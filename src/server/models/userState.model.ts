import * as mongoose from 'mongoose';
import Schema = mongoose.Schema;
import * as mongooseTypes from 'mongoose-types-ext';
mongooseTypes(mongoose);
import routes from '../routes';

export interface UserState extends mongoose.Document {
  ownerId: string;
  playedPosition: number;
  mediaQueue: string[];
  browsingFolderPath: string;
  openedPlaylistId: string;
  playingMediumInQueueIndex: number;
  links: string[];
}

export interface IUserStateModel extends mongoose.Model<UserState> {
}

const userStateSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
  playedPosition: Number,
  mediaQueue: [ String ],
  browsingFolderPath: { type: String, maxLength: 128 },
  openedPlaylistId: String, // TODO Put a link url in it ? | s/b an ObjectID instead
  playingMediumInQueueIndex: Number
});
userStateSchema.set('toJSON', { virtuals: true });
// virtuals: false to avoid inserting links to database
userStateSchema.set('toObject', { virtuals: false });
userStateSchema.methods.toJSON = function() {
  var obj = this.toObject();
  // TODO This id is used only for client side's ui. Client should rather only use its own ids
  obj.links = this.links;
  delete obj._id;
  delete obj.ownerId;
  delete obj.__v;
  return obj;
};
userStateSchema.virtual('links').get(function() {
  return [{
    rel: 'self',
    href: routes.userStates.selfPath.replace(':userStateId', this.id)
  }, {
    rel: 'update',
    href: routes.userStates.updatePath.replace(':userStateId', this._id)
  }, {
    rel: 'remove',
    href: routes.userStates.deletePath.replace(':userStateId', this._id)
  }];
});

export default mongoose.model<UserState>('UserState', userStateSchema);
