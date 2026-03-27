"use client"

import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { useRouter } from "next/navigation"
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
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const syncStaffData = async (user: SupabaseUser | null) => {
            if (!user) {
                dispatch(setCredentials(null))
                return
            }

            let staffData: AuthUser = {
                id: user.id,
                username: "",
                full_name: "",
                role: "",
                email: user.email || "",
                avatar_url: "",
                permissions: null
            }

            try {
                const dbStaff = await getStaffById(user.id || "")
                if (dbStaff) {
                    staffData = {
                        ...staffData,
                        full_name: dbStaff.full_name,
                        username: dbStaff.username,
                        avatar_url: dbStaff.avatar_url,
                        role: dbStaff.role,
                        permissions: dbStaff.permissions
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

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (['INITIAL_SESSION', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
                if (!session) {
                    // session expired or user is logged out
                    dispatch(setCredentials(null))
                    router.push("/")
                    return
                }
                syncStaffData(session.user)
            }

            if (event === 'SIGNED_OUT') {
                dispatch(setCredentials(null))
                router.push("/")
            }
        })

        return () => subscription.unsubscribe()
    }, [dispatch, initialUser, supabase.auth, router])

    return null
}