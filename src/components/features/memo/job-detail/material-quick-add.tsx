'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Package, Scan, Star } from 'lucide-react';
import { BarcodeScanner } from '@/components/features/memo/shared/barcode-scanner';
import { useToast } from '@/hooks/use-toast';

interface MaterialQuickAddProps {
  jobId: number;
}

export function MaterialQuickAdd({ jobId }: MaterialQuickAddProps) {
  const { toast } = useToast();
  const [showScanner, setShowScanner] = useState(false);

  const handleAddFromRecent = () => {
    // TODO: Implement recent materials selection
    toast({
      title: 'Coming Soon',
      description: 'Recent materials selection will be available soon!',
    });
  };

  const handleScanELNumber = () => {
    setShowScanner(true);
  };

  const handleELNumberScanned = (elNumber: string) => {
    // TODO: Look up material by EL-number and add to job
    toast({
      title: 'EL-Number Scanned',
      description: `EL-Number: ${elNumber}. Material lookup will be implemented soon!`,
    });
    console.log('Scanned EL-number:', elNumber, 'for job:', jobId);
  };

  const handleAddFromFavorites = () => {
    // TODO: Implement favorites materials selection
    toast({
      title: 'Coming Soon',
      description: 'Favorite materials will be available soon!',
    });
  };

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Package className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">Quick Add Materials</h3>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Button
          onClick={handleAddFromRecent}
          variant="outline"
          className="h-12 justify-start"
        >
          <Package className="h-4 w-4 mr-2" />
          Recent Materials
        </Button>

        <Button
          onClick={handleScanELNumber}
          variant="outline"
          className="h-12 justify-start"
        >
          <Scan className="h-4 w-4 mr-2" />
          Scan EL-Number
        </Button>

        <Button
          onClick={handleAddFromFavorites}
          variant="outline"
          className="h-12 justify-start"
        >
          <Star className="h-4 w-4 mr-2" />
          Favorites
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        EL-number scanning now available! Full material management coming soon.
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleELNumberScanned}
        title="Scan EL-Number"
      />
    </div>
  );
}
