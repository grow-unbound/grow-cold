import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-base px-4 py-3 font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'min-h-touch min-w-touch bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 focus-visible:outline-primary-500',
        secondary:
          'min-h-touch min-w-touch border-2 border-secondary-500 bg-transparent text-secondary-500 hover:bg-secondary-50 active:bg-secondary-100 focus-visible:outline-secondary-500',
        danger:
          'min-h-touch min-w-touch bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 focus-visible:outline-danger-500',
        ghost:
          'min-h-touch min-w-0 border-0 bg-transparent px-4 py-3 text-secondary-500 hover:underline active:text-secondary-700',
        /** Alias for secondary (teal outline); matches COMPONENT_SPECS secondary button */
        outline:
          'min-h-touch min-w-touch border-2 border-secondary-500 bg-transparent text-secondary-500 hover:bg-secondary-50 active:bg-secondary-100 focus-visible:outline-secondary-500',
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
