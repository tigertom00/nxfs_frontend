'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/stores';
import { llmProvidersAPI, LLMProvider, CreateLLMProviderPayload } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, X, Upload } from 'lucide-react';

interface CreateProviderDialogProps {
  children: React.ReactNode;
  onProviderCreated: (provider: LLMProvider) => void;
}

export function CreateProviderDialog({
  children,
  onProviderCreated,
}: CreateProviderDialogProps) {
  const { language } = useUIStore();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [strengths_en, setStrengthsEn] = useState<string[]>(['']);
  const [strengths_no, setStrengthsNo] = useState<string[]>(['']);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<number[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    description_nb: '',
    pricing: '',
    pricing_nb: '',
  });

  const texts = {
    title: language === 'no' ? 'Legg til LLM-leverandør' : 'Add LLM Provider',
    description:
      language === 'no'
        ? 'Opprett en ny LLM-leverandør'
        : 'Create a new LLM provider',
    name: language === 'no' ? 'Navn' : 'Name',
    namePlaceholder: language === 'no' ? 'f.eks. ChatGPT' : 'e.g. ChatGPT',
    url: language === 'no' ? 'URL' : 'URL',
    urlPlaceholder:
      language === 'no' ? 'https://chatgpt.com' : 'https://chatgpt.com',
    descriptionEn:
      language === 'no' ? 'Beskrivelse (engelsk)' : 'Description (English)',
    descriptionNo:
      language === 'no' ? 'Beskrivelse (norsk)' : 'Description (Norwegian)',
    descriptionPlaceholder:
      language === 'no'
        ? 'Beskriv leverandøren...'
        : 'Describe the provider...',
    strengthsEn:
      language === 'no' ? 'Styrker (engelsk)' : 'Strengths (English)',
    strengthsNo:
      language === 'no' ? 'Styrker (norsk)' : 'Strengths (Norwegian)',
    strengthPlaceholder:
      language === 'no'
        ? 'f.eks. Utmerkede skriveferdigheter'
        : 'e.g. Excellent writing capabilities',
    pricing: language === 'no' ? 'Prissetting' : 'Pricing',
    pricingEn:
      language === 'no' ? 'Prissetting (engelsk)' : 'Pricing (English)',
    pricingNo:
      language === 'no' ? 'Prissetting (norsk)' : 'Pricing (Norwegian)',
    pricingPlaceholder: language === 'no' ? 'f.eks. Freemium' : 'e.g. Freemium',
    tags: language === 'no' ? 'Kategorier (Tag-IDer)' : 'Categories (Tag IDs)',
    tagPlaceholder:
      language === 'no'
        ? 'Skriv tag-ID og trykk Enter'
        : 'Type tag ID and press Enter',
    icon: language === 'no' ? 'Ikon' : 'Icon',
    uploadIcon: language === 'no' ? 'Last opp ikon' : 'Upload Icon',
    addStrength: language === 'no' ? 'Legg til styrke' : 'Add Strength',
    create: language === 'no' ? 'Opprett leverandør' : 'Create Provider',
    creating: language === 'no' ? 'Oppretter...' : 'Creating...',
    cancel: language === 'no' ? 'Avbryt' : 'Cancel',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload: CreateLLMProviderPayload = {
        name: formData.name,
        url: formData.url,
        description: formData.description,
        description_nb: formData.description_nb,
        strengths_en: strengths_en.filter((s) => s.trim()),
        strengths_no: strengths_no.filter((s) => s.trim()),
        pricing: formData.pricing,
        pricing_nb: formData.pricing_nb,
        tag_ids: tags,
        icon: iconFile,
      };

      const newProvider = await llmProvidersAPI.createProvider(payload);
      onProviderCreated(newProvider);
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create provider:', error);
      toast.error(
        language === 'no'
          ? 'Kunne ikke opprette leverandør'
          : 'Failed to create provider'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      description: '',
      description_nb: '',
      pricing: '',
      pricing_nb: '',
    });
    setStrengthsEn(['']);
    setStrengthsNo(['']);
    setTags([]);
    setTagInput('');
    setIconFile(null);
  };

  const handleInputChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleStrengthChange = (
    index: number,
    value: string,
    isNorwegian: boolean
  ) => {
    if (isNorwegian) {
      const newStrengths = [...strengths_no];
      newStrengths[index] = value;
      setStrengthsNo(newStrengths);
    } else {
      const newStrengths = [...strengths_en];
      newStrengths[index] = value;
      setStrengthsEn(newStrengths);
    }
  };

  const addStrength = (isNorwegian: boolean) => {
    if (isNorwegian) {
      setStrengthsNo([...strengths_no, '']);
    } else {
      setStrengthsEn([...strengths_en, '']);
    }
  };

  const removeStrength = (index: number, isNorwegian: boolean) => {
    if (isNorwegian) {
      setStrengthsNo(strengths_no.filter((_, i) => i !== index));
    } else {
      setStrengthsEn(strengths_en.filter((_, i) => i !== index));
    }
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tagId = parseInt(tagInput.trim());
      if (!isNaN(tagId) && !tags.includes(tagId)) {
        setTags([...tags, tagId]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagId: number) => {
    setTags(tags.filter((t) => t !== tagId));
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIconFile(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{texts.title}</DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{texts.name}</Label>
              <Input
                id="name"
                placeholder={texts.namePlaceholder}
                value={formData.name}
                onChange={handleInputChange('name')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">{texts.url}</Label>
              <Input
                id="url"
                type="url"
                placeholder={texts.urlPlaceholder}
                value={formData.url}
                onChange={handleInputChange('url')}
                required
              />
            </div>
          </div>

          {/* Descriptions */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">{texts.descriptionEn}</Label>
              <Textarea
                id="description"
                placeholder={texts.descriptionPlaceholder}
                value={formData.description}
                onChange={handleInputChange('description')}
                required
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description_nb">{texts.descriptionNo}</Label>
              <Textarea
                id="description_nb"
                placeholder={texts.descriptionPlaceholder}
                value={formData.description_nb}
                onChange={handleInputChange('description_nb')}
                required
                rows={3}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pricing">{texts.pricingEn}</Label>
              <Input
                id="pricing"
                placeholder={texts.pricingPlaceholder}
                value={formData.pricing}
                onChange={handleInputChange('pricing')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricing_nb">{texts.pricingNo}</Label>
              <Input
                id="pricing_nb"
                placeholder={texts.pricingPlaceholder}
                value={formData.pricing_nb}
                onChange={handleInputChange('pricing_nb')}
                required
              />
            </div>
          </div>

          {/* Strengths */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{texts.strengthsEn}</Label>
              {strengths_en.map((strength, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={texts.strengthPlaceholder}
                    value={strength}
                    onChange={(e) =>
                      handleStrengthChange(index, e.target.value, false)
                    }
                  />
                  {strengths_en.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeStrength(index, false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addStrength(false)}
              >
                <Plus className="w-4 h-4 mr-2" />
                {texts.addStrength}
              </Button>
            </div>

            <div className="space-y-2">
              <Label>{texts.strengthsNo}</Label>
              {strengths_no.map((strength, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={texts.strengthPlaceholder}
                    value={strength}
                    onChange={(e) =>
                      handleStrengthChange(index, e.target.value, true)
                    }
                  />
                  {strengths_no.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeStrength(index, true)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addStrength(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                {texts.addStrength}
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">{texts.tags}</Label>
            <Input
              id="tags"
              type="number"
              placeholder={texts.tagPlaceholder}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInput}
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tagId) => (
                  <Badge
                    key={tagId}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Tag {tagId}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeTag(tagId)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Icon Upload */}
          <div className="space-y-2">
            <Label htmlFor="icon">{texts.icon}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="icon"
                type="file"
                accept="image/*"
                onChange={handleIconUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('icon')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                {texts.uploadIcon}
              </Button>
              {iconFile && (
                <span className="text-sm text-muted-foreground">
                  {iconFile.name}
                </span>
              )}
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            {texts.cancel}
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            onClick={handleSubmit}
            className="api-gradient hover:opacity-90"
          >
            {isLoading ? texts.creating : texts.create}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
