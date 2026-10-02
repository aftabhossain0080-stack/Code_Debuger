import { ErrorExplanation, DebugResponse, SupportedLanguage } from '../types';
import { FALLBACK_EXPLANATIONS } from '../data/presets';

export async function explainErrorWithGemini(
  codeOrError: string,
  language: SupportedLanguage
): Promise<{ explanation: ErrorExplanation; isFallback: boolean; errorMessage?: string }> {
  const trimmed = codeOrError.trim();
  if (!trimmed) {
    throw new Error('Please enter or paste your code first.');
  }

  try {
    const res = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: trimmed, code: trimmed, language }),
    });

    if (res.ok) {
      const data: DebugResponse = await res.json();
      if (data) {
        const hasErr = data.hasError !== false;
        const errType = hasErr ? (data.errorType || data.error_type || 'SyntaxError') : 'No Errors Detected';
        const errLine = data.errorLine ?? null;
        const errMsg = data.errorMessage || null;

        const whatHappened = hasErr
          ? (errMsg
              ? (errLine ? `${errType} on line ${errLine} — ${errMsg}` : `${errType} — ${errMsg}`)
              : (data.what_happened || `${errType} detected.`))
          : 'The code is correct.';

        const whyDidItHappen = data.explanation || data.why_it_happened || (hasErr ? 'Syntax or logic error occurred.' : 'No syntax or runtime errors were found in this code.');
        const howCanIFixIt = data.how_to_fix || (hasErr
          ? (errLine ? `Fix the ${errType.toLowerCase()} on line ${errLine} as shown in the corrected code.` : 'Update the code as shown in the corrected code.')
          : 'No changes needed. Your code is directly runnable.');

        const beforeCode = data.before_code || trimmed;
        const afterCode = data.correctedCode || data.after_code || trimmed;

        return {
          explanation: {
            hasError: hasErr,
            errorType: errType,
            errorLine: errLine,
            errorMessage: errMsg,
            language,
            severity: hasErr ? 'Error' : 'Success',
            whatHappened,
            whyDidItHappen,
            howCanIFixIt,
            suggestedSolutionSummary: data.suggested_solution || (hasErr ? `Fixed ${errType}` : 'Code is correct and runs cleanly.'),
            solution: {
              before: beforeCode,
              after: afterCode,
            },
            confidence: data.confidence || (hasErr ? 'High' : 'Verified'),
            modelUsed: data.modelUsed || data.model_used,
          },
          isFallback: false,
        };
      }
    }

    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Server could not analyze code.');
  } catch (err: any) {
    console.warn('API call failed or offline, using high-speed local engine:', err);
    const fallback = getLocalExplanation(trimmed, language);
    return {
      explanation: fallback,
      isFallback: true,
      errorMessage: err?.message || 'Using local diagnostic engine (Gemini API offline)',
    };
  }
}

