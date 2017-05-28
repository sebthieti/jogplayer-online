import {autoinject} from 'aurelia-framework';
import * as moment from 'moment';
import * as _ from 'lodash';
import AudioService from '../../../services/audio.service';
import MediaQueueService from '../../../services/mediaQueue.service';
import {ButtonMap, PlayerEvent} from '../../../constants';

interface AudioPlayerElements extends Dictionary<HTMLElement> {
  timeLine: HTMLElement,
  timeLineContainer: HTMLElement,
  cursor: HTMLElement,
  elapsedTime: HTMLElement,
  remainingTime: HTMLElement,
  loadedChunks: HTMLElement,
  btnPlay: HTMLElement,
  volumeBarContainer: HTMLElement,
  volumeBar: HTMLElement
}

@autoinject
export class AudioControls {
  isMuting = false;
  isDraggingCursor = false;
  audioPlayerElements: AudioPlayerElements;

  private controlElements = {
    elapsedTime: 'elapsed-time',
    remainingTime: 'remaining-time',
    loadedChunks: 'loaded-chunks',
    timeLineContainer: 'time-line-container',
    timeLine: 'time-line',
    volumeBar: 'volume-bar',
    volumeBarContainer: 'volume-bar-container',
    cursor: 'cursor',
    btnPlay: 'btnPlay'
  };

  constructor(
    private audioService: AudioService,
    private mediaQueueService: MediaQueueService) {
  }

  attached() {
    this.init();
  }

  init() {
    this.audioPlayerElements = _.mapValues(
      this.controlElements,
      (value: string) => window.document.getElementById(value)
    ) as AudioPlayerElements;
    this.initAudioPlayer();
  }

  initAudioPlayer() {
    this.initListenToAudioEvents();
    this.initVolumeBar();
    this.initTimeLine();
    this.initCursorEvents();
    this.initCursorVisibleOnMediumSet();
  }

  initListenToAudioEvents() {
    this.updateTimelineAndCursorOnTimeUpdate();
    this.updateMediaChunksBufferedOnProgressOrDuration();
    this.updatePlayButtonStatusToState();
    this.updateVolumeBarOnChange();
  }

  updateTimelineAndCursorOnTimeUpdate() {
    return this.audioService
      .observeTimeUpdate()
      .do(timeUpdateSet => {
        const currentTime = timeUpdateSet.currentTime;
        const audioDuration = timeUpdateSet.duration;
        const timeRemaining = audioDuration - currentTime;

        const format = this.getTimeFormatForDuration(currentTime);

        const currentTimeHHMMSS = moment(currentTime * 1000).format(format);
        const timeRemainingHHMMSS = moment(timeRemaining * 1000).format(format);

        if (this.isDraggingCursor) {
          return;
        }

        const timeLineContainer = this.audioPlayerElements.timeLineContainer;
        const cursorPositionRatio = (currentTime / audioDuration);
        const cursorOffsetX = timeLineContainer.offsetWidth * cursorPositionRatio;
        this.audioPlayerElements.cursor.style.transform = 'translateX(' + cursorOffsetX + 'px)';

        this.audioPlayerElements.elapsedTime.textContent = currentTimeHHMMSS;
        this.audioPlayerElements.remainingTime.textContent = '-' + timeRemainingHHMMSS;
      })
      .subscribe();
  }

  getTimeFormatForDuration(time) {
    if (time < 3600) {
      return 'm:ss';
    }
    return 'H:mm:ss';
  }

