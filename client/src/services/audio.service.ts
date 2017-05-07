import { Subject, Observable } from 'rx';
import * as _ from 'lodash';
import {autoinject} from 'aurelia-framework';
import {JpoEvent} from '../constants';
import MediumSourceTag from '../helpers/mediumSourceTag.helper';

export interface AudioServiceEvent {
  name: string,
  value: AudioServiceEventValue
}

export interface AudioServiceEventValue {
  duration?: number,
  currentTime?: number,
  buffered?: TimeRanges,
  volume?: number,
  mediumOrFile?: string
}

@autoinject
export default class AudioService {
  private currentState = JpoEvent.Unknown;
  private eventSubject = new Subject<AudioServiceEvent>();
  private audioPlayer: HTMLAudioElement;
  private backupVolume = 0;
  
  constructor(private mediumSourceTag: MediumSourceTag) {
    this.initAudioPlayer();
  }

  private initAudioPlayer(): void {
    this.initAndGiveAudio();
    this.initEvents();
  }

  private initAndGiveAudio(): void {
    this.audioPlayer = <HTMLAudioElement>document.getElementById('audioPlayer');
  }

  private initEvents(): void {
    this.audioPlayer.addEventListener('playing', () => {
      this.currentState = JpoEvent.Play;
      this.eventSubject.onNext({ name: this.currentState, value: null });
    }, true);

    this.audioPlayer.addEventListener('pause', () => {
      this.currentState = JpoEvent.Pause;
      this.eventSubject.onNext({ name: this.currentState, value: null });
    }, true);

    this.audioPlayer.addEventListener('ended', () => {
      this.currentState = JpoEvent.Ended;
      this.eventSubject.onNext({ name: this.currentState, value: null });
    }, true);

    this.audioPlayer.addEventListener('abort', () => {
      this.currentState = JpoEvent.Aborted;
      this.eventSubject.onNext({ name: this.currentState, value: null });
    }, true);

    this.audioPlayer.addEventListener('error', () => {
      // Some browsers fires an error when a medium format can't be read.
      // So only fire an event when we tried the latest format.
      const ext = this.audioPlayer.currentSrc.substring(
        this.audioPlayer.currentSrc.lastIndexOf('.')
      );
      if (ext === '.mp3') { // MP3 is the last chance try
        this.currentState = JpoEvent.Error;
        this.eventSubject.onNext({ name: JpoEvent.Error, value: null });
      }
    }, true);

    this.audioPlayer.addEventListener('timeupdate', (ev) => {
      this.eventSubject.onNext({
        name: JpoEvent.TimeUpdate,
        value: {
          currentTime: (ev.target as HTMLAudioElement).currentTime,
          duration: (ev.target as HTMLAudioElement).duration
        }
      });
    }, true);

    this.audioPlayer.addEventListener('durationchange', ev => {
      this.eventSubject.onNext({
        name: JpoEvent.DurationChange,
        value: {
          duration: (ev.target as HTMLAudioElement).duration,
          buffered: (ev.target as HTMLAudioElement).buffered
        }
      });
    }, true);

    this.audioPlayer.addEventListener('progress', ev => {
      this.eventSubject.onNext({
        name: JpoEvent.Progress,
        value: {
          duration: (ev.target as HTMLAudioElement).duration,
          buffered: (ev.target as HTMLAudioElement).buffered
        }
      });
    }, true);
  }

  getState(): string {
    return this.currentState;
  }

  getMediumDuration(): number {
    return this.audioPlayer.duration;
  }

  observeEvents(): Observable<AudioServiceEvent> {
    return this.eventSubject;
  }

  observePlayingMedium(): Observable<string> {
    return this.observeEvents()
      .filter(e => e.name === JpoEvent.MediumSet)
      .map(e => e.value.mediumOrFile);
  }

  observeMediumEnded(): Observable<AudioServiceEvent> {
    return this.observeEvents()
      .filter(e => e.name === JpoEvent.Ended);
  }

  observeVolume(): Observable<number> {
    return this.observeEvents()
      .filter(e => e.name === JpoEvent.Volume)
      .map(e => e.value.volume);
  }

