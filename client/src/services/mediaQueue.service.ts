import {autoinject} from 'aurelia-framework';
import { Subject, BehaviorSubject, Observable } from 'rx';
import MediumModel from '../models/medium.model';
import {PlayerEvent} from '../constants';
import AudioService from './audio.service';
import Mediators from "../mediators";

@autoinject
export default class MediaQueueService {
  private currentMediumIndexInQueueSubject = new BehaviorSubject<number>(-1);
  private mediaQueueSubject = new BehaviorSubject<MediumModel[]>([]);
  private mediumOnErrorSubject = new Subject<MediumModel>();
  private queueEndedWithMediumSubject = new Subject<MediumModel>();

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
            this.displayMediumErrorResumeNext();
            break;
          case PlayerEvent.Ended:
          case PlayerEvent.Next:
            this.playNext();
            break;
          case PlayerEvent.Previous:
            this.playPrevious();
            break;
          case PlayerEvent.PlayFirst:
            this.playFirst();
            break;
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

  playMediumAsync(mediumPosition: number, medium: MediumModel) {
    this.currentMediumIndexInQueueSubject.onNext(mediumPosition);
    return this.audioService.setMediumToPlayAndPlayAsync(medium);
  }

  getMediumAtIndexAsync(index: number): MediumModel {
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

  enqueueMediumAndStartQueue(mediumModel): void {
    const mediaQueue = this.mediaQueueSubject.getValue();
    this.mediaQueueSubject.onNext(mediaQueue.concat(mediumModel));
  }

  enqueueMediaAndStartQueue(mediaModels: MediumModel[]): void {
    const mediaQueue = this.mediaQueueSubject.getValue();
    this.mediaQueueSubject.onNext(mediaQueue.concat(mediaModels));
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

  observeCurrentMediumInQueue(): Observable<MediumModel> {
    return this.currentMediumIndexInQueueSubject
      .map(position => {
        return position >= 0 ?
            this.mediaQueueSubject.getValue()[position] :
            null
        }
      );
  }

  observeCurrentMediumIndexInQueue(): Observable<number> {
    return this.currentMediumIndexInQueueSubject;
  }

  observeMediaQueue(): BehaviorSubject<MediumModel[]> {
    return this.mediaQueueSubject;
  }

  clearQueue(): void {
    this.audioService.stop();
    this.currentMediumIndexInQueueSubject.onNext(-1);
    this.mediaQueueSubject.onNext([]);
  }

  observeQueueEndedWithMedium(): Observable<MediumModel> {
    return this.queueEndedWithMediumSubject;
  }
}
