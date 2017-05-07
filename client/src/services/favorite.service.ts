import {autoinject} from 'aurelia-framework';
import { Subject, Observable } from 'rx';
// import Rx  from 'rx';

import * as _ from 'lodash';
import FavoriteModel from '../models/favorite.model';
import {FavoriteRepository} from '../repositories/favorite.repository';

@autoinject
export default class FavoriteService {
  private favorites: FavoriteModel[];

  private favoritesSubject = new Subject<FavoriteModel[]>();
  private favoriteChangeSubject = new Subject<FavoriteModel>();
  private selectedFavoriteSubject = new Subject<FavoriteModel>();

  constructor(private repository: FavoriteRepository) {
    // Observable.;
  }

  // getAndObserveFavorite(favoriteIndex: number): Observable<FavoriteModel[]> {
  //   return this
  //     .observeFavorites()
  //     .filter(favorites => favorites.index === favoriteIndex);
  // }

  observeFavorites(): Observable<FavoriteModel[]> {
    return this.favoritesSubject.whereIsDefined();
  }

  observeFavoriteChanges(): Observable<FavoriteModel> {
    // Rx.config
    return this.favoriteChangeSubject;
  }

  observeSelectedFavorite(): Observable<FavoriteModel> {
    return this.selectedFavoriteSubject;
  }

  // observeSelectedFavoriteLink() {
  //   return this.observeSelectedFavorite()
  //     .selectMany((favorite) {
  //     var target = linkHelper.selectTargetLinkFromLinks(favorite.links);
  //     return target.href;
  //   })
  // }

  async addFolderToFavoritesAsync(folderPath: string): Promise<FavoriteModel> {
    // const favorites = await this.observeFavorites().toPromise();
    // this.observeFavorites().getValueAsync(function(favorites) {

    // Get folder name for fav name.
    // var favCount = 0;
    // if (favorites) {
    //   favCount = favorites.length;
    // }

    const favorite = new FavoriteModel(this.repository,
      (favorite) => this.getIndexOfFavorite(favorite),
      {
        name: _.last(this.splitFolderPath(folderPath)),
        folderPath: folderPath
      });

    await this.repository.insertAsync(favorite);
    const length = this.favorites.push(favorite);
    this.favoritesSubject.onNext(this.favorites);

    return this.favorites[length-1];
        // .then((newFavorite) {
        //   favorites = favorites.concat(newFavorite);
        //   favoritesSubject.onNext(favorites);
        // });
    // });
  }

  private getIndexOfFavorite(favorite: FavoriteModel): number {
    return this.favorites.indexOf(favorite);
  }

  // TODO May be moved to helper ?
  private splitFolderPath(folderPath: string): string[] {
    const levels = folderPath.split("/");
    return _.filter(levels, lvl => lvl !== '');
  }

  // updateFavoriteAsync(favoriteModel) {
  //   return favoriteModel.updateAsync();
  // }

  async removeFavorite(favorite: FavoriteModel): Promise<void> {
    const index = this.favorites.indexOf(favorite);
    await this.repository.deleteAsync(index);
    this.favorites.splice(index, 1);
    this.favoritesSubject.onNext(this.favorites);

    //   observeFavorites().getValueAsync(function(favorites){
    //     var updatedFavorites = removeFavorite(favorites, favoriteModel);
    //     updatedFavorites = remapIndexes(updatedFavorites);
    //
    //     favoritesSubject.onNext(updatedFavorites);
    //   });
    // });
  }

  // removeFavorite(favorites, favorite) {
  //   return _.filter(favorites, function(fav) {
  //     return fav.id !== favorite.id;
  //   });
  // }

  // TODO Business should create VM, and receive VM
  // remapIndexes(favorites) {
  //   var favIndex = 0;
  //   _.each(favorites, function(fav) {
  //     fav.index = favIndex;
  //     favIndex++;
  //   });
  //   return favorites;
  // }

  // changeSelectedFavorite(favorite) {
  //   selectedFavoriteSubject.onNext(favorite); // TODO Use only link ?
  // }

  async loadFavorites(): Promise<FavoriteModel[]> {
    // authBusiness
    //   .observeAuthenticatedUser()
    //   .whereHasValue()
    //   .do(function(__) {
    const favorites = await this.repository.getAsync();

    this.favorites = favorites.map(fav => new FavoriteModel(
      this.repository,
      (favorite) => this.getIndexOfFavorite(favorite),
      {
        name: fav.name,
        folderPath: fav.folderPath
      })
    );
    this.favoritesSubject.onNext(this.favorites);
    return this.favorites;
    // FavoriteModel
    //       .getAsync()
    //       .then(function(favorites) {
    //         favoritesSubject.onNext(favorites);
    //       });
      // })
      // .silentSubscribe();
  }

  // clearUsersOnUserLogoff() {
  //   authBusiness
  //     .observeCurrentUserAuthentication()
  //     .whereIsNull()
  //     .do(function() {
  //       favoritesSubject.onNext(null);
  //     })
  //     .silentSubscribe();
  // }
}
