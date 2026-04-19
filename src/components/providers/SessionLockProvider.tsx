"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/store/store"
import { SessionLockDialog } from "@/components/shared/SessionLockDialog"

const IDLE_MS = 15 * 60 * 1000

const SessionLockContext = createContext<{ lock: () => void }>({ lock: () => {} })

export const useSessionLock = () => useContext(SessionLockContext)

export function SessionLockProvider({ children }: { children: React.ReactNode }) {
    const [isLocked, setIsLocked] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)

    const lock = useCallback(() => setIsLocked(true), [])
    const unlock = useCallback(() => setIsLocked(false), [])

    const resetTimer = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(lock, IDLE_MS)
    }, [lock])

    useEffect(() => {
        if (!isAuthenticated) {
            if (timerRef.current) clearTimeout(timerRef.current)
            return
        }

        const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const
        events.forEach(e => document.addEventListener(e, resetTimer, { passive: true }))
        resetTimer()

        return () => {
            events.forEach(e => document.removeEventListener(e, resetTimer))
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [isAuthenticated, resetTimer])

    return (
        <SessionLockContext.Provider value={{ lock }}>
            {children}
            {isAuthenticated && <SessionLockDialog open={isLocked} onUnlock={unlock} />}
        </SessionLockContext.Provider>
    )
}
