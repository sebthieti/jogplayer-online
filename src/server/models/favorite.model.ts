import routes from '../routes';
import {Favorite} from '../entities/favorite';
import {Link} from '../entities/link';
import {UpsertFavoriteRequest} from '../requests/upsertFavorite.request';
import {IFavoriteRepository} from '../repositories/favorite.repository';
import {IUserModel} from './user.model';

export interface IFavoriteModel {
  index: number;
  name: string;
  folderPath: string;
  links: Link[];
  setFromRequest(request: UpsertFavoriteRequest): IFavoriteModel;
  updateFavoriteAsync(): Promise<IFavoriteModel>;
  toEntity(): Favorite;
}

export default class FavoriteModel implements IFavoriteModel {
  name: string;
  folderPath: string;

  static fromRequest(
    favoriteRepository: IFavoriteRepository,
    user: IUserModel,
    favoriteRequest: UpsertFavoriteRequest,
    indexer: (model: IFavoriteModel) => number
  ) {
    return new FavoriteModel(favoriteRepository, user, indexer, {
      name: favoriteRequest.name,
      folderPath: favoriteRequest.folderPath
    })
  }

  constructor(
    private favoriteRepository: IFavoriteRepository,
    private user: IUserModel,
    public indexer: (model: IFavoriteModel) => number,
    favorite?: Favorite
  ) {
    Object.assign(this, favorite);
  }

  setFromRequest(request: UpsertFavoriteRequest): IFavoriteModel {
    Object.assign(this, request);
    return this;
  }

  async updateFavoriteAsync(): Promise<IFavoriteModel> {
    await this.favoriteRepository.updateAsync(
      this.indexer(this),
      this.toEntity(),
      this.user._id);
    return this;
  }

  get index(): number {
    return this.indexer(this);
  }

  get links(): Link[] {
    const index = this.index;
    return [{
      rel: 'self',
      href: routes.favorites.selfPath.replace(':favIndex', index.toString())
    }, {
      rel: 'target',
      href: '/api/explore' + this.folderPath // TODO Refactor
    }, {
      rel: 'update',
      href: routes.favorites.updatePath.replace(':favIndex', index.toString())
    }, {
      rel: 'remove',
      href: routes.favorites.deletePath.replace(':favIndex', index.toString())
    }];
  }

  toEntity(): Favorite {
    return {
      name: this.name,
      folderPath: this.folderPath
    };
  }
}
