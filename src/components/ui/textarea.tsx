import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        "border-white/15 placeholder:text-muted-foreground/70 focus-visible:border-white/40 focus-visible:ring-ring focus-visible:ring-2 aria-invalid:ring-destructive/30 aria-invalid:border-destructive h-14 min-h-[56px] w-full resize-y rounded-2xl border bg-black/35 px-4 py-2.5 text-base leading-relaxed text-foreground/85 shadow-[0_10px_30px_rgba(5,5,5,0.45)] transition-colors outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-black/70 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
})

export { Textarea }