  observeTimeUpdate(): Observable<AudioServiceEventValue> {
    return this.observeEvents()
      .filter(e => e.name === JpoEvent.TimeUpdate)
      .map(e => e.value);
  }

  playOrPause(): void {
    // If media is set, play it. otherwise, ask the queue
    switch (this.currentState) {
      case JpoEvent.Ended:
      case JpoEvent.Pause:
        this.audioPlayer.play();
        break;
      case JpoEvent.Play:
        this.audioPlayer.pause();
        break;
      case JpoEvent.Error:
        break;
      case JpoEvent.Unknown:
        break;
      default:
        this.audioPlayer.play();
        break;
    }
  }

  stop(): void {
    // Search for source tag to set medium to read.
    const allSourceTags = this.audioPlayer.querySelectorAll('source');
    _.each(allSourceTags, function(tag) {
      this.audioPlayer.removeChild(tag);
    });

    this.audioPlayer.load();
  }

  getVolume(): number {
    return this.audioPlayer.volume;
  }

  setVolume(volumePercent): void {
    const safeVolumePerOne = Math.min(Math.max(volumePercent, 0), 1);

    this.audioPlayer.volume = safeVolumePerOne;

    this.eventSubject.onNext({
      name: JpoEvent.Volume,
      value: { volume: safeVolumePerOne }
    });
  }

  unmute(): void {
    this.setVolume(this.backupVolume);
  }

  mute(): void {
    if (this.audioPlayer.volume != 0) {
      this.backupVolume = this.getVolume();
    }
    this.setVolume(0);
  }

  setMediumPositionByTime(timePosition): void {
    if (!this.audioPlayer.duration) {
      return;
    }
    if (!timePosition || timePosition > this.audioPlayer.duration) {
      return;
    }
    this.audioPlayer.currentTime = timePosition;
  }

  setMediumPositionByRatio(cursorPercent): void {
    if (!this.audioPlayer.duration) {
      return;
    }
    this.audioPlayer.currentTime = cursorPercent * this.audioPlayer.duration;
  }

  async setMediumToPlayAndPlayAsync(mediumOrFile): Promise<void> {
    await this.setMediumToPlayAsync(mediumOrFile);
    this.audioPlayer.play();
  }

  setMediumToPlayAsync(mediumOrFile): Promise<void> {
    return new Promise<void>(resolve => {
      const mediumToPlayLoaded = () => {
        this.audioPlayer.removeEventListener('loadeddata', mediumToPlayLoaded);
        this.currentState = JpoEvent.MediumLoaded;
        resolve();
      };
      this.audioPlayer.addEventListener('loadeddata', mediumToPlayLoaded, true);

      const mediumModel = mediumOrFile.model || mediumOrFile;

      const extPos = mediumModel.selectSelfPlayFromLinks().lastIndexOf('.');
      const mediumExt = mediumModel.selectSelfPlayFromLinks().substring(extPos);

      // Search for source tag to set medium to read.
      const allSourceTags = this.audioPlayer.querySelectorAll('source');
      _.each(allSourceTags, tag => this.audioPlayer.removeChild(tag));

      const src = mediumModel.selectSelfPlayFromLinks();
      this.audioPlayer.appendChild(this.mediumSourceTag.build(src));

      // We'll have mp3 and ogg, in case the browser can't play
      if (mediumExt === '.mp3' || mediumExt === '.ogg') {
        if (mediumExt === '.mp3') {
          // Add opposite ext
          this.audioPlayer.appendChild(this.mediumSourceTag.build(src, '.ogg'));
        } else {
          // Add opposite ext
          this.audioPlayer.appendChild(this.mediumSourceTag.build(src, '.mp3'));
        }
      } else {
        this.audioPlayer.appendChild(this.mediumSourceTag.build(src, '.ogg'));
        this.audioPlayer.appendChild(this.mediumSourceTag.build(src, '.mp3'));
      }
      this.audioPlayer.load();

      this.eventSubject.onNext({
        name: JpoEvent.MediumSet, // TODO To avoid event data corruption, make name private, give getName
        value: { mediumOrFile: mediumOrFile }
      });
    });
  }
}
