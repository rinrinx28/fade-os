import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  color?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "size-7 text-[0.65rem]",
  md: "size-9 text-xs",
  lg: "size-12 text-sm",
};

/** Avatar chữ cái với màu accent của thợ. */
export function Avatar({ name, color, size = "md", className }: AvatarProps) {
  const c = color ?? "var(--copper)";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        SIZES[size],
        className,
      )}
      style={{
        background: `linear-gradient(140deg, ${c}, color-mix(in oklch, ${c} 78%, black))`,
      }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
