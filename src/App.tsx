/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ErrorInput } from './components/ErrorInput';
import { SolutionResult } from './components/SolutionResult';
import { Footer } from './components/Footer';
import { HistoryDrawer } from './components/HistoryDrawer';
import { DEMO_EXAMPLES, FALLBACK_EXPLANATIONS } from './data/presets';
import { SupportedLanguage, ErrorExplanation, HistoryItem, SavedFixItem } from './types';
import { explainErrorWithGemini } from './utils/analyzer';
import {
  loadHistory,
  saveHistory,
  loadSavedFiles,
  saveSavedFiles,
} from './utils/storage';
import { getFileExtension } from './utils/export';

const INITIAL_CODE = 'name = "Aftab"\nprint(name';

export default function App() {
  const [themeMode, setThemeMode] = useState<'charcoal' | 'midnight'>('charcoal');
  const [errorText, setErrorText] = useState<string>(INITIAL_CODE);
  const [language, setLanguage] = useState<SupportedLanguage>('Python');
  const [explanation, setExplanation] = useState<ErrorExplanation | null>(
    FALLBACK_EXPLANATIONS[INITIAL_CODE] || null
  );
  const [selectedDemoId, setSelectedDemoId] = useState<string>('py-missing-bracket');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');
  const [apiNotice, setApiNotice] = useState<string | null>(null);

  // History & Saved Files State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [savedFiles, setSavedFiles] = useState<SavedFixItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<'history' | 'saved'>('history');

  // Load from localStorage on mount
  useEffect(() => {
    const loadedHist = loadHistory();
    const loadedSaved = loadSavedFiles();

    // If history is completely empty, seed with initial diagnostic demo
    if (loadedHist.length === 0 && FALLBACK_EXPLANATIONS[INITIAL_CODE]) {
      const initialItem: HistoryItem = {
        id: 'init-demo-1',
        timestamp: Date.now() - 60000,
        rawError: INITIAL_CODE,
        language: 'Python',
        explanation: FALLBACK_EXPLANATIONS[INITIAL_CODE],
      };
      setHistory([initialItem]);
      saveHistory([initialItem]);
    } else {
      setHistory(loadedHist);
    }

    setSavedFiles(loadedSaved);
  }, []);

  // Toggle Theme mode
  const handleToggleTheme = () => {
    setThemeMode((prev) => (prev === 'charcoal' ? 'midnight' : 'charcoal'));
  };

  // Open Drawer to specific tab
  const handleOpenDrawer = (tab: 'history' | 'saved') => {
    setDrawerTab(tab);
    setIsDrawerOpen(true);
  };

  // Handle Demo Example selection
  const handleSelectDemo = (demoId: string) => {
    const demo = DEMO_EXAMPLES.find((d) => d.id === demoId);
    if (demo) {
      setSelectedDemoId(demoId);
      setErrorText(demo.error);
      setLanguage(demo.language);
      setValidationError('');
      setApiNotice(null);

      // Preload fallback explanation if available
      if (FALLBACK_EXPLANATIONS[demo.error]) {
        setExplanation(FALLBACK_EXPLANATIONS[demo.error]);
      }
    }
  };

  // Handle Explain Error submission
  const handleExplain = async () => {
    const trimmed = errorText.trim();
    if (!trimmed) {
      setValidationError('Please enter or paste a coding error first.');
      return;
    }

    setValidationError('');
    setApiNotice(null);
    setIsAnalyzing(true);

    try {
      const result = await explainErrorWithGemini(trimmed, language);
      setExplanation(result.explanation);
      if (result.isFallback && result.errorMessage) {
        setApiNotice(result.errorMessage);
      }

      // Automatically add to diagnostic History
      const newHistoryItem: HistoryItem = {
        id: `diag-${Date.now()}`,
        timestamp: Date.now(),
        rawError: trimmed,
        language,
        explanation: result.explanation,
      };

      const updatedHistory = [newHistoryItem, ...history.filter(h => h.rawError !== trimmed)].slice(0, 50);
      setHistory(updatedHistory);
      saveHistory(updatedHistory);

      // Smooth scroll to solution
      setTimeout(() => {
        const solutionEl = document.getElementById('solution-section');
        if (solutionEl) {
          solutionEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 50);
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to explain error.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle select item from history
  const handleSelectHistoryItem = (item: HistoryItem) => {
    setErrorText(item.rawError);
    setLanguage(item.language);
    setExplanation(item.explanation);
    setSelectedDemoId('');
    setValidationError('');
    setApiNotice(null);

    setTimeout(() => {
      const solutionEl = document.getElementById('solution-section');
      if (solutionEl) {
        solutionEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
  };

  // Delete history item
  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    saveHistory(updated);
  };

  // Clear all history
  const handleClearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  // Toggle Save current explanation or history item to Saved Files
  const handleToggleSaveCurrent = () => {
    if (!explanation) return;

    const existingIndex = savedFiles.findIndex(
      (f) => f.rawError === errorText.trim() || f.errorType === explanation.errorType
    );

    if (existingIndex >= 0) {
      // Remove from saved
      const updated = savedFiles.filter((_, idx) => idx !== existingIndex);
      setSavedFiles(updated);
      saveSavedFiles(updated);
    } else {
      // Add to saved
      const ext = getFileExtension(language);
      const newSavedItem: SavedFixItem = {
        id: `saved-${Date.now()}`,
        savedAt: Date.now(),
        title: `${explanation.errorType} Fix (${language})`,
        filename: `DEVFIX_${explanation.errorType}_Report.md`,
        language,
        errorType: explanation.errorType,
        rawError: errorText,
        explanation,
      };
      const updated = [newSavedItem, ...savedFiles];
      setSavedFiles(updated);
      saveSavedFiles(updated);
    }
  };

  // Toggle Save from History item
  const handleToggleSaveHistory = (item: HistoryItem) => {
    const exists = savedFiles.some((f) => f.id === item.id || f.rawError === item.rawError);
    if (exists) {
      const updated = savedFiles.filter((f) => f.id !== item.id && f.rawError !== item.rawError);
      setSavedFiles(updated);
      saveSavedFiles(updated);
    } else {
      const newSavedItem: SavedFixItem = {
        id: item.id,
        savedAt: Date.now(),
        title: `${item.explanation.errorType} Fix (${item.language})`,
        filename: `DEVFIX_${item.explanation.errorType}_Report.md`,
        language: item.language,
        errorType: item.explanation.errorType,
        rawError: item.rawError,
        explanation: item.explanation,
      };
      const updated = [newSavedItem, ...savedFiles];
      setSavedFiles(updated);
      saveSavedFiles(updated);
    }
  };

  // Delete saved file
  const handleDeleteSavedFile = (id: string) => {
    const updated = savedFiles.filter((f) => f.id !== id);
    setSavedFiles(updated);
    saveSavedFiles(updated);
  };

  const isCurrentSaved = !!(
    explanation &&
    savedFiles.some(
      (f) => f.rawError === errorText.trim() || f.errorType === explanation.errorType
    )
  );

  // Background styling classes based on themeMode
  const bgClass =
    themeMode === 'midnight'
      ? 'bg-[#07080a] text-zinc-100'
      : 'bg-[#0c0e12] text-zinc-100';

  return (
    <div className={`min-h-screen flex flex-col ${bgClass} transition-colors duration-200 selection:bg-emerald-500/25 selection:text-emerald-200`}>
      
      {/* Subtle background glow effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/10 blur-[130px] rounded-full" />
        <div className="absolute top-96 right-10 w-[400px] h-[300px] bg-teal-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <Header
        themeMode={themeMode}
        onToggleTheme={handleToggleTheme}
        historyCount={history.length}
        savedCount={savedFiles.length}
        onOpenDrawer={handleOpenDrawer}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 relative z-10 space-y-8 pb-12">
        {/* Hero */}
        <Hero />

        {/* Error Input Card */}
        <section aria-label="Error Input Card">
          <ErrorInput
            errorText={errorText}
            onChangeErrorText={(text) => {
              setErrorText(text);
              setSelectedDemoId('');
              if (validationError) setValidationError('');
            }}
            language={language}
            onChangeLanguage={(newLang) => {
              setLanguage(newLang);
              setSelectedDemoId('');
            }}
            onSubmit={handleExplain}
            isAnalyzing={isAnalyzing}
            onSelectDemo={handleSelectDemo}
            selectedDemoId={selectedDemoId}
            validationError={validationError}
          />
        </section>

        {/* API Notice / Fallback indicator if any */}
        {apiNotice && (
          <div className="px-4 py-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-400 font-mono flex items-center justify-between">
            <span>Notice: {apiNotice}</span>
            <span className="text-emerald-400">Fallback engine active</span>
          </div>
        )}

        {/* AI Result Section */}
        {explanation && (
          <section id="solution-section" aria-label="Result Section" className="pt-2">
            <SolutionResult
              explanation={explanation}
              rawError={errorText}
              isSaved={isCurrentSaved}
              onToggleSave={handleToggleSaveCurrent}
            />
          </section>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Slide-over Drawer for History & Saved Files */}
      <HistoryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={drawerTab}
        onSelectTab={setDrawerTab}
        history={history}
        savedFiles={savedFiles}
        onSelectHistoryItem={handleSelectHistoryItem}
        onDeleteHistoryItem={handleDeleteHistoryItem}
        onClearHistory={handleClearHistory}
        onToggleSaveHistory={handleToggleSaveHistory}
        onDeleteSavedFile={handleDeleteSavedFile}
      />

    </div>
  );
}
