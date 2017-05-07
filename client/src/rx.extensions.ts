import {Observable} from 'rx';
import * as _ from 'lodash';

declare module 'rx' {
  export interface PreviousValueSelector<T, TResult> {
    (previous: T, current: T): TResult;
  }

  export interface Observable<T> {
    asAsyncValue(): Observable<T>
    doAsync(callback: (value: T) => void): Observable<T>;
    selectUnit(): Observable<any>;
    mapWithPreviousValue<TResult>(selector: PreviousValueSelector<T, TResult>): Observable<T>;
    whereHasValue(): Observable<T>;
    whereIsDefined(): Observable<T>;
    whereIsNotNull(): Observable<T>;
    whereIsNull(): Observable<T>;
    whereIsFalse(): Observable<T>;
    whereIsTrue(): Observable<T>;
    whereIsAdminOrRootUser(): Observable<T>;
  }
}

Observable.prototype.asAsyncValue = function(): Observable {
  return this.take(1);
};

Observable.prototype.whereIsDefined = function(): Observable {
  return this.filter(obj => !_.isUndefined(obj));
};

Observable.prototype.whereIsNotNull = function(): Observable {
  return this.filter(obj => obj !== null);
};

Observable.prototype.whereIsNull = function(): Observable {
  return this.filter(obj => obj === null);
};

Observable.prototype.whereHasValue = function(): Observable {
  return this.filter(obj => !_.isUndefined(obj) && obj);
};

Observable.prototype.whereIsFalse = function(): Observable {
  return this.filter(boolean => boolean === false);
};

Observable.prototype.whereIsTrue = function(): Observable {
  return this.filter(boolean => boolean === true);
};

Observable.prototype.selectUnit = function(): Observable {
  return this.select(__ => {});
};

Observable.prototype.mapWithPreviousValue = function(selector): Observable {
  let previousValue = null;
  return this.select(function(sel) {
    let local = selector(previousValue, sel);
    previousValue = sel;
    return local;
  });
};

Observable.prototype.doAsync = function(callback): Observable {
  this.asAsyncValue()
    .do(callback)
    .subscribe();
};

Observable.prototype.whereIsAdminOrRootUser = function(): Observable {
  return this.filter(function(user) {return user && user.permissions && user.permissions.isRoot || user.permissions.isAdmin});
};
