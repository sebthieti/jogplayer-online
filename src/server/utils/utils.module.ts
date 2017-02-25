import PathBuilder, {IPathBuilder} from './pathBuilder';
import {IFileExplorerService} from '../services/fileExplorers/fileExplorer.service';

export default function bootstrap(container: any) {
  container.register(
    'pathBuilder',
    (fileExplorerService: IFileExplorerService): IPathBuilder =>
      new PathBuilder(fileExplorerService)
  );
}
