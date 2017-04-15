import {BookmarkDto} from '../dto/bookmark.dto';
import {IBookmarkModel} from '../models/bookmark.model';

export default function toBookmarkDto(bookmark: IBookmarkModel): BookmarkDto {
  return {
    name: bookmark.name,
    position: bookmark.position
  } as BookmarkDto;
}
