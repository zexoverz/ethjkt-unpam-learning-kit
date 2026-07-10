import { ConnectButton } from "@rainbow-me/rainbowkit";

interface NavbarProps {
  setTab: (tab: string) => void;
}

export default function Navbar({ setTab }: NavbarProps) {
  return (
    <nav className="border-b border-zinc-800 bg-[#121214] px-4 md:px-6 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      {/* Brand Logo & Name */}
      <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setTab("swap")}>
        <div className="relative flex items-center justify-center w-9 h-9 rounded-md overflow-hidden border border-zinc-800 transition-colors duration-200">
          <img src="/dika-swap.png" alt="DikaSwap Logo" className="w-full h-full object-contain" />
        </div>
        <span className="text-lg font-bold tracking-tight text-[#FAFAFA]">
          DikaSwap
        </span>
      </div>

      {/* Connect Button */}
      <div>
        <ConnectButton chainStatus="icon" showBalance={false} />
      </div>
    </nav>
  );
}
