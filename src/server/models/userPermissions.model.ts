import * as mongoose from 'mongoose';
import Schema = mongoose.Schema;
import * as mongooseTypes from 'mongoose-types-ext';
mongooseTypes(mongoose);
import routes from '../routes';

export interface UserPermissions extends mongoose.Document {
  canWrite: boolean;
  isAdmin: boolean;
  isRoot: boolean;
  allowPaths: string[];
  denyPaths: string[];
  homePath: string;
  links: string[];
}

export interface IUserPermissionsModel extends mongoose.Model<UserPermissions> {
}

const userPermissionsSchema = new Schema({
  //userId: { type: Schema.Types.ObjectId, ref: 'User' },
  canWrite: Boolean,
  isAdmin: Boolean,
  isRoot: Boolean, // TODO This one must be read only
  allowPaths: [ String ],
  denyPaths: [ String ],
  homePath: { type: String, maxLength: 128 }
});

userPermissionsSchema.set('toJSON', { virtuals: true });
// virtuals: false to avoid inserting links to database
userPermissionsSchema.set('toObject', { virtuals: false });
userPermissionsSchema.methods.toJSON = function() {
  var obj = this.toObject();
  // TODO This id is used only for client side's ui. Client should rather only use its own ids
  //obj.id = obj._id;
  obj.links = this.links;
  delete obj._id;
  delete obj.userId;
  delete obj.__v;
  return obj;
};
userPermissionsSchema.virtual('links').get(function() {
  return [{
    rel: 'update',
    href: routes.userPermissions.updatePath.replace(':userId', this.id)
  }, (function(self){
    return self.homePath
      ? {
        rel: 'self.browsingFolderPath',
        href: routes.explore.fileInfoPathPattern.replace(':relativePath', self.homePath)
      } : {};
  }(this)) ];
});

export default mongoose.model<UserPermissions>('UserPermission', userPermissionsSchema);
