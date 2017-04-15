export interface UpdatePermissionsRequest {
  canWrite: boolean;
  isAdmin: boolean;
  allowPaths: string[];
  denyPaths: string[];
  homePath: string;
}
