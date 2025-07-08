import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { TemplateCreator } from '@/components/TemplateCreator';
import { CertificateGenerator } from '@/components/CertificateGenerator';
import { useTemplates } from '@/hooks/useTemplates';
import { useExcelData } from '@/hooks/useExcelData';
import { Template } from '@/types';
import { Plus, FileText, Upload, Settings, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function CertificateApp() {
  const [activeTab, setActiveTab] = useState('templates');
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  
  const {
    templates,
    currentTemplate,
    setCurrentTemplate,
    saveTemplate,
    deleteTemplate,
    loadTemplate
  } = useTemplates();

  const {
    excelData,
    loading: excelLoading,
    loadExcelFile,
    searchInSheets
  } = useExcelData();

  const createNewTemplate = () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    const newTemplate: Template = {
      id: `template-${Date.now()}`,
      name: templateName,
      canvasWidth: 800,
      canvasHeight: 600,
      backgroundColor: '#ffffff',
      textFields: [],
      columnMappings: {}
    };

    setCurrentTemplate(newTemplate);
    setIsCreatingTemplate(false);
    setTemplateName('');
    setActiveTab('creator');
    toast.success('New template created');
  };

  const handleSaveTemplate = () => {
    if (currentTemplate) {
      saveTemplate(currentTemplate);
      toast.success('Template saved successfully');
    }
  };

  const handleLoadTemplate = (templateId: string) => {
    loadTemplate(templateId);
    setActiveTab('creator');
  };

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await loadExcelFile(file);
        toast.success('Excel file loaded successfully');
      } catch (error) {
        toast.error('Error loading Excel file');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Certificate Generator</h1>
          <p className="text-gray-600 mt-2">Create custom certificate templates and generate certificates from Excel data</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="creator" disabled={!currentTemplate}>Template Creator</TabsTrigger>
            <TabsTrigger value="generator" disabled={!currentTemplate || !excelData}>Generator</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Manage Templates</h2>
              <div className="flex space-x-4">
                <div className="relative">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleExcelUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={excelLoading}
                  />
                  <Button disabled={excelLoading}>
                    <Upload className="w-4 h-4 mr-2" />
                    {excelLoading ? 'Loading...' : 'Upload Excel'}
                  </Button>
                </div>
                
                <Dialog open={isCreatingTemplate} onOpenChange={setIsCreatingTemplate}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      New Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Template</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Template Name</label>
                        <Input
                          placeholder="Enter template name"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsCreatingTemplate(false)}>
                          Cancel
                        </Button>
                        <Button onClick={createNewTemplate}>
                          Create Template
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {excelData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Excel Data Loaded
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Available sheets:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(excelData.sheets).map(sheetName => (
                        <Badge key={sheetName} variant="secondary">
                          {sheetName} ({excelData.sheets[sheetName].length} rows)
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {template.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTemplate(template.id);
                          toast.success('Template deleted');
                        }}
                      >
                        ×
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Canvas: {template.canvasWidth} × {template.canvasHeight}
                      </p>
                      <p className="text-sm text-gray-600">
                        Text Fields: {template.textFields.length}
                      </p>
                      <div className="flex space-x-2 mt-4">
                        <Button
                          size="sm"
                          onClick={() => handleLoadTemplate(template.id)}
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            loadTemplate(template.id);
                            if (excelData) {
                              setActiveTab('generator');
                            } else {
                              toast.error('Please upload Excel data first');
                            }
                          }}
                          disabled={!excelData}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Generate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {templates.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500 mb-4">No templates created yet</p>
                  <Button onClick={() => setIsCreatingTemplate(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Template
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="creator">
            {currentTemplate && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Template Creator: {currentTemplate.name}</h2>
                  <Button onClick={handleSaveTemplate}>
                    Save Template
                  </Button>
                </div>
                <TemplateCreator
                  template={currentTemplate}
                  onTemplateChange={setCurrentTemplate}
                  excelData={excelData}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="generator">
            {currentTemplate && excelData && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Certificate Generator: {currentTemplate.name}</h2>
                </div>
                <CertificateGenerator
                  template={currentTemplate}
                  excelData={excelData}
                  onSearch={searchInSheets}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}