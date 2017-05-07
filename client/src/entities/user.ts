import {UserPermissions} from './userPermissions';

export interface User {
  id: string;
  isActive: boolean;
  username: string;
  fullName: string;
  email: string;
  password: string;
  permissions: UserPermissions;
}

export interface UpsertUser {
  isActive?: boolean;
  username?: string;
  fullName?: string;
  email?: string;
  password?: string;
}

export interface InsertUserWithPermissions {
  isActive?: boolean;
  username: string;
  password: string;
  fullName?: string;
  email?: string;
  permissions: UserPermissions;
}

export interface UpdatePermissions {
  canWrite?: boolean;
  isAdmin?: boolean;
  allowPaths?: string[];
  denyPaths?: string[];
  homePath?: string;
}
