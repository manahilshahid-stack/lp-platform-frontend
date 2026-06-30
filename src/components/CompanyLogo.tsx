import { useState } from "react";

type Props = {
  website: string;
  name: string;
  fallbackLetter: string;
  fallbackColor: string;
  size?: number;
  className?: string;
};

/**
 * Tries to load the company's real logo via Clearbit's logo API.
 * Falls back to the coloured letter avatar if the logo isn't found.
 */
export function CompanyLogo({
  website,
  name,
  fallbackLetter,
  fallbackColor,
  size = 44,
  className = "",
}: Props) {
  const [failed, setFailed] = useState(false);

  const logoUrl = website ? `https://logo.clearbit.com/${website}` : null;

  if (logoUrl && !failed) {
    return (
      <div
        className={`overflow-hidden rounded-lg bg-white shadow-sm ${className}`}
        style={{ width: size, height: size, minWidth: size }}
      >
        <img
          src={logoUrl}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-contain p-[10%]"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`grid place-items-center rounded-lg font-display font-bold text-primary-foreground ${className}`}
      style={{ width: size, height: size, minWidth: size, background: fallbackColor }}
    >
      {fallbackLetter}
    </div>
  );
}
