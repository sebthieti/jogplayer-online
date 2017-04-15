import {Bookmark} from './bookmark';
import {Metadata} from "./metadata";
import {ObjectID} from "mongodb";

export const MediumType = {
  Audio: 'audio',
  Video: 'video'
};

export interface MediumMetadata {
  title: string;
  type: 'id3TagV1';
}

export interface MediumSummary {
  title?: string;
  filePath: string;
  duration?: number;
}

export interface Medium extends MediumSummary {
  _id?: ObjectID;
  mediumType?: string;
  isSelected: boolean;
  bookmarks: Bookmark[];
  infos?: MediumMetadata[];
  metadatas: Metadata;
}
