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
import { Material } from '@/lib/api';
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

  if (!material) {return null;}

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
                {material.leverandor?.navn || 'Unknown Supplier'} •{' '}
                {material.kategori?.kategori || 'Electrical Component'}
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
              {material.gtin_number && (
                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <div>
                    <p className="font-medium text-sm">GTIN/EAN Barcode</p>
                    <p className="text-sm text-muted-foreground">
                      {material.gtin_number}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      copyToClipboard(material.gtin_number!, 'GTIN Number')
                    }
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {material.varenummer && (
                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <div>
                    <p className="font-medium text-sm">Product Number</p>
                    <p className="text-sm text-muted-foreground">
                      {material.varenummer}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      copyToClipboard(material.varenummer!, 'Product Number')
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
          {(material.teknisk_beskrivelse ||
            material.varebetegnelse ||
            material.info) && (
            <>
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Descriptions
                </h3>
                <div className="space-y-3">
                  {material.teknisk_beskrivelse && (
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium text-sm mb-1">
                        Technical Description
                      </p>
                      <p className="text-sm">{material.teknisk_beskrivelse}</p>
                    </div>
                  )}
                  {material.varebetegnelse && (
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium text-sm mb-1">
                        Product Designation
                      </p>
                      <p className="text-sm">{material.varebetegnelse}</p>
                    </div>
                  )}
                  {material.info && (
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium text-sm mb-1">
                        Technical Info/ETIM
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
          {(material.kategori ||
            material.vekt ||
            material.hoyde ||
            material.bredde ||
            material.lengde ||
            material.varemerke) && (
            <>
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Technical Specifications
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {material.kategori && (
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium text-sm">Category</p>
                      <p className="text-sm text-muted-foreground">
                        {material.kategori.blokknummer} -{' '}
                        {material.kategori.kategori}
                      </p>
                    </div>
                  )}
                  {material.varemerke && (
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium text-sm">Brand</p>
                      <p className="text-sm text-muted-foreground">
                        {material.varemerke}
                      </p>
                    </div>
                  )}
                  {material.vekt && (
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium text-sm">Weight</p>
                      <p className="text-sm text-muted-foreground">
                        {material.vekt} g
                      </p>
                    </div>
                  )}
                  {material.hoyde && (
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium text-sm">Height</p>
                      <p className="text-sm text-muted-foreground">
                        {material.hoyde} mm
                      </p>
                    </div>
                  )}
                  {material.bredde && (
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium text-sm">Width</p>
                      <p className="text-sm text-muted-foreground">
                        {material.bredde} mm
                      </p>
                    </div>
                  )}
                  {material.lengde && (
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium text-sm">Length</p>
                      <p className="text-sm text-muted-foreground">
                        {material.lengde} mm
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Links and Documentation */}
          {(material.produktblad ||
            material.produkt_url ||
            material.fdv ||
            material.cpr_sertifikat ||
            material.miljoinformasjon) && (
            <>
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documentation
                </h3>
                <div className="space-y-2">
                  {material.produktblad && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() =>
                        material.produktblad && window.open(material.produktblad, '_blank')
                      }
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Product Datasheet
                    </Button>
                  )}
                  {material.produkt_url && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() =>
                        material.produkt_url && window.open(material.produkt_url, '_blank')
                      }
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Manufacturer Page
                    </Button>
                  )}
                  {material.fdv && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => material.fdv && window.open(material.fdv, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      FDV Document
                    </Button>
                  )}
                  {material.cpr_sertifikat && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() =>
                        material.cpr_sertifikat && window.open(material.cpr_sertifikat, '_blank')
                      }
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      CPR Certificate
                    </Button>
                  )}
                  {material.miljoinformasjon && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() =>
                        material.miljoinformasjon && window.open(material.miljoinformasjon, '_blank')
                      }
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Environmental Info
                    </Button>
                  )}
                </div>
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
