import MediumSummary, {IMediumSummary} from './mediumSummary';

export const MediumType = {
  Audio: 'audio',
  Video: 'video'
};

export interface IMedium extends IMediumSummary {
  // TODO Rework this to keep only one
  id?: string;
  _id?: string;
  mediumType: string;
  isAvailable: boolean;
  isSelected: boolean;
  bookmarks: any;
  metadatas: any;
}

export default class Medium extends MediumSummary implements IMedium {
  id: string;
  _id: string;
  mediumType: string;
  isAvailable: boolean;
  isSelected: boolean;
  bookmarks: any;
  metadatas: any;

  static fromMediaSummary(medium: IMedium, mediaType: string) {
    return new Medium({
      id: null,
      mediumType: mediaType,
      index: medium.index,
      title: medium.title,
      duration: medium.duration,
      isAvailable: false, // TODO To change ?
      isSelected: true, // TODO To change ?
      bookmarks: [],
      metadatas: []
    });
  }

  constructor(entity: IMedium) {
    super({
      title: entity.title,
      index: entity.index,
      filePath: entity.filePath,
      duration: entity.duration
    });

    this._id = entity.id;
    this.mediumType = entity.mediumType;
    this.isAvailable = entity.isAvailable;
    this.isSelected = entity.isSelected;
    this.bookmarks = entity.bookmarks;
    this.metadatas = entity.metadatas;
  }

  // TODO In the future, think about moving to extension class
  // toDto(medium) {
  //   return new MediaDto.Media(
  //     medium.id,
  //     medium.mediaType,
  //     medium.title,
  //     medium.filePath,
  //     medium.duration,
  //     medium.mustRelocalize,
  //     medium.isSelected,
  //     medium.bookmarks,
  //     medium.metadatas
  //   );
  // };
}
