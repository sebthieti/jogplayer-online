import {HttpClient, json} from 'aurelia-fetch-client';
import {autoinject} from 'aurelia-framework';
import {Favorite, UpsertFavorite} from '../entities/favorite';

@autoinject
export class FavoriteRepository {
  private baseUrl = 'api/favorites';

  constructor(private http: HttpClient) {
    http.baseUrl = 'http://localhost:10000/';
    http.configure(config => config
      .withDefaults({
        credentials: 'include'
      })
    );
  }

  async getAsync(): Promise<Favorite[]> {
    const resp = await this.http.fetch(this.baseUrl);
    const data = await resp.json();
    return data as Favorite[];
  }

  async getByIndexAsync(index: number): Promise<Favorite> {
    const resp = await this.http.fetch(`${this.baseUrl}/${index}`);
    const data = await resp.json();
    return data as Favorite;
  }

  async insertAsync(favorite: Favorite): Promise<Favorite> {
    const resp = await this.http.fetch(this.baseUrl, {
      method: 'POST',
      body: json(favorite)
    });
    const data = await resp.json();
    return data as Favorite;
  }

  async updateAsync(index: number, favorite: UpsertFavorite): Promise<Favorite> {
    const resp = await this.http.fetch(`${this.baseUrl}/${index}`, {
      method: 'PATCH',
      body: json(favorite)
    });
    const data = await resp.json();
    return data as Favorite;
  }

  async deleteAsync(index: number): Promise<void> {
    await this.http.fetch(`${this.baseUrl}/${index}`, {
      method: 'DELETE'
    });
  }
}
