import React from 'react';
import { Cpu, Zap } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="text-center pt-8 pb-6 sm:pt-12 sm:pb-8 max-w-4xl mx-auto px-4">
      {/* Top subtle badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-4">
        <Zap className="w-3.5 h-3.5 text-emerald-400" />
        <span>Instant AI Stack Trace & Syntax Explainer</span>
      </div>

      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3 sm:mb-4">
        Turn Coding Errors Into{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-300">
          Understandable Solutions
        </span>
      </h1>

      <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
        Paste an error, select the language, and understand what happened, why it happened, and how to fix it.
      </p>
    </section>
  );
};
