import {HttpClient} from 'aurelia-fetch-client';
import {autoinject} from 'aurelia-framework';
import {MediumSummary} from '../entities/medium';
import {File} from '../entities/file';
import {Folder} from '../entities/folder';

@autoinject
export class FileExplorerRepository {
  constructor(private http: HttpClient) {
  }

  async getMediumFromUrl(url: string): Promise<MediumSummary> {
    const resp = await this.http.fetch(`api/explore${url}`);
    const data = await resp.json();
    return {
      name: data.name,
      type: data.type
    };
  }

  async getFolder(url: string): Promise<Folder> {
    if (url[url.length - 1] !== '/') {
      url += '/';
    }
    const resp = await this.http.fetch(`api/explore${url}`);
    const data = await resp.json();
    return {
      files: data.files.map(x => this.toFile(x))
    };
  }

  private toFile(entity: any): File {
    return {
      name: entity.name,
      type: entity.type
    }
  }
}
