import {HttpClient, json} from 'aurelia-fetch-client';
import {autoinject} from 'aurelia-framework';
import {UpdatePermissions, UpsertUser, User} from '../entities/user';
import {UserPermissions} from '../entities/userPermissions';

@autoinject
export class UserRepository {
  private baseUrl = 'api/users';

  constructor(private http: HttpClient) {
    http.baseUrl = 'http://localhost:10000/';
    http.configure(config => config
      .withDefaults({
        credentials: 'include'
      })
    );
  }

  async getUsers(): Promise<User[]> {
    const resp = await this.http.fetch(this.baseUrl);
    const data = await resp.json();
    return data as User[];
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
    return data as User;
  }

  async logout(): Promise<void> {
    await this.http.fetch('api/logout', {
      method: 'POST'
    });
  }

  async isAuthenticated(): Promise<User> {
    const resp = await this.http.fetch('api/is-authenticated');
    const data = await resp.json();
    return data as User;
  }

  async insert(user: UpsertUser): Promise<User> {
    const resp = await this.http.fetch(this.baseUrl, {
      method: 'POST',
      body: json(user)
    });
    const data = await resp.json();
    return data as User;
  }

  async update(userId: string, user: UpsertUser): Promise<User> {
    try {
      const resp = await this.http.fetch(`${this.baseUrl}/${userId}`, {
        method: 'PATCH',
        body: json(user),
        credentials: 'include'
      });
      const data = await resp.json();
      return data as User;
    } catch (e) {
      console.log(e);
    }
  }

  async remove(userId: string): Promise<void> {
    await this.http.fetch(`${this.baseUrl}/${userId}`, {
      method: 'DELETE'
    });
  }

  async updateUserPermissions(userId: string, permissions: UpdatePermissions): Promise<UserPermissions> {
    const resp = await this.http.fetch(`${this.baseUrl}/${userId}/permissions`, {
      method: 'PATCH',
      body: json(permissions)
    });
    const data = await resp.json();
    return data as UserPermissions;
  }
}
