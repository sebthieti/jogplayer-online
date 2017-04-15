import * as os from 'os';
import * as process from 'process';
import * as path from 'path';
import * as express from 'express';
import * as dependable from '@bruce17/dependable';

import {IRouter} from './routers/router';
import registerRouterModule, {postRegisterAuthenticationStack} from './routers/router.module';
import registerServicesModule from './services/services.module';
import registerRepositoriesModuleAsync from './repositories/repository.module';
import registerUtilsModule from './utils/utils.module';
import registerStreamModule from './stream/stream.module';
import registerProxiesModule from './cache/proxies.module';
import registerDirectorsModule from './directors/directors.module';
import registerEventsModule from './events/events.module';

class JogPlayerServer {
  constructor(private container = dependable.container()) {
  }
  /**
   * @description
   *
   * Register all components needed to run the web application, all using composite root principle
   *
   * @param {object} app The application object..
   */
  async bootstrap(app: express.Application) {
    // TODO Move ffmpeg/ffprobe to dedicated folder
    this.checkAndSetRequiredEnvVar();

    await this.registerApp(app);
  }

  async bootstrapForUnitTests() {
    // TODO Move ffmpeg/ffprobe to dedicated folder
    await this.registerTest();
  }

  giveContainer() {
    return this.container;
  };

  private async registerApp(app: express.Application) {
    registerEventsModule(this.container);
    registerServicesModule(this.container);
    await registerRepositoriesModuleAsync(this.container);
    registerUtilsModule(this.container);
    registerStreamModule(this.container);
    registerProxiesModule(this.container);
    registerDirectorsModule(this.container);
    registerRouterModule(this.container, app);

    postRegisterAuthenticationStack(this.container, app);

    this.container.resolve((
      setupRouter: IRouter,
      homeRouter: IRouter,
      mediaRouter: IRouter,
      playlistRouter: IRouter,
      fileExplorerRouter: IRouter,
      favoriteRouter: IRouter,
      authRouter: IRouter,
      userRouter: IRouter,
      userStateRouter: IRouter
    ) => {
      homeRouter.bootstrap();
      setupRouter.bootstrap();
      mediaRouter.bootstrap();
      playlistRouter.bootstrap();
      fileExplorerRouter.bootstrap();
      favoriteRouter.bootstrap();
      authRouter.bootstrap();
      userRouter.bootstrap();
      userStateRouter.bootstrap();
    });
  }

  private async registerTest() {
    registerServicesModule(this.container);
    await registerRepositoriesModuleAsync(this.container);
    registerUtilsModule(this.container);
    registerStreamModule(this.container);
    registerProxiesModule(this.container);
    registerDirectorsModule(this.container);
  }

  /**
   * @description
   *
   * Check in system's environment for necessary variables, like paths to external programs
   * If not present, then they're added
   */
  private checkAndSetRequiredEnvVar() {
    if (!('FFMPEG_PATH' in process.env)) {
      // To ensure fluent-ffmpeg will work well
      process.env.FFMPEG_PATH = path.join(process.cwd(), this.getFFMpegRelativePath());
    }
    if (!('FFPROBE_PATH' in process.env)) {
      // To ensure fluent-ffmpeg will work well with ffprobe
      process.env.FFPROBE_PATH = path.join(process.cwd(), this.getFFProbeRelativePath());
    }
  }

  /**
   * @description
   *
   * An helper method to return the appropriate relative path to ffmpeg, depending on environment
   */
  private getFFMpegRelativePath() {
    return os.platform() === 'win32'
      ? './ffmpeg/ffmpeg.exe'
      : './ffmpeg/ffmpeg';
  }

  /**
   * @description
   *
   * An helper method to return the appropriate relative path to ffprobe, depending on environment
   */
  private getFFProbeRelativePath() {
    return os.platform() === 'win32'
      ? './ffmpeg/ffprobe.exe'
      : './ffmpeg/ffprobe';
  }
}

export default new JogPlayerServer();
