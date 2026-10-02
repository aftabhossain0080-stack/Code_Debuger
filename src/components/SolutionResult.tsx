import React, { useState } from 'react';
import { ErrorExplanation } from '../types';
import { generateMarkdownReport, downloadFile, getFileExtension } from '../utils/export';
import {
  Check,
  Copy,
  AlertCircle,
  Info,
  ShieldCheck,
  CheckCircle2,
  FileCode,
  Download,
  Bookmark,
  FileText,
  Sparkles,
} from 'lucide-react';

interface SolutionResultProps {
  explanation: ErrorExplanation;
  rawError?: string;
  isSaved?: boolean;
  onToggleSave?: () => void;
}

export const SolutionResult: React.FC<SolutionResultProps> = ({
  explanation,
  rawError = '',
  isSaved = false,
  onToggleSave,
}) => {
  const [copied, setCopied] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(explanation.solution.after);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const filename = `DEVFIX_${explanation.errorType}_Report.md`;
    const md = generateMarkdownReport(rawError, explanation);
    downloadFile(filename, md, 'text/markdown');
  };

  const handleDownloadCode = () => {
    const ext = getFileExtension(explanation.language);
    const filename = `fix_${explanation.errorType.toLowerCase()}.${ext}`;
    downloadFile(filename, explanation.solution.after, 'text/plain');
  };

  const handleSaveClick = () => {
    if (onToggleSave) {
      onToggleSave();
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
    }
  };

  // Severity styling
  const isClean = explanation.hasError === false || explanation.severity.toLowerCase().includes('success');
  const severityBadgeColor = isClean
    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    : explanation.severity.toLowerCase().includes('critical') || explanation.severity.toLowerCase().includes('fatal')
    ? 'bg-red-500/15 text-red-300 border-red-500/30'
    : explanation.severity.toLowerCase().includes('warning')
    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    : 'bg-rose-500/15 text-rose-300 border-rose-500/30';

  return (
    <div className="w-full bg-[#12151b] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl shadow-black/60 transition-all">
      
      {/* Top Header with Badges: Error Type, Programming Language, Severity, AI Confidence */}
      <div className="p-4 sm:p-5 border-b border-zinc-800 bg-[#0e1015] flex flex-wrap items-center justify-between gap-3">
        {/* Left: Badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
          {/* Error Type */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800/90 border border-zinc-700/80 text-zinc-200">
            <span className="text-zinc-500 font-sans font-medium">Error Type:</span>
            <span className="font-semibold text-emerald-400">{explanation.errorType}</span>
          </div>

          {/* Programming Language */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800/90 border border-zinc-700/80 text-zinc-200">
            <span className="text-zinc-500 font-sans font-medium">Programming Language:</span>
            <span className="font-semibold text-zinc-100">{explanation.language}</span>
          </div>

          {/* Severity */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border font-medium ${severityBadgeColor}`}>
            <span className="text-zinc-400 font-sans">Severity:</span>
            <span className="font-semibold">{explanation.severity}</span>
          </div>
        </div>

        {/* Right: AI Engine & Confidence */}
        <div className="flex items-center flex-wrap gap-2">
          {explanation.modelUsed && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live: <strong className="text-white font-semibold">{explanation.modelUsed}</strong></span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Confidence: <strong className="text-white font-semibold">{explanation.confidence || 'High'}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Content: Four Compact Sections */}
      <div className="p-4 sm:p-6 space-y-5">
        
        {/* Section 1: WHAT HAPPENED? */}
        <div className="bg-[#0e1016] border border-zinc-800/90 rounded-lg p-4 transition-all hover:border-zinc-700">
          <div className="flex items-center gap-2 text-xs font-bold font-mono tracking-wider uppercase text-emerald-400 mb-2">
            <AlertCircle className="w-4 h-4 text-emerald-400" />
            <span>1. WHAT HAPPENED?</span>
          </div>
          <p className="text-sm sm:text-base text-zinc-200 font-normal leading-relaxed pl-6">
            "{explanation.whatHappened}"
          </p>
        </div>

        {/* Section 2: WHY DID IT HAPPEN? */}
        <div className="bg-[#0e1016] border border-zinc-800/90 rounded-lg p-4 transition-all hover:border-zinc-700">
          <div className="flex items-center gap-2 text-xs font-bold font-mono tracking-wider uppercase text-emerald-400 mb-2">
            <Info className="w-4 h-4 text-emerald-400" />
            <span>2. WHY DID IT HAPPEN?</span>
          </div>
          <p className="text-sm sm:text-base text-zinc-200 font-normal leading-relaxed pl-6">
            "{explanation.whyDidItHappen}"
          </p>
        </div>

        {/* Section 3: HOW CAN I FIX IT? */}
        <div className="bg-[#0e1016] border border-zinc-800/90 rounded-lg p-4 transition-all hover:border-zinc-700">
          <div className="flex items-center gap-2 text-xs font-bold font-mono tracking-wider uppercase text-emerald-400 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>3. HOW CAN I FIX IT?</span>
          </div>
          <p className="text-sm sm:text-base text-zinc-200 font-normal leading-relaxed pl-6">
            "{explanation.howCanIFixIt}"
          </p>
        </div>

        {/* Section 4: SUGGESTED SOLUTION */}
        <div className="bg-[#0c0e14] border border-emerald-500/30 rounded-lg p-4 sm:p-5 shadow-lg shadow-black/40">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 text-xs font-bold font-mono tracking-wider uppercase text-emerald-400">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>4. SUGGESTED SOLUTION</span>
            </div>

            {/* Action Buttons: Save Fix, Export Files, Copy */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Save to In-App Library */}
              {onToggleSave && (
                <button
                  type="button"
                  onClick={handleSaveClick}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                    isSaved
                      ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                      : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white border-zinc-700'
                  }`}
                  title="Bookmark and save to Saved Files"
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'text-amber-400 fill-amber-400/20' : 'text-zinc-400'}`} />
                  <span>{savedFeedback ? 'Saved!' : isSaved ? 'Saved in Library' : 'Save Fix'}</span>
                </button>
              )}

              {/* Download Markdown Report */}
              <button
                type="button"
                onClick={handleDownloadMarkdown}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
                title="Download full Markdown report"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Save .md File</span>
                <span className="sm:hidden">.md</span>
              </button>

              {/* Download Code File */}
              <button
                type="button"
                onClick={handleDownloadCode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
                title={`Download fixed code as .${getFileExtension(explanation.language)} file`}
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Save Code File</span>
                <span className="sm:hidden">.{getFileExtension(explanation.language)}</span>
              </button>

              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
                title="Copy corrected code"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {explanation.suggestedSolutionSummary && (
            <p className="text-xs text-zinc-400 mb-3 font-mono">
              // {explanation.suggestedSolutionSummary}
            </p>
          )}

          {/* Before & After Code Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Before Code Panel */}
            <div className={`flex flex-col bg-[#07090c] border rounded-lg overflow-hidden ${isClean ? 'border-zinc-800' : 'border-red-500/25'}`}>
              <div className={`px-3 py-1.5 border-b flex items-center justify-between text-[11px] font-mono ${isClean ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300' : 'bg-red-950/30 border-red-500/20 text-red-400'}`}>
                <span className="font-semibold uppercase tracking-wider">{isClean ? 'Original' : 'Before'}</span>
                <span className="text-zinc-500">{isClean ? 'Input Code' : 'Problematic Code'}</span>
              </div>
              <div className={`p-3 font-mono text-xs sm:text-sm overflow-x-auto whitespace-pre leading-relaxed ${isClean ? 'text-zinc-200' : 'text-red-200/90'}`}>
                <code>{explanation.solution.before}</code>
              </div>
            </div>

            {/* After Code Panel */}
            <div className="flex flex-col bg-[#07090c] border border-emerald-500/40 rounded-lg overflow-hidden shadow-sm shadow-emerald-950/20">
              <div className="px-3 py-1.5 bg-emerald-950/30 border-b border-emerald-500/30 flex items-center justify-between text-[11px] font-mono">
                <span className="text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {isClean ? 'Verified Runnable Code' : 'Corrected Code'}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[10px] text-emerald-400/90 hover:text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 cursor-pointer transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
              <div className="p-3 font-mono text-xs sm:text-sm text-emerald-200 overflow-x-auto whitespace-pre leading-relaxed">
                <code>{explanation.solution.after}</code>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
