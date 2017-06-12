import {autoinject} from 'aurelia-framework';
import {HttpClient, json} from 'aurelia-fetch-client';
import {Medium} from '../entities/medium';
import {Playlist} from '../entities/playlist';

interface MovePlaylistsRequest {
  ids: number[];
  steps: number;
}

export interface UpsertPlaylist {
  name?: string;
  filePath?: string;
}

export interface InsertPlaylistMedia {
  mediaFilePath: string;
  index?: number;
}

@autoinject
export default class PlaylistRepository {
  constructor(private http: HttpClient) {
    http.baseUrl = 'http://localhost:10000/';
    http.configure(config => config
      .withDefaults({
        credentials: 'include'
      })
    );
  }

  async getPlaylists(): Promise<Playlist[]> {
    const resp = await this.http.fetch('api/playlists');
    const data = await resp.json();
    return data.map(x => this.toPlaylist(x));
  }

  async insertPlaylist(playlist: UpsertPlaylist): Promise<Playlist> {
    const resp = await this.http.fetch('api/playlists', {
      method: 'POST',
      body: json(playlist)
    });
    const data = await resp.json();
    return this.toPlaylist(data);
  }

  async updatePlaylist(playlistIndex: number, playlist: UpsertPlaylist): Promise<Playlist> {
    const resp = await this.http.fetch(`api/playlists/${playlistIndex}`, {
      method: 'PATCH',
      body: json(playlist)
    });
    const data = await resp.json();
    return this.toPlaylist(data);
  }

  async movePlaylists(playlistIndexes: number[], steps: number): Promise<Playlist[]> {
    const resp = await this.http.fetch('/api/actions/playlists/move', {
      method: 'PATCH',
      body: json({
        ids: playlistIndexes,
        steps
      } as MovePlaylistsRequest)
    });
    const data = await resp.json();
    return data.map(x => this.toPlaylist(x));
  }

  async deletePlaylist(playlistIndex: number): Promise<void> {
    await this.http.fetch(`api/playlists/${playlistIndex}`, {
      method: 'DELETE'
    });
  }

  async getMediumById(playlistIndex: number, mediumId: string): Promise<Medium> {
    const resp = await this.http.fetch(`api/playlists/${playlistIndex}/media/${mediumId}`);
    const data = await resp.json();
    return this.toMedium(data);
  }

  async getMediumByPath(rawMediumPath: string): Promise<Medium> {
    const resp = await this.http.fetch(rawMediumPath);
    const data = await resp.json();
    return this.toMedium(data);
  }

  async getMedia(playlistIndex: number): Promise<Medium[]> {
    const resp = await this.http.fetch(`api/playlists/${playlistIndex}/media/`);
    const data = await resp.json();
    return data.map(x => this.toMedium(x));
  }

  async addMedium(playlistIndex: number, insertMedia: InsertPlaylistMedia): Promise<Medium> {
    const resp = await this.http.fetch(`api/playlists/${playlistIndex}/media/`, {
      method: 'POST',
      body: json(insertMedia)
    });
    const data = await resp.json();
    return this.toMedium(data);
  }

  async insertMedium(playlistIndex: number, mediumIndex: number, mediumFilePath: string): Promise<Medium> {
    const resp = await this.http.fetch(`api/playlists/${playlistIndex}/media/`, {
      method: 'POST',
      body: json({
        index: mediumIndex,
        mediumFilePath
      })
    });
    const data = await resp.json();
    return this.toMedium(data);
  }

  async removeMedium(playlistIndex: number, mediumIndex: number): Promise<void> {
    await this.http.fetch(`api/playlists/${playlistIndex}/media/${mediumIndex}`, {
      method: 'DELETE'
    });
  }

  private toPlaylist(entity: any): Playlist {
    return {
      name: entity.name,
      isAvailable: entity.isAvailable
    }
  }

  private toMedium(entity: any): Medium {
    return {
      id: entity.id,
      title: entity.title,
      name: entity.name || entity.title,
      isAvailable: entity.isAvailable,
      isChecked: entity.isChecked,
      mimeType: entity.mimeType,
      duration: entity.duration,
      filePath: entity.filePath,
      ext: entity.ext
    }
  }
}
