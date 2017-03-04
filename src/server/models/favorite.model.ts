import * as mongoose from 'mongoose';
import Schema = mongoose.Schema;

import * as mongooseTypes from 'mongoose-types-ext';
mongooseTypes(mongoose);
import routes from '../routes';

export interface Favorite extends mongoose.Document {
  ownerId: string;
  name: string;
  createdOn: Date;
  updatedOn: Date;
  folderPath: string;
  index: number;
  links: string[];
}

export interface IFavoriteModel extends mongoose.Model<Favorite> {
}

const favoriteSchema: mongoose.Schema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, maxLength: 128 },
  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date },
  folderPath: { type: String, maxLength: 256 },
  index: Number
});
favoriteSchema.set('toJSON', { virtuals: true });
// virtuals: false to avoid inserting links to database
favoriteSchema.set('toObject', { virtuals: false });
favoriteSchema.methods.toJSON = function() {
  let obj = this.toObject();
  obj.id = obj._id;
  obj.links = this.links;
  delete obj._id;
  delete obj.__v;
  delete obj.ownerId;
  delete obj.createdOn;
  delete obj.updatedOn;
  return obj;
};
favoriteSchema.virtual('links').get(function() {
  return [{
    rel: 'self',
    href: routes.favorites.selfPath.replace(':favId', this._id)
  }, {
    rel: 'target',
    href: '/api/explore' + this.folderPath // TODO Refactor
  }, {
    rel: 'update',
    href: routes.favorites.updatePath.replace(':favId', this._id)
  }, {
    rel: 'remove',
    href: routes.favorites.deletePath.replace(':favId', this._id)
  }];
});

export default mongoose.model<Favorite>('Favorite', favoriteSchema);
