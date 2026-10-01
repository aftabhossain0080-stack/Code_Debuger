import React from 'react';
import { Terminal, Shield, Zap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-zinc-800/80 bg-[#0d0f14] py-6 mt-12 text-zinc-500 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Left: Status indicator */}
        <div className="flex items-center gap-2 font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-zinc-400">All Diagnostic Services Operational</span>
          <span className="text-zinc-700">|</span>
          <span className="text-zinc-500">Inference ~42ms</span>
        </div>

        {/* Right: Brand and copyright */}
        <div className="flex items-center gap-4 text-zinc-500 font-mono text-[11px]">
          <span>CODE DEBUG MVP</span>
          <span>•</span>
          <span>Zero Telemetry</span>
          <span>•</span>
          <span className="text-emerald-400/80">Developer Edition</span>
        </div>

      </div>
    </footer>
  );
};