export function getLocalExplanation(rawInput: string, language: SupportedLanguage): ErrorExplanation {
  const trimmed = rawInput.trim();

  // Check demo presets first
  if (FALLBACK_EXPLANATIONS[trimmed]) {
    return FALLBACK_EXPLANATIONS[trimmed];
  }

  // Check brackets balance
  const lines = trimmed.split('\n');
  const stack: { char: string; line: number }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '(' || ch === '[' || ch === '{') {
        stack.push({ char: ch, line: i + 1 });
      } else if (ch === ')' || ch === ']' || ch === '}') {
        const last = stack.pop();
        if (!last || ((ch === ')' && last.char !== '(') || (ch === ']' && last.char !== '[') || (ch === '}' && last.char !== '{'))) {
          return {
            hasError: true,
            errorType: 'SyntaxError',
            errorLine: i + 1,
            errorMessage: `unmatched '${ch}'`,
            language,
            severity: 'Error',
            whatHappened: `SyntaxError — unmatched '${ch}'.`,
            whyDidItHappen: `Closing parenthesis '${ch}' does not match any open parenthesis.`,
            howCanIFixIt: `Remove or fix the extra '${ch}'.`,
            suggestedSolutionSummary: `Fixed unmatched parenthesis.`,
            solution: {
              before: trimmed,
              after: trimmed.slice(0, -1),
            },
            confidence: 'High',
          };
        }
      }
    }
  }

  if (stack.length > 0) {
    const unclosed = stack[stack.length - 1];
    const matchClose = unclosed.char === '(' ? ')' : unclosed.char === '[' ? ']' : '}';
    return {
      hasError: true,
      errorType: 'SyntaxError',
      errorLine: unclosed.line,
      errorMessage: `'${unclosed.char}' was never closed`,
      language,
      severity: 'Error',
      whatHappened: `SyntaxError — '${unclosed.char}' was never closed.`,
      whyDidItHappen: `The closing '${matchClose}' is missing.`,
      howCanIFixIt: `Add the closing '${matchClose}'.`,
      suggestedSolutionSummary: `Added closing '${matchClose}'.`,
      solution: {
        before: trimmed,
        after: `${trimmed}${matchClose}`,
      },
      confidence: 'High',
    };
  }

  // Check trailing operators
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (/[+\-*/%&|^=]\s*$/.test(l) && !l.endsWith('==') && !l.endsWith('!=')) {
      return {
        hasError: true,
        errorType: 'SyntaxError',
        errorLine: i + 1,
        errorMessage: 'invalid syntax (trailing operator)',
        language,
        severity: 'Error',
        whatHappened: 'SyntaxError — invalid syntax with incomplete operator.',
        whyDidItHappen: 'The operator at the end of the line requires a second value.',
        howCanIFixIt: 'Provide the operand or complete the expression.',
        suggestedSolutionSummary: 'Completed operator expression.',
        solution: {
          before: trimmed,
          after: trimmed.replace(/([+\-*/%])\s*$/, '$1 y'),
        },
        confidence: 'High',
      };
    }
  }

  // Check NameError heuristics
  const lower = trimmed.toLowerCase();
  if (lower.includes('nameerror') || lower.includes('is not defined')) {
    const match = trimmed.match(/name ['"]?([a-zA-Z0-9_]+)['"]? is not defined/i);
    const identifier = match ? match[1] : 'x';
    return {
      hasError: true,
      errorType: 'NameError',
      errorLine: 1,
      errorMessage: `name '${identifier}' is not defined`,
      language,
      severity: 'Error',
      whatHappened: `NameError — name '${identifier}' is not defined.`,
      whyDidItHappen: `Variable '${identifier}' was referenced before being defined.`,
      howCanIFixIt: `Define '${identifier}' before referencing it.`,
      suggestedSolutionSummary: `Defined variable '${identifier}'.`,
      solution: {
        before: trimmed,
        after: `${identifier} = "value"\n${trimmed}`,
      },
      confidence: 'High',
    };
  }

  // Check TypeError heuristics
  if (lower.includes('typeerror')) {
    return {
      hasError: true,
      errorType: 'TypeError',
      errorLine: 1,
      errorMessage: 'Type mismatch in operation',
      language,
      severity: 'Error',
      whatHappened: 'TypeError — incompatible data types used together.',
      whyDidItHappen: 'An operation was attempted on incompatible types.',
      howCanIFixIt: 'Convert types so both operands match.',
      suggestedSolutionSummary: 'Fixed type mismatch with conversion.',
      solution: {
        before: trimmed,
        after: trimmed,
      },
      confidence: 'High',
    };
  }

  // Default: code is correct or clean
  return {
    hasError: false,
    errorType: 'No Errors Detected',
    errorLine: null,
    errorMessage: null,
    language,
    severity: 'Success',
    whatHappened: 'The code is correct.',
    whyDidItHappen: 'No syntax or runtime errors were found in this code.',
    howCanIFixIt: 'No changes needed. Your code is directly runnable.',
    suggestedSolutionSummary: 'Code is correct.',
    solution: {
      before: trimmed,
      after: trimmed,
    },
    confidence: 'Verified',
  };
}
