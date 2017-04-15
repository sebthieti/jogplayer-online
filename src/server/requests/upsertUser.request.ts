export interface UpsertUserRequest {
  isActive: boolean;
  username: string;
  fullName: string;
  email: string;
  password: string;
}
