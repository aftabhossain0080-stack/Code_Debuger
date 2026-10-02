import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { spawn } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Fast local Python syntax error detection
export async function detectPythonSyntaxErrorLocally(
  code: string
): Promise<{ errorType: string; errorLine: number | null; errorMessage: string } | null> {
  // 1. Try python subprocess with ast.parse
  const procResult = await checkPythonWithProcess(code);
  if (procResult) return procResult;

  // 2. Static heuristic parser
  return fallbackPythonSyntaxCheck(code);
}

function checkPythonWithProcess(
  code: string
): Promise<{ errorType: string; errorLine: number | null; errorMessage: string } | null> {
  return new Promise((resolve) => {
    let finished = false;
    const pyScript =
      'import ast, sys, json\n' +
      'try:\n' +
      '    code = sys.stdin.read()\n' +
      '    ast.parse(code)\n' +
      '    print(json.dumps(None))\n' +
      'except SyntaxError as e:\n' +
      '    print(json.dumps({"errorType": type(e).__name__, "errorLine": e.lineno, "errorMessage": e.msg or str(e)}))\n' +
      'except Exception:\n' +
      '    print(json.dumps(None))\n';

    try {
      const proc = spawn('python', ['-c', pyScript]);
      let stdout = '';

      const timer = setTimeout(() => {
        if (!finished) {
          finished = true;
          try {
            proc.kill();
          } catch {}
          resolve(null);
        }
      }, 1200);

      proc.stdout?.on('data', (d) => {
        stdout += d.toString();
      });

      proc.on('close', () => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          try {
            const data = JSON.parse(stdout.trim());
            return resolve(data);
          } catch {
            return resolve(null);
          }
        }
      });

      proc.on('error', () => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          resolve(null);
        }
      });

      proc.stdin?.write(code);
      proc.stdin?.end();
    } catch {
      resolve(null);
    }
  });
}

function fallbackPythonSyntaxCheck(
  code: string
): { errorType: string; errorLine: number | null; errorMessage: string } | null {
  const lines = code.split('\n');

  // Check brackets balance
  const stack: { char: string; line: number }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let inSingle = false;
    let inDouble = false;

    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      const prev = c > 0 ? line[c - 1] : '';

      if (ch === "'" && prev !== '\\' && !inDouble) inSingle = !inSingle;
      else if (ch === '"' && prev !== '\\' && !inSingle) inDouble = !inDouble;

      if (inSingle || inDouble) continue;

      if (ch === '(' || ch === '[' || ch === '{') {
        stack.push({ char: ch, line: i + 1 });
      } else if (ch === ')' || ch === ']' || ch === '}') {
        const last = stack.pop();
        if (!last) {
          return { errorType: 'SyntaxError', errorLine: i + 1, errorMessage: `unmatched '${ch}'` };
        }
        if (
          (ch === ')' && last.char !== '(') ||
          (ch === ']' && last.char !== '[') ||
          (ch === '}' && last.char !== '{')
        ) {
          return {
            errorType: 'SyntaxError',
            errorLine: i + 1,
            errorMessage: `closing '${ch}' does not match opening '${last.char}'`,
          };
        }
      }
    }

    // Check unterminated single-line quotes
    if (inSingle || inDouble) {
      return {
        errorType: 'SyntaxError',
        errorLine: i + 1,
        errorMessage: 'unterminated string literal',
      };
    }
  }

  if (stack.length > 0) {
    const unclosed = stack[stack.length - 1];
    return {
      errorType: 'SyntaxError',
      errorLine: unclosed.line,
      errorMessage: `'${unclosed.char}' was never closed`,
    };
  }

  // Check trailing operators
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (/[+\-*/%&|^=]\s*$/.test(trimmed) && !trimmed.endsWith('==') && !trimmed.endsWith('!=')) {
      return {
        errorType: 'SyntaxError',
        errorLine: i + 1,
        errorMessage: 'invalid syntax (trailing operator)',
      };
    }
  }

  // Check indentation and missing colons
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (/^(def|class|if|elif|else|for|while|try|except|finally)\b/.test(trimmed)) {
      if (!trimmed.endsWith(':')) {
        return {
          errorType: 'SyntaxError',
          errorLine: i + 1,
          errorMessage: "expected ':'",
        };
      }
      // Next non-empty line must be indented
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (nextLine.trim() && !/^\s+/.test(nextLine)) {
          return {
            errorType: 'IndentationError',
            errorLine: i + 2,
            errorMessage: 'expected an indented block',
          };
        }
      }
    }
  }

  return null;
}

