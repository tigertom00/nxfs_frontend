'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useIntl } from '@/hooks/use-intl';
import { Tag } from '@/types/api';

interface TagInputProps {
  value: number[]; // Array of tag IDs
  onChange: (tagIds: number[]) => void;
  availableTags: Tag[]; // Available tags from the parent
  placeholder?: string;
}

export function TagInput({ value, onChange, availableTags, placeholder }: TagInputProps) {
  const { t } = useIntl();
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get selected tags from IDs
  const selectedTags = availableTags.filter(tag => value.includes(tag.id));

  // Filter available tags for suggestions
  const filteredSuggestions = availableTags
    .filter(tag =>
      tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(tag.id)
    )
    .slice(0, 5);

  const addTag = (tag: Tag) => {
    if (!value.includes(tag.id)) {
      onChange([...value, tag.id]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (tagId: number) => {
    onChange(value.filter(id => id !== tagId));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // If there's a matching suggestion, add the first one
      if (filteredSuggestions.length > 0) {
        addTag(filteredSuggestions[0]);
      }
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      // Remove last tag when backspacing on empty input
      removeTag(value[value.length - 1]);
    }
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="space-y-2 relative">
      <div className="min-h-[42px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="gap-1">
              {tag.name}
              <button
                type="button"
                onClick={() => removeTag(tag.id)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          <div className="flex-1 min-w-[120px]">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder={value.length === 0 ? placeholder : undefined}
              className="border-0 p-0 h-6 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
      </div>

      {/* Tag Suggestions */}
      {showSuggestions && inputValue && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
          {filteredSuggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => addTag(tag)}
              className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {t('blog.editor.tagHelp')}
      </p>
    </div>
  );
}