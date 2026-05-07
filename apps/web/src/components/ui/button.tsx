'use client';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base: 36px visual height, 48px tap zone via padding extension, 16px input-safe font
  'relative inline-flex items-center justify-center gap-1.5 rounded-md px-5 text-[15px] font-semibold transition-all duration-fast ease-out disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:shadow-focus',
  {
    variants: {
      variant: {
        // Primary CTA — brand-ui fill, white text
        default:
          'h-9 bg-brand-ui text-text-on-brand hover:bg-brand-hover active:bg-brand-press',
        // Secondary — warm surface, default border
        secondary:
          'h-9 border border-border bg-surface-subtle text-text-primary hover:bg-surface-inset active:bg-surface-inset',
        // Destructive — outward (rust) tint
        danger:
          'h-9 border border-outward-border bg-outward-bg text-outward hover:bg-outward-border',
        // Ghost — brand text, no background
        ghost:
          'h-9 border-0 bg-transparent px-2 text-brand-text hover:underline active:opacity-70',
        // Outline CTA — brand border + brand text (strong secondary)
        outline:
          'h-9 border-2 border-brand-ui bg-surface text-brand-text hover:bg-brand-subtle active:bg-brand-subtle',
      },
      size: {
        sm:      'h-7 px-3 text-small',
        default: 'h-9 px-5',
        lg:      'h-[42px] px-6 text-body',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }));
    if (asChild) {
      return (
        <Slot
          className={classes}
          ref={ref as unknown as React.ComponentPropsWithRef<typeof Slot>['ref']}
          {...(props as React.ComponentPropsWithoutRef<typeof Slot>)}
        />
      );
    }
    return <button className={classes} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';
