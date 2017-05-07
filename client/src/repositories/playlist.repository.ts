import {Medium} from '../entities/medium';
import {HttpClient, json} from 'aurelia-fetch-client';
import {autoinject} from 'aurelia-framework';
import {Playlist} from '../entities/playlist';

interface MovePlaylistsRequest {
  ids: number[];
  steps: number;
}

export interface UpsertPlaylist {
  name?: string;
  filePath?: string;
  // mediaIds: string[];
}

@autoinject
export default class PlaylistRepository {
  constructor(private http: HttpClient) {
  }

  async getPlaylists(): Promise<Playlist[]> {
    const resp = await this.http.fetch('api/playlists');
    const data = await resp.json();
    return data as Playlist[];
  }

  async insertPlaylist(playlist: UpsertPlaylist): Promise<Playlist> {
    const resp = await this.http.fetch('api/playlists', {
      method: 'post',
      body: json(playlist)
    });
    const data = await resp.json();
    return data as Playlist;
  }

  async updatePlaylist(playlistIndex: number, playlist: UpsertPlaylist): Promise<Playlist> {
    const resp = await this.http.fetch(`/api/playlists/${playlistIndex}`, {
      method: 'patch',
      body: json(playlist)
    });
    const data = await resp.json();
    return data as Playlist;
  }

  async movePlaylists(playlistIndexes: number[], steps: number): Promise<Playlist[]> {
    const resp = await this.http.fetch('/api/actions/playlists/move', {
      method: 'patch',
      body: json({
        ids: playlistIndexes,
        steps
      } as MovePlaylistsRequest)
    });
    const data = await resp.json();
    return data as Playlist[];
  }

  async deletePlaylist(playlistIndex: number): Promise<void> {
    await this.http.fetch(`/api/playlists/${playlistIndex}`, {
      method: 'delete'
    });
  }

  async getMediumById(playlistIndex: number, mediumId: string): Promise<Medium> {
    const resp = await this.http.fetch(`/api/playlists/${playlistIndex}/media/${mediumId}`);
    const data = await resp.json();
    return data as Medium;
  }

  async getMediumByPath(rawMediumPath: string): Promise<Medium> {
    const resp = await this.http.fetch(rawMediumPath);
    const data = await resp.json();
    return data as Medium;
  }

  async getMedia(playlistIndex: number): Promise<Medium[]> {
    const resp = await this.http.fetch(`/api/playlists/${playlistIndex}/media/`);
    const data = await resp.json();
    return data as Medium[];
  }

  async addMedium(playlistIndex: number, mediumFilePath: string): Promise<Medium> {
    const resp = await this.http.fetch(`/api/playlists/${playlistIndex}/media/`, {
      method: 'post',
      body: json(mediumFilePath)
    });
    const data = await resp.json();
    return data as Medium;
  }

  async insertMedium(playlistIndex: number, mediumIndex: number, mediumFilePath: string): Promise<Medium> {
    const resp = await this.http.fetch(`/api/playlists/${playlistIndex}/media/`, {
      method: 'post',
      body: json({
        index: mediumIndex,
        mediumFilePath
      })
    });
    const data = await resp.json();
    return data as Medium;
  }

  async removeMedium(playlistIndex: number, mediumIndex: number): Promise<void> {
    await this.http.fetch(`/api/playlists/${playlistIndex}/media/${mediumIndex}`, {
      method: 'delete'
    });
  }
}
