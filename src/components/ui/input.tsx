import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground/70 selection:bg-primary selection:text-primary-foreground h-11 w-full min-w-0 rounded-2xl border border-white/15 bg-black/40 px-4 text-base text-foreground/85 shadow-[0_8px_24px_rgba(5,5,5,0.45)] transition-colors outline-none file:inline-flex file:h-7 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:text-[11px] file:font-semibold file:uppercase file:tracking-[0.24em] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-white/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-black/80",
        "aria-invalid:ring-destructive/30 aria-invalid:border-destructive/60",
        className
      )}
      {...props}
    />
  )
}

export { Input }
