import {autoinject} from 'aurelia-framework';
import { BehaviorSubject } from 'rx';
import MediumModel from '../models/medium.model';
import {FileExplorerRepository} from '../repositories/fileExplorer.repository';

@autoinject
export default class MediaService {
  private mediaSelectionSubject = new BehaviorSubject<MediumModel[]>(null);

  constructor(private fileExplorerRepository: FileExplorerRepository) {
  }

  getAndObserveHasMediaSelection() {
    return this.observeMediaSelection()
      .map(mediaSelection => mediaSelection.length > 0)
      .startWith(false);
  };

  observeMediaSelection() {
    return this.mediaSelectionSubject.filter(x => !!x);
  };

  changeMediaSelection(media) {
    this.mediaSelectionSubject.onNext(media);
  };

  async setMediaFromFilePath(mediumModel: MediumModel, filePath: string): Promise<MediumModel> {
    const medium = await this.fileExplorerRepository.getMediumFromUrl(filePath);
    Object.assign(mediumModel, {
      name: medium.name,
      type: medium.type,
      filePath
    });
    return mediumModel;
  }
}
