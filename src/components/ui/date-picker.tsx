'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from 'lucide-react';
import { useUIStore } from '@/stores';

interface DatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  disabled = false,
}: DatePickerProps) {
  const { language } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);

  const texts = {
    selectDate: language === 'no' ? 'Velg dato' : 'Select date',
    clear: language === 'no' ? 'Fjern' : 'Clear',
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const formatDisplayDate = (dateString?: string) => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const clearDate = () => {
    onChange('');
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between text-left font-normal"
          disabled={disabled}
        >
          <span className={value ? '' : 'text-muted-foreground'}>
            {value ? formatDisplayDate(value) : placeholder || texts.selectDate}
          </span>
          <Calendar className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="space-y-3">
          <Input
            type="date"
            value={value || ''}
            onChange={handleDateChange}
            disabled={disabled}
            className="w-full"
          />
          {value && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearDate}
              className="w-full"
            >
              {texts.clear}
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}