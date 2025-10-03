'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import {
  validateJobOrderNumber,
  suggestNextJobOrderNumber,
} from '@/lib/time-utils';

interface JobOrderValidatorProps {
  value: number | string;
  onChange: (orderNumber: number) => void;
  existingOrderNumbers?: number[];
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export function JobOrderValidator({
  value,
  onChange,
  existingOrderNumbers = [],
  className,
  required = true,
  disabled = false,
}: JobOrderValidatorProps) {
  const [inputValue, setInputValue] = useState(value.toString());
  const [validation, setValidation] = useState<{
    isValid: boolean;
    year?: number;
    sequence?: number;
    yearCode?: number;
    error?: string;
  }>({ isValid: false });

  // Update input when value prop changes
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  // Validate whenever input changes
  useEffect(() => {
    const orderNumber = parseInt(inputValue);
    if (isNaN(orderNumber) || inputValue.length !== 4) {
      setValidation({ isValid: false, error: 'Must be a 4-digit number' });
      return;
    }

    const result = validateJobOrderNumber(orderNumber);

    // Check if number already exists
    if (result.isValid && existingOrderNumbers.includes(orderNumber)) {
      setValidation({
        ...result,
        isValid: false,
        error: 'Order number already exists',
      });
    } else {
      setValidation(result);
    }
  }, [inputValue, existingOrderNumbers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Only call onChange if valid
    const orderNumber = parseInt(newValue);
    if (!isNaN(orderNumber) && newValue.length === 4) {
      const result = validateJobOrderNumber(orderNumber);
      if (result.isValid && !existingOrderNumbers.includes(orderNumber)) {
        onChange(orderNumber);
      }
    }
  };

  const handleSuggestNext = () => {
    try {
      const suggested = suggestNextJobOrderNumber(existingOrderNumbers);
      setInputValue(suggested.toString());
      onChange(suggested);
    } catch (error) {}
  };

  return (
    <div className={className}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="order-number">
            Job Order Number{' '}
            {required && <span className="text-destructive">*</span>}
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSuggestNext}
            disabled={disabled}
            className="h-7 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Suggest Next
          </Button>
        </div>

        <div className="relative">
          <Input
            id="order-number"
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="8001"
            maxLength={4}
            className={`pr-10 ${validation.isValid ? 'border-green-500' : validation.error ? 'border-red-500' : ''}`}
            disabled={disabled}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {validation.isValid ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : validation.error ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : null}
          </div>
        </div>

        {/* Validation Status */}
        {validation.error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {validation.error}
          </div>
        )}

        {validation.isValid && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            Valid order number
          </div>
        )}
      </div>
    </div>
  );
}
