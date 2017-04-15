import * as os from 'os';
import * as _ from 'lodash';
import ResourceLinksDto from '../dto/resourceLinks.dto';
import FileInfoDto from '../dto/fileInfo.dto';
import FolderContentDto from '../dto/folderContent.dto';
import {IFileInfo} from '../entities/fileInfo';
import {IResourceLinksDto} from '../dto/resourceLinks.dto';
import {LinkDto} from '../dto/link.dto';

class LinkBuilder {
  toFolderContentDto(urlPath: string, files: IFileInfo[]): FolderContentDto {
    return this.buildFolderContentDto(urlPath, files);
  }

  toFileInfoDto(urlPath: string, file: IFileInfo): FileInfoDto {
    return this.buildFileInfoDto(urlPath, file);
  }

  private buildFolderContentDto(urlPath: string, files: IFileInfo[]): FolderContentDto {
    return new FolderContentDto()
      .setLinks(this.buildFolderLinks(urlPath))
      .setFiles(this.buildFilesLinks(urlPath, files));
  }

  private buildFolderLinks(urlPath: string): ResourceLinksDto {
    return new ResourceLinksDto()
      .addLink(this.makeSelfLinkToRes(urlPath))
      .addLink(this.tryMakeFolderSelfPhysLink(urlPath))
      .addLink(this.tryMakeParentLink(urlPath));
  }

  private buildFilesLinks(urlPath: string, files: IFileInfo[]): FileInfoDto[] {
    return files.map(file => this.buildFileInfoDto(urlPath, file));
  }

  private buildFileInfoDto(urlPath: string, file: IFileInfo): FileInfoDto {
    return new FileInfoDto({
      name: file.name,
      type: file.type,
      resourcesLinksDto: this.buildFileLinks(file, urlPath)
    });
  }

  private buildFileLinks(file: IFileInfo, parentFolderPath: string): IResourceLinksDto {
    return new ResourceLinksDto()
      .addLink(this.makeSelfLinkToRes(parentFolderPath, file))
      .addLink(this.tryMakeFileSelfPhysLink(parentFolderPath, file))
      .addLink(this.tryMakeSelfPlayLink(parentFolderPath, file));
  }

  private tryMakeFolderSelfPhysLink(folderPath: string): LinkDto {
    if (!folderPath || folderPath === '/') {
      return;
    }
    return {rel: 'self.phys', href: folderPath};
  }

  private tryMakeFileSelfPhysLink(parentFolderPath: string, file: IFileInfo): LinkDto {
    let fullFilePath = null;
    if (os.platform() !== 'win32') { // TODO Stop here: cannot diff when first time show and clicking to / to show inside
      parentFolderPath = (
        parentFolderPath === '/' ||
        parentFolderPath === '/root/'
      ) ? '' : parentFolderPath;
      if (file.name.startsWith('~/')) {
        fullFilePath = parentFolderPath + file.name;
      } else if (file.name === '/') {
        fullFilePath = file.name;
      } else {
        fullFilePath = parentFolderPath + file.name;
      }
    } else {
      fullFilePath = (parentFolderPath || '') + file.name;
    }

    if (!fullFilePath || fullFilePath === '/') {
      return;
    }
    if (file.isDirectory && _.last(fullFilePath) !== '/') {
      fullFilePath += '/';
    }

    return {rel: 'self.phys', href: fullFilePath};
  }

  private makeSelfLinkToRes(parentFolderPath: string, file?: IFileInfo): LinkDto {
    // encode url, no '/' if just file
    // ^\/api\/explore\/(.*[\/])*$/
    let fullFilePath;
    if (file) {
      if (os.platform() !== 'win32') {
        parentFolderPath =
          (parentFolderPath === '/' ||
          parentFolderPath === '/root/') ? '' : parentFolderPath;
        if (file.name.startsWith('~/')) {
          fullFilePath = parentFolderPath + file.name;
        } else if (file.name === '/') {
          fullFilePath = file.name;
        } else {
          fullFilePath = parentFolderPath + file.name;
        }

        if (file.isDirectory && _.last(fullFilePath) !== '/') {
          fullFilePath += '/';
        }
      } else {
        fullFilePath = parentFolderPath + file.name;

        const pathTail = this.canBrowseFile(file) ? '/' : '';
        fullFilePath = fullFilePath + pathTail;
      }
    } else {
      fullFilePath = parentFolderPath;
    }

    if (fullFilePath === '/') {
      return {rel: 'self', href: `/api/explore/root/`};
    }

    if (_.first(fullFilePath) !== '/') {
      return {rel: 'self', href: `/api/explore/${fullFilePath}`};
    } else {
      return {rel: 'self', href: `/api/explore${fullFilePath}`};
    }
  }

  private tryMakeParentLink(urlPath: string): LinkDto {
    const upPath = this.tryMakeUpPath(urlPath);
    if (!upPath) {
      return;
    }
    return {rel: 'parent', href: '/api/explore' + upPath};
  }

  private tryMakeUpPath(urlPath: string): string {
    let noTrailingSlash;
    if (urlPath.endsWith('/')) {
      noTrailingSlash = urlPath.substring(0, urlPath.length - 1);
    } else {
      noTrailingSlash = urlPath;
    }
    return noTrailingSlash.substring(0, noTrailingSlash.lastIndexOf('/') + 1);
  }

  private tryMakeSelfPlayLink(parentFolderPath: string, file: IFileInfo): LinkDto {
    if (file.type && file.type === 'F') {
      const fullFilePath = parentFolderPath + file.name;
      // TODO only when playable
      return {rel: 'self.play', href: '/api/media/play/path' + fullFilePath};
    }
  }

  private canBrowseFile(file: IFileInfo): boolean {
    return !file.type || file.type === 'D';
  }
}

export default new LinkBuilder();
