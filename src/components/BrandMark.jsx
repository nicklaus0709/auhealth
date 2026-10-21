import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
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
    <Link to="/" aria-label="AuHealth - Ir al inicio" className={cn("flex items-center gap-3", className)}>
      <img
        src={logo}
        alt="AuHealth"
        className={cn("shrink-0 rounded-xl bg-white object-contain shadow-teal", iconClass)}
        style={{ width: iconSize, height: iconSize }}
      />
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
    </Link>
  );
}
