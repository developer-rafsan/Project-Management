export function getMonthRange(year, month, startDay = 1) {
  if (startDay <= 1) {
    return {
      from: new Date(year, month - 1, 1),
      to: new Date(year, month, 0, 23, 59, 59, 999),
    }
  }
  return {
    from: new Date(year, month - 2, startDay),
    to: new Date(year, month - 1, startDay - 1, 23, 59, 59, 999),
  }
}

export function isDateInMonthRange(date, year, month, startDay = 1) {
  const { from, to } = getMonthRange(year, month, startDay)
  return date >= from && date <= to
}

export function getMonthStartDay() {
  if (typeof window === "undefined") return 1
  const saved = localStorage.getItem("monthStartDay")
  return saved ? Number(saved) : 1
}
