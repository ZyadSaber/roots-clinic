"use client"

import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { createClient } from "@/lib/supabase/client"
import { setCredentials, AuthUser } from "@/store/slices/authSlice"
import { User as SupabaseUser } from "@supabase/supabase-js"
import { getStaffById } from "@/services/staff"

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
            let staffData: AuthUser = {
                id: user.id,
                username: "",
                full_name: "",
                role: "",
                email: user.email || "",
                avatar_url: ""
            }

            // Try to enhance with real database data from staff table
            try {
                const dbStaff = await getStaffById(user.id || "")
                if (dbStaff) {
                    staffData = {
                        ...staffData,
                        full_name: dbStaff.full_name,
                        username: dbStaff.username,
                        avatar_url: dbStaff.avatar_url,
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
