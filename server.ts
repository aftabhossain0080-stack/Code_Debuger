import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// High-fidelity fallback catalog for standard errors
function generateFallbackResponse(error: string, language: string) {
  const lower = error.toLowerCase();

  // JavaScript: Cannot read properties of undefined
  if (lower.includes('cannot read properties of undefined') || lower.includes("cannot read property") || lower.includes("undefined (reading")) {
    const propMatch = error.match(/reading ['"]?([a-zA-Z0-9_$]+)['"]?/i) || error.match(/of undefined \(reading '([^']+)'\)/i);
    const prop = propMatch ? propMatch[1] : 'name';
    return {
      error_type: 'TypeError',
      severity: 'Error',
      what_happened: `You tried to access a property ('${prop}') from an object reference that is currently undefined.`,
      why_it_happened: `The object you expected to contain '${prop}' was not initialized, returned undefined from an async call, or does not exist.`,
      how_to_fix: `Check that the object exists before accessing its property, or use optional chaining (?.) with a default value.`,
      suggested_solution: `Use optional chaining (?.) and nullish coalescing (??) to guard property access and provide a safe fallback value.`,
      before_code: `// Problematic: Accessing nested property on uninitialized object
const user = undefined;

// This line throws: TypeError: Cannot read properties of undefined (reading '${prop}')
console.log(user.profile.${prop});`,
      after_code: `// Full corrected code with optional chaining & default fallback:
const user = undefined;

// Optional chaining (?.) safely short-circuits to undefined instead of crashing
const user${prop.charAt(0).toUpperCase() + prop.slice(1)} = user?.profile?.${prop} ?? 'Default Value';

console.log('User ${prop}:', user${prop.charAt(0).toUpperCase() + prop.slice(1)});`,
      confidence: 'High',
    };
  }

  // Python: NameError (e.g. pd)
  if (lower.includes('nameerror') || (lower.includes('name') && lower.includes('is not defined'))) {
    const match = error.match(/name ['"]?([a-zA-Z0-9_]+)['"]? is not defined/i);
    const id = match ? match[1] : 'pd';
    const isPd = id === 'pd';
    return {
      error_type: 'NameError',
      severity: 'Error',
      what_happened: `Python encountered the identifier '${id}', but it has not been defined or imported in this script.`,
      why_it_happened: isPd
        ? `You called Pandas via '${id}', but forgot to import the package first.`
        : `Variable '${id}' was accessed before declaration or was misspelled.`,
      how_to_fix: isPd
        ? `Add 'import pandas as pd' at the very top of your file.`
        : `Declare or import '${id}' before referencing it.`,
      suggested_solution: isPd ? `Import pandas with the alias pd and initialize data.` : `Declare or assign ${id} before referencing it.`,
      before_code: isPd
        ? `# Problematic: Using pandas without importing it
data = {'id': [1, 2], 'name': ['Alice', 'Bob']}

# This throws NameError: name 'pd' is not defined
df = pd.DataFrame(data)
print(df)`
        : `# Problematic: Referencing variable before initialization
result = ${id}.process_data()
print(result)`,
      after_code: isPd
        ? `# Full corrected working code:
import pandas as pd

# Sample structured data
data = {
    'id': [1, 2, 3],
    'name': ['Alice', 'Bob', 'Charlie']
}

# Successfully create DataFrame using imported pandas alias
df = pd.DataFrame(data)
print(df.head())`
        : `# Full corrected code:
class Handler:
    def process_data(self):
        return "Processed successfully"

# Initialize variable before calling its methods
${id} = Handler()
result = ${id}.process_data()
print(result)`,
      confidence: 'High',
    };
  }

  // Python: IndexError
  if (lower.includes('indexerror') || lower.includes('out of range')) {
    return {
      error_type: 'IndexError',
      severity: 'Error',
      what_happened: `You attempted to access an item at an index outside the boundaries of the list.`,
      why_it_happened: `The requested index is greater than or equal to the total length of the list, or the list is empty.`,
      how_to_fix: `Verify that the list is not empty and that the index is within range: 0 <= index < len(list).`,
      suggested_solution: `Add a boundary length check or check if the list contains elements before indexing.`,
      before_code: `# Problematic: Direct index access on list without boundary check
numbers = [10, 20, 30]

# Accessing index 5 causes IndexError: list index out of range
target = numbers[5]
print(target)`,
      after_code: `# Full corrected code with boundary check and fallback:
numbers = [10, 20, 30]
target_index = 5

# Safe boundary check before accessing
if 0 <= target_index < len(numbers):
    target = numbers[target_index]
    print(f"Found element at index {target_index}: {target}")
else:
    print(f"Index {target_index} is out of bounds. Valid range: 0 to {len(numbers) - 1}.")`,
      confidence: 'High',
    };
  }

  // Python: KeyError
  if (lower.includes('keyerror')) {
    const match = error.match(/KeyError:\s*['"]?([^'"\n\r]+)['"]?/i);
    const key = match ? match[1] : 'age';
    return {
      error_type: 'KeyError',
      severity: 'Error',
      what_happened: `You tried to access key '${key}' in a dictionary, but that key does not exist.`,
      why_it_happened: `Direct bracket indexing user['${key}'] throws a KeyError when the key has not been added.`,
      how_to_fix: `Use the dictionary .get('${key}', default_value) method to safely retrieve it.`,
      suggested_solution: `Use dict.get() with a default fallback to prevent KeyError when keys are missing.`,
      before_code: `# Problematic: Direct bracket access on missing dictionary key
user_profile = {
    'username': 'coder123',
    'email': 'coder@example.com'
}

# Raises KeyError: '${key}'
user_value = user_profile['${key}']
print(user_value)`,
      after_code: `# Full corrected code with dict.get() and default value:
user_profile = {
    'username': 'coder123',
    'email': 'coder@example.com'
}

# Safely access key; returns fallback value if key does not exist
user_value = user_profile.get('${key}', 'Not provided')
print(f"User ${key}: {user_value}")`,
      confidence: 'High',
    };
  }

  // Generic fallback
  let extractedType = 'RuntimeError';
  const typeMatch = error.match(/([A-Z][a-zA-Z0-9_]*(?:Error|Exception|Fault|Warning|Failure))/);
  if (typeMatch) {
    extractedType = typeMatch[1];
  }

  return {
    error_type: extractedType,
    severity: 'Error',
    what_happened: `The runtime encountered an unhandled ${extractedType} during execution.`,
    why_it_happened: `An unexpected state or missing contract violated execution rules in ${language}.`,
    how_to_fix: `Verify variable values, check for missing imports or uninitialized variables, and add error handling.`,
    suggested_solution: `Add defensive validation and comprehensive try/catch boundaries to safely handle errors.`,
    before_code: `// Problematic code that triggers ${extractedType}:
function executeTask(payload) {
  // Unvalidated operation
  return payload.process();
}

executeTask(null);`,
    after_code: `// Full corrected code with defensive guards & error handling:
function executeTask(payload) {
  try {
    // 1. Validate payload existence
    if (!payload || typeof payload.process !== 'function') {
      console.warn("Invalid payload supplied; aborting safely.");
      return null;
    }

    // 2. Safely execute task
    return payload.process();
  } catch (err) {
    console.error("Safely handled runtime exception:", err);
    return null;
  }
}

// Works cleanly without crashing
const result = executeTask({ process: () => "Task Completed Successfully!" });
console.log(result);`,
    confidence: 'High',
  };
}

// API route to explain errors using Gemini API with intelligent fallback
app.post('/api/explain', async (req, res) => {
  const { error, language } = req.body;

  if (!error || typeof error !== 'string' || !error.trim()) {
    return res.status(400).json({ error: 'Please enter a valid coding error message.' });
  }

  const selectedLang = language || 'General Programming';
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are DEVFIX, an elite AI developer tool and coding error explainer powered by Google Gemini.
A developer submitted this coding error in ${selectedLang}:

=== ERROR MESSAGE ===
${error.trim()}
====================

Target Programming Language: ${selectedLang}

Analyze this error with maximum technical accuracy and return structured JSON.

CRITICAL INSTRUCTIONS FOR CODE GENERATION:
1. "after_code" MUST BE THE FULL, COMPLETE, COPY-PASTEABLE, FULLY WORKING CORRECTED CODE.
   - Do NOT provide just a single line, snippet, or placeholder (e.g. NEVER write "// ... rest of code").
   - Provide the complete, realistic script or function with all necessary imports, full variable declarations, input mock/setup, defensive checks, and helpful inline comments explaining the fix.
   - The developer should be able to copy the entire "after_code" directly and run it successfully without any syntax or missing-variable errors.
2. "before_code" MUST BE A COMPLETE CODE SNIPPET showing the realistic context where the bug happens.
   - Show how variables were set up or omitted and the exact offending line that throws this error.
3. "suggested_solution" MUST BE A CLEAR, CONCISE SUMMARY (1-2 sentences) explaining the exact code change made in "after_code".
4. "what_happened", "why_it_happened", and "how_to_fix" must each be 1-2 plain-English, beginner-friendly sentences.

Required JSON Structure:
- "error_type": Short standard error name (e.g. "TypeError", "NameError", "SyntaxError", "KeyError", "IndexError", "ReferenceError", "NullPointerException")
- "severity": Must be one of "Error", "Critical", or "Warning"
- "what_happened": Explain the error in 1-2 simple, plain-English sentences understandable to beginners.
- "why_it_happened": Explain the precise technical cause in 1-2 concise sentences.
- "how_to_fix": Give actionable, practical step-by-step guidance on how to fix it in 1-2 sentences.
- "suggested_solution": A clear explanation of what was changed in the full corrected code.
- "before_code": Realistic complete code snippet demonstrating the bug or vulnerable line causing this error.
- "after_code": Full, complete, runnable corrected code snippet fixing the issue.
- "confidence": "High" (or "Very High", "Medium")`;

    // Try available models in order of responsiveness & stability
    const modelsToTry = [
      'gemini-3.5-flash',
      'gemini-3.7-flash',
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-3.6-flash',
      'gemini-3.8-flash',
    ];

    for (const model of modelsToTry) {
      try {
        console.log(`[DEVFIX] Analyzing error with Gemini model: ${model}`);
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                error_type: { type: Type.STRING },
                severity: { type: Type.STRING },
                what_happened: { type: Type.STRING },
                why_it_happened: { type: Type.STRING },
                how_to_fix: { type: Type.STRING },
                suggested_solution: { type: Type.STRING },
                before_code: { type: Type.STRING },
                after_code: { type: Type.STRING },
                confidence: { type: Type.STRING },
              },
              required: [
                'error_type',
                'severity',
                'what_happened',
                'why_it_happened',
                'how_to_fix',
                'before_code',
                'after_code',
                'confidence',
              ],
            },
          },
        });

        const rawText = response.text || '';
        let data: any = null;
        try {
          data = JSON.parse(rawText);
        } catch {
          const match = rawText.match(/\{[\s\S]*\}/);
          if (match) {
            data = JSON.parse(match[0]);
          }
        }

        if (data && data.what_happened) {
          console.log(`[DEVFIX] Live Gemini response generated using ${model}`);
          return res.json({
            ...data,
            model_used: model,
          });
        }
      } catch (err: any) {
        console.warn(`[DEVFIX] Model ${model} attempt failed:`, err?.message || err);
      }
    }
  }

  // Graceful fallback: Never crash or leave the user empty-handed
  console.log('[DEVFIX] Using fallback catalog');
  const fallback = generateFallbackResponse(error.trim(), selectedLang);
  return res.json(fallback);
});

// Vite Middleware for development
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('index.html', { root: 'dist' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Network: http://127.0.0.1:${PORT}/\n`);
  });
}

startServer();
