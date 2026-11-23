import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'ghost';

const variants: Record<Variant, string> = {
  primary:
    'bg-rose text-on-rose hover:bg-rose-strong shadow-[0_10px_24px_-12px_rgba(225,29,99,0.8)]',
  secondary: 'bg-surface text-ink border border-line hover:border-ink',
  ghost: 'text-rose hover:bg-blush',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'primary', className, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-pill px-6 text-[0.95rem] font-bold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none',
        variants[variant],
        className,
      )}
      {...rest}
    />
  );
}

/** Same look as Button, for anchors (Next <Link> passes its own element). */
export function buttonClasses(variant: Variant = 'primary', className?: string): string {
  return cn(
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-pill px-6 text-[0.95rem] font-bold transition-colors',
    variants[variant],
    className,
  );
}
