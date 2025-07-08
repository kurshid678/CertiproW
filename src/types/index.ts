export interface TextFieldProperties {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  text: string;
  columnMapping?: string;
  sheetMapping?: string;
  textAlign: 'left' | 'center' | 'right';
}

export interface Template {
  id: string;
  name: string;
  canvasWidth: number;
  canvasHeight: number;
  backgroundImage?: string;
  backgroundColor: string;
  textFields: TextFieldProperties[];
  columnMappings: Record<string, string>;
}

export interface ExcelData {
  sheets: Record<string, Record<string, string | number>[]>;
  columns: Record<string, string[]>;
}

export interface SearchResult {
  sheetName: string;
  rowIndex: number;
  data: Record<string, string | number>;
}