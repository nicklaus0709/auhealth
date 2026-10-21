import { HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BrandMark({
  iconSize = 40,
  iconClass = "",
  showWordmark = false,
  wordmarkClass = "text-gradient-teal",
  subtitle = null,
  subtitleClass = "text-muted-foreground",
  className,
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-teal to-brand-emerald shadow-teal",
          iconClass
        )}
        style={{ width: iconSize, height: iconSize }}
      >
        <HeartPulse
          className="text-white"
          style={{ width: iconSize * 0.54, height: iconSize * 0.54 }}
          strokeWidth={2.2}
        />
      </div>
      {showWordmark && (
        <div className="leading-tight">
          <span className={cn("font-heading text-lg font-bold tracking-tight", wordmarkClass)}>AuHealth</span>
          {subtitle && (
            <p className={cn("mt-0.5 text-[11px] font-medium uppercase tracking-[.16em]", subtitleClass)}>
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}