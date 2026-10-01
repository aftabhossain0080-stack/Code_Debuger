import React, { useState } from 'react';
import { HistoryItem, SavedFixItem } from '../types';
import { generateMarkdownReport, downloadFile, getFileExtension } from '../utils/export';
import {
  X,
  Clock,
  Bookmark,
  Download,
  Trash2,
  FileText,
  Code2,
  ArrowUpRight,
  Check,
  Copy,
} from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'history' | 'saved';
  onSelectTab: (tab: 'history' | 'saved') => void;
  history: HistoryItem[];
  savedFiles: SavedFixItem[];
  onSelectHistoryItem: (item: HistoryItem) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearHistory: () => void;
  onToggleSaveHistory: (item: HistoryItem) => void;
  onDeleteSavedFile: (id: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  history,
  savedFiles,
  onSelectHistoryItem,
  onDeleteHistoryItem,
  onClearHistory,
  onToggleSaveHistory,
  onDeleteSavedFile,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleDownloadMarkdown = (item: SavedFixItem) => {
    const md = generateMarkdownReport(item.rawError, item.explanation);
    downloadFile(item.filename, md, 'text/markdown');
  };

  const handleDownloadCode = (item: SavedFixItem) => {
    const ext = getFileExtension(item.language);
    const filename = `fix_${item.errorType.toLowerCase()}.${ext}`;
    downloadFile(filename, item.explanation.solution.after, 'text/plain');
  };

  const formatTime = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md sm:max-w-lg bg-[#0e1117] border-l border-zinc-800 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#0b0d12]">
          <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={() => onSelectTab('history')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>History ({history.length})</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('saved')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                activeTab === 'saved'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved Files ({savedFiles.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'history' ? (
            /* History Tab */
            history.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Clock className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-zinc-300 mb-1">No Diagnostic History Yet</h4>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  When you analyze coding errors, they will automatically be saved here for quick reference.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-1 text-xs text-zinc-500 font-mono">
                  <span>Recent diagnoses ({history.length})</span>
                  <button
                    type="button"
                    onClick={onClearHistory}
                    className="text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                </div>

                {history.map((item) => {
                  const isSaved = savedFiles.some((f) => f.id === item.id);
                  return (
                    <div
                      key={item.id}
                      className="bg-[#12151c] border border-zinc-800/90 rounded-lg p-3.5 hover:border-zinc-700 transition-all group"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-emerald-400">
                            {item.explanation.errorType}
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                            {item.language}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-500 font-mono">
                          {formatTime(item.timestamp)}
                        </span>
                      </div>

                      <p className="text-xs font-mono text-zinc-400 line-clamp-2 bg-[#090b0e] p-2 rounded mb-2.5 border border-zinc-900">
                        {item.rawError}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectHistoryItem(item);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                        >
                          <span>Load Fix</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onToggleSaveHistory(item)}
                            title={isSaved ? 'Saved in library' : 'Save to library'}
                            className={`p-1.5 rounded transition-colors cursor-pointer ${
                              isSaved
                                ? 'text-amber-400 bg-amber-950/40 border border-amber-500/30'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                            }`}
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteHistoryItem(item.id)}
                            title="Delete this history entry"
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )
          ) : (
            /* Saved Files Tab */
            savedFiles.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Bookmark className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-zinc-300 mb-1">No Saved Files Yet</h4>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  Click "Save to File" or bookmark any error solution to access your offline reports and code fixes here.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-1 text-xs text-zinc-500 font-mono">
                  <span>Saved Fix Reports ({savedFiles.length})</span>
                </div>

                {savedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="bg-[#12151c] border border-zinc-800/90 rounded-lg p-3.5 hover:border-zinc-700 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <span className="font-mono text-xs font-semibold text-zinc-200">
                          {file.filename}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {file.language}
                      </span>
                    </div>

                    <div className="bg-[#090b0e] p-2.5 rounded border border-zinc-900 text-xs font-mono text-emerald-300 overflow-x-auto">
                      <code>{file.explanation.solution.after}</code>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDownloadMarkdown(file)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
                          title="Download Markdown Report"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                          <span>.md Report</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadCode(file)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
                          title="Download Code File"
                        >
                          <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>.{getFileExtension(file.language)}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(file.id, file.explanation.solution.after)}
                          className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Copy Code"
                        >
                          {copiedId === file.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteSavedFile(file.id)}
                          className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Delete saved file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )
          )}
        </div>

      </div>
    </div>
  );
};
