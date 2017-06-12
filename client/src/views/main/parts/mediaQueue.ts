import {autoinject, computedFrom} from 'aurelia-framework';
import MediaQueueService from '../../../services/mediaQueue.service';
import MediumInQueueModel from '../../../models/mediumInQueue.model';

@autoinject
export class MediaQueue {
  mediaQueueViewModels: MediumInQueueModel[];

  constructor(private mediaQueueService: MediaQueueService) {
  }

  bind() {
    this.mediaQueueService
      .observeMediaQueue()
      .do(mediaInQueue => {
        this.mediaQueueViewModels = mediaInQueue
      })
      .subscribe();

    this.mediaQueueService
      .observeCurrentMediumInQueueIndex()
      .whereIsNotNull()
      .mapWithPreviousValue((oldValueIndex, newValueIndex) => {
        // If a medium is already playing, then unset it's playing status (the color change) and set the new one
        if (oldValueIndex !== -1) { // TODO Can Still be an object but unlinked from array
          this.mediaQueueViewModels[oldValueIndex].medium.isPlaying = false;
        }
        if (newValueIndex === -1) {
          return;
        }
        const nextMedium = this.mediaQueueViewModels[newValueIndex].medium;
        nextMedium.isPlaying = true;
        nextMedium.hasError = false;
      })
      .subscribe();

    this.mediaQueueService
      .observeMediumError()
      .do(medium => medium.hasError = true)
      .subscribe()
  }

  playMediumAsync(mediumPosition: number, medium: MediumInQueueModel) {
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
