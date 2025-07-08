import { useState, useEffect } from 'react';
import { Template } from '@/types';

export const useTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);

  useEffect(() => {
    const savedTemplates = localStorage.getItem('certificate-templates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  const saveTemplate = (template: Template) => {
    const updatedTemplates = templates.some(t => t.id === template.id)
      ? templates.map(t => t.id === template.id ? template : t)
      : [...templates, template];
    
    setTemplates(updatedTemplates);
    localStorage.setItem('certificate-templates', JSON.stringify(updatedTemplates));
  };

  const deleteTemplate = (templateId: string) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    setTemplates(updatedTemplates);
    localStorage.setItem('certificate-templates', JSON.stringify(updatedTemplates));
  };

  const loadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setCurrentTemplate(template);
    }
  };

  return {
    templates,
    currentTemplate,
    setCurrentTemplate,
    saveTemplate,
    deleteTemplate,
    loadTemplate
  };
};