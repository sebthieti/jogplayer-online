import {UserPermissionsDto} from './userPermissions.dto';

export interface UserDto {
  id: string;
  isActive: boolean;
  username: string;
  fullName: string;
  email: string;
  password: string;
  permissions: UserPermissionsDto;
}
