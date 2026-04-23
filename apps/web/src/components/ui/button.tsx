'use client';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1 rounded-base min-h-touch px-4 py-3 text-base font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 focus-visible:outline-primary-500',
        secondary:
          'border-2 border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 active:bg-neutral-100 focus-visible:outline-primary-500',
        danger:
          'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 focus-visible:outline-danger-500',
        ghost:
          'min-h-touch min-w-0 border-0 bg-transparent px-2.5 py-3 text-primary-600 hover:underline active:text-primary-800',
        /** Green outline CTA (strong secondary) */
        outline:
          'border-2 border-primary-500 bg-white text-primary-700 hover:bg-primary-50 active:bg-primary-100 focus-visible:outline-primary-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
