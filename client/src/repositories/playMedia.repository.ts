import {HttpClient} from 'aurelia-fetch-client';
import {autoinject} from 'aurelia-framework';

@autoinject
export default class PlayMediaRepository {
  constructor(private http: HttpClient) {
  }

  async getMediumInfo(playlistIndex: number, mediumIndex: number): Promise<any> {
    const resp = await this.http.fetch(`api/playlists/${playlistIndex}/media/${mediumIndex}`);
    const data = await resp.json();
    return data;
  }
}
