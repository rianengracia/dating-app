import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center tm-mono text-xs transition-colors disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

const sizes: Record<Size, string> = {
  sm: "h-8 px-3",
  md: "h-11 px-6",
  lg: "h-13 px-8 text-sm",
};

const variants: Record<Variant, string> = {
  primary: "bg-accent text-[#0F1923] hover:bg-accent-hover active:bg-accent-press tm-clip-tl",
  secondary:
    "border border-line text-fg hover:border-accent hover:text-fg tm-clip-tl bg-transparent",
  ghost: "text-fg-muted hover:text-fg",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
};

type ButtonAsButton = CommonProps & ComponentProps<"button"> & { href?: undefined };
type ButtonAsLink = CommonProps & ComponentProps<typeof Link> & { href: string };

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "primary", size = "md", className = "", children, ...rest } = props;
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`.trim();

  if ("href" in rest && rest.href) {
    return (
      <Link className={cls} {...(rest as ComponentProps<typeof Link>)}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...(rest as ComponentProps<"button">)}>
      {children}
    </button>
  );
}
