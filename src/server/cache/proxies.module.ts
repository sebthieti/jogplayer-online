import UserCache, {IUserCache} from './user.cache';
import {ICache, default as Cache} from './cache';
import {IUserRepository} from '../repositories/user.repository';

/**
 * @description
 *
 * Register all cache components, that is all caches, to IoC.
 */
export default function bootstrap(container: any) {
  container.register(
    'userCache',
    (cache: ICache, userRepository: IUserRepository): IUserCache => new UserCache(cache)
  );
  container.register('cache', (): ICache => new Cache());
}
