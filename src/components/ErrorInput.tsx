import React, { useMemo } from 'react';
import { SupportedLanguage } from '../types';
import { DEMO_EXAMPLES } from '../data/presets';
import { Terminal, Copy, Trash2, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

interface ErrorInputProps {
  errorText: string;
  onChangeErrorText: (text: string) => void;
  language: SupportedLanguage;
  onChangeLanguage: (lang: SupportedLanguage) => void;
  onSubmit: () => void;
  isAnalyzing: boolean;
  onSelectDemo: (demoId: string) => void;
  selectedDemoId?: string;
  validationError?: string;
}

const LANGUAGES: SupportedLanguage[] = [
  'Python',
  'JavaScript',
  'Java',
  'C++',
  'C',
  'Other',
];

export const ErrorInput: React.FC<ErrorInputProps> = ({
  errorText,
  onChangeErrorText,
  language,
  onChangeLanguage,
  onSubmit,
  isAnalyzing,
  onSelectDemo,
  selectedDemoId,
  validationError,
}) => {
  // Compute line numbers
  const lineCount = useMemo(() => {
    return Math.max(errorText.split('\n').length, 4);
  }, [errorText]);

  const handlePasteSample = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChangeErrorText(text);
      }
    } catch {
      // Fallback
    }
  };

  const handleClear = () => {
    onChangeErrorText('');
  };

  return (
    <div className="w-full bg-[#12151b] border border-zinc-800/90 rounded-xl overflow-hidden shadow-2xl shadow-black/60 transition-all hover:border-zinc-700/80">
      
      {/* Editor Header Bar */}
      <div className="bg-[#0e1015] px-4 py-2.5 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Window controls & Label */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-3 h-3 rounded-full bg-red-500/80 border border-red-600/40 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-600/40 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600/40 inline-block" />
          </div>

          <div className="h-4 w-[1px] bg-zinc-800 hidden sm:block" />

          <label htmlFor="error-textarea" className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 font-mono">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            Paste your error
          </label>
        </div>

        {/* Right: Quick actions (Clear & Paste) */}
        <div className="flex items-center gap-2">
          {errorText && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isAnalyzing}
              className="text-xs text-zinc-400 hover:text-red-400 flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-800/60 transition-colors cursor-pointer disabled:opacity-50"
              title="Clear input"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePasteSample}
            disabled={isAnalyzing}
            className="text-xs text-zinc-400 hover:text-emerald-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-800/60 transition-colors cursor-pointer disabled:opacity-50"
            title="Paste from clipboard"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Paste</span>
          </button>
        </div>
      </div>

      {/* Editor Body with Line Numbers */}
      <div className="relative flex bg-[#0c0e12] min-h-[160px] sm:min-h-[190px]">
        {/* Line numbers gutter */}
        <div 
          aria-hidden="true" 
          className="select-none py-3.5 pl-3 pr-2.5 text-right font-mono text-xs text-zinc-600 bg-[#0a0c10] border-r border-zinc-900 w-10 sm:w-12 leading-relaxed"
        >
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i} className="leading-6">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Large code-editor-style textarea */}
        <div className="flex-1 relative">
          <textarea
            id="error-textarea"
            value={errorText}
            onChange={(e) => onChangeErrorText(e.target.value)}
            disabled={isAnalyzing}
            placeholder={`name = "Aftab"\nprint(name`}
            className="w-full h-full min-h-[160px] sm:min-h-[190px] p-3.5 bg-transparent font-mono text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 outline-none resize-y leading-6 border-0 focus:ring-0 disabled:opacity-60"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Validation Warning if empty */}
      {validationError && (
        <div className="px-4 py-2 bg-red-950/40 border-t border-red-500/30 flex items-center gap-2 text-xs text-red-300 font-mono">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Demo Examples Selector Bar */}
      <div className="px-4 py-2.5 bg-[#0e1117] border-t border-zinc-800/60 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-zinc-500 font-medium shrink-0 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Demo Examples:
        </span>
        <div className="flex items-center gap-1.5 flex-nowrap">
          {DEMO_EXAMPLES.map((demo) => {
            const isActive = selectedDemoId === demo.id;
            return (
              <button
                key={demo.id}
                type="button"
                onClick={() => onSelectDemo(demo.id)}
                disabled={isAnalyzing}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                    : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-700/60'
                }`}
              >
                {demo.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Control Footer: Language Dropdown + Primary Button */}
      <div className="p-4 bg-[#0e1015] border-t border-zinc-800/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Language dropdown */}
        <div className="flex items-center gap-2.5">
          <label htmlFor="language-select" className="text-xs font-medium text-zinc-400 shrink-0">
            Language:
          </label>
          <div className="relative">
            <select
              id="language-select"
              value={language}
              onChange={(e) => onChangeLanguage(e.target.value as SupportedLanguage)}
              disabled={isAnalyzing}
              className="appearance-none bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-emerald-500 text-zinc-200 text-xs sm:text-sm font-medium py-2 pl-3 pr-8 rounded-lg outline-none cursor-pointer transition-colors disabled:opacity-60"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang} className="bg-zinc-900 text-zinc-200">
                  {lang}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
              <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Primary button */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={isAnalyzing}
          className="relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm sm:text-base text-zinc-950 bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
        >
          {isAnalyzing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-zinc-950" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Analyzing error...</span>
            </>
          ) : (
            <>
              <span>Explain Error →</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
};
