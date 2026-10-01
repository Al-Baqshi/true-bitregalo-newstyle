import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/*
 * Buttons give feedback on press (a 2% squeeze), keep a visible focus ring, and grow
 * to a 44px touch target on phones and tablets. A disabled button is drawn with its
 * own colours rather than faded, so its label stays readable.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-[560] outline-none transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:border-transparent disabled:bg-secondary disabled:text-subtle aria-disabled:pointer-events-none aria-disabled:border-transparent aria-disabled:bg-secondary aria-disabled:text-subtle [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.15em]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-hover",
        outline: "border border-border-strong bg-transparent text-foreground hover:bg-secondary",
        ghost: "text-foreground hover:bg-secondary",
        destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
        link: "rounded-sm text-gold underline decoration-1 underline-offset-4 hover:decoration-2 active:scale-100",
      },
      size: {
        default: "h-10 px-4 text-sm pointer-coarse:h-11",
        sm: "h-9 px-3 text-sm pointer-coarse:h-11 pointer-coarse:px-4",
        lg: "h-12 px-6 text-base",
        icon: "size-10 pointer-coarse:size-11",
        "icon-sm": "size-9 pointer-coarse:size-11",
        "icon-lg": "size-12",
      },
    },
    compoundVariants: [{ variant: "link", class: "h-auto px-0 pointer-coarse:h-auto pointer-coarse:px-0" }],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
