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

export function getMonthFromDate(date, startDay = 1) {
  if (startDay <= 1) {
    return { month: date.getMonth() + 1, year: date.getFullYear() }
  }
  const day = date.getDate()
  let month = date.getMonth() + 1
  let year = date.getFullYear()
  if (day >= startDay) {
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }
  return { month, year }
}

export function getEffectiveMonthYear(project, startDay = 1) {
  const d = project.currentProjectDate || project.createdAt
  if (!d) return { month: null, year: null }
  const date = new Date(d)
  return getMonthFromDate(date, startDay)
}


