import Link from "next/link";

type Props = {
  href?: string;
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
};

export function Brand({ href = "/", size = "md" }: Props) {
  return (
    <Link
      href={href}
      className={`tm-display ${sizeMap[size]} text-fg hover:text-fg`}
      aria-label="TrueMatch home"
    >
      TRUE<span className="text-accent">//</span>MATCH
    </Link>
  );
}
