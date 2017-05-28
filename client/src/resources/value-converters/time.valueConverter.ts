import * as moment from 'moment';

export class TimeValueConverter {
  toView(timeInSeconds: number) {
    const format = this.getTimeFormatForDuration(timeInSeconds);
    return moment(timeInSeconds * 1000).format(format);
  }

  private getTimeFormatForDuration(timeInSeconds: number) {
    if (timeInSeconds < 3600) {
      return 'm:ss';
    }
    return 'H:mm:ss';
  }
}
