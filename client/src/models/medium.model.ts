import {Medium} from '../entities/medium';

export default class MediumModel {
  id?: string;
  title: string;
  index: number;
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
  }

  get playPath() {
    // TODO Find a way to keep localhost:10000
    return `http://localhost:10000/api/media/play/path${this.filePath}`;
  }
}
