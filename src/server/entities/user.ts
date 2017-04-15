import {ObjectID} from 'mongodb';
import {UserPermissions} from './userPermissions';
import {Favorite} from './favorite';
import {UserState} from './userState';
import {Playlist} from './playlist';

export interface User {
  _id?: ObjectID;
  isActive: boolean;
  username: string;
  hashedPassword: string;
  passwordSalt: string;
  fullName: string;
  role: string;
  email: string;
  favorites?: Favorite[];
  permissions?: UserPermissions;
  state?: UserState;
  playlists?: Playlist[];
}
