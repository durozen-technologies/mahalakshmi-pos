export type ExpenseHistoryInterval = "today" | "date" | "range" | "week" | "month" | "year" | "all";

export type ExpenseHistoryFilterDraft = {
  interval: ExpenseHistoryInterval;
  date: string;
  startDate: string;
  endDate: string;
  weekDate: string;
  month: string;
  year: string;
};

export type ExpenseHistoryRange = {
  rangeStartDate: string | null;
  rangeEndDate: string | null;
  label: string;
  isValid: boolean;
  validationMessage?: string;
};

export const EXPENSE_HISTORY_INTERVAL_OPTIONS: {
  key: ExpenseHistoryInterval;
  label: string;
  icon: string;
}[] = [
  { key: "today", label: "Today", icon: "calendar-today" },
  { key: "date", label: "Date", icon: "calendar" },
  { key: "range", label: "Range", icon: "calendar-range" },
  { key: "week", label: "Week", icon: "calendar-week" },
  { key: "month", label: "Month", icon: "calendar-month" },
  { key: "year", label: "Year", icon: "calendar-blank" },
  { key: "all", label: "Total", icon: "sigma" },
];

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function toDateInputValue(value: Date) {
  return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
}

export function createExpenseHistoryFilterDraft(now = new Date()): ExpenseHistoryFilterDraft {
  const today = toDateInputValue(now);
  return {
    interval: "today",
    date: today,
    startDate: today,
    endDate: today,
    weekDate: today,
    month: `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`,
    year: String(now.getFullYear()),
  };
}

function parseDateInput(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

function parseMonthInput(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    return null;
  }
  return { year, month };
}

function parseYearInput(value: string) {
  const match = /^(\d{4})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  return Number(match[1]);
}

function addDays(value: Date, days: number) {
  const nextDate = new Date(value);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function startOfWeek(value: Date) {
  const day = value.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return addDays(value, mondayOffset);
}

function dateRange(start: Date, end: Date, label: string): ExpenseHistoryRange {
  return {
    rangeStartDate: toDateInputValue(start),
    rangeEndDate: toDateInputValue(end),
    label,
    isValid: true,
  };
}

function invalidRange(label: string, validationMessage: string): ExpenseHistoryRange {
  return {
    rangeStartDate: null,
    rangeEndDate: null,
    label,
    isValid: false,
    validationMessage,
  };
}

export function buildExpenseHistoryRange(filter: ExpenseHistoryFilterDraft): ExpenseHistoryRange {
  if (filter.interval === "all") {
    return { rangeStartDate: null, rangeEndDate: null, label: "All time", isValid: true };
  }

  if (filter.interval === "today") {
    const today = toDateInputValue(new Date());
    return { rangeStartDate: today, rangeEndDate: today, label: "Today", isValid: true };
  }

  if (filter.interval === "date") {
    const date = parseDateInput(filter.date);
    if (!date) {
      return invalidRange("Date", "Use YYYY-MM-DD.");
    }
    return dateRange(date, date, filter.date.trim());
  }

  if (filter.interval === "range") {
    const start = parseDateInput(filter.startDate);
    const end = parseDateInput(filter.endDate);
    if (!start || !end) {
      return invalidRange("Range", "Use YYYY-MM-DD for both dates.");
    }
    if (start > end) {
      return invalidRange("Range", "Start date must be before end date.");
    }
    return dateRange(start, end, `${filter.startDate.trim()} to ${filter.endDate.trim()}`);
  }

  if (filter.interval === "week") {
    const referenceDate = parseDateInput(filter.weekDate);
    if (!referenceDate) {
      return invalidRange("Week", "Use YYYY-MM-DD.");
    }
    const start = startOfWeek(referenceDate);
    const end = addDays(start, 6);
    return dateRange(start, end, `Week of ${toDateInputValue(start)}`);
  }

  if (filter.interval === "month") {
    const month = parseMonthInput(filter.month);
    if (!month) {
      return invalidRange("Month", "Use YYYY-MM.");
    }
    const start = new Date(month.year, month.month - 1, 1);
    const end = new Date(month.year, month.month, 0);
    return dateRange(start, end, filter.month.trim());
  }

  const year = parseYearInput(filter.year);
  if (!year) {
    return invalidRange("Year", "Use YYYY.");
  }
  return dateRange(new Date(year, 0, 1), new Date(year, 11, 31), String(year));
}
