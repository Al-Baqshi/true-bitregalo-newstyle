"use client"
import * as React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

/*
 * One overlay for both screens: a sheet that rises from the bottom edge on a phone,
 * a centred dialog on a wider screen. Use it for a choice that needs the person's
 * whole attention (picking a wallet, the "new" menu on mobile), not for ordinary content.
 */
const Sheet = Dialog.Root
const SheetTrigger = Dialog.Trigger
const SheetClose = Dialog.Close

function SheetContent({
  title,
  description,
  className,
  children,
  ...props
}: React.ComponentProps<typeof Dialog.Content> & { title: string; description?: string }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-150 data-[state=open]:duration-200" />
      <Dialog.Content
        className={cn(
          "fixed z-50 flex flex-col bg-popover text-popover-foreground shadow-overlay outline-none",
          // phone: bottom sheet
          "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl border-t border-border pb-safe data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:duration-300 data-[state=closed]:duration-200",
          // wider: centred dialog
          "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[85dvh] sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:pb-0 sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:fade-in-0 sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:fade-out-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:duration-200",
          className
        )}
        {...props}
      >
        <div className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-border-strong/50 sm:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-4 px-5 pb-1 pt-4 sm:px-6 sm:pt-5">
          <div className="min-w-0">
            <Dialog.Title className="t-subheading">{title}</Dialog.Title>
            {description && <Dialog.Description className="mt-1 text-sm text-muted-foreground">{description}</Dialog.Description>}
          </div>
          <Dialog.Close
            className="-mr-2 -mt-1 flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground pointer-coarse:size-11"
            aria-label="Close"
          >
            <X className="size-5" />
          </Dialog.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-3 sm:px-6 sm:pb-6">{children}</div>
      </Dialog.Content>
    </Dialog.Portal>
  )
}

export { Sheet, SheetTrigger, SheetClose, SheetContent }
