import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { ExcelData, SearchResult } from '@/types';

export const useExcelData = () => {
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadExcelFile = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const sheets: Record<string, Record<string, string | number>[]> = {};
      const columns: Record<string, string[]> = {};
      
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number)[][];
        
        if (jsonData.length > 0) {
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1).map(row => {
            const obj: Record<string, string | number> = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });
          
          sheets[sheetName] = rows;
          columns[sheetName] = headers;
        }
      });
      
      setExcelData({ sheets, columns });
    } catch (error) {
      console.error('Error loading Excel file:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchInSheets = useCallback((query: string): SearchResult[] => {
    if (!excelData || !query.trim()) return [];
    
    const results: SearchResult[] = [];
    const searchTerm = query.toLowerCase();
    
    Object.entries(excelData.sheets).forEach(([sheetName, rows]) => {
      rows.forEach((row, index) => {
        const matchFound = Object.values(row).some(value => 
          String(value).toLowerCase().includes(searchTerm)
        );
        
        if (matchFound) {
          results.push({
            sheetName,
            rowIndex: index,
            data: row
          });
        }
      });
    });
    
    return results;
  }, [excelData]);

  return {
    excelData,
    loading,
    loadExcelFile,
    searchInSheets
  };
};