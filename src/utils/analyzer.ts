import { ErrorExplanation, GeminiErrorResponse, SupportedLanguage } from '../types';
import { FALLBACK_EXPLANATIONS } from '../data/presets';

export async function explainErrorWithGemini(
  error: string,
  language: SupportedLanguage
): Promise<{ explanation: ErrorExplanation; isFallback: boolean; errorMessage?: string }> {
  const trimmed = error.trim();
  if (!trimmed) {
    throw new Error('Please enter a coding error first.');
  }

  try {
    const res = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: trimmed, language }),
    });

    if (res.ok) {
      const data: GeminiErrorResponse = await res.json();
      if (data && data.what_happened) {
        return {
          explanation: {
            errorType: data.error_type || 'UnknownError',
            language,
            severity: (data.severity as any) || 'Error',
            whatHappened: data.what_happened,
            whyDidItHappen: data.why_it_happened,
            howCanIFixIt: data.how_to_fix,
            suggestedSolutionSummary: data.suggested_solution,
            solution: {
              before: data.before_code || '// Problematic line',
              after: data.after_code || '// Corrected line',
            },
            confidence: data.confidence || 'High',
            modelUsed: data.model_used,
          },
          isFallback: false,
        };
      }
    }

    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Server could not analyze error.');
  } catch (err: any) {
    console.warn('API Explain call failed, using high-precision fallback engine:', err);
    // Use fallback engine
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

  // Common heuristics
  const lower = trimmed.toLowerCase();

  // NameError (e.g. pd, np, etc.)
  if (lower.includes('nameerror') || lower.includes('is not defined')) {
    const match = trimmed.match(/name ['"]?([a-zA-Z0-9_]+)['"]? is not defined/i);
    const identifier = match ? match[1] : 'identifier';
    const isLibrary = ['pd', 'np', 'plt', 'tf', 'torch', 'math'].includes(identifier);

    return {
      errorType: 'NameError',
      language,
      severity: 'Error',
      whatHappened: `Python encountered the identifier '${identifier}', but it has not been defined in the current scope.`,
      whyDidItHappen: isLibrary
        ? `You called '${identifier}' assuming the library was imported, but the import statement was missing.`
        : `The variable '${identifier}' was referenced before being assigned or was misspelled.`,
      howCanIFixIt: isLibrary
        ? `Add 'import ${identifier === 'pd' ? 'pandas as pd' : identifier === 'np' ? 'numpy as np' : identifier}' at the top of the file.`
        : `Define '${identifier}' before referencing it, or verify the spelling.`,
      suggestedSolutionSummary: `Import or declare '${identifier}' before usage.`,
      solution: {
        before: `${identifier}.process()`,
        after: `${isLibrary ? `import ${identifier === 'pd' ? 'pandas as pd' : identifier}\n\n` : `const ${identifier} = defaultValue;\n`}${identifier}.process()`,
      },
      confidence: 'High',
    };
  }

  // TypeError: Cannot read properties of undefined
  if (lower.includes('cannot read properties of undefined') || lower.includes('cannot read property') || lower.includes('undefined (reading')) {
    const propMatch = trimmed.match(/reading ['"]?([a-zA-Z0-9_$]+)['"]?/i) || trimmed.match(/of undefined \(reading '([^']+)'\)/i);
    const propName = propMatch ? propMatch[1] : 'name';

    return {
      errorType: 'TypeError',
      language,
      severity: 'Error',
      whatHappened: `You tried to access a property ('${propName}') from a value that is undefined.`,
      whyDidItHappen: `The object you expected to contain the property was not initialized, returned undefined from an API/function, or does not exist.`,
      howCanIFixIt: `Check that the object exists before accessing its property, or use optional chaining (?.).`,
      suggestedSolutionSummary: `Use optional chaining to guard property dereference.`,
      solution: {
        before: `user.profile.${propName}`,
        after: `user?.profile?.${propName}`,
      },
      confidence: 'High',
    };
  }

  // IndexError
  if (lower.includes('indexerror') || lower.includes('out of range')) {
    return {
      errorType: 'IndexError',
      language,
      severity: 'Error',
      whatHappened: `You attempted to access an item at an index outside the valid range of the sequence.`,
      whyDidItHappen: `The specified index is greater than or equal to the length of the list, or the list is empty.`,
      howCanIFixIt: `Verify the list is non-empty and that the index is strictly less than len(list).`,
      suggestedSolutionSummary: `Check the collection length before indexing.`,
      solution: {
        before: `val = items[0]`,
        after: `val = items[0] if len(items) > 0 else None`,
      },
      confidence: 'High',
    };
  }

  // KeyError
  if (lower.includes('keyerror')) {
    const keyMatch = trimmed.match(/KeyError:\s*['"]?([^'"\n\r]+)['"]?/i);
    const keyName = keyMatch ? keyMatch[1] : 'key';

    return {
      errorType: 'KeyError',
      language,
      severity: 'Error',
      whatHappened: `You tried to access key '${keyName}' in a dictionary, but that key does not exist.`,
      whyDidItHappen: `Direct bracket lookup raises a KeyError when the key was never inserted or is misspelled.`,
      howCanIFixIt: `Use dict.get('${keyName}', fallback) to retrieve values safely with a default.`,
      suggestedSolutionSummary: `Use the dictionary .get() method with a default value.`,
      solution: {
        before: `value = data['${keyName}']`,
        after: `value = data.get('${keyName}', None)`,
      },
      confidence: 'High',
    };
  }

  // General heuristic
  let extractedType = 'RuntimeError';
  const typeMatch = trimmed.match(/([A-Z][a-zA-Z0-9_]*(?:Error|Exception|Fault|Warning|Failure))/);
  if (typeMatch) {
    extractedType = typeMatch[1];
  }

  return {
    errorType: extractedType,
    language,
    severity: lower.includes('fatal') || lower.includes('segfault') ? 'Critical' : 'Error',
    whatHappened: `The runtime encountered an unhandled ${extractedType} during execution.`,
    whyDidItHappen: `An invalid state or unexpected value violated ${language}'s execution rules.`,
    howCanIFixIt: `Validate inputs, ensure all variables and modules are declared, and add defensive error handling.`,
    suggestedSolutionSummary: `Apply defensive guards and verify input state.`,
    solution: {
      before: `// Failing code statement:\n${trimmed.slice(0, 50)}...`,
      after: `// Defensive implementation with safety checks:\ntry {\n  // safe operations\n} catch (err) {\n  console.error("Safely caught:", err);\n}`,
    },
    confidence: 'High',
  };
}
