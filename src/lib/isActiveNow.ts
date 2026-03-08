import { DoctorScheduleRecord } from "@/types/database";

export default function isActiveNow(slot: DoctorScheduleRecord): boolean {
  const now = new Date();
  const todayDayOfWeek = now.getDay();
  if (slot.day_of_week !== todayDayOfWeek) return false;

  const toMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return (
    currentMinutes >= toMinutes(slot.start_time) &&
    currentMinutes < toMinutes(slot.end_time)
  );
}
