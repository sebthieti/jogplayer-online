import {BookmarkModel, IBookmarkModel} from "./bookmark.model";
import {Metadata} from "../entities/metadata";
import {Medium, MediumMetadata, MediumSummary, MediumType} from "../entities/medium";
import {IModel} from "./model";
import {ObjectID} from "mongodb";
import routes from '../routes';
import {IMediaService} from "../services/media.service";
import MediaHelper from '../utils/mediaHelper';
import * as path from 'path';
import {IMediaRepository} from '../repositories/media.repository';
import {Link} from '../entities/link';

export interface IMediumModel extends IModel<Medium>{
  id: string;
  _id: ObjectID;
  isChecked: boolean;
  isAvailable: boolean;
  mediaType: string;
  mimeType: string;
  ext: string;
  links: Link[];
  title: string;
  filePath: string;
  duration: number;
  mediumType: string;
  isSelected: boolean;
  bookmarks: IBookmarkModel[];
  infos: MediumMetadata[];
  metadatas: Metadata;

  setIsAvailable(isAvailable: boolean): IMediumModel;
  setFromEntity(medium: Medium): IMediumModel;
  updateAsync(): Promise<IMediumModel>;
}

export class MediumModel implements IMediumModel {
  _id: ObjectID;
  isChecked: boolean;
  isAvailable: boolean;
  mediaType: string;
  mimeType: string;
  ext: string;
  title: string;
  filePath: string;
  duration: number;
  mediumType: string;
  isSelected: boolean;
  bookmarks: IBookmarkModel[];
  infos: MediumMetadata[];
  metadatas: Metadata;

  static async buildFromFilePathAsync(
    mediaService: IMediaService,
    mediaRepository: IMediaRepository,
    indexerFn: (model: IMediumModel) => number,
    filePath: string): Promise<IMediumModel> {
    let model = new MediumModel(mediaService, mediaRepository, indexerFn, {
      filePath: filePath,
      isSelected: true,
      bookmarks: [],
      metadatas: {createdOn: new Date(), updatedOn: null}
    });
    return await model.initModelAsync();
  }

  static async buildFromEntity(
    mediaService: IMediaService,
    mediumSummary: IMediaRepository,
    indexerFn: (model: IMediumModel) => number,
    medium?: Medium
  ): Promise<IMediumModel> {
    const model = new MediumModel(mediaService, mediumSummary, indexerFn, medium);

    return await model.initModelAsync();
  }

  static async buildFromSummary(
    mediaService: IMediaService,
    mediaRepository: IMediaRepository,
    indexerFn: (model: IMediumModel) => number,
    mediumSummary: MediumSummary): Promise<IMediumModel> {
    const model = new MediumModel(
      mediaService,
      mediaRepository,
      indexerFn,
      Object.assign(mediumSummary, {
        isSelected: true // TODO To selected
      } as Medium));

    return await model.initModelAsync();
  }

  private constructor(
    private mediaService: IMediaService,
    private mediaRepository: IMediaRepository,
    private containerIndexFn: (model: IMediumModel) => number,
    medium?: Medium) {
    this.setFields(medium);
    this.bookmarks = medium && medium.bookmarks && medium.bookmarks.map(b => new BookmarkModel(b)) || [];
  }

  setFromEntity(medium: Medium): IMediumModel {
    this.setFields(medium);
    return this;
  }

  private setFields(medium?: Medium) {
    this._id = medium && medium._id;
    this.title = medium && medium.title;
    this.filePath = medium && medium.filePath;
    this.duration = medium && medium.duration;

    this.mediumType = medium && medium.mediumType;
    this.isSelected = medium && medium.isSelected;
    this.infos = medium && medium.infos;
    this.metadatas = medium && medium.metadatas;
  }

  private async initModelAsync(): Promise<IMediumModel> {
    if (!this.filePath) {
      return;
    }

    const mimeType = MediaHelper.getMimeTypeFromPath(this.filePath);

    try { // Medium exists
      const mediumInfo = await this.mediaService.getMediumInfosAsync(this.filePath);
      const mediumFormat = mediumInfo.detailedInfo && mediumInfo.detailedInfo.format;

      this.duration = Math.round(mediumFormat.duration || 0);
      this.ext = mediumInfo.fileext;
      this.title = mediumInfo.name; // TODO Should also look for tag's title
      this.filePath = mediumFormat && mediumFormat.filename || this.filePath;
      this.mimeType = mimeType;
      this.isAvailable = true;
      this.mediumType = MediumType.Audio;
      this.metadatas = {} as Metadata;
      this.bookmarks = [];
    } catch (err) { // Can happen when loading a playlist where media are not found
      const fileext = path.extname(this.filePath);
      const name = path.basename(this.filePath, fileext);

      this.title = name;
      this.duration = 0;
      this.mediumType = '';
      this.isSelected = true;
      this.metadatas = {} as Metadata;
      this.bookmarks = [];
      this.infos = [];
    }

    return this;
  }

  get id(): string {
    return this._id.toString();
  }

  setIsAvailable(isAvailable: boolean): IMediumModel {
    this.isAvailable = isAvailable;
    return this;
  }

  async updateAsync(): Promise<IMediumModel> {
    const updatedMedium = await this.mediaRepository.updateMediumByIdAsync(this._id, this.toEntity());
    this.setFields(updatedMedium);
    return this;
  }

  toEntity(): Medium {
    return {
      _id: this._id,
      title: this.title,
      filePath: this.filePath,
      duration: this.duration,
      mediumType: this.mediaType,
      isSelected: this.isSelected,
      bookmarks: this.bookmarks.map(b => b.toEntity()),
      infos: this.infos,
      metadatas: this.metadatas
    };
  }

  get links(): Link[] {
    const playlistIndex = this.containerIndexFn && `${this.containerIndexFn(this)}` || '-1';
    return [{
      rel: 'self',
      href: routes.media.selfPath
        .replace(':playlistIndex', playlistIndex)
        .replace(':mediumId', this.id)
    }, {
      rel: 'self.play',
      href: routes.media.selfPlay.replace(':mediumIdWithExt', this.id + this.ext)
    }, {
      rel: 'update',
      href: routes.media.updatePath
        .replace(':playlistIndex', playlistIndex)
        .replace(':mediumId', this.id)
    }, {
      rel: 'remove',
      href: routes.media.deletePath
        .replace(':playlistIndex', playlistIndex)
        .replace(':mediumId', this.id)
    }];
  }
}
