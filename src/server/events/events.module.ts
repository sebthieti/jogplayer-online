import {IEvents, default as Events} from './index';

export default function register(container: any) {
  container.register('events', (): IEvents => new Events());
}
