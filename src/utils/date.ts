// Day boundary: entries before 3am local time count as the previous calendar day.

export function getTodayDate(): string {
  const now = new Date()
  if (now.getHours() < 3) {
    now.setDate(now.getDate() - 1)
  }
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