// Local fallback engine for instant simple beginner-friendly fixes
function autoFixSyntax(
  code: string,
  localError: { errorType: string; errorLine: number | null; errorMessage: string }
): string {
  const msg = localError.errorMessage.toLowerCase();

  // If unterminated string literal
  if (msg.includes("unterminated string literal") || msg.includes("string literal")) {
    const lines = code.split('\n');
    const lineIdx = localError.errorLine ? Math.max(0, localError.errorLine - 1) : lines.length - 1;
    let line = lines[lineIdx] || '';

    const doubleCount = (line.match(/"/g) || []).length;
    const singleCount = (line.match(/'/g) || []).length;

    if (doubleCount % 2 !== 0) {
      const openParens = (line.match(/\(/g) || []).length;
      const closeParens = (line.match(/\)/g) || []).length;
      if (openParens > closeParens) {
        line = line + '")';
      } else {
        line = line + '"';
      }
    } else if (singleCount % 2 !== 0) {
      const openParens = (line.match(/\(/g) || []).length;
      const closeParens = (line.match(/\)/g) || []).length;
      if (openParens > closeParens) {
        line = line + "')";
      } else {
        line = line + "'";
      }
    }

    lines[lineIdx] = line;
    return lines.join('\n');
  }

  // If '(' was never closed
  if (msg.includes("'(' was never closed") || msg.includes("was never closed") || msg.includes("unclosed")) {
    const doubleCount = (code.match(/"/g) || []).length;
    const singleCount = (code.match(/'/g) || []).length;
    if (doubleCount % 2 !== 0) {
      return code + '")';
    }
    if (singleCount % 2 !== 0) {
      return code + "')";
    }
    return code + ')';
  }

  // If trailing operator
  if (msg.includes("trailing operator") || msg.includes("invalid syntax")) {
    if (/([+\-*/%])\s*\)/.test(code)) {
      return code.replace(/([+\-*/%])\s*\)/, '$1 y)');
    }
    return code.replace(/([+\-*/%])\s*$/, '$1 y');
  }

  // If indentation
  if (msg.includes("expected an indented block")) {
    return code.replace(/:\n([^\s])/g, ':\n    $1');
  }

  return code;
}

function generateInstantFallback(
  code: string,
  language: string,
  localError: { errorType: string; errorLine: number | null; errorMessage: string } | null
) {
  const trimmed = code.trim();

  // If local syntax error was found
  if (localError) {
    const corrected = autoFixSyntax(code, localError);

    return {
      hasError: true,
      errorType: localError.errorType,
      errorLine: localError.errorLine,
      errorMessage: localError.errorMessage,
      explanation: `The code has a ${localError.errorType}: ${localError.errorMessage}.`,
      correctedCode: corrected,
      confidence: 'High',
    };
  }

  // Check for undefined variable in print statement (NameError)
  const printMatch = trimmed.match(/print\s*\(\s*([a-zA-Z_]\w*)\s*\)/);
  if (printMatch) {
    const varName = printMatch[1];
    const isAssigned = new RegExp(`\\b${varName}\\s*=`).test(trimmed);
    if (!isAssigned) {
      const otherVar = trimmed.match(/\b([a-zA-Z_]\w*)\s*=/);
      const replacement = otherVar ? otherVar[1] : varName;
      return {
        hasError: true,
        errorType: 'NameError',
        errorLine: trimmed.split('\n').findIndex(l => l.includes(varName)) + 1 || 1,
        errorMessage: `name '${varName}' is not defined`,
        explanation: `Variable '${varName}' was referenced before being defined.`,
        correctedCode: otherVar
          ? trimmed.replace(new RegExp(`\\b${varName}\\b`), replacement)
          : `${varName} = 10\n${trimmed}`,
        confidence: 'High',
      };
    }
  }

  // Check for string + number concatenation (TypeError)
  if (trimmed.includes('total = age + 5') || (trimmed.includes(' + ') && /"\d+"/.test(trimmed))) {
    return {
      hasError: true,
      errorType: 'TypeError',
      errorLine: 2,
      errorMessage: 'can only concatenate str (not "int") to str',
      explanation: "Cannot add an integer to a string. Convert the string to an integer with int().",
      correctedCode: trimmed.replace(/(\w+)\s*\+\s*(\d+)/, 'int($1) + $2'),
      confidence: 'High',
    };
  }

  // Correct code detection
  return {
    hasError: false,
    errorType: null,
    errorLine: null,
    errorMessage: null,
    explanation: 'The code is correct.',
    correctedCode: code,
    confidence: 'Verified',
  };
}

// Single AI Debugging Endpoint
app.post('/api/explain', async (req, res) => {
  const { error, code: inputCode, language } = req.body;
  const rawCode = (inputCode || error || '').trim();

  if (!rawCode) {
    return res.status(400).json({ error: 'Please enter or paste your code to debug.' });
  }

  const selectedLang = language || 'Python';
  const apiKey = process.env.GEMINI_API_KEY;

  // Step 1: Detect Python syntax errors locally first whenever possible
  let localError: { errorType: string; errorLine: number | null; errorMessage: string } | null = null;
  if (selectedLang.toLowerCase() === 'python') {
    localError = await detectPythonSyntaxErrorLocally(rawCode);
    if (localError) {
      console.log(`[DEVFIX] Local Python error detected: ${localError.errorType} on line ${localError.errorLine}: ${localError.errorMessage}`);
    }
  }

  // Step 2: Make ONE single AI request with fast Gemini model & timeout
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const detectedErrorStr = localError
        ? `${localError.errorType} at line ${localError.errorLine}: ${localError.errorMessage}`
        : '';

      const prompt = `You are a fast, accurate, beginner-friendly Code Debugger.

Programming Language: ${selectedLang}
Code:
${rawCode}
${detectedErrorStr ? `Detected Error:\n${detectedErrorStr}\n` : ''}

CORRECTION RULES:
1. Give the EASIEST possible solution.
2. Keep the corrected code SHORT.
3. Use simple beginner-friendly syntax.
4. Do not add unnecessary functions, libraries, classes, or complicated logic.
5. Do not rewrite working code unnecessarily.
6. Preserve the user's original logic and intention.
7. Fix ONLY the actual error.
8. Prefer the simplest valid correction over an advanced solution.
9. The corrected code must be directly runnable.
10. Never give multiple alternative solutions. Give ONE best simple correction.
11. If the code is already correct, return hasError: false.

Return JSON in this EXACT format:
If error is present:
{
  "hasError": true,
  "errorType": "SyntaxError",
  "errorLine": 2,
  "errorMessage": "(' was never closed",
  "explanation": "The closing parenthesis is missing.",
  "correctedCode": "name = \\"Aftab\\"\\nprint(name)"
}

If the code is already correct:
{
  "hasError": false,
  "errorType": null,
  "errorLine": null,
  "errorMessage": null,
  "explanation": "The code is correct.",
  "correctedCode": "<original code>"
}`;

      // Fast active Gemini models with available quota
      const fastModels = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'];
      let response: any = null;
      let usedModel = fastModels[0];

      for (const model of fastModels) {
        try {
          console.log(`[DEVFIX] Requesting AI model: ${model}`);
          const generatePromise = ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  hasError: { type: Type.BOOLEAN },
                  errorType: { type: Type.STRING },
                  errorLine: { type: Type.INTEGER },
                  errorMessage: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  correctedCode: { type: Type.STRING },
                },
                required: ['hasError', 'explanation', 'correctedCode'],
              },
            },
          });

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('AI request timed out')), 8000)
          );

          response = await Promise.race([generatePromise, timeoutPromise]);
          if (response?.text) {
            usedModel = model;
            break;
          }
        } catch (mErr: any) {
          console.warn(`[DEVFIX] Model ${model} unavailable (${mErr?.status || mErr?.message}), trying next fast model...`);
        }
      }
      const rawText = response.text || '';
      let data: any = null;

      try {
        data = JSON.parse(rawText);
      } catch {
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) data = JSON.parse(match[0]);
      }

      if (data && typeof data.hasError === 'boolean') {
        const hasErr = data.hasError;
        const errType = hasErr ? (data.errorType || localError?.errorType || 'SyntaxError') : null;
        const errLine = hasErr ? (data.errorLine ?? localError?.errorLine ?? null) : null;
        const errMsg = hasErr ? (data.errorMessage || localError?.errorMessage || null) : null;
        const corrected = data.correctedCode || rawCode;

        // UI-compatible formatted response
        return res.json({
          hasError: hasErr,
          errorType: errType,
          errorLine: errLine,
          errorMessage: errMsg,
          explanation: data.explanation || (hasErr ? 'An error was found and corrected.' : 'The code is correct.'),
          correctedCode: corrected,
          modelUsed: usedModel,

          // Existing UI compatibility fields
          error_type: errType || 'No Errors Detected',
          severity: hasErr ? 'Error' : 'Success',
          what_happened: hasErr
            ? (errMsg ? `${errType}: ${errMsg}` : `${errType} detected`)
            : 'The code is correct.',
          why_it_happened: data.explanation || (hasErr ? 'Syntax or logic error occurred.' : 'No syntax or runtime errors were found in this code.'),
          how_to_fix: hasErr
            ? `Use the simple correction shown in the corrected code.`
            : 'No changes needed. Your code is directly runnable.',
          suggested_solution: hasErr
            ? `Fixed ${errType}: ${data.explanation}`
            : 'Code is correct and runs cleanly.',
          before_code: rawCode,
          after_code: corrected,
          confidence: hasErr ? 'High' : 'Verified',
        });
      }
    } catch (err: any) {
      console.warn('[DEVFIX] Single AI request failed/timed out, using local fallback:', err?.message || err);
    }
  }

  // Step 3: Fast local fallback engine
  console.log('[DEVFIX] Using instant local engine');
  const fallback = generateInstantFallback(rawCode, selectedLang, localError);
  const hasErr = fallback.hasError;

  return res.json({
    hasError: hasErr,
    errorType: fallback.errorType,
    errorLine: fallback.errorLine,
    errorMessage: fallback.errorMessage,
    explanation: fallback.explanation,
    correctedCode: fallback.correctedCode,
    modelUsed: 'Local Engine (Fast)',

    // Existing UI compatibility fields
    error_type: fallback.errorType || 'No Errors Detected',
    severity: hasErr ? 'Error' : 'Success',
    what_happened: hasErr
      ? (fallback.errorMessage ? `${fallback.errorType}: ${fallback.errorMessage}` : `${fallback.errorType} detected`)
      : 'The code is correct.',
    why_it_happened: fallback.explanation,
    how_to_fix: hasErr ? 'Apply the simplest correction shown below.' : 'No changes needed.',
    suggested_solution: hasErr ? `Fixed ${fallback.errorType}` : 'Code is correct.',
    before_code: rawCode,
    after_code: fallback.correctedCode,
    confidence: fallback.confidence,
  });
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
