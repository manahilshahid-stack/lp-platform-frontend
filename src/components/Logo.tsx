type Props = {
  size?: number;
  showWordmark?: boolean;
  subtitle?: string;
  className?: string;
};

export function Logo({ size = 36, showWordmark = true, subtitle = "LP Portal", className = "" }: Props) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/merantix-logo.png"
        alt="Merantix Capital"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="object-contain rounded-sm"
      />
      {showWordmark && (
        <div className="leading-tight">
          <div className="font-display text-sm font-bold tracking-tight">Merantix Capital</div>
          {subtitle && (
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{subtitle}</div>
          )}
        </div>
      )}
    </div>
  );
}
