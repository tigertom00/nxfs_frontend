'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Info } from 'lucide-react';
import { toast } from 'sonner';

interface EnvironmentVariable {
  key: string;
  value: string;
  enabled: boolean;
}

interface EnvironmentVariablesDialogProps {
  children: React.ReactNode;
  variables: EnvironmentVariable[];
  onUpdateVariables: (variables: EnvironmentVariable[]) => void;
}

export function EnvironmentVariablesDialog({
  children,
  variables,
  onUpdateVariables,
}: EnvironmentVariablesDialogProps) {
  const [open, setOpen] = useState(false);
  const [localVariables, setLocalVariables] = useState<EnvironmentVariable[]>(
    []
  );

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setLocalVariables([...variables]);
    }
    setOpen(newOpen);
  };

  const addVariable = () => {
    setLocalVariables([
      ...localVariables,
      { key: '', value: '', enabled: true },
    ]);
  };

  const updateVariable = (
    index: number,
    field: keyof EnvironmentVariable,
    value: string | boolean
  ) => {
    const updated = localVariables.map((v, i) =>
      i === index ? { ...v, [field]: value } : v
    );
    setLocalVariables(updated);
  };

  const removeVariable = (index: number) => {
    setLocalVariables(localVariables.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    try {
      // Filter out empty variables
      const validVariables = localVariables.filter((v) => v.key.trim() !== '');
      onUpdateVariables(validVariables);
      toast.success('Environment variables saved successfully');
      setOpen(false);
    } catch (error) {
      toast.error('Failed to save environment variables');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Environment Variables</DialogTitle>
          <DialogDescription>
            Manage variables that can be used in your requests using{' '}
            {'{{variable_name}}'}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 my-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">How to use variables:</p>
              <p>
                Use {'{{variable_name}}'} in URLs, headers, or request body.
                Example:
              </p>
              <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded">
                {'{{BASE_URL}}'}/api/v1/users
              </code>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-4">
            {localVariables.map((variable, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 border rounded-lg"
              >
                <Switch
                  checked={variable.enabled}
                  onCheckedChange={(checked) =>
                    updateVariable(index, 'enabled', checked)
                  }
                />
                <Input
                  placeholder="Variable name"
                  value={variable.key}
                  onChange={(e) => updateVariable(index, 'key', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Variable value"
                  value={variable.value}
                  onChange={(e) =>
                    updateVariable(index, 'value', e.target.value)
                  }
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeVariable(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <Button variant="outline" onClick={addVariable} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Variable
            </Button>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Variables</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
