'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FileText,
  Plus,
  Calendar,
  BarChart3,
  Package,
  Clock,
  Users,
  Star,
  Edit,
  Trash2,
} from 'lucide-react';

interface ReportTemplatesProps {
  onTemplateSelected: (template: any) => void;
}

export function ReportTemplates({ onTemplateSelected }: ReportTemplatesProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    type: '',
    schedule: '',
  });

  const predefinedTemplates = [
    {
      id: 'weekly_summary',
      name: 'Weekly Summary',
      description: 'Comprehensive weekly overview of jobs, materials, and time tracking',
      type: 'comprehensive',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      metrics: ['job_completion', 'material_usage', 'time_tracking', 'efficiency'],
      schedule: 'Weekly - Monday mornings',
      popular: true,
    },
    {
      id: 'monthly_performance',
      name: 'Monthly Performance',
      description: 'Detailed monthly performance analysis with trends and recommendations',
      type: 'comprehensive',
      icon: BarChart3,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
      metrics: ['performance_metrics', 'cost_analysis', 'efficiency_trends'],
      schedule: 'Monthly - First of month',
      popular: true,
    },
    {
      id: 'job_efficiency',
      name: 'Job Efficiency Report',
      description: 'Focus on job completion rates and time efficiency',
      type: 'job_completion',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      metrics: ['completion_rate', 'time_analysis', 'productivity'],
      schedule: 'Bi-weekly',
      popular: false,
    },
    {
      id: 'material_cost_analysis',
      name: 'Material Cost Analysis',
      description: 'Detailed breakdown of material costs and usage patterns',
      type: 'material_usage',
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
      metrics: ['cost_breakdown', 'usage_patterns', 'supplier_analysis'],
      schedule: 'Monthly',
      popular: false,
    },
    {
      id: 'team_productivity',
      name: 'Team Productivity',
      description: 'Track team performance and individual productivity metrics',
      type: 'time_tracking',
      icon: Users,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100 dark:bg-teal-900',
      metrics: ['individual_performance', 'team_metrics', 'time_allocation'],
      schedule: 'Weekly',
      popular: false,
    },
    {
      id: 'quarterly_executive',
      name: 'Quarterly Executive Summary',
      description: 'High-level overview for management with key insights and trends',
      type: 'comprehensive',
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900',
      metrics: ['executive_summary', 'kpis', 'strategic_insights'],
      schedule: 'Quarterly',
      popular: true,
    },
  ];

  const [templates, setTemplates] = useState(predefinedTemplates);
  const [customTemplates, setCustomTemplates] = useState([]);

  const handleCreateTemplate = () => {
    const template = {
      id: `custom_${Date.now()}`,
      ...newTemplate,
      icon: FileText,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100 dark:bg-gray-900',
      metrics: ['custom'],
      popular: false,
      custom: true,
    };

    setCustomTemplates(prev => [...prev, template]);
    setNewTemplate({ name: '', description: '', type: '', schedule: '' });
    setShowCreateDialog(false);
  };

  const handleTemplateSelect = (template: any) => {
    onTemplateSelected(template);
  };

  const renderTemplateCard = (template: any) => (
    <Card
      key={template.id}
      className="cursor-pointer transition-all hover:shadow-md hover-lift"
      onClick={() => handleTemplateSelect(template)}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${template.bgColor}`}>
              <template.icon className={`h-4 w-4 ${template.color}`} />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {template.name}
                {template.popular && (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                )}
                {template.custom && (
                  <Badge variant="outline" className="text-xs">
                    Custom
                  </Badge>
                )}
              </CardTitle>
            </div>
          </div>
          {template.custom && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle edit
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setCustomTemplates(prev => prev.filter(t => t.id !== template.id));
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">{template.description}</p>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Schedule: {template.schedule}</span>
          </div>

          <div className="flex flex-wrap gap-1">
            {template.metrics.slice(0, 3).map((metric) => (
              <Badge key={metric} variant="outline" className="text-xs">
                {metric.replace('_', ' ')}
              </Badge>
            ))}
            {template.metrics.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{template.metrics.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Report Templates</h2>
          <p className="text-muted-foreground">
            Use predefined templates or create custom report configurations
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Custom Template</DialogTitle>
              <DialogDescription>
                Create a reusable report template with your preferred settings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Custom Weekly Report"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateDescription">Description</Label>
                <Textarea
                  id="templateDescription"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this template covers..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateType">Report Type</Label>
                <select
                  id="templateType"
                  value={newTemplate.type}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full border border-border rounded px-3 py-2"
                >
                  <option value="">Select type...</option>
                  <option value="job_completion">Job Completion</option>
                  <option value="material_usage">Material Usage</option>
                  <option value="time_tracking">Time Tracking</option>
                  <option value="comprehensive">Comprehensive</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateSchedule">Schedule</Label>
                <Input
                  id="templateSchedule"
                  value={newTemplate.schedule}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, schedule: e.target.value }))}
                  placeholder="e.g., Weekly, Monthly, On-demand"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTemplate}
                  disabled={!newTemplate.name || !newTemplate.type}
                >
                  Create Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Popular Templates */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-600" />
          <h3 className="text-lg font-semibold">Popular Templates</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.filter(t => t.popular).map(renderTemplateCard)}
        </div>
      </div>

      {/* All Templates */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">All Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.filter(t => !t.popular).map(renderTemplateCard)}
        </div>
      </div>

      {/* Custom Templates */}
      {customTemplates.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Custom Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customTemplates.map(renderTemplateCard)}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="flex items-center gap-2 h-auto p-4"
              onClick={() => handleTemplateSelect(templates.find(t => t.id === 'weekly_summary'))}
            >
              <Calendar className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Generate Weekly Report</div>
                <div className="text-xs text-muted-foreground">Last 7 days summary</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2 h-auto p-4"
              onClick={() => handleTemplateSelect(templates.find(t => t.id === 'monthly_performance'))}
            >
              <BarChart3 className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Monthly Performance</div>
                <div className="text-xs text-muted-foreground">Current month analysis</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2 h-auto p-4"
              onClick={() => handleTemplateSelect(templates.find(t => t.id === 'quarterly_executive'))}
            >
              <Users className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Executive Summary</div>
                <div className="text-xs text-muted-foreground">High-level overview</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}