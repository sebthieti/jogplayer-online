import {ObjectID} from 'mongodb';
import {Metadata} from './metadata';

export interface Playlist {
  name: string;
  filePath: string;
  mediaIds: ObjectID[];
  metadata: Metadata;
}
