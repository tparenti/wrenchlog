export function formatDateInput(value) {
  if (!value) return ''
  if (typeof value === 'string' && value.length >= 10) {
    return value.slice(0, 10)
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export function todayDateInput() {
  return new Date().toISOString().slice(0, 10)
}

export function formatDisplayDate(value) {
  const normalized = formatDateInput(value)
  if (!normalized) return 'No date set'
  return new Date(`${normalized}T00:00:00`).toLocaleDateString()
}