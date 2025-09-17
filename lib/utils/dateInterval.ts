import { add, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subDays } from "date-fns";
import { Duration } from "./duration";

export class DateInterval {
  constructor(
    public readonly from: Date,
    public readonly to: Date,
  ) {}

  formatted(formatString: string = "yyyy-MM-dd") {
    return {
      from: format(this.from, formatString),
      to: format(this.to, formatString),
    };
  }

  static currentMonth() {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());

    return new DateInterval(start, end);
  }

  static currentWeek() {
    const start = startOfWeek(new Date());
    const end = endOfWeek(new Date());

    return new DateInterval(start, end);
  }

  static lastDays(days: number) {
    const start = subDays(new Date(), days);
    const end = new Date();

    return new DateInterval(start, end);
  }

  static builder() {
    let from: Date | undefined;
    let to: Date | undefined;

    const builder = {
      from: (date: Date | string) => {
        from = typeof date === "string" ? new Date(date) : date;
        return builder;
      },
      to: (date: Date | string) => {
        to = typeof date === "string" ? new Date(date) : date;
        return builder;
      },
      build: () => {
        if (!from || !to) {
          throw new Error("From and to dates are required");
        }
        return new DateInterval(from, to);
      },
    };

    return builder;
  }

  createGrid(step: Duration = Duration.days(1)) {
    const dates = [];
    let current = this.from;

    while (current <= this.to) {
      dates.push(current);
      current = add(current, { seconds: step.seconds });
    }

    return dates;
  }
}
