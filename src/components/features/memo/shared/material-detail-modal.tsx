'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Material } from '@/types/api';
import { useIntl } from '@/hooks/use-intl';
import {
  Package,
  Barcode,
  Hash,
  Globe,
  FileText,
  DollarSign,
  Ruler,
  Weight,
  Star,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Copy,
  Heart,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MaterialDetailModalProps {
  material: Material | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleFavorite?: (material: Material) => void;
  onSelect?: (material: Material) => void;
}

export function MaterialDetailModal({
  material,
  isOpen,
  onClose,
  onToggleFavorite,
  onSelect,
}: MaterialDetailModalProps) {
  const { t } = useIntl();
  const { toast } = useToast();

  if (!material) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: `${label}: ${text}`,
    });
  };

  const handleFavoriteClick = () => {
    onToggleFavorite?.(material);
  };

  const handleSelectClick = () => {
    onSelect?.(material);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl">
                {material.tittel || 'Untitled Material'}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {material.leverandor.name} •{' '}
                {material.type_designation || 'Electrical Component'}
              </DialogDescription>
            </div>
            {onToggleFavorite && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleFavoriteClick}
                className="h-8 w-8 p-0"
              >
                <Heart
                  className={`h-4 w-4 ${
                    material.favorites
                      ? 'fill-red-500 text-red-500'
                      : 'text-muted-foreground hover:text-red-500'
                  }`}
                />
              </Button>
            )}
          </div>

          {/* Status Badges */}
          <div className="flex gap-2 flex-wrap mt-2">
            {material.favorites && (
              <Badge variant="secondary" className="text-xs">
                <Star className="h-3 w-3 mr-1" />
                Favorite
              </Badge>
            )}
            {material.approved && (
              <Badge variant="default" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Approved
              </Badge>
            )}
            {material.discontinued && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Discontinued
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Identification Numbers */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Identification Numbers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {material.el_nr && (
                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <div>
                    <p className="font-medium text-sm">EL-Number</p>
                    <p className="text-sm text-muted-foreground">
                      {material.el_nr}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      copyToClipboard(material.el_nr!, 'EL-Number')
                    }
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {material.ean_number && (
                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <div>
                    <p className="font-medium text-sm">EAN Barcode</p>
                    <p className="text-sm text-muted-foreground">
                      {material.ean_number}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      copyToClipboard(material.ean_number!, 'EAN Number')
                    }
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {material.article_number && (
                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <div>
                    <p className="font-medium text-sm">Article Number</p>
                    <p className="text-sm text-muted-foreground">
                      {material.article_number}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      copyToClipboard(
                        material.article_number!,
                        'Article Number'
                      )
                    }
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {material.order_number && (
                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <div>
                    <p className="font-medium text-sm">Order Number</p>
                    <p className="text-sm text-muted-foreground">
                      {material.order_number}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      copyToClipboard(material.order_number!, 'Order Number')
                    }
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Descriptions */}
          {(material.norwegian_description ||
            material.english_description ||
            material.german_description ||
            material.info) && (
            <>
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Descriptions
                </h3>
                <div className="space-y-3">
                  {material.norwegian_description && (
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium text-sm mb-1">Norwegian</p>
                      <p className="text-sm">
                        {material.norwegian_description}
                      </p>
                    </div>
                  )}
                  {material.english_description && (
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium text-sm mb-1">English</p>
                      <p className="text-sm">{material.english_description}</p>
                    </div>
                  )}
                  {material.german_description && (
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium text-sm mb-1">German</p>
                      <p className="text-sm">{material.german_description}</p>
                    </div>
                  )}
                  {material.info && (
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium text-sm mb-1">
                        Additional Info
                      </p>
                      <p className="text-sm">{material.info}</p>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Technical Specifications */}
          {(material.category ||
            material.weight ||
            material.height ||
            material.width ||
            material.depth ||
            material.unit_per_package) && (
            <>
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Technical Specifications
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {material.category && (
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium text-sm">Category</p>
                      <p className="text-sm text-muted-foreground">
                        {material.category}
                      </p>
                    </div>
                  )}
                  {material.weight && (
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium text-sm">Weight</p>
                      <p className="text-sm text-muted-foreground">
                        {material.weight}
                      </p>
                    </div>
                  )}
                  {material.height && (
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium text-sm">Height</p>
                      <p className="text-sm text-muted-foreground">
                        {material.height}
                      </p>
                    </div>
                  )}
                  {material.width && (
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium text-sm">Width</p>
                      <p className="text-sm text-muted-foreground">
                        {material.width}
                      </p>
                    </div>
                  )}
                  {material.depth && (
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium text-sm">Depth</p>
                      <p className="text-sm text-muted-foreground">
                        {material.depth}
                      </p>
                    </div>
                  )}
                  {material.unit_per_package && (
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium text-sm">Units per Package</p>
                      <p className="text-sm text-muted-foreground">
                        {material.unit_per_package}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Pricing Information */}
          {(material.list_price ||
            material.net_price ||
            material.discount_factor ||
            material.vat) && (
            <>
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Pricing Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {material.list_price && (
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium text-sm">List Price</p>
                      <p className="text-sm text-muted-foreground">
                        {material.list_price} NOK
                      </p>
                    </div>
                  )}
                  {material.net_price && (
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium text-sm">Net Price</p>
                      <p className="text-sm text-muted-foreground">
                        {material.net_price} NOK
                      </p>
                    </div>
                  )}
                  {material.discount_factor && (
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium text-sm">Discount Factor</p>
                      <p className="text-sm text-muted-foreground">
                        {material.discount_factor}
                      </p>
                    </div>
                  )}
                  {material.vat && (
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium text-sm">VAT</p>
                      <p className="text-sm text-muted-foreground">
                        {material.vat}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Links and Documentation */}
          {material.datasheet_url && (
            <>
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documentation
                </h3>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open(material.datasheet_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Datasheet
                </Button>
              </div>
              <Separator />
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {onSelect && (
              <Button onClick={handleSelectClick} className="flex-1">
                <Package className="h-4 w-4 mr-2" />
                Add to Job
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