  updateMediaChunksBufferedOnProgressOrDuration() {
    return this.audioService
      .observeEvents()
      .filter(e =>
        e.name === PlayerEvent.DurationChange ||
        e.name === PlayerEvent.Progress
      )
      .select(e => e.value)
      .do(durationProgressSet => {
        const buffer = durationProgressSet.buffered;
        const bufferLength = buffer.length;

        if (bufferLength === 0) {
          return;
        }
        if (!durationProgressSet.duration) {
          return;
        }

        const start = buffer.start(0);
        const end = buffer.end(0);
        const duration = durationProgressSet.duration;

        // Compute start position in percent
        const startPercent = (start / duration) * 100;

        // Compute end position in percent
        const endPercent = (end / duration) * 100;
        const loadedChunksWidth = endPercent - startPercent;

        const loadedChunks = this.audioPlayerElements.loadedChunks;
        loadedChunks.style.left = startPercent + '%';
        loadedChunks.style.width = loadedChunksWidth + '%';
      })
      .subscribe();
  }

  updatePlayButtonStatusToState() {
    this.audioService
      .observeEvents()
      .filter(e =>
        e.name === PlayerEvent.Unknown ||
        e.name === PlayerEvent.Pause ||
        e.name === PlayerEvent.Play
      )
      .do(e => {
        if (e.name === PlayerEvent.Play) {
          this.turnPlayButtonToPause();
        } else {
          this.turnPauseButtonToPlay();
        }
      })
      .subscribe();
  }

  turnPauseButtonToPlay() {
    const classes = this.audioPlayerElements.btnPlay.classList;
    classes.remove('icon-pause2');
    classes.add('icon-play3');
  }

  turnPlayButtonToPause() {
    const classes = this.audioPlayerElements.btnPlay.classList;
    classes.remove('icon-play3');
    classes.add('icon-pause2');
  }

  initVolumeBar() {
    const volumeBarWidth = this.audioPlayerElements.volumeBarContainer.clientWidth;
    const volumeXPos = volumeBarWidth * this.audioService.getVolume();
    const volumeOffset = volumeBarWidth - volumeXPos;

    this.audioPlayerElements.volumeBar.style.transform = 'translateX(' + volumeOffset + 'px)';

    const volumeBarContainer = this.audioPlayerElements.volumeBarContainer;

    this.observeElementEvent(volumeBarContainer, 'mousedown')
      .filter((event: MouseEvent) => event.button === ButtonMap.Left)
      .do((event: MouseEvent) => {
        const volumeBarOffset = event.clientX - (<HTMLElement>event.target).offsetLeft;
        this.updateVolume(volumeBarOffset);
      })
      .selectMany(() => this.observeElementEvent(volumeBarContainer, 'mousemove'))
      .do((event: MouseEvent) => {
        const volumeBarOffset = event.clientX - (<HTMLElement>event.target).offsetLeft;
        this.updateVolume(volumeBarOffset);
      })
      .takeUntil(this.observeElementEvent(volumeBarContainer, 'mouseup'))
      .repeat()
      .subscribe();
  }

  updateVolume(mouseX) {
    const volumeBar = this.audioPlayerElements.volumeBarContainer;
    const volumeBarWidth = volumeBar.clientWidth;
    const volumePercent = mouseX / volumeBarWidth;
    const safeVolumePerOne = Math.min(Math.max(volumePercent, 0), 1);

    const volumeOffset = -volumeBarWidth + mouseX;
    this.audioPlayerElements.volumeBar.style.transform = 'translateX(' + volumeOffset + 'px)';

    this.audioService.setVolume(safeVolumePerOne);
  }

  updateVolumeBarOnChange() {
    this.audioService
      .observeVolume()
      .do(vol => {
        // To turn back the normal vol icon when user just unmute by changing volume
        if (this.isMuting && vol != 0) {
          this.isMuting = false;
        }

        const volumeBar = this.audioPlayerElements.volumeBarContainer;
        const volumeBarWidth = volumeBar.clientWidth;
        const mouseX = volumeBarWidth * vol;

        const volumeOffset = -volumeBarWidth + mouseX;
        this.audioPlayerElements.volumeBar.style.transform = 'translateX(' + volumeOffset + 'px)';
      })
      .subscribe();
  }

  observeElementEvent(element, eventName) {
    return Rx.Observable.fromEventPattern(
      h => element.addEventListener(eventName, h, false),
      h => element.removeEventListener(eventName, h, false)
    );
  }

