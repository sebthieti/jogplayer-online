import * as mongoose from 'mongoose';
import Schema = mongoose.Schema;
import * as mongooseTypes from 'mongoose-types-ext';
mongooseTypes(mongoose);
import routes from '../routes';

export interface Playlist extends mongoose.Document {
  ownerId: string;
  name: string;
  index: number;
  filePath: string;
  media: any[];
  createdOn: Date;
  updatedOn: Date;
  links: string[];
  setMedia(media);
  setUpdatedOn(updatedOn);
}

export interface IPlaylistModel extends mongoose.Model<Playlist> {
}

const playlistSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, maxLength: 128 },
  index: Number,
  filePath: { type: String, maxLength: 256 },
  media: [{ type: Schema.Types.ObjectId, ref: 'Media' }],
  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date }
});
playlistSchema.virtual('isVirtual').get(() => {
  return !this.filePath;
});
// TODO Think about remove this and only compute it elsewhere (maybe only put it to DTO ?)
playlistSchema.virtual('isAvailable').get(() => {
  return this._isAvailable || false;
}).set(value => {
  this._isAvailable = value;
});
playlistSchema.statics.whereInOrGetAll = function (path, whereIn) {
  return whereIn ? this.where(path).in(whereIn) : this;
};
playlistSchema.set('toJSON', { virtuals: true });
// virtuals: false to avoid inserting links to database
playlistSchema.set('toObject', { virtuals: false });
playlistSchema.methods.toJSON = function() {
  var obj = this.toObject();
  obj.links = this.links;
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  delete obj.isVirtual;
  delete obj.ownerId;
  delete obj.filePath;
  delete obj.createdOn;
  delete obj.updatedOn;
  return obj;
};
playlistSchema.virtual('links').get(function() {
  return [{
    rel: 'self',
    href: routes.playlists.selfPath.replace(':playlistId', this._id)
  }, {
    rel: 'media',
    href: routes.playlists.listMedia.replace(':playlistId', this._id)
  }, {
    rel: 'media.insert',
    href: routes.media.insertPath.replace(':playlistId', this._id)
  }, {
    rel: 'update',
    href: routes.playlists.updatePath.replace(':playlistId', this._id)
  }, {
    rel: 'remove',
    href: routes.playlists.delete.path.replace(':playlistId', this._id)
  }, {
    rel: 'actions.move',
    href: routes.playlists.actions.movePath.replace(':playlistId', this._id)
  }];
});
playlistSchema.methods.setMedia = (function (media) {
  this.media = media;
  return this;
});
playlistSchema.methods.setUpdatedOn = (function (updatedOn) {
  this.updatedOn = updatedOn;
  return this;
});

export default mongoose.model<Playlist>('Playlist', playlistSchema);
