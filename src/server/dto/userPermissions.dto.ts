export interface UserPermissionsDto {
  isAdmin: boolean;
  isRoot: boolean;
  canWrite: boolean;
  allowPaths: string[];
  denyPaths: string[];
  homePath: string;
}
