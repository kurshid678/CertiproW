import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Template, ExcelData, SearchResult } from '@/types';
import { Search, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface CertificateGeneratorProps {
  template: Template;
  excelData: ExcelData;
  onSearch: (query: string) => SearchResult[];
}

export const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({
  template,
  excelData,
  onSearch
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    const results = onSearch(searchQuery);
    setSearchResults(results);
    
    if (results.length > 0 && !selectedResult) {
      setSelectedResult(results[0]);
    }
  };

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (excelData.sheets[sheetName] && excelData.sheets[sheetName].length > 0) {
      setSelectedResult({
        sheetName,
        rowIndex: 0,
        data: excelData.sheets[sheetName][0]
      });
    }
  };

  const getFieldValue = (field: TextFieldProperties) => {
    if (!selectedResult || !field.columnMapping) {
      return field.text;
    }
    
    // If field has a specific sheet mapping, use data from that sheet if available
    if (field.sheetMapping && field.sheetMapping === selectedResult.sheetName) {
      return selectedResult.data[field.columnMapping] || field.text;
    }
    
    // If no specific sheet mapping or sheet doesn't match, use current selected result
    return selectedResult.data[field.columnMapping] || field.text;
  };

  const downloadPDF = async () => {
    if (!certificateRef.current) return;

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: template.canvasWidth > template.canvasHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [template.canvasWidth, template.canvasHeight]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, template.canvasWidth, template.canvasHeight);
      pdf.save(`certificate-${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      {/* Search Panel */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Search Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Search in all sheets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="w-4 h-4" />
              </Button>
            </div>

            <div>
              <label className="text-sm font-medium">Or select sheet directly:</label>
              <Select value={selectedSheet} onValueChange={handleSheetChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sheet" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(excelData.sheets).map(sheetName => (
                    <SelectItem key={sheetName} value={sheetName}>
                      {sheetName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {searchResults.length > 0 && (
              <div>
                <label className="text-sm font-medium">Search Results ({searchResults.length}):</label>
                <div className="max-h-60 overflow-y-auto space-y-2 mt-2">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 border rounded cursor-pointer ${
                        selectedResult === result ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedResult(result)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{result.sheetName}</Badge>
                        <span className="text-xs text-gray-500">Row {result.rowIndex + 1}</span>
                      </div>
                      <div className="text-sm">
                        {Object.entries(result.data).slice(0, 3).map(([key, value]) => (
                          <div key={key} className="truncate">
                            <span className="font-medium">{key}:</span> {String(value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedResult && (
          <Card>
            <CardHeader>
              <CardTitle>Selected Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(selectedResult.data).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium text-sm">{key}:</span>
                    <span className="text-sm text-right flex-1 ml-2">{String(value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Certificate Preview */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Certificate Preview</CardTitle>
            <Button onClick={downloadPDF} disabled={!selectedResult}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            <div className="border-2 border-gray-300 overflow-auto">
              <div
                ref={certificateRef}
                className="relative"
                style={{
                  width: template.canvasWidth,
                  height: template.canvasHeight,
                  backgroundColor: template.backgroundColor,
                  backgroundImage: template.backgroundImage ? `url(${template.backgroundImage})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {template.textFields.map(field => (
                  <div
                    key={field.id}
                    className="absolute"
                    style={{
                      left: field.x,
                      top: field.y,
                      width: field.width,
                      height: field.height
                    }}
                  >
                    <div
                      className="w-full h-full flex items-center px-2"
                      style={{
                        fontSize: field.fontSize,
                        fontFamily: field.fontFamily,
                        fontWeight: field.fontWeight,
                        color: field.color,
                        textAlign: field.textAlign
                      }}
                    >
                      {getFieldValue(field)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};