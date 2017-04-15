import {IUserModel} from '../models/user.model';
import {UserDto} from '../dto/user.dto';
import toUserPermission from './userPermissions.mapper';

export default function toUserDto(user: IUserModel): UserDto {
  return {
    id: user._id.toString(),
    isActive: user.isActive,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    permissions: toUserPermission(user.permissions)
  } as UserDto;
}
