import {autoinject, computedFrom} from 'aurelia-framework';
import MediaQueueService from '../../../services/mediaQueue.service';
import MediumModel from '../../../models/medium.model';

@autoinject
export class MediaQueue {
  mediaQueueViewModels: any[];

  constructor(private mediaQueueService: MediaQueueService) {
  }

  bind() {
    this.mediaQueueService
      .observeMediaQueue()
      .do(mediaQueueViewModels => {
        this.mediaQueueViewModels = mediaQueueViewModels;
      })
      .subscribe();

    this.mediaQueueService
      .observeCurrentMediumInQueue()
      .whereIsNotNull()
      .mapWithPreviousValue((oldValue, newValue) => {
        // If a medium is already playing, then unset it's playing status (the color change) and set the new one
        if (oldValue) { // TODO Can Still be an object but unlinked from array
          oldValue.isPlaying = false;
        }
        newValue.isPlaying = true;
        newValue.hasError = false;
      })
      .subscribe();

    this.mediaQueueService
      .observeMediumError()
      .do(mediumInError => {
        mediumInError.hasError = true;
      })
      .subscribe()
  }

  playMediumAsync(mediumPosition: number, medium: MediumModel) {
    return this.mediaQueueService.playMediumAsync(mediumPosition, medium);
  }

  innerRemove(mediumPosition: number) {
    this.mediaQueueService.removeMedium(mediumPosition);
  }

  clearQueue() {
    this.mediaQueueService.clearQueue();
  }

  @computedFrom('mediaQueueViewModels')
  get hasAny(): boolean {
    return this.mediaQueueViewModels.length > 0;
  }
}
