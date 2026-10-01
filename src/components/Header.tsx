import React from 'react';
import { Terminal, Github, Moon, Sparkles, Clock, Bookmark } from 'lucide-react';

interface HeaderProps {
  themeMode: 'charcoal' | 'midnight';
  onToggleTheme: () => void;
  historyCount: number;
  savedCount: number;
  onOpenDrawer: (tab: 'history' | 'saved') => void;
}

export const Header: React.FC<HeaderProps> = ({
  themeMode,
  onToggleTheme,
  historyCount,
  savedCount,
  onOpenDrawer,
}) => {
  return (
    <header className="w-full border-b border-zinc-800/80 bg-[#0d0f14]/90 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-900 border border-emerald-500/40 shadow-sm shadow-emerald-950/40 group">
            <Terminal className="w-5 h-5 text-emerald-400 group-hover:scale-105 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0d0f14] animate-pulse" />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2.5">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1 font-mono">
              DEV<span className="text-emerald-400">FIX</span>
              <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-emerald-400/90 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded ml-1">
                AI MVP
              </span>
            </span>
            <span className="hidden lg:inline-block text-xs text-zinc-400 font-medium">
              Turn coding errors into understandable solutions.
            </span>
          </div>
        </div>

        {/* Right side controls: History + Saved Files + GitHub + Theme */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* History Button */}
          <button
            type="button"
            onClick={() => onOpenDrawer('history')}
            title="View Diagnostic History"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-mono font-medium text-zinc-300 bg-zinc-900/90 hover:bg-zinc-800 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                {historyCount}
              </span>
            )}
          </button>

          {/* Saved Files Button */}
          <button
            type="button"
            onClick={() => onOpenDrawer('saved')}
            title="View Saved Files and Bug Reports"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-mono font-medium text-zinc-300 bg-zinc-900/90 hover:bg-zinc-800 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400/80" />
            <span className="hidden sm:inline">Saved Files</span>
            <span className="sm:hidden">Saved</span>
            {savedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-amber-950 text-amber-400 border border-amber-800/80">
                {savedCount}
              </span>
            )}
          </button>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            title="View DEVFIX on GitHub"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-300 bg-zinc-900/90 hover:bg-zinc-800 hover:text-white border border-zinc-800 transition-colors"
          >
            <Github className="w-4 h-4 text-zinc-400" />
            <span>GitHub</span>
          </a>

          <button
            onClick={onToggleTheme}
            type="button"
            title={`Switch to ${themeMode === 'charcoal' ? 'Midnight Void' : 'Charcoal'} Dark Theme`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-300 bg-zinc-900/90 hover:bg-zinc-800 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
          >
            {themeMode === 'charcoal' ? (
              <Moon className="w-4 h-4 text-emerald-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-emerald-300" />
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
