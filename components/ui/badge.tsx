import { cn } from "@/lib/utils";

type Tone = "neutral" | "copper" | "success" | "danger" | "warning" | "info";

const TONES: Record<Tone, string> = {
  neutral: "bg-paper-2 text-ink-soft border-line",
  copper: "bg-copper-soft text-copper-deep border-copper/20",
  success: "bg-success-soft text-success border-success/20",
  danger: "bg-danger-soft text-danger border-danger/20",
  warning: "bg-warning-soft text-[oklch(45%_0.1_70)] border-warning/30",
  info: "bg-info-soft text-info border-info/20",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

export function Badge({ tone = "neutral", dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5",
        "text-xs font-medium tracking-tight",
        TONES[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
