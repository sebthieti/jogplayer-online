import {HttpClient, json} from 'aurelia-fetch-client';
import {autoinject} from 'aurelia-framework';
import {UpdatePermissions, UpsertUser, User} from '../entities/user';
import {UserPermissions} from '../entities/userPermissions';
import { Subject, Observable } from 'rx';

@autoinject
export class UserRepository {
  private baseUrl = 'api/users';
  private unauthorizedErrorSubject = new Subject<void>();

  constructor(private http: HttpClient) { // TODO If same instance of fetch, then we only need one setup
    http.baseUrl = 'http://localhost:10000/';
    http.configure(config => config
      .withInterceptor({
        response(response: Response) {
          if (response.status === 401) {
            this.unauthorizedErrorSubject.onNext();
          }
          return response;
        }
      })
      .withDefaults({
        credentials: 'include'
      })
    );
  }

  observeUnauthorizedError(): Observable<void> {
    return this.unauthorizedErrorSubject;
  }

  async getUsers(): Promise<User[]> {
    const resp = await this.http.fetch(this.baseUrl);
    const data = await resp.json();
    return data.map(x => this.toUser(x));
  }

  async login(username: string, password: string): Promise<User> {
    const resp = await this.http.fetch('api/login', {
      method: 'POST',
      body: json({
        username: username,
        password: password
      })
    });
    const data = await resp.json();
    return this.toUser(data);
  }

  async logout(): Promise<void> {
    await this.http.fetch('api/logout', {
      method: 'POST'
    });
  }

  async isAuthenticated(): Promise<User> {
    const resp = await this.http.fetch('api/is-authenticated');
    const data = await resp.json();
    return this.toUser(data);
  }

  async insert(user: UpsertUser): Promise<User> {
    const resp = await this.http.fetch(this.baseUrl, {
      method: 'POST',
      body: json(user)
    });
    const data = await resp.json();
    return this.toUser(data);
  }

  async update(userId: string, user: UpsertUser): Promise<User> {
    const resp = await this.http.fetch(`${this.baseUrl}/${userId}`, {
      method: 'PATCH',
      body: json(user),
      credentials: 'include'
    });
    const data = await resp.json();
    return this.toUser(data);
  }

  async remove(userId: string): Promise<void> {
    await this.http.fetch(`${this.baseUrl}/${userId}`, {
      method: 'DELETE'
    });
  }

  async updatePermissions(userId: string, permissions: UpdatePermissions): Promise<UserPermissions> {
    const resp = await this.http.fetch(`${this.baseUrl}/${userId}/permissions`, {
      method: 'PATCH',
      body: json(permissions)
    });
    const data = await resp.json();
    return this.toPermissions(data);
  }

  private toUser(entity: any): User {
    return {
      id: entity.id,
      isActive: entity.isActive,
      username: entity.username,
      fullName: entity.fullName,
      email: entity.email,
      permissions: this.toPermissions(entity.permissions)
    }
  }

  private toPermissions(entity: any): UserPermissions {
    return {
      isRoot: entity.isRoot,
      isAdmin: entity.isAdmin,
      canWrite: entity.canWrite,
      allowPaths: entity.allowPaths,
      denyPaths: entity.denyPaths,
      homePath: entity.homePath
    }
  }
}
