import {HttpClient, json} from 'aurelia-fetch-client';
import {autoinject} from 'aurelia-framework';
import {Favorite, InsertFavorite, UpdateFavorite} from '../entities/favorite';

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
    return data.map(x => this.toFavorite(x));
  }

  async getByIndexAsync(index: number): Promise<Favorite> {
    const resp = await this.http.fetch(`${this.baseUrl}/${index}`);
    const data = await resp.json();
    return this.toFavorite(data);
  }

  async insertAsync(favorite: InsertFavorite): Promise<Favorite> {
    const resp = await this.http.fetch(this.baseUrl, {
      method: 'POST',
      body: json(favorite)
    });
    const data = await resp.json();
    return this.toFavorite(data);
  }

  async updateAsync(index: number, favorite: UpdateFavorite): Promise<Favorite> {
    const resp = await this.http.fetch(`${this.baseUrl}/${index}`, {
      method: 'PATCH',
      body: json(favorite)
    });
    const data = await resp.json();
    return this.toFavorite(data);
  }

  async deleteAsync(index: number): Promise<void> {
    await this.http.fetch(`${this.baseUrl}/${index}`, {
      method: 'DELETE'
    });
  }

  private toFavorite(entity: any): Favorite {
    return {
      name: entity.name,
      folderPath: entity.folderPath
    };
  }
}
