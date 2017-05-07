import * as _ from 'lodash';
import {autoinject} from 'aurelia-framework';
import { Subject, BehaviorSubject, Observable } from 'rx';
import MediumModel from '../models/medium.model';
import {JpoEvent} from '../constants';
import AudioService from './audio.service';
import Mediators from "../mediators";

// jpoApp.factory('mediaQueueBusiness', [
//   '$q',
//   'audioService',
//   'authBusiness',
//   'viewModelBuilder',
//   'mediators',
//   function($q, audioService, authBusiness, viewModelBuilder, mediators) {
@autoinject
export default class MediaQueueService {
  private currentMediumInQueueSubject = new BehaviorSubject<MediumModel>(null);
  private mediaQueueSubject = new BehaviorSubject<string[]>([]);
  private mediumOnErrorSubject = new Subject<MediumModel>();
  private observeQueueEndedWithMediumSubject = new Subject<MediumModel>();

  constructor(
    private audioService: AudioService,
    private mediators: Mediators
  ) {
    this.initMediaQueue();
  }

  private initMediaQueue(): void {
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
          case JpoEvent.Error:
            this.displayMediumErrorResumeNext();
            break;
          case JpoEvent.Ended:
          case JpoEvent.Next:
            this.playNext();
            break;
          case JpoEvent.Previous:
            this.playPrevious();
            break;
          case JpoEvent.PlayFirst:
            this.playFirst();
            break;
        }
      })
      .subscribe();

    // this.clearUsersOnUserLogoff();

    this.onFirstMediumInQueueStartPlay();
    this.onLastMediumEndAndNewOneAppendedStartPlay();
  }

  // clearUsersOnUserLogoff() {
  //   authBusiness
  //     .observeCurrentUserAuthentication()
  //     .whereIsNull()
  //     .mapMany(() => { return mediaQueueSubject.take(1) })
  //     .where(mediaQueue => { return mediaQueue.length > 0 })
  //     .do(() => { mediaQueueSubject.onNext([]) })
  //     .silentSubscribe();
  // }

  private displayMediumErrorResumeNext(): void {
    // Notify error playing and try next.
    const currentMedium = this.observeCurrentMediumInQueue().getValue();

    this.mediumOnErrorSubject.onNext(currentMedium);
    this.playNext();
  }

  observeMediumError(): Observable<MediumModel> {
    return this.mediumOnErrorSubject;
  }

  playMedium(mediumVm): void {
    this.audioService.setMediumToPlayAndPlayAsync(mediumVm);
  }

  getMediumAtIndexAsync(index: number): MediumModel {
    const mediaQueue = this.observeMediaQueue().getValue();
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
        const previousMediaInQueue = this.mediaQueueSubject.value[previousMediaIndex];

        this.audioService.setMediumToPlayAndPlayAsync(previousMediaInQueue);
      })
      .subscribe();
  }

  private onFirstMediumInQueueStartPlay(): void {
    this.observeMediaQueue()
      .filter(x => !!x)
      .filter(() => this.mediators.getIsUserStateInitialized())
      .mapWithPreviousValue((oldValue, newValue) => {
        return oldValue !== null && _.isEmpty(oldValue) && newValue.some();
      })
      .filter(firstTimeQueueFilled => firstTimeQueueFilled)
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
      .filter(x => x.mediaAdded)
      .combineLatest( // TODO Optimize this chain
        this.audioService.observeMediumEnded(),
        (mediaQueueSet, playStatus) => {
          return {mediaQueueSet: mediaQueueSet, playStatus: playStatus}
        } // TODO rename to getAndObservePlayStatus ?
      )
      .map(x => x.mediaQueueSet.mediaQueue)
      .do(newMediaQueue => {
        const currentMedium = this.observeCurrentMediumInQueue().getValue();
        const currentMediumIndex = newMediaQueue.indexOf(currentMedium);

        // Check for next media in queue
        const nextMediumIndex = currentMediumIndex + 1;
        const nextMediumViewModelInQueue = newMediaQueue[nextMediumIndex];

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
    this.audioService.setMediumToPlayAndPlayAsync(firstMediumInQueue);
  }

  enqueueMediumAndStartQueue(mediumModel): void {
    // const mediumVm = viewModelBuilder.buildQueuedMediumViewModel(mediumModel);
    const mediaQueue = this.observeMediaQueue().getValue();
    const mediaQueueWithMedium = mediaQueue.concat(mediumModel);
    this.mediaQueueSubject.onNext(mediaQueueWithMedium);
  }

  enqueueMediaAndStartQueue(mediaModels): void {
    // const mediaVm = mediaModels.map(viewModelBuilder.buildQueuedMediumViewModel);
    const mediaQueue = this.observeMediaQueue().getValue();
    const mediaQueueWithMedia = mediaQueue.concat(mediaModels/*mediaVm*/);
    this.mediaQueueSubject.onNext(mediaQueueWithMedia);
  }

  removeMedium(medium): void {
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
    return this.observeMediaQueue()
      .combineLatest(
        this.observeCurrentMediumInQueue(),
        (mediaQueue, currentMediumInQueue) => mediaQueue.indexOf(currentMediumInQueue)
      );
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
