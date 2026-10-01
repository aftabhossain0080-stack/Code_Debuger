export type ColumnType = 'numeric' | 'categorical' | 'boolean' | 'date';

export interface ColumnMeta {
  name: string;
  type: ColumnType;
  missingCount: number;
  uniqueCount: number;
  sampleValues: (string | number | boolean | null)[];
}

export interface DatasetStats {
  rowCount: number;
  columnCount: number;
  missingValuesCount: number;
  missingCellPercentage: number;
  duplicateRowCount: number;
  duplicateRowPercentage: number;
  numericColumnCount: number;
  categoricalColumnCount: number;
  columns: ColumnMeta[];
}

export interface ProcessedDataset {
  filename: string;
  fileSize: number; // in bytes
  fileSizeFormatted: string;
  headers: string[];
  rows: (string | number | boolean | null)[][];
  stats: DatasetStats;
  previewRows: (string | number | boolean | null)[][];
}

export interface SampleDatasetOption {
  id: string;
  name: string;
  description: string;
  filename: string;
  csvContent: string;
}
