export interface UserPermissions {
  isAdmin: boolean;
  isRoot: boolean;
  canWrite: boolean;
  allowPaths: string[];
  denyPaths: string[];
  homePath: string;
}
