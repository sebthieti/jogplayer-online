import * as fs from 'fs';

// TODO Send both to async helpers/utils ?
export function checkFileExistsAsync(filePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    fs.exists(filePath, exists => {
      resolve(exists);
    });
  });
}
