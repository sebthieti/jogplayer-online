// TODO This file is temporary and will be removed soon

export default class Mediators {
  isUserStateInitialized = false;

  getIsUserStateInitialized(): boolean {
    return this.isUserStateInitialized;
  }

  setIsUserStateInitialized(value: boolean): void {
    this.isUserStateInitialized = value;
  }
}
