/** Converts a "hh:mm a" or "HH:MM" time string to a decimal hour number (e.g. 9.5 = 09:30) */
export function timeToDecimal(time: string): number {
    if (!time) return 8
    const parts = time.split(" ")
    const [h, mString] = parts[0].split(":")
    let hNum = Number(h)
    const mNum = Number(mString)
    const period = parts[1]
    if (period === "PM" && hNum !== 12) hNum += 12
    if (period === "AM" && hNum === 12) hNum = 0
    return hNum + (mNum || 0) / 60
}

/** Parses a duration string or number to minutes, defaulting to 30 */
export function durationToMinutes(dur: string | number): number {
    const n = parseInt(String(dur), 10)
    return isNaN(n) ? 30 : n
}

/** Generates 30-min time slots between "HH:MM:SS" start and end times */
export function buildTimeSlots(startTime: string, endTime: string): string[] {
    const toMins = (t: string) => {
        const [h, m] = t.split(":").map(Number)
        return h * 60 + m
    }
    const toLabel = (mins: number) => {
        const h24 = Math.floor(mins / 60)
        const m = mins % 60
        const period = h24 >= 12 ? "PM" : "AM"
        const h12 = h24 % 12 === 0 ? 12 : h24 % 12
        return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`
    }
    const slots: string[] = []
    for (let cur = toMins(startTime); cur < toMins(endTime); cur += 30) {
        slots.push(toLabel(cur))
    }
    return slots
}

/** Combines a Date and a "09:30 AM" time string into a full ISO timestamp */
export function buildTimestamp(date: Date, timeSlot: string): string {
    const [time, period] = timeSlot.split(" ")
    const [hStr, mStr] = time.split(":")
    let hours = parseInt(hStr, 10)
    const minutes = parseInt(mStr, 10)
    if (period === "PM" && hours !== 12) hours += 12
    if (period === "AM" && hours === 12) hours = 0
    const dt = new Date(date)
    dt.setHours(hours, minutes, 0, 0)
    return dt.toISOString()
}
