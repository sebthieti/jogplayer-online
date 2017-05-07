import { BehaviorSubject } from 'rx';
import MediumModel from '../models/medium.model';

export default class MediaService {
  private mediaSelectionSubject = new BehaviorSubject<MediumModel[]>();

  getAndObserveHasMediaSelection() {
    return this.observeMediaSelection()
      .map(mediaSelection => mediaSelection.some())
      .startWith(false);
  };

  observeMediaSelection() {
    return this.mediaSelectionSubject.filter(x => x);
  };

  changeMediaSelection(media) {
    this.mediaSelectionSubject.onNext(media);
  };
}
