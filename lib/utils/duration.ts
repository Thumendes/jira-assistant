export class Duration {
  private _milliseconds: number;

  private constructor(milliseconds: number) {
    this._milliseconds = milliseconds;
  }

  get ms() {
    return this._milliseconds;
  }

  get seconds() {
    return this._milliseconds / 1000;
  }

  get minutes() {
    return this.seconds / 60;
  }

  get hours() {
    return this.minutes / 60;
  }

  get days() {
    return this.hours / 24;
  }

  get weeks() {
    return this.days / 7;
  }

  get months() {
    return this.days / 30;
  }

  get years() {
    return this.days / 365;
  }

  static milliseconds(milliseconds: number) {
    return new Duration(milliseconds);
  }

  static seconds(seconds: number) {
    return new Duration(seconds * 1000);
  }

  static minutes(minutes: number) {
    return new Duration(minutes * 60 * 1000);
  }

  static hours(hours: number) {
    return new Duration(hours * 60 * 60 * 1000);
  }

  static days(days: number) {
    return new Duration(days * 24 * 60 * 60 * 1000);
  }

  static weeks(weeks: number) {
    return new Duration(weeks * 7 * 24 * 60 * 60 * 1000);
  }

  static months(months: number) {
    return new Duration(months * 30 * 24 * 60 * 60 * 1000);
  }

  static years(years: number) {
    return new Duration(years * 365 * 24 * 60 * 60 * 1000);
  }

  // add and subtract methods
  add(duration: Duration) {
    this._milliseconds += duration._milliseconds;
    return this;
  }

  subtract(duration: Duration) {
    this._milliseconds -= duration._milliseconds;
    return this;
  }

  // 1h 20m 30s
  format() {
    let remaining = this._milliseconds;

    const hours = Math.floor(remaining / (60 * 60 * 1000));
    remaining -= hours * 60 * 60 * 1000;

    const minutes = Math.floor(remaining / (60 * 1000));
    remaining -= minutes * 60 * 1000;

    const seconds = Math.floor(remaining / 1000);

    return [hours, minutes, seconds]
      .map((value, index) => (value ? `${value}${"h m s".split(" ")[index]}` : ""))
      .join(" ");
  }

  valueOf() {
    return this._milliseconds;
  }

  toString() {
    return this.format();
  }

  static fromExpression(value: string) {
    const matches = value.match(/(\d+)(h|m|s)/g);

    if (!matches) {
      throw new Error(`Invalid duration format: ${value}`);
    }

    const ms = matches.reduce((acc, match) => {
      const value = parseInt(match.slice(0, -1));
      const unit = match.slice(-1);

      switch (unit) {
        case "h":
          return acc + Duration.hours(value)._milliseconds;
        case "m":
          return acc + Duration.minutes(value)._milliseconds;
        case "s":
          return acc + Duration.seconds(value)._milliseconds;
        default:
          throw new Error(`Invalid duration unit: ${unit}`);
      }
    }, 0);

    return new Duration(ms);
  }
}
