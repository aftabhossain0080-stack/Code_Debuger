export type SupportedLanguage = 'Python' | 'JavaScript' | 'Java' | 'C++' | 'C' | 'Other';

export interface DebugResponse {
  hasError: boolean;
  errorType: string | null;
  errorLine: number | null;
  errorMessage: string | null;
  explanation: string;
  correctedCode: string;
  modelUsed?: string;
  model_used?: string;
  error_type?: string;
  severity?: string;
  what_happened?: string;
  why_it_happened?: string;
  how_to_fix?: string;
  suggested_solution?: string;
  before_code?: string;
  after_code?: string;
  confidence?: string;
}

export type GeminiErrorResponse = DebugResponse;

export interface ErrorExplanation {
  hasError?: boolean;
  errorType: string;
  errorLine?: number | null;
  errorMessage?: string | null;
  language: SupportedLanguage;
  severity: 'Error' | 'Critical' | 'Warning' | 'Success' | string;
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
