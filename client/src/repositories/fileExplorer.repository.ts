import {HttpClient} from 'aurelia-fetch-client';
import {autoinject} from 'aurelia-framework';
import {Medium} from '../entities/medium';

@autoinject
export class FileExplorerRepository {
  constructor(private http: HttpClient) {
  }

  async getMediumFromUrl(url: string): Promise<Medium> {
    const resp = await this.http.fetch(url);
    const data = await resp.json();
    return data as Medium;
  }
}
