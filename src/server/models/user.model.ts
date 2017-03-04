import * as mongoose from 'mongoose';
import Schema = mongoose.Schema;
import * as mongooseTypes from 'mongoose-types-ext';
mongooseTypes(mongoose);
import routes from '../routes';
import {UserPermissions} from './userPermissions.model';

export interface User extends mongoose.Document {
  isActive: boolean;
  username: string;
  password: string;
  passwordSalt: string;
  fullName: string;
  email: string;
  permissions: UserPermissions;
  links: string[];
}

export interface IUserModel extends mongoose.Model<User> {
}

const userSchema = new Schema({
  isActive: Boolean,
  username: { type: String, required: 'Username is mandatory', maxLength: 128 },
  password: { type: String, required: 'Password is mandatory', maxLength: 128 },
  passwordSalt: { type: String, required: 'PasswordSalt is mandatory' },
  fullName: { type: String, maxLength: 128 },
  email: { type: String, maxLength: 128 },
  //state: { type: Schema.Types.ObjectId, ref: 'UserState' }
  permissions: { type: Schema.Types.ObjectId, ref: 'UserPermission' }
});
userSchema.set('toJSON', { virtuals: true });
// virtuals: false to avoid inserting links to database
userSchema.set('toObject', { virtuals: false });
userSchema.methods.toJSON = function() {
  let obj = this.toObject();
  //var f = this.permissions.toJSON();

  obj.links = this.links;

  delete obj._id; // TODO Use select method pattern instead
  delete obj.permissions;
  obj.permissions = this.permissions.toJSON();
  //delete obj.canWrite;
  //delete obj.isAdmin;
  delete obj.password;
  delete obj.passwordSalt;
  delete obj.__v;
  return obj;
};
userSchema.virtual('links').get(function() {
  return [{
    rel: 'self',
    href: routes.users.selfPath.replace(':userId', this.id)
  }/*, {
   rel: 'self.permissions',
   href: _userRoutes.selfPermissionsPath.replace(':userId', this.id)
   }*/, {
    rel: 'update',
    href: routes.users.updatePath.replace(':userId', this._id)
  }, {
    rel: 'remove',
    href: routes.users.deletePath.replace(':userId', this._id)
  }];
});

export default mongoose.model<User>('User', userSchema);
