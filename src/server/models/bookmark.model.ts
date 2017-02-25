import * as mongoose from 'mongoose';
import Schema = mongoose.Schema;

export interface Bookmark extends mongoose.Document {
  name: string;
  comment: string;
  position: number;
}

export interface IBookmarkModel extends mongoose.Model<Bookmark> {
}

export default mongoose.model<Bookmark>('Bookmark', new Schema({
  name: String,
  comment: String,
  position: Number
}));