  initTimeLine() {
    const timeLine = this.audioPlayerElements.timeLine;
    const cursor = this.audioPlayerElements.cursor;

    timeLine.addEventListener('mousedown', event => {
      if (event.button !== ButtonMap.Left) {
        return;
      }
      if (!this.isDraggingCursor) {
        this.isDraggingCursor = true;
      }
      cursor.style.transform = 'translateX(' + event.offsetX + 'px)';
    }, false);

    timeLine.addEventListener('mouseup', event => {
      if (event.button !== ButtonMap.Left) {
        return;
      }
      if (this.isDraggingCursor) {
        this.isDraggingCursor = false;
      }

      const cursorX = this.relativeXFromDirectParent(event);
      const cursorPercent = cursorX / timeLine.clientWidth;

      this.audioService.setMediumPositionByRatio(cursorPercent);
    }, false);
  }

  initCursorEvents() {
    const timeLine = this.audioPlayerElements.timeLine;
    const cursor = this.audioPlayerElements.cursor;

    cursor.addEventListener('mousedown', event => {
      if (event.button !== ButtonMap.Left) {
        return;
      }
      if (!this.isDraggingCursor) {
        this.isDraggingCursor = true;
      }

      const cursorX = this.relativeXFromDirectParent(event);

      cursor.style.transform = 'translateX(' + cursorX + 'px)';
    }, false);

    cursor.addEventListener('mousemove', (event: MouseEvent) => {
      if (!this.isDraggingCursor) {
        return;
      }

      const cursorX = this.relativeXFromDirectParent(event);
      const cursorParentWidth = (<HTMLElement>event.target).offsetParent.clientWidth;
      if (cursorX < 0 || cursorX > cursorParentWidth) {
        return;
      }

      const cursorPercent = cursorX / timeLine.clientWidth;

      this.updateLandingPosition(cursorPercent);

      cursor.style.transform = 'translateX(' + cursorX + 'px)';
    }, false);

    cursor.addEventListener('mouseup', event => {
      if (event.button !== ButtonMap.Left) {
        return;
      }
      if (this.isDraggingCursor) {
        this.isDraggingCursor = false;
      }

      const cursorX = this.relativeXFromDirectParent(event);
      const cursorPercent = cursorX / timeLine.clientWidth;

      this.audioService.setMediumPositionByRatio(cursorPercent);
    }, false);
  }

  relativeXFromDirectParent(event) {
    const parentX = event.target.offsetParent.offsetLeft;
    return event.clientX - parentX;
  }

  updateLandingPosition(cursorPercent) {
    const mediumDuration = this.audioService.getMediumDuration();
    const currentTime = cursorPercent * mediumDuration;
    const timeRemaining = mediumDuration - currentTime;

    const format = this.getTimeFormatForDuration(currentTime);
    const currentTimeHHMMSS = moment(currentTime * 1000).format(format);
    const timeRemainingHHMMSS = moment(timeRemaining * 1000).format(format);

    this.audioPlayerElements.elapsedTime.textContent = currentTimeHHMMSS;
    this.audioPlayerElements.remainingTime.textContent = '-' + timeRemainingHHMMSS;
  }

  initCursorVisibleOnMediumSet() {
    this.audioService
      .observePlayingMedium()
      .do(() =>
        // Ensure cursor is visible
        this.audioPlayerElements.cursor.classList.remove('hidden')
      )
      .subscribe();
  }

  playOrPause() {
    if (this.audioService.getState() === PlayerEvent.Unknown) {
      this.mediaQueueService.playFirst();
    } else {
      this.audioService.playOrPause();
    }
  }

  playNext() {
    this.mediaQueueService.playNext();
  }

  playPrevious() {
    this.mediaQueueService.playPrevious();
  }

  mute() {
    this.isMuting = !this.isMuting;
    if (this.isMuting) {
      this.audioService.mute();
    } else {
      this.audioService.unmute();
    }
  }
}
