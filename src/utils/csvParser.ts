import { ColumnMeta, ColumnType, DatasetStats, ProcessedDataset } from '../types/dataset';

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const MISSING_IDENTIFIERS = new Set([
  '',
  'null',
  'none',
  'na',
  'n/a',
  'nan',
  'undefined',
  '?',
  '-',
  '#n/a',
]);

export function isMissingValue(val: unknown): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val === 'string') {
    return MISSING_IDENTIFIERS.has(val.trim().toLowerCase());
  }
  return false;
}

// RFC 4180 compliant CSV parser
export function parseRawCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  const len = csvText.length;
  for (let i = 0; i < len; i++) {
    const char = csvText[i];
    const nextChar = i + 1 < len ? csvText[i + 1] : '';

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++; // skip next quote
        } else {
          // Closing quote
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField);
        currentField = '';
        if (currentRow.some((field) => field.trim() !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else if (char === '\n') {
        currentRow.push(currentField);
        currentField = '';
        if (currentRow.some((field) => field.trim() !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentField += char;
      }
    }
  }

  // Final field & row
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((field) => field.trim() !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function inferColumnType(values: (string | number | boolean | null)[]): ColumnType {
  const nonNulls = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (nonNulls.length === 0) return 'categorical';

  let numericCount = 0;
  let booleanCount = 0;
  let dateCount = 0;

  for (const val of nonNulls) {
    const str = String(val).trim();

    // Check boolean
    if (['true', 'false', '0', '1', 'yes', 'no'].includes(str.toLowerCase())) {
      booleanCount++;
    }

    // Check numeric
    if (!isNaN(Number(str)) && str !== '') {
      numericCount++;
    } else {
      // Check date format: YYYY-MM-DD or MM/DD/YYYY or similar
      const parsedDate = Date.parse(str);
      if (!isNaN(parsedDate) && (str.includes('-') || str.includes('/')) && str.length >= 8) {
        dateCount++;
      }
    }
  }

  const threshold = nonNulls.length * 0.85;

  if (numericCount >= threshold) return 'numeric';
  if (booleanCount >= threshold) return 'boolean';
  if (dateCount >= threshold) return 'date';
  return 'categorical';
}

export function processCSV(
  csvContent: string,
  filename: string,
  fileSize: number
): ProcessedDataset {
  const trimmed = csvContent.trim();
  if (!trimmed) {
    throw new Error('The uploaded CSV file is empty. Please provide a file with data rows.');
  }

  const rawRows = parseRawCSV(csvContent);
  if (rawRows.length === 0) {
    throw new Error('No valid tabular rows could be parsed from the CSV file.');
  }

  if (rawRows.length === 1) {
    throw new Error('The CSV contains header names but no data rows to analyze.');
  }

  // Headers
  const rawHeaders = rawRows[0];
  const headers = rawHeaders.map((h, i) => {
    const clean = h.trim();
    return clean ? clean : `Column_${i + 1}`;
  });

  const dataRows = rawRows.slice(1);
  const columnCount = headers.length;

  // Normalize rows to match header count
  const normalizedRows: (string | number | boolean | null)[][] = [];
  let totalMissingCells = 0;

  for (const row of dataRows) {
    const normRow: (string | number | boolean | null)[] = [];
    for (let c = 0; c < columnCount; c++) {
      const rawVal = row[c];
      if (rawVal === undefined || isMissingValue(rawVal)) {
        normRow.push(null);
        totalMissingCells++;
      } else {
        const strVal = rawVal.trim();
        // Convert to number if numeric
        if (!isNaN(Number(strVal)) && strVal !== '') {
          normRow.push(Number(strVal));
        } else {
          normRow.push(strVal);
        }
      }
    }
    normalizedRows.push(normRow);
  }

  // Calculate duplicate rows
  const seenSignatures = new Set<string>();
  let duplicateRowCount = 0;

  for (const row of normalizedRows) {
    const sig = row.map((v) => (v === null ? '__NULL__' : String(v))).join(':::');
    if (seenSignatures.has(sig)) {
      duplicateRowCount++;
    } else {
      seenSignatures.add(sig);
    }
  }

  // Column metadata
  const columns: ColumnMeta[] = [];
  let numericColumnCount = 0;
  let categoricalColumnCount = 0;

  for (let c = 0; c < columnCount; c++) {
    const colName = headers[c];
    const colValues = normalizedRows.map((r) => r[c]);
    const missingCount = colValues.filter((v) => v === null).length;
    const nonNullValues = colValues.filter((v) => v !== null);
    const uniqueCount = new Set(nonNullValues.map(String)).size;
    const type = inferColumnType(colValues);

    if (type === 'numeric') {
      numericColumnCount++;
    } else {
      categoricalColumnCount++;
    }

    columns.push({
      name: colName,
      type,
      missingCount,
      uniqueCount,
      sampleValues: colValues.slice(0, 5),
    });
  }

  const rowCount = normalizedRows.length;
  const totalCells = rowCount * columnCount;
  const missingCellPercentage = totalCells > 0 ? (totalMissingCells / totalCells) * 100 : 0;
  const duplicateRowPercentage = rowCount > 0 ? (duplicateRowCount / rowCount) * 100 : 0;

  const stats: DatasetStats = {
    rowCount,
    columnCount,
    missingValuesCount: totalMissingCells,
    missingCellPercentage: parseFloat(missingCellPercentage.toFixed(1)),
    duplicateRowCount,
    duplicateRowPercentage: parseFloat(duplicateRowPercentage.toFixed(1)),
    numericColumnCount,
    categoricalColumnCount,
    columns,
  };

  return {
    filename,
    fileSize,
    fileSizeFormatted: formatBytes(fileSize),
    headers,
    rows: normalizedRows,
    stats,
    previewRows: normalizedRows.slice(0, 10),
  };
}
