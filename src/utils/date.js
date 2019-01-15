import isAfter from "date-fns/is_after";
import isBefore from "date-fns/is_before";
import isSameDay from "date-fns/is_same_day";

export const isSameDayOrAfter = (date, compareDate) => isSameDay(date,compareDate) || isAfter(date, compareDate)
export const isSameDayOrBefore = (date, compareDate) => isSameDay(date,compareDate) || isBefore(date, compareDate)
