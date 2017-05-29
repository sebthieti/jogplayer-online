import * as _ from 'lodash';
import {autoinject} from 'aurelia-framework';
import { Subject, BehaviorSubject, Observable } from 'rx';
import MediumModel from '../models/medium.model';
import {PlayerEvent} from '../constants';
import AudioService from './audio.service';
import Mediators from "../mediators";
import FileModel from '../models/file.model';

@autoinject
export default class MediaQueueService {
  private currentMediumInQueueSubject = new BehaviorSubject<MediumModel|FileModel>(null);
  private currentMediumIndexInQueueSubject = new BehaviorSubject<number>(-1);
  private mediaQueueSubject = new BehaviorSubject<MediumModel[]>([]);
  private mediumOnErrorSubject = new Subject<MediumModel|FileModel>();
  private observeQueueEndedWithMediumSubject = new Subject<MediumModel|FileModel>();

  constructor(
    private audioService: AudioService,
    private mediators: Mediators
  ) { }

  init(): void {
    this.audioService
      .observePlayingMedium()
      .do(mediumVm => {
        // Set state: change current media
        this.currentMediumInQueueSubject.onNext(mediumVm);
      })
      .subscribe();

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

  private displayMediumErrorResumeNext(): void {
    // Notify error playing and try next.
    const currentMedium = this.currentMediumInQueueSubject.getValue();

    this.mediumOnErrorSubject.onNext(currentMedium);
    this.playNext();
  }

  observeMediumError(): Observable<MediumModel> {
    return this.mediumOnErrorSubject;
  }

  playMedium(mediumPosition: number, mediumVm) {
    this.currentMediumIndexInQueueSubject.onNext(mediumPosition);
    return this.audioService.setMediumToPlayAndPlayAsync(mediumVm);
  }

  getMediumAtIndexAsync(index: number): MediumModel {
    const mediaQueue = this.mediaQueueSubject.getValue();
    return mediaQueue[index];
  }

  playNext(): void {
    this.observeMediaQueueAndCurrentMedium() // TODO Multiple observable creation through calls ?
      .do(mediaQueueSet => {
        const currentMediumIndex = mediaQueueSet.mediaViewModelsQueue.indexOf(mediaQueueSet.currentMediumInQueue);
        const isLastElement = currentMediumIndex === mediaQueueSet.mediaViewModelsQueue.length - 1;
        if (isLastElement) {
          this.observeQueueEndedWithMediumSubject.onNext(mediaQueueSet.currentMediumInQueue);
          return;
        }

        // Check for next media in queue
        const nextMediumIndex = currentMediumIndex + 1;
        const nextMediumViewModelInQueue = mediaQueueSet.mediaViewModelsQueue[nextMediumIndex];

        this.currentMediumIndexInQueueSubject.onNext(nextMediumIndex);

        this.audioService.setMediumToPlayAndPlayAsync(nextMediumViewModelInQueue);
      })
      .subscribe();
  }

  playPrevious(): void {
    this.observeMediaQueueAndCurrentMedium()
      .do(mediaQueueSet => {
        const currentMediumIndex = mediaQueueSet.mediaViewModelsQueue.indexOf(mediaQueueSet.currentMediumInQueue);
        // Check for previous media in queue
        const isFirstMediaInQueue = currentMediumIndex <= 0;
        if (isFirstMediaInQueue) {
          return;
        }

        const previousMediaIndex = currentMediumIndex-1;
        const previousMediaInQueue = this.mediaQueueSubject.getValue()[previousMediaIndex];

        this.currentMediumIndexInQueueSubject.onNext(previousMediaIndex);

        this.audioService.setMediumToPlayAndPlayAsync(previousMediaInQueue);
      })
      .subscribe();
  }

  private onFirstMediumInQueueStartPlay(): void {
    this.observeMediaQueue()
      .filter(x => !!x)
      .filter(() => this.mediators.getIsUserStateInitialized())
      .mapWithPreviousValue((oldValue, newValue) => {
        return oldValue !== null && _.isEmpty(oldValue) && newValue.length > 0;
      })
      .filter(firstTimeQueueFilled => !!firstTimeQueueFilled)
      .do(_ => this.playFirst())
      .subscribe();
  }

  private onLastMediumEndAndNewOneAppendedStartPlay(): void {
    this.observeMediaQueue()
      .filter(x => !!x)
      .mapWithPreviousValue((oldValue, newValue) => {
        // TODO Good algorithm ?
        return {
          mediaAdded: oldValue !== null && newValue.length > oldValue.length,
          mediaQueue: newValue
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
        const currentMedium = this.currentMediumInQueueSubject.getValue();
        const currentMediumIndex = newMediaQueue.indexOf(currentMedium);

        // Check for next media in queue
        const nextMediumIndex = currentMediumIndex + 1;
        const nextMediumViewModelInQueue = newMediaQueue[nextMediumIndex];

        this.currentMediumIndexInQueueSubject.onNext(nextMediumIndex);

        this.audioService.setMediumToPlayAndPlayAsync(nextMediumViewModelInQueue);
      })
      .subscribe();
  }

  playFirst(): void {
    const mediaQueue = this.observeMediaQueue().getValue();
    if (_.isEmpty(mediaQueue)) {
      return;
    }

    const firstMediumInQueue = mediaQueue[0];
    this.currentMediumIndexInQueueSubject.onNext(0);

    this.audioService.setMediumToPlayAndPlayAsync(firstMediumInQueue);
  }

  enqueueMediumAndStartQueue(mediumModel): void {
    const mediaQueue = this.mediaQueueSubject.getValue();
    const mediaQueueWithMedium = mediaQueue.concat(mediumModel);
    this.mediaQueueSubject.onNext(mediaQueueWithMedium);
  }

  enqueueMediaAndStartQueue(mediaModels: MediumModel[]): void {
    const mediaQueue = this.mediaQueueSubject.getValue();
    const mediaQueueWithMedia = mediaQueue.concat(mediaModels/*mediaVm*/);
    this.mediaQueueSubject.onNext(mediaQueueWithMedia);
  }

  removeMedium(mediumPosition: number, medium): void {
    this.observeMediaQueueAndCurrentMedium()
      .do(mediaQueueSet => {
        // If medium to remove is current playing...
        if (mediaQueueSet.currentMediumInQueue && mediaQueueSet.currentMediumInQueue === medium) {
          this.audioService.stop();
          this.currentMediumInQueueSubject.onNext(null);
        }
        const updatedMediaQueue = mediaQueueSet
          .mediaViewModelsQueue
          .filter(mediumInQueue => mediumInQueue !== medium);
        this.mediaQueueSubject.onNext(updatedMediaQueue);
      })
      .subscribe();
  }

  observeIsCurrentMediumLast(): Observable<any> {
    return this.observeMediaQueueAndCurrentMedium()
      .map(mediaQueueSet => {
        const currentMediumIndex = mediaQueueSet.mediaViewModelsQueue.indexOf(mediaQueueSet.currentMediumInQueue);
        const isLastElement = currentMediumIndex === mediaQueueSet.mediaViewModelsQueue.length - 1;
        return isLastElement;
      });
  }

  observeMediaQueueAndCurrentMedium(): Observable<any> {
    return this.observeMediaQueue()
      .asAsyncValue()
      .combineLatest(
        this.observeCurrentMediumInQueue().asAsyncValue(),
        (mediaQueue, currentMediumInQueue) => {
          return { mediaViewModelsQueue: mediaQueue, currentMediumInQueue: currentMediumInQueue }
        }
      );
  }

  observeCurrentMediumInQueue(): BehaviorSubject<MediumModel> {
    return this.currentMediumInQueueSubject.filter(m => !!m);
  }

  observeCurrentMediumIndexInQueue(): Observable<number> {
    return this.currentMediumIndexInQueueSubject;
  }

  observeMediaQueue(): BehaviorSubject<string[]> {
    return this.mediaQueueSubject;
  }

  clearQueue(): void {
    this.audioService.stop();
    this.currentMediumInQueueSubject.onNext(null);
    this.mediaQueueSubject.onNext([]);
  }

  observeQueueEndedWithMedium(): Observable<MediumModel> {
    return this.observeQueueEndedWithMediumSubject;
  }
}
