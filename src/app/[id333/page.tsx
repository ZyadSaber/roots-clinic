import AppointmentsDoctorClient from "./AppointmentsDoctorClient"

export default async function DoctorAppointmentsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    return <AppointmentsDoctorClient doctorId={id} />
}
