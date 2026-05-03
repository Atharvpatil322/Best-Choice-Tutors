import { Toaster as Sonner } from "sonner"
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Loader2 } from "lucide-react"

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      position="top-center"
      className="toaster group"
      icons={{
        success: <CheckCircle2 className="size-5 shrink-0 text-emerald-600" aria-hidden />,
        error: <AlertCircle className="size-5 shrink-0 text-red-600" aria-hidden />,
        info: <Info className="size-5 shrink-0 text-sky-600" aria-hidden />,
        warning: <AlertTriangle className="size-5 shrink-0 text-amber-600" aria-hidden />,
        loading: <Loader2 className="size-5 shrink-0 animate-spin text-muted-foreground" aria-hidden />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
