export interface IDto {
  getDefinedFields();
}

export default class Dto implements IDto {
  // TODO Rename this because a class like folder content shouldn't inherit this
  getDefinedFields() {
    let data = {};
    for (let prop in this) {
      if (this.hasOwnProperty(prop) && this[prop] !== undefined) {
        data[prop] = this[prop];
      }
    }
    return data;
  }
}
