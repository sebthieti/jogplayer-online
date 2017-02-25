// TODO Rename file to medium not media
import * as mongoose from 'mongoose';
import Schema = mongoose.Schema;
import * as mongooseTypes from 'mongoose-types-ext';
mongooseTypes(mongoose);
import routes from '../routes';

export interface Media extends mongoose.Document {
  ownerId: string;
  _playlistId: string;
  title: string;
  createdOn: Date;
  updatedOn: Date;
  filePath: string;
  isChecked: boolean;
  mediaType: string;
  index: number;
  duration: number;
  mimeType: string;
  ext: string;
  links: string[];
  setIsAvailable(isAvailable: boolean): IMediaModel;
}

export interface IMediaModel extends mongoose.Model<Media> {
}

const mediaSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
  _playlistId: { type: Schema.Types.ObjectId, ref: 'Playlist' },
  title: { type: String, maxLength: 256 },
  createdOn: { type: Date },
  updatedOn: { type: Date },
  filePath: { type: String, maxLength: 256 },
  isChecked: { type: Boolean, default: true },
  mediaType: String,
  index: Number,
  duration: Number,
  mimeType: String,
  ext: String//,
  //metadatas: [],
  //bookmarks: [{ type: Schema.Types.ObjectId, ref: 'Bookmark' }]
});
// TODO Think about remove this and only compute it elsewhere (maybe only put it to DTO ?)
mediaSchema.virtual('isAvailable').get(() => {
  return this._isAvailable || false;
}).set(function(value) {
  this._isAvailable = value;
});
mediaSchema.set('toJSON', { virtuals: true });
// virtuals: false to avoid inserting links to database
mediaSchema.set('toObject', { virtuals: false });
mediaSchema.methods.toJSON = function() {
  var obj = this.toObject();
  obj.id = obj._id;
  obj.links = this.links;
  delete obj._id;
  delete obj.__v;
  delete obj._playlistId;
  delete obj.ownerId;
  delete obj.filePath;
  delete obj.createdOn;
  delete obj.updatedOn;
  return obj;
};
mediaSchema.virtual('links').get(function() {
  return [{
    rel: 'self',
    href: routes.media.selfPath
      .replace(':playlistId', this._playlistId)
      .replace(':mediumId', this._id)
  }, {
    rel: 'self.play',
    href: routes.media.selfPlay.replace(':mediumIdWithExt', this._id + this.ext)
  }, {
    rel: 'update',
    href: routes.media.updatePath
      .replace(':playlistId', this._playlistId)
      .replace(':mediumId', this._id)
  }, {
    rel: 'remove',
    href: routes.media.deletePath
      .replace(':playlistId', this._playlistId)
      .replace(':mediumId', this._id)
  }];
});
mediaSchema.methods.setIsAvailable = function (isAvailable) {
  this.isAvailable = isAvailable;
  return this;
};

export default mongoose.model<Media>('Media', mediaSchema);
