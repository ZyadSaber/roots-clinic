"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      richColors
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground font-semibold",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:bg-emerald-500 group-[.toaster]:text-white group-[.toaster]:border-emerald-600",
          error: "group-[.toaster]:bg-rose-500 group-[.toaster]:text-white group-[.toaster]:border-rose-600",
          warning: "group-[.toaster]:bg-amber-400 group-[.toaster]:text-black group-[.toaster]:border-amber-500",
          info: "group-[.toaster]:bg-sky-400 group-[.toaster]:text-white group-[.toaster]:border-sky-500",
          loading: "group-[.toaster]:bg-white group-[.toaster]:text-black group-[.toaster]:border-gray-200",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
