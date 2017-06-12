import {autoinject} from 'aurelia-framework';
import { Subject, BehaviorSubject, Observable } from 'rx';
import MediumModel from '../models/medium.model';
import {PlayerEvent} from '../constants';
import AudioService from './audio.service';
import Mediators from "../mediators";
import MediumInQueueModel from '../models/mediumInQueue.model';
import {MediumPlaylistLink} from '../entities/mediumPlaylistLink';

@autoinject
export default class MediaQueueService {
  private currentMediumIndexInQueueSubject = new BehaviorSubject<number>(null);
  private mediaQueueSubject = new BehaviorSubject<MediumInQueueModel[]>([]);
  private mediumOnErrorSubject = new Subject<MediumModel>();
  private queueEndedWithMediumSubject = new Subject<MediumInQueueModel>();

  constructor(
    private audioService: AudioService,
    private mediators: Mediators
  ) { }

  init(): void {
    // this.audioService
    //   .observePlayingMedium()
    //   .do(mediumVm => {
    //     // Set state: change current media
    //     this.currentMediumInQueueSubject.onNext(mediumVm);
    //   })
    //   .subscribe();

    this.audioService
      .observeEvents()
      .do(e => {
        switch (e.name) {
          case PlayerEvent.Error:
            return this.displayMediumErrorResumeNext();
          case PlayerEvent.Ended:
          case PlayerEvent.Next:
            return this.playNext();
          case PlayerEvent.Previous:
            return this.playPrevious();
          case PlayerEvent.PlayFirst:
            return this.playFirst();
        }
      })
      .subscribe();

    this.onFirstMediumInQueueStartPlay();
    this.onLastMediumEndAndNewOneAppendedStartPlay();
  }

  private displayMediumErrorResumeNext(): Promise<void> {
    // Notify error playing and try next.
    const currentMedium = this.mediaQueueSubject[
      this.currentMediumIndexInQueueSubject.getValue()
    ];

    this.mediumOnErrorSubject.onNext(currentMedium);
    return this.playNext();
  }

  observeMediumError(): Observable<MediumModel> {
    return this.mediumOnErrorSubject;
  }

  playMediumAsync(mediumPosition: number, medium: MediumInQueueModel) {
    this.currentMediumIndexInQueueSubject.onNext(mediumPosition);
    return this.audioService.setMediumToPlayAndPlayAsync(medium);
  }

  getMediumAtIndexAsync(index: number): MediumInQueueModel {
    const mediaQueue = this.mediaQueueSubject.getValue();
    return mediaQueue[index];
  }

  playNext(): Promise<void> {
    const mediaQueue = this.mediaQueueSubject.getValue();
    const currentMediumIndex = this.currentMediumIndexInQueueSubject.getValue();

    const isLastElement = currentMediumIndex === mediaQueue.length - 1;
    if (isLastElement) {
      this.queueEndedWithMediumSubject.onNext(mediaQueue[currentMediumIndex]);
      return;
    }

    // Check for next media in queue
    const nextMediumIndex = currentMediumIndex + 1;
    const nextMediumInQueue = mediaQueue[nextMediumIndex];

    this.currentMediumIndexInQueueSubject.onNext(nextMediumIndex);

    return this.audioService.setMediumToPlayAndPlayAsync(nextMediumInQueue);
  }

  playPrevious(): Promise<void> {
    const currentMediumIndex = this.currentMediumIndexInQueueSubject.getValue();

    // Check for previous media in queue
    const isFirstMediaInQueue = currentMediumIndex <= 0;
    if (isFirstMediaInQueue) {
      return;
    }

    const previousMediaIndex = currentMediumIndex-1;
    const previousMediaInQueue = this.mediaQueueSubject.getValue()[previousMediaIndex];

    this.currentMediumIndexInQueueSubject.onNext(previousMediaIndex);

    return this.audioService.setMediumToPlayAndPlayAsync(previousMediaInQueue);
  }

