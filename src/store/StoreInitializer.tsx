"use client"

import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { setCredentials, AuthUser } from "@/store/slices/authSlice"
import { User as SupabaseUser } from "@supabase/supabase-js"
import { getStaffById } from "@/services/staff"

const SESSION_MAX_MS = 8 * 60 * 60 * 1000
const LOGIN_TIME_KEY = "clinic_login_time"

function recordLoginTime() {
    if (!localStorage.getItem(LOGIN_TIME_KEY)) {
        localStorage.setItem(LOGIN_TIME_KEY, Date.now().toString())
    }
}

function clearLoginTime() {
    localStorage.removeItem(LOGIN_TIME_KEY)
}

function isSessionExpired(): boolean {
    const raw = localStorage.getItem(LOGIN_TIME_KEY)
    if (!raw) return false
    return Date.now() - parseInt(raw, 10) > SESSION_MAX_MS
}

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

        const forceSignOut = async () => {
            clearLoginTime()
            dispatch(setCredentials(null))
            await supabase.auth.signOut()
            router.push("/")
        }

        if (initialUser) {
            if (isSessionExpired()) {
                forceSignOut()
                return
            }
            recordLoginTime()
            syncStaffData(initialUser)
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                if (!session) {
                    clearLoginTime()
                    dispatch(setCredentials(null))
                    router.push("/")
                    return
                }
                if (isSessionExpired()) {
                    forceSignOut()
                    return
                }
                if (event === 'INITIAL_SESSION') {
                    recordLoginTime()
                }
                syncStaffData(session.user)
            }

            if (event === 'SIGNED_OUT') {
                clearLoginTime()
                dispatch(setCredentials(null))
                router.push("/")
            }
        })

        return () => subscription.unsubscribe()
    }, [dispatch, initialUser, supabase.auth, router])

    return null
}
