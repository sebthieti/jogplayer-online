import {HttpClient, json} from 'aurelia-fetch-client';
import {autoinject} from 'aurelia-framework';
import {UpdateUserState, UserState} from '../entities/userState';

@autoinject
export default class UserStateRepository {
  constructor(private http: HttpClient) {
    http.baseUrl = 'http://localhost:10000/';
    http.configure(config => config
      .withDefaults({
        credentials: 'include'
      })
    );
  }

  async getCurrentUserState(): Promise<UserState> {
    const resp = await this.http.fetch('api/state');
    const data = await resp.json();
    return this.toUserState(data);
  }

  async updateUserState(state: UpdateUserState): Promise<UserState> {
    const resp = await this.http.fetch('api/state', {
      method: 'PATCH',
      body: json(state)
    });
    const data = await resp.json();
    return this.toUserState(data);
  }

  private toUserState(entity: any): UserState {
    return {
      playedPosition: entity.playedPosition,
      mediaQueue: entity.mediaQueue,
      browsingFolderPath: entity.browsingFolderPath,
      openedPlaylistPosition: entity.openedPlaylistPosition,
      playingMediumInQueueIndex: entity.playingMediumInQueueIndex
    }
  }
}
