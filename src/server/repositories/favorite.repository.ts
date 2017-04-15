import {IMongoDbContext} from './mongoDb.context';
import {Favorite} from '../entities/favorite';
import {ObjectID} from 'mongodb';
import {isNumber} from 'util';

export interface IFavoriteRepository {
  getAsync(issuerId: ObjectID): Promise<Favorite[]>;
  addAsync(favorite: Favorite, issuerId: ObjectID): Promise<Favorite>;
  updateAsync(favoriteIndex: number, favorite: Favorite, issuerId: ObjectID): Promise<Favorite>;
  removeByIdAsync(favoriteIndex: number, issuerId: ObjectID): Promise<number>;
}

export default class FavoriteRepository implements IFavoriteRepository {
  constructor(private dbContext: IMongoDbContext) {
  }

  getAsync(issuerId: ObjectID): Promise<Favorite[]> {
    return this.dbContext.users
      .find({ _id: issuerId }, { fields: 'favorites'})
      .toArray();
  }

  async addAsync(favorite: Favorite, issuerId: ObjectID): Promise<Favorite> {
    if (!favorite) {
      throw new Error('favorite must be set');
    }
    if (!issuerId) {
      throw new Error('issuer must be set');
    }

    const result = await this.dbContext
      .users
      .findOneAndUpdate(
        { _id: issuerId },
        { $push: { favorites: favorite }},
        { projection: { favorites: 1 }}
      );

    const favorites = result.value.favorites as Favorite[];
    return favorites[favorites.length - 1];
  }

  async updateAsync(favoriteIndex: number, favorite: Favorite, issuerId: ObjectID): Promise<Favorite> {
    if (!isNumber(favoriteIndex)) {
      throw new Error('favorite index must be a number');
    }
    if (!favorite) {
      throw new Error('favorite must be set');
    }
    if (!issuerId) {
      throw new Error('issuer must be set');
    }

    let updateDbReq = { $set: {} };
    updateDbReq.$set[`favorites.${favoriteIndex}`] = favorite;

    const result = await this.dbContext
      .users
      .findOneAndUpdate(
        { _id: issuerId },
        updateDbReq,
        { projection: { favorites: 1 }, returnOriginal: false }
      );

    const favorites = result.value.favorites as Favorite[];
    return favorites[favoriteIndex];
  }

  async removeByIdAsync(favoriteIndex: number, issuerId: ObjectID): Promise<number> {
    const updateDbReq = { $unset: {} };
    updateDbReq.$unset[`favorites.${favoriteIndex}`] = 1;

    await this.dbContext.users.update(
      { _id: issuerId },
      updateDbReq
    );

    await this.dbContext.users.update(
      { _id: issuerId },
      {$pull : { favorites : null }}
    );

    return 1;
  }
}
