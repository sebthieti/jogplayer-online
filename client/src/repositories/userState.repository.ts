import {HttpClient, json} from 'aurelia-fetch-client';
import {autoinject} from 'aurelia-framework';
import {UpdateUserState, UserState} from '../entities/userState';

@autoinject
export default class UserStateRepository {
  constructor(private http: HttpClient) {
  }

  async getCurrentUserState(): Promise<UserState> {
    const resp = await this.http.fetch('api/state');
    const data = await resp.json();
    return data as UserState;
  }

  async updateUserState(state: UpdateUserState): Promise<UserState> {
    const resp = await this.http.fetch('api/state', {
      method: 'patch',
      body: json(state)
    });
    const data = await resp.json();
    return data as UserState;
  }
}