  private onFirstMediumInQueueStartPlay(): void {
    this.mediaQueueSubject
      .filter(x => !!x && this.mediators.getIsUserStateInitialized())
      .mapWithPreviousValue((oldValue, newValue) =>
        oldValue !== null && oldValue.length === 0 && newValue.length > 0
      )
      .filter(firstTimeQueueFilled => !!firstTimeQueueFilled)
      .do(_ => this.playFirst())
      .subscribe();
  }

  private onLastMediumEndAndNewOneAppendedStartPlay(): void {
    this.mediaQueueSubject
      .filter(x => !!x)
      .mapWithPreviousValue((oldQueue, newQueue) => {
        // TODO Good algorithm ?
        return {
          mediaAdded: oldQueue !== null && newQueue.length > oldQueue.length,
          mediaQueue: newQueue
        }
      })
      .filter(x => !!x.mediaAdded)
      .combineLatest( // TODO Optimize this chain
        this.audioService.observeMediumEnded(),
        (mediaQueueSet, playStatus) => {
          return {mediaQueueSet: mediaQueueSet, playStatus: playStatus}
        } // TODO rename to getAndObservePlayStatus ?
      )
      .map(x => x.mediaQueueSet.mediaQueue)
      .do(newMediaQueue => {
        const currentMediumIndex = this.currentMediumIndexInQueueSubject.getValue();

        // Check for next media in queue
        const nextMediumIndex = currentMediumIndex + 1;
        const nextMediumViewModelInQueue = newMediaQueue[nextMediumIndex];

        this.currentMediumIndexInQueueSubject.onNext(nextMediumIndex);

        return this.audioService.setMediumToPlayAndPlayAsync(nextMediumViewModelInQueue);
      })
      .subscribe();
  }

  playFirst(): Promise<void> {
    const mediaQueue = this.mediaQueueSubject.getValue();
    if (mediaQueue.length === 0) {
      return;
    }

    this.currentMediumIndexInQueueSubject.onNext(0);

    return this.audioService.setMediumToPlayAndPlayAsync(mediaQueue[0]);
  }

  enqueueMediumAndStartQueue(mediumModel: MediumModel, playlistLink?: MediumPlaylistLink): void {
    const mediaQueue = this.mediaQueueSubject.getValue();
    const mediumInQueue = new MediumInQueueModel(mediumModel, playlistLink);
    this.mediaQueueSubject.onNext(mediaQueue.concat(mediumInQueue));
  }

  // TODO Stopped here. playlistLink doesn't make sence here
  enqueueMediaAndStartQueue(mediaModels: MediumModel[], playlistLink?: MediumPlaylistLink): void {
    const mediaQueue = this.mediaQueueSubject.getValue();
    const mediaInQueue = mediaModels.map(mediumModel =>
      new MediumInQueueModel(mediumModel, playlistLink)
    );
    this.mediaQueueSubject.onNext(mediaQueue.concat(mediaInQueue));
  }

  removeMedium(position: number): void {
    const mediaQueue = this.mediaQueueSubject.getValue();
    const currentMediumIndex = this.currentMediumIndexInQueueSubject.getValue();

    // If medium to remove is current playing...
    if (currentMediumIndex === position) {
      this.audioService.stop();
      this.currentMediumIndexInQueueSubject.onNext(-1);
    }
    mediaQueue.splice(position, 1);
    this.mediaQueueSubject.onNext(mediaQueue);
  }

  observeCurrentMediumInQueueIndex(): Observable<number> {
    return this.currentMediumIndexInQueueSubject;
  }

  observeCurrentMediumIndexInQueue(): Observable<number> {
    return this.currentMediumIndexInQueueSubject;
  }

  observeMediaQueue(): BehaviorSubject<MediumInQueueModel[]> {
    return this.mediaQueueSubject;
  }

  clearQueue(): void {
    this.audioService.stop();
    this.currentMediumIndexInQueueSubject.onNext(-1);
    this.mediaQueueSubject.onNext([]);
  }

  observeQueueEndedWithMedium(): Observable<MediumInQueueModel> {
    return this.queueEndedWithMediumSubject;
  }
}
