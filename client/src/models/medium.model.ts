import {Medium} from '../entities/medium';

export default class MediumModel implements Medium {
  id: string;
  name: string;
  title: string;
  isAvailable: boolean;
  isChecked: boolean;
  mimeType: string;
  duration: number;
  ext: string;
  filePath: string;
  isPlaying: boolean;
  hasError: boolean;

  constructor(
    public origin: 'playlist' | 'file',
    medium?: Medium
  ) {
    Object.assign(this, medium);
    this.setName();
  }

  get playPath() {
    // TODO Find a way to keep localhost:10000
    return `http://localhost:10000/api/media/play/path${this.filePath}`;
  }

  private setName() {
    if (this.name) {
      return;
    }

    if (this.title) {
      this.name = this.title;
    } else if (this.filePath) {
      this.name = this.filePath.substr(
        this.filePath.lastIndexOf('/'),
        this.filePath.lastIndexOf('.')
      );
    }
  }
}
