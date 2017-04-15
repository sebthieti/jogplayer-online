import * as utils from 'util';

export default class LazyModelAsync<TModel, TEntity> {
  _value: TModel;
  _entities: TEntity;
  _whenReadyArr = [];

  constructor(
    private fn: (TEntity?) => Promise<TModel>,
    entities?: TEntity
  ) {
    this._entities = entities;
  }

  whenReady(fn: (TModel) => void) {
    this._whenReadyArr.push(fn);
    return this;
  }

  get valueAsync(): Promise<TModel> {
    if (utils.isUndefined(this._value)) {
      return this.fn(this._entities).then(value => {
        this._value = value;
        this._whenReadyArr.forEach(fn => fn(value));
        return value;
      });
    }
    return Promise.resolve(this._value);
  }

  get value(): TModel {
    return this._value;
  }

  get entities(): TEntity {
    return this._entities;
  }
}
