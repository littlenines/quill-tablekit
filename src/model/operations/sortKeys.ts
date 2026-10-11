export type SortKey = { kind: 'number' | 'date'; value: number } | { kind: 'text'; text: string } | { kind: 'empty' }

const GROUP_ORDER: Record<SortKey['kind'], number> = { number: 0, date: 1, text: 2, empty: 3 }

const PLAIN_NUMBER = /^[-+]?(?:\d+\.?\d*|\.\d+)$/
const TIME = String.raw`(?:[T\s,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?`
const ISO_DATE = new RegExp(String.raw`^(\d{4})-(\d{1,2})-(\d{1,2})${TIME}$`)
const DOTTED_DATE = new RegExp(String.raw`^(\d{1,2})\.\s?(\d{1,2})\.\s?(\d{4})\.?${TIME}$`)
const SLASHED_DATE = new RegExp(String.raw`^(\d{1,2})[/-](\d{1,2})[/-](\d{4})${TIME}$`)

export const validLocale = (locale: string | null | undefined): string | undefined => {
  try {
    return locale ? Intl.getCanonicalLocales(locale)[0] : undefined
  } catch {
    return undefined
  }
}

const separatorPattern = (separator: string) =>
  /\s/.test(separator) ? String.raw`\s` : separator.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)

// "1.234,5" in German, "1,234.5" in English, and "1.5" in any language
const numberReader = (locale: string | undefined) => {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6)
  const group = separatorPattern(parts.find(({ type }) => type === 'group')?.value ?? ',')
  const decimal = separatorPattern(parts.find(({ type }) => type === 'decimal')?.value ?? '.')
  const localeNumber = new RegExp(String.raw`^([-−+]?)(\d{1,3}(?:${group}\d{3})+|\d+)(?:${decimal}(\d+))?$`)

  return (text: string): number | null => {
    const match = localeNumber.exec(text)

    if (match) {
      const [, sign, whole, fraction = '0'] = match

      return Number(`${sign && sign !== '+' ? '-' : ''}${whole.replace(/\D/g, '')}.${fraction}`)
    }

    return PLAIN_NUMBER.test(text) ? Number(text) : null
  }
}

const isDayFirstLocale = (locale: string | undefined) => {
  const partTypes = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'numeric', year: 'numeric' })
    .formatToParts(new Date(2000, 11, 31))
    .map(({ type }) => type)

  return partTypes.indexOf('day') < partTypes.indexOf('month')
}

// 03/01/2024 could be either way, so the other dates in the column decide, and then the language
const slashesAreDayFirst = (texts: string[], locale: string | undefined) => {
  const slashedDates = texts.flatMap((text) => {
    const match = SLASHED_DATE.exec(text)

    return match ? [[Number(match[1]), Number(match[2])]] : []
  })

  if (slashedDates.some(([first]) => first > 12)) return true
  if (slashedDates.some(([, second]) => second > 12)) return false

  return isDayFirstLocale(locale)
}

const numbersOf = (match: RegExpExecArray) => match.slice(1).map((part) => Number(part ?? 0))

const toTimestamp = (year: number, month: number, day: number, [hours, minutes, seconds]: number[]) => {
  if (month < 1 || month > 12 || hours > 23 || minutes > 59 || seconds > 59) return null

  const timestamp = Date.UTC(year, month - 1, day, hours, minutes, seconds)

  return new Date(timestamp).getUTCDate() === day ? timestamp : null
}

const dateReader =
  (dayFirstSlashes: boolean) =>
  (text: string): number | null => {
    const isoMatch = ISO_DATE.exec(text)

    if (isoMatch) {
      const [year, month, day, ...time] = numbersOf(isoMatch)

      return toTimestamp(year, month, day, time)
    }

    const dottedMatch = DOTTED_DATE.exec(text)

    if (dottedMatch) {
      const [day, month, year, ...time] = numbersOf(dottedMatch)

      return toTimestamp(year, month, day, time)
    }

    const slashedMatch = SLASHED_DATE.exec(text)

    if (!slashedMatch) return null

    const [first, second, year, ...time] = numbersOf(slashedMatch)

    return dayFirstSlashes ? toTimestamp(year, second, first, time) : toTimestamp(year, first, second, time)
  }

export const sortKeysOf = (texts: string[], locale: string | undefined): SortKey[] => {
  const readNumber = numberReader(locale)
  const readDate = dateReader(slashesAreDayFirst(texts, locale))

  return texts.map((text): SortKey => {
    if (text === '') return { kind: 'empty' }

    const number = readNumber(text)

    if (number != null) return { kind: 'number', value: number }

    const date = readDate(text)

    return date != null ? { kind: 'date', value: date } : { kind: 'text', text }
  })
}

// Numbers, then dates, then text, then empty cells
export const compareSortKeys =
  (collator: Intl.Collator) =>
  (first: SortKey, second: SortKey): number => {
    if (first.kind !== second.kind) return GROUP_ORDER[first.kind] - GROUP_ORDER[second.kind]
    if (first.kind === 'text' && second.kind === 'text') return collator.compare(first.text, second.text)
    if ('value' in first && 'value' in second) return first.value - second.value

    return 0
  }
