const shortDateOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  timeZone: 'UTC',
}

export function formatDate(date: string, locale?: string) {
  return new Intl.DateTimeFormat(locale, shortDateOptions).format(new Date(date))
}
