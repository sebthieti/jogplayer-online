import * as _ from 'lodash';

export function extractFolderNameFromPath(folderPath: string): string {
  return _(folderPath)
    .split('/')
    .filter(segment => segment !== '')
    .last();
}

export function splitFolderPath(folderPath: string): string[] {
  return folderPath.split('/');
}
