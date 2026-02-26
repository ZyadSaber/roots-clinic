"use client"

import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { createClient } from "@/lib/supabase/client"
import { setCredentials } from "@/store/slices/authSlice"
import { User as SupabaseUser } from "@supabase/supabase-js"
import { getStaffByEmail } from "@/services/staff"

export default function StoreInitializer({
    initialUser
}: {
    initialUser: SupabaseUser | null
}) {
    const dispatch = useDispatch()
    const supabase = createClient()

    useEffect(() => {
        const syncStaffData = async (user: SupabaseUser | null) => {
            if (!user) {
                dispatch(setCredentials(null))
                return
            }

            // Start with Supabase data
            let staffData = {
                id: user.id,
                email: user.email || "",
                username: user.email?.split('@')[0] || "",
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || "User",
                role: (user.user_metadata?.role as "admin" | "doctor" | "receptionist" | "finance") || "receptionist",
                avatar_url: user.user_metadata?.avatar_url
            }

            // Try to enhance with real database data from staff table
            try {
                const dbStaff = await getStaffByEmail(user.email || "")
                if (dbStaff) {
                    staffData = {
                        ...staffData,
                        full_name: dbStaff.full_name,
                        username: dbStaff.username,
                        avatar_url: dbStaff.avatar_url || staffData.avatar_url,
                        role: dbStaff.role
                    }
                }
            } catch (err) {
                console.error("Failed to sync staff data:", err)
            }

            dispatch(setCredentials(staffData))
        }

        if (initialUser) {
            syncStaffData(initialUser)
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            syncStaffData(session?.user || null)
        })

        return () => subscription.unsubscribe()
    }, [dispatch, initialUser, supabase.auth])

    return null
}
