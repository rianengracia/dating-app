import type { ComponentProps, ReactNode } from "react";

type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
};

export function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  const errorId = error ? `${htmlFor}-error` : undefined;
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="tm-mono text-[11px] text-fg-muted flex items-center gap-2">
        <span className="text-accent">▸</span>
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-fg-dim">{hint}</p>}
      {error && (
        <p id={errorId} className="text-xs text-accent tm-mono">
          ▸ {error}
        </p>
      )}
    </div>
  );
}

type InputProps = ComponentProps<"input"> & { invalid?: boolean };

export function Input({ invalid, className = "", ...rest }: InputProps) {
  const border = invalid ? "border-accent" : "border-line";
  return (
    <input
      {...rest}
      aria-invalid={invalid || undefined}
      className={`w-full bg-surface-2 border ${border} text-fg placeholder:text-fg-dim h-11 px-3 tm-clip-tl focus:outline-none focus:ring-2 focus:ring-cyan focus:ring-offset-2 focus:ring-offset-bg ${className}`}
    />
  );
}

type TextareaProps = ComponentProps<"textarea"> & { invalid?: boolean };

export function Textarea({ invalid, className = "", ...rest }: TextareaProps) {
  const border = invalid ? "border-accent" : "border-line";
  return (
    <textarea
      {...rest}
      aria-invalid={invalid || undefined}
      className={`w-full bg-surface-2 border ${border} text-fg placeholder:text-fg-dim p-3 tm-clip-tl focus:outline-none focus:ring-2 focus:ring-cyan focus:ring-offset-2 focus:ring-offset-bg resize-y min-h-[96px] ${className}`}
    />
  );
}
