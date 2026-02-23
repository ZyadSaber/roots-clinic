// "use client";

// import { useState, useEffect } from "react";
// // import { getCurrentUser } from "@/services/user";

// export interface UserSession {
//   id: string;
//   username: string;
//   role: string;
//   allowedPages: string[];
//   fullName: string;
// }

// export function useAuth() {
//   const [user, setUser] = useState<UserSession | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     async function fetchUser() {
//       try {
//         const session = await getCurrentUser();
//         setUser(session);
//       } catch (error) {
//         console.error("Failed to fetch user session:", error);
//         setUser(null);
//       } finally {
//         setLoading(false);
//       }
//     }

//     fetchUser();
//   }, []);

//   return { user, loading };
// }
