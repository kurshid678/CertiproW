import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ColorPicker } from './ColorPicker';
import { TextFieldProperties, Template, ExcelData } from '@/types';
import { Trash2, Move, Type } from 'lucide-react';

interface TemplateCreatorProps {
  template: Template;
  onTemplateChange: (template: Template) => void;
  excelData: ExcelData | null;
}

export const TemplateCreator: React.FC<TemplateCreatorProps> = ({
  template,
  onTemplateChange,
  excelData
}) => {
  const [selectedTextField, setSelectedTextField] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const addTextField = () => {
    const newTextField: TextFieldProperties = {
      id: `field-${Date.now()}`,
      x: 50,
      y: 50,
      width: 200,
      height: 40,
      fontSize: 16,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      color: '#000000',
      text: 'New Text Field',
      textAlign: 'left'
    };

    onTemplateChange({
      ...template,
      textFields: [...template.textFields, newTextField]
    });
  };

  const updateTextField = (id: string, updates: Partial<TextFieldProperties>) => {
    const updatedFields = template.textFields.map(field =>
      field.id === id ? { ...field, ...updates } : field
    );

    onTemplateChange({
      ...template,
      textFields: updatedFields
    });
  };

  const deleteTextField = (id: string) => {
    const updatedFields = template.textFields.filter(field => field.id !== id);
    onTemplateChange({
      ...template,
      textFields: updatedFields
    });
    setSelectedTextField(null);
  };

  const handleMouseDown = (e: React.MouseEvent, fieldId: string) => {
    e.preventDefault();
    const field = template.textFields.find(f => f.id === fieldId);
    if (!field) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const offsetX = e.clientX - rect.left - field.x;
    const offsetY = e.clientY - rect.top - field.y;

    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);
    setSelectedTextField(fieldId);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !selectedTextField || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, template.canvasWidth - 50));
    const newY = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, template.canvasHeight - 30));

    updateTextField(selectedTextField, { x: newX, y: newY });
  }, [isDragging, selectedTextField, dragOffset, template.canvasWidth, template.canvasHeight]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const selectedField = template.textFields.find(f => f.id === selectedTextField);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
      {/* Canvas */}
      <div className="lg:col-span-3">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Canvas</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="border-2 border-dashed border-gray-300 overflow-auto">
              <div
                ref={canvasRef}
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
                    className={`absolute border-2 cursor-move ${
                      selectedTextField === field.id ? 'border-blue-500' : 'border-transparent hover:border-gray-400'
                    }`}
                    style={{
                      left: field.x,
                      top: field.y,
                      width: field.width,
                      height: field.height
                    }}
                    onMouseDown={(e) => handleMouseDown(e, field.id)}
                    onClick={() => setSelectedTextField(field.id)}
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
                      {field.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Properties Panel */}
      <div className="space-y-4">
        {/* Canvas Properties */}
        <Card>
          <CardHeader>
            <CardTitle>Canvas Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Width</Label>
              <Input
                type="number"
                value={template.canvasWidth}
                onChange={(e) => onTemplateChange({
                  ...template,
                  canvasWidth: parseInt(e.target.value) || 800
                })}
              />
            </div>
            <div>
              <Label>Height</Label>
              <Input
                type="number"
                value={template.canvasHeight}
                onChange={(e) => onTemplateChange({
                  ...template,
                  canvasHeight: parseInt(e.target.value) || 600
                })}
              />
            </div>
            <div>
              <Label>Background Color</Label>
              <ColorPicker
                color={template.backgroundColor}
                onChange={(color) => onTemplateChange({
                  ...template,
                  backgroundColor: color
                })}
              />
            </div>
            <div>
              <Label>Background Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      onTemplateChange({
                        ...template,
                        backgroundImage: event.target?.result as string
                      });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
            <Button onClick={addTextField} className="w-full">
              <Type className="w-4 h-4 mr-2" />
              Add Text Field
            </Button>
          </CardContent>
        </Card>

        {/* Text Field Properties */}
        {selectedField && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Text Field Properties
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteTextField(selectedField.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Text</Label>
                <Input
                  value={selectedField.text}
                  onChange={(e) => updateTextField(selectedField.id, { text: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>X Position</Label>
                  <Input
                    type="number"
                    value={selectedField.x}
                    onChange={(e) => updateTextField(selectedField.id, { x: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Y Position</Label>
                  <Input
                    type="number"
                    value={selectedField.y}
                    onChange={(e) => updateTextField(selectedField.id, { y: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Width</Label>
                  <Input
                    type="number"
                    value={selectedField.width}
                    onChange={(e) => updateTextField(selectedField.id, { width: parseInt(e.target.value) || 100 })}
                  />
                </div>
                <div>
                  <Label>Height</Label>
                  <Input
                    type="number"
                    value={selectedField.height}
                    onChange={(e) => updateTextField(selectedField.id, { height: parseInt(e.target.value) || 30 })}
                  />
                </div>
              </div>

              <div>
                <Label>Font Size: {selectedField.fontSize}px</Label>
                <Slider
                  value={[selectedField.fontSize]}
                  onValueChange={([value]) => updateTextField(selectedField.id, { fontSize: value })}
                  min={8}
                  max={72}
                  step={1}
                />
              </div>

              <div>
                <Label>Font Family</Label>
                <Select
                  value={selectedField.fontFamily}
                  onValueChange={(value) => updateTextField(selectedField.id, { fontFamily: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Georgia">Georgia</SelectItem>
                    <SelectItem value="Verdana">Verdana</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Font Weight</Label>
                <Select
                  value={selectedField.fontWeight}
                  onValueChange={(value) => updateTextField(selectedField.id, { fontWeight: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="lighter">Light</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Text Align</Label>
                <Select
                  value={selectedField.textAlign}
                  onValueChange={(value: 'left' | 'center' | 'right') => 
                    updateTextField(selectedField.id, { textAlign: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Color</Label>
                <ColorPicker
                  color={selectedField.color}
                  onChange={(color) => updateTextField(selectedField.id, { color })}
                />
              </div>

              {excelData && (
                <div className="space-y-2">
                  <Label>Map to Excel Column</Label>
                  <div>
                    <Label className="text-xs text-gray-600">Select Sheet:</Label>
                    <Select
                      value={selectedField.sheetMapping || Object.keys(excelData.sheets)[0]}
                      onValueChange={(value) => updateTextField(selectedField.id, { sheetMapping: value, columnMapping: undefined })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sheet" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(excelData.sheets).map(sheetName => (
                          <SelectItem key={sheetName} value={sheetName}>
                            {sheetName} ({excelData.sheets[sheetName].length} rows)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Select Column:</Label>
                    <Select
                      value={selectedField.columnMapping || 'no-mapping'}
                      onValueChange={(value) => updateTextField(selectedField.id, { columnMapping: value === 'no-mapping' ? undefined : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-mapping">No mapping</SelectItem>
                        {selectedField.sheetMapping && excelData.columns[selectedField.sheetMapping] ? 
                          excelData.columns[selectedField.sheetMapping].map(column => (
                            <SelectItem key={column} value={column}>{column}</SelectItem>
                          )) : 
                          Object.values(excelData.columns).flat().map(column => (
                            <SelectItem key={column} value={column}>{column}</SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};