export interface UserPermissions {
  canWrite: boolean;
  isAdmin: boolean;
  isRoot: boolean;
  allowPaths: string[];
  denyPaths: string[];
  homePath: string;
}
