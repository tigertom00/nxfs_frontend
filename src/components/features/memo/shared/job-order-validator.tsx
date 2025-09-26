'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertCircle, RefreshCw, Calendar } from 'lucide-react';
import {
  validateJobOrderNumber,
  suggestNextJobOrderNumber,
  generateJobOrderNumber,
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
    } catch (error) {
      console.error('Failed to suggest next order number:', error);
    }
  };

  const getYearCodeInfo = () => {
    const currentYear = new Date().getFullYear();
    const codes = [];

    for (let year = 2025; year <= currentYear + 2; year++) {
      const code = (year - 2017) % 10;
      codes.push({ year, code });
    }

    return codes;
  };

  const yearCodes = getYearCodeInfo();

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

        {validation.isValid && validation.year && validation.sequence && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            Valid order number for {validation.year} (sequence #
            {validation.sequence})
          </div>
        )}

        {/* Year Code Reference */}
        <Card className="bg-muted/50">
          <CardContent className="p-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Year Code Reference
              </div>
              <div className="flex flex-wrap gap-1">
                {yearCodes.map(({ year, code }) => (
                  <Badge
                    key={year}
                    variant={
                      year === new Date().getFullYear()
                        ? 'default'
                        : 'secondary'
                    }
                    className="text-xs"
                  >
                    {year}: {code}xxx
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Order format: YXXX where Y is year code and XXX is sequence
                (001-999)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Examples */}
        <div className="text-xs text-muted-foreground">
          <p>
            <strong>Examples:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>8001-8999: Jobs from 2025</li>
            <li>9001-9999: Jobs from 2026</li>
            <li>0001-0999: Jobs from 2027</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
