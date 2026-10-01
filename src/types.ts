export type SupportedLanguage = 'JavaScript' | 'Python' | 'Java' | 'C++' | 'C' | 'Other';

export interface GeminiErrorResponse {
  error_type: string;
  severity: string;
  what_happened: string;
  why_it_happened: string;
  how_to_fix: string;
  suggested_solution?: string;
  before_code: string;
  after_code: string;
  confidence: string;
  model_used?: string;
}

export interface ErrorExplanation {
  errorType: string;
  language: SupportedLanguage;
  severity: 'Error' | 'Critical' | 'Warning' | string;
  whatHappened: string;
  whyDidItHappen: string;
  howCanIFixIt: string;
  suggestedSolutionSummary?: string;
  solution: {
    before: string;
    after: string;
  };
  confidence: string;
  modelUsed?: string;
}

export interface DemoExample {
  id: string;
  label: string;
  language: SupportedLanguage;
  error: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  rawError: string;
  language: SupportedLanguage;
  explanation: ErrorExplanation;
  isSaved?: boolean;
}

export interface SavedFixItem {
  id: string;
  savedAt: number;
  title: string;
  filename: string;
  language: SupportedLanguage;
  errorType: string;
  rawError: string;
  explanation: ErrorExplanation;
}
