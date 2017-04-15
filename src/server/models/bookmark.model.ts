import {IModel} from "./model";
import {Bookmark} from "../entities/bookmark";

export interface IBookmarkModel extends IModel<Bookmark> {
  name: string;
  position: number;
}

export class BookmarkModel implements IBookmarkModel {
  name: string;
  position: number;

  constructor(bookmark: Bookmark) {
  }

  toEntity(): Bookmark {
    return {
      name: this.name,
      position: this.position
    };
  }
}
