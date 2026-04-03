const ETHIOPIAN_MONTHS = [
  "Meskerem",
  "Tikimt",
  "Hidar",
  "Tahsas",
  "Tir",
  "Yekatit",
  "Megabit",
  "Miyazya",
  "Ginbot",
  "Sene",
  "Hamle",
  "Nehasse",
  "Pagumen",
];

function toJulianDay(date: Date): number {
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  const day = date.getDate();

  if (month <= 2) {
    year -= 1;
    month += 12;
  }

  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);

  return (
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    b -
    1524
  );
}

function fromJulianDayToEthiopian(julianDay: number): {
  year: number;
  month: number;
  day: number;
} {
  const epoch = 1723856;
  const days = julianDay - epoch;
  const cycle = Math.floor(days / 1461);
  const remainder = ((days % 1461) + 1461) % 1461;
  const yearInCycle = Math.floor(remainder / 365);
  const dayOfCycle = remainder % 365;

  const year = cycle * 4 + yearInCycle + 1;
  const month = Math.floor(dayOfCycle / 30) + 1;
  const day = (dayOfCycle % 30) + 1;

  return { year, month, day };
}

export function formatGregorianDate(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatEthiopianDate(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const { year, month, day } = fromJulianDayToEthiopian(toJulianDay(date));
  const monthName =
    ETHIOPIAN_MONTHS[
      Math.max(0, Math.min(ETHIOPIAN_MONTHS.length - 1, month - 1))
    ];
  return `${monthName} ${day}, ${year}`;
}

export function formatGregorianAndEthiopian(dateInput: string | Date): string {
  return `${formatGregorianDate(dateInput)} | ${formatEthiopianDate(dateInput)}`;
}

export function formatShortGregorianAndEthiopian(
  dateInput: string | Date,
): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const gregorian = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
  return `${gregorian} (${formatEthiopianDate(dateInput)})`;
}
