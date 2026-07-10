import React from "react";

interface TokenIconProps {
  symbol: string;
  logoUrl?: string;
  size?: string; // e.g. "w-5 h-5" or "w-4 h-4"
  textClass?: string; // e.g. "text-[8px]" or "text-[7px]"
  bgClass?: string; // fallback background color if no logo is found, e.g. "bg-blue-600"
  className?: string;
}

const LOGO_MAP: Record<string, string> = {
  DKT: "/dkt-logo.png",
  ETHJKT: "/ethjkt-logo.png",
};

export default function TokenIcon({
  symbol,
  logoUrl,
  size = "w-5 h-5",
  textClass = "text-[8px]",
  bgClass = "bg-blue-600",
  className = "",
}: TokenIconProps) {
  const finalLogo = logoUrl || LOGO_MAP[symbol.toUpperCase()];

  if (finalLogo) {
    return (
      <div className={`${size} rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${className}`}>
        <img src={finalLogo} alt={symbol} className="w-full h-full object-cover" />
      </div>
    );
  }

  // Fallback placeholder
  return (
    <div className={`${size} rounded-full ${bgClass} flex items-center justify-center font-bold text-white flex-shrink-0 ${textClass} ${className}`}>
      {symbol ? symbol.slice(0, 1).toUpperCase() : "?"}
    </div>
  );
}
