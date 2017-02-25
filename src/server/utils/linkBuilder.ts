import * as os from 'os';
import ResourceLinksDto from '../dto/resourceLinks.dto';
import LinkDto from '../dto/link.dto';
import FileInfoDto from '../dto/fileInfo.dto';
import FolderContentDto from '../dto/folderContent.dto';

class LinkBuilder {
  toFolderContentDto(urlPath, files) {
    return this.buildFolderContentDto(urlPath, files);
  }

  toFileInfoDto(urlPath, file) {
    return this.buildFileInfoDto(urlPath, file);
  }

  private buildFolderContentDto(urlPath, files) {
    return new FolderContentDto()
      .setLinks(this.buildFolderLinks(urlPath))
      .setFiles(this.buildFilesLinks(files, urlPath));
  }

  private buildFolderLinks(urlPath) {
    return new ResourceLinksDto()
      .addLink(this.makeSelfLinkToRes(urlPath))
      .addLink(this.tryMakeFolderSelfPhysLink(urlPath))
      .addLink(this.tryMakeParentLink(urlPath));
  }

  private buildFilesLinks(files, urlPath) {
    return files.map(file => {
      return this.buildFileInfoDto(urlPath, file);
    });
  }

  private buildFileInfoDto(urlPath, file) {
    return new FileInfoDto({
      name: file.name,
      type: file.type,
      resourcesLinksDto: this.buildFileLinks(file, urlPath)
    });
  }

  private buildFileLinks(file, parentFolderPath) {
    return new ResourceLinksDto()
      .addLink(this.makeSelfLinkToRes(parentFolderPath, file))
      .addLink(this.tryMakeFileSelfPhysLink(parentFolderPath, file))
      .addLink(this.tryMakeSelfPlayLink(parentFolderPath, file));
  }

  private tryMakeFolderSelfPhysLink(folderPath) {
    if (!folderPath || folderPath === '/') {
      return;
    }
    return new LinkDto({rel: 'self.phys', href: folderPath});
  }

  private tryMakeFileSelfPhysLink(parentFolderPath, file) {
    let fullFilePath = null;
    if (os.platform() === 'linux') { // TODO Stop here: cannot diff when first time show and clicking to / to show inside
      parentFolderPath = (parentFolderPath === '/' ? '' : parentFolderPath);
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
    if (file.isDirectory) {
      fullFilePath += '/';
    }

    return new LinkDto({rel: 'self.phys', href: fullFilePath});
  }

  private makeSelfLinkToRes(parentFolderPath: string, file?: any) {
    // encode url, no '/' if just file
    // ^\/api\/explore\/(.*[\/])*$/
    var fullFilePath;
    if (file) {
      if (os.platform() === 'linux') {
        parentFolderPath = (parentFolderPath === '/' ? '' : parentFolderPath);
        if (file.name.startsWith('~/')) {
          fullFilePath = parentFolderPath + file.name;
        } else if (file.name === '/') {
          fullFilePath = file.name;
        } else {
          fullFilePath = parentFolderPath + file.name;
        }

        if (file.isDirectory) {
          fullFilePath += '/';
        }
      } else {
        fullFilePath = parentFolderPath + file.name;

        const pathTail = this.isBrowsableFile(file) ? '/' : '';
        fullFilePath = fullFilePath + pathTail;
      }
    } else {
      fullFilePath = parentFolderPath;
    }
    return new LinkDto({rel: 'self', href: '/api/explore' + fullFilePath});
  }

  private tryMakeParentLink(urlPath) {
    const upPath = this.tryMakeUpPath(urlPath);
    if (!upPath) {
      return;
    }
    return new LinkDto({rel: 'parent', href: '/api/explore' + upPath});
  }

  private tryMakeUpPath(urlPath) {
    let noTrailingSlash;
    if (urlPath.endsWith('/')) {
      noTrailingSlash = urlPath.substring(0, urlPath.length - 1);
    } else {
      noTrailingSlash = urlPath;
    }
    const upPath = noTrailingSlash.substring(0, noTrailingSlash.lastIndexOf('/') + 1);
    return upPath;
  }

  private tryMakeSelfPlayLink(parentFolderPath, file) {
    if (file.type && file.type === 'F') {
      var fullFilePath = parentFolderPath + file.name;
      // TODO only when playable
      return new LinkDto({rel: 'self.play', href: '/api/media/play/path' + fullFilePath});
    }
  }

  private isBrowsableFile(file) {
    return !file.type || file.type === 'D';
  }
}

export default new LinkBuilder();
