'use strict';

var Dto = function () {
};

// TODO Rename this because a class like folder content shouldn't inherit this
Dto.prototype.getDefinedFields = function () {
  var data = {};
  for (var prop in this) {
    if(this.hasOwnProperty(prop) && this[prop] !== undefined) {
      data[prop] = this[prop];
    }
  }
  return data;
};

module.exports = Dto;
