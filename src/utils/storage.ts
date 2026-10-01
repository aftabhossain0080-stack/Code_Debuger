import { HistoryItem, SavedFixItem } from '../types';

const HISTORY_KEY = 'devfix_error_history_v1';
const SAVED_FILES_KEY = 'devfix_saved_files_v1';

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 50)));
  } catch (err) {
    console.error('Failed to save history:', err);
  }
}

export function loadSavedFiles(): SavedFixItem[] {
  try {
    const raw = localStorage.getItem(SAVED_FILES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveSavedFiles(items: SavedFixItem[]): void {
  try {
    localStorage.setItem(SAVED_FILES_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save files:', err);
  }
}
