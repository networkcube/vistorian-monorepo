import { timeFormat, timeParse } from "d3-time-format";
import * as d3 from "d3";

// separaetely defined in map.ts
const toMMDDYYYY = timeFormat("%m/%d/%Y");

export const formatAsDDMMYYYY = d3.timeFormat("%d/%m/%Y"); // "DD/MM/YYYY"

export const TIME_FORMAT = "%Y-%m-%d %H:%M:%S"; // "YYYY-MM-DD hh:mm:ss"
export const parseStandardTime = timeParse(TIME_FORMAT);
export const formatStandardTime = timeFormat(TIME_FORMAT);

// TODO: improve this type
export const offsetInMilliseconds: Record<string, any> = {
  millisecond: 1,
  second: 1000,
  minute: 1000 * 60,
  hour: 1000 * 60 * 60,
  day: 1000 * 60 * 60 * 24,
  week: 1000 * 60 * 60 * 24 * 7,
  month: 1000 * 60 * 60 * 24 * 30,
  year: 1000 * 60 * 60 * 24 * 365,

  milliseconds: 1,
  seconds: 1000,
  minutes: 1000 * 60,
  hours: 1000 * 60 * 60,
  days: 1000 * 60 * 60 * 24,
  weeks: 1000 * 60 * 60 * 24 * 7,
  months: 1000 * 60 * 60 * 24 * 30,
  years: 1000 * 60 * 60 * 24 * 365,
};

export function addDate(date: Date, n: number, granularity: string): Date {
  // alternative is to use things like a.setDate(a.getDate() + 1); to add a day
  return new Date(date.getTime() + n * offsetInMilliseconds[granularity]);
}

export const dayOfWeek = timeFormat("%w"); // "Sunday-based weekday as a decimal number [0,6]."

export function startOf(date: Date, granularity: string) {
  const d = new Date(date);

  switch (granularity) {
    case "millisecond":
      break;

    case "second":
      d.setMilliseconds(0);
      break;

    case "minute":
      d.setMilliseconds(0);
      d.setSeconds(0);
      break;

    case "hour":
      d.setMilliseconds(0);
      d.setSeconds(0);
      d.setMinutes(0);
      break;

    case "day":
      d.setMilliseconds(0);
      d.setSeconds(0);
      d.setMinutes(0);
      d.setHours(0);
      break;

    case "week":
      return new Date(
        d.getTime() - 1000 * 60 * 60 * 24 * parseInt(dayOfWeek(d))
      );

    case "month":
      d.setMilliseconds(0);
      d.setSeconds(0);
      d.setMinutes(0);
      d.setHours(0);
      d.setDate(0);
      break;

    case "year":
      d.setMilliseconds(0);
      d.setSeconds(0);
      d.setMinutes(0);
      d.setHours(0);
      d.setDate(0);
      d.setMonth(0);
      break;
  }

  return d;
}

export function getGranularityName(granularityIndex: number) {
  let granularityName = "milliseconds";
  switch (granularityIndex) {
    case 0:
      granularityName = "milliseconds";
      break;
    case 1:
      granularityName = "seconds";
      break;
    case 2:
      granularityName = "minutes";
      break;
    case 3:
      granularityName = "hours";
      break;
    case 4:
      granularityName = "days";
      break;
    case 5:
      granularityName = "weeks";
      break;
    case 6:
      granularityName = "months";
      break;
    case 7:
      granularityName = "years";
      break;
    // case 8: minGranName = 'decades'; break;
    // case 9: minGranName = 'centuries'; break;
    // case 10: minGranName = 'millenia'; break;
  }
  return granularityName;
}

export function formatTimeAtGranularity(
  time: Date,
  granularity: number
): number {
  const getWeek = d3.timeFormat("%V");

  const dateObj = new Date(time);
  switch (granularity) {
    case 0:
      return dateObj.getUTCMilliseconds();
    case 1:
      return dateObj.getUTCSeconds();
    case 2:
      return dateObj.getUTCMinutes();
    case 3:
      return dateObj.getUTCHours();
    case 4:
      return dateObj.getUTCDay();
    case 5:
      return parseInt(getWeek(dateObj));
    case 6:
      return dateObj.getUTCMonth() + 1;
    default:
      return dateObj.getUTCFullYear();
  }
}

export const formatAtGranularity = (time: Date, granularity: number) =>
  formatTimeAtGranularity(time, granularity).toString();

export function getGranularityFormattingString(
  granualarity: any,
  separator: boolean
): string {
  switch (granualarity) {
    case 0:
      return "%S";
    case 1:
      return "%S" + (separator ? "." : "");
    case 2:
      return "%M" + (separator ? ":" : "");
    case 3:
      return "%H" + (separator ? "" : "");
    case 4:
      return "%D" + (separator ? " " : "");
    case 6:
      return "%m" + (separator ? "-" : "");
    default:
      return "%Y" + (separator ? "-" : "");
  }
}

// export { offsetInMilliseconds, addDate, startOf };
