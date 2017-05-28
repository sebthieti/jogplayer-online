export const ChangeEvent = {
  Add: 'add',
  Update: 'update',
  Remove: 'remove'
};

export const AuthenticationStatus = {
  Undetermined: '',
  SessionExpired: 'session-expired',
  LoggedIn: 'logged-in',
  LoggingIn: 'logging-in',
  InvalidCredentials: 'invalid-credentials'
};

export const PlayerEvent = {
  Unknown: '',
  Aborted: 'aborted',
  Error: 'error',
  PlayFirst: 'first',
  Pause: 'paused',
  Stop: 'stop',
  Play: 'play',
  Previous: 'previous',
  Next: 'next',
  Ended: 'ended',
  TimeUpdate: 'time-update',
  DurationChange: 'duration-change',
  Progress: 'progress',
  MediumSet: 'medium-set',
  MediumLoaded: 'medium-loaded',
  Volume: 'volume'
};

export const ButtonMap = {
  Left: 0
};

export const SelectionMode = {
  Single: 'single',
  Grouped: 'grouped',
  KeepEach: 'keep-each'
};

export const KeyCode = {
  Ctrl: 17,
  Shift: 16
};
