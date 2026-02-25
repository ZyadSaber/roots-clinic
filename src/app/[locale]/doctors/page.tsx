import DoctorsClient from "@/components/doctors/DoctorsClient";

export default async function DoctorsPage() {
    const specializations = [
        "All Specializations",
        "generaldentistry",
        "orthodontics",
        "radiology",
        "periodontics",
        "oralsurgery"
    ];

    const doctors = [
        {
            name: "Dr. Sarah Jenkins",
            specialty: "seniororthodontist",
            fee: 150,
            status: "Available",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDKbo6Fpf1EQ0grM7Mt6Lfk3WbhvLZ5mRXThI11dI5UY8rvq60AFXNpFZs2TRW5Ryuub3pC32-u69Z2VD0Ks3yMX7_Anmba2t8TuTadzzBwzWK-zyDexYNeNa_RkE-9UOxMjCSrtKChJzB4VkzovTzEDBSvV7_IjYqCYKWRaL88kUeKhM7aUaqG_seS9vUkEhrynZ5nIYxP84d8q2GqPjvbmoizdmhuyuIrDY7If4uDse8MKOXJ71XJXVELBxGwfOqjXjW_EN6NiCDJ",
            rating: 4.8,
            reviews: 124,
            exp: 12,
            schedule: [
                { day: "Monday", time: "09:00 AM - 05:00 PM", active: false },
                { day: "Tuesday", time: "09:00 AM - 05:00 PM", active: false },
                { day: "Wednesday", time: "Active Now", active: true },
                { day: "Thursday", time: "09:00 AM - 03:00 PM", active: false },
                { day: "Friday", time: "08:00 AM - 02:00 PM", active: false },
            ]
        },
        {
            name: "Dr. Michael Chen",
            specialty: "radiologyspecialist",
            fee: 120,
            status: "On Break",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBlZqh2RRtkH8sgYGepK82uqPnMTI18jfM42glPn04jG8VKWmvhmy1gYm5P_rP8gYAX8lXdqK5w6AhN6NNAfMQ_P-_8vyiuyHZ5u41xBFljQ8j1iZ0RDmOxBHEz5SwyysOJGBM7M2QbePdIGxupjtttjXRydk0tF5FeF-Q14t-IxWdeI1oC26IHHl4_am0TTjl_IliXSZALmsliL1p12sWUpISxLOFKuz5Rj7SgZjLZNN-OuhrZLF-aM9aMuK0L6sg708AhAldqVdK2",
            rating: 4.5,
            reviews: 89,
            exp: 8,
            schedule: []
        },
        {
            name: "Dr. Elena Rodriguez",
            specialty: "generaldentistry",
            fee: 95,
            status: "Available",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwl51ly2MXaovsoeiwfas5jswYkiqgxm9yweW669TAWRuys3BnqXaAFJQ7ExAtf5e6jGfOrOSyoSPai_imbqDhg0T14Yusqs7g6vOqynVnNRyTyYHZ5bUyzPNr6ahn4-tTtJUYLPa6Hpb4Z2BT4N3TyKW9gGi7hlJ90295sf1MfVOxJ2XQL7L-TNMAsQ43yvVtIDsOcpR_h-AOP3EswhCfJxYm7KyO93fLrVutMrKr3QV4aIeUCCLzY5lIiMYQM_r8lmuUgqqjCSRN",
            rating: 4.9,
            reviews: 210,
            exp: 15,
            schedule: []
        },
        {
            name: "Dr. Marcus Thorne",
            specialty: "periodontist",
            fee: 180,
            status: "Away",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAFKnu3b0I08_rvG94pbeuixgEelmmdBerGYbW8zRNT53Iex4i0DbuxbSeXFmbDaCuA6DxZrExY7JZ2PDG2of-ZfLtPsVOhHjkVMeRY9fmC53V0lZormOiSxyr0Mk3HNEkuQlVcqnRGQO-zYIltg7u_T7wa1XqWudGVrwW1vAotQe5H0N6zd2o4P7iivYyD-TZya4Jq1T2vNnfLm9drhVQCHzi-LinhzWQ8NTs8-E-P_PsoI959eM9i0II43qGOniM1GGnu09zoi7qN",
            rating: 4.7,
            reviews: 56,
            exp: 10,
            schedule: []
        }
    ];

    return (
        <DoctorsClient
            doctors={doctors}
            specializations={specializations}
        />
    );
}
