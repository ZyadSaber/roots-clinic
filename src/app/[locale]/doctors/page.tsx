import DoctorsClient from "@/components/doctors/DoctorsClient";
import { getDoctors, getDoctorSchedule } from "@/services/doctors";
import { getSpecialties } from "@/services/specialties";
import { Specialty, DoctorRecord, DoctorScheduleRecord } from "@/types/database";

export default async function DoctorsPage() {
    const specialtiesData: Specialty[] = await getSpecialties();
    const doctorsData: DoctorRecord[] = await getDoctors();

    // Transform doctors for the UI and fetch their schedules
    const doctors = await Promise.all(doctorsData.map(async (d: DoctorRecord) => {
        const scheduleData = await getDoctorSchedule(d.id);

        // Map day number (0-6) to string names if needed, or keep as is if UI handles numbers
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const schedule = scheduleData.map((s: DoctorScheduleRecord) => ({
            day: days[s.day_of_week] || "Unknown",
            time: `${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)}`,
            active: s.is_active
        }));

        return {
            id: d.id,
            name: d.name,
            specialty_en: d.specialty_en || "General",
            specialty_ar: d.specialty_ar || "عام",
            fee: typeof d.fee === 'string' ? parseFloat(d.fee) : d.fee,
            status: d.status,
            image: d.image || "https://avatar.iran.liara.run/public",
            rating: typeof d.rating === 'string' ? parseFloat(d.rating) : d.rating,
            reviews: d.reviews,
            exp: d.exp,
            schedule
        };
    }));

    return (
        <DoctorsClient
            doctors={doctors}
            specializations={specialtiesData}
        />
    );
}
