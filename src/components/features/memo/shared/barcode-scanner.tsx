'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scan, X, Camera, Keyboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  title?: string;
}

// Norwegian EL-number validation pattern
// Based on research: EL-numbers appear to be numeric identifiers
// Common formats might be 6-8 digits, sometimes with spaces or hyphens
const EL_NUMBER_PATTERNS = [
  /^\d{6,8}$/, // Simple 6-8 digit number
  /^\d{2}\s?\d{3}\s?\d{2,3}$/, // Format like "10 123 45" or "10 123 456"
  /^\d{2}-?\d{3}-?\d{2,3}$/, // Format like "10-123-45" or "10-123-456"
  /^EL\d{6,8}$/i, // Format like "EL123456"
];

export function BarcodeScanner({
  isOpen,
  onClose,
  onScan,
  title = 'Scan EL-Number',
}: BarcodeScannerProps) {
  const { toast } = useToast();
  const [manualInput, setManualInput] = useState('');
  const [isWebCamSupported, setIsWebCamSupported] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check if camera is available
  useEffect(() => {
    const checkCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(
          (device) => device.kind === 'videoinput'
        );
        setIsWebCamSupported(hasCamera);
      } catch (error) {
        setIsWebCamSupported(false);
      }
    };

    if (isOpen) {
      checkCamera();
    }
  }, [isOpen]);

  // Clean up camera stream when modal closes
  useEffect(() => {
    if (!isOpen && streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsScanning(false);
    }
  }, [isOpen]);

  const validateELNumber = (code: string): boolean => {
    // Remove any whitespace
    const cleanCode = code.trim();

    // Check against known EL-number patterns
    return EL_NUMBER_PATTERNS.some((pattern) => pattern.test(cleanCode));
  };

  const handleManualSubmit = () => {
    if (!manualInput.trim()) {
      toast({
        title: 'Invalid input',
        description: 'Please enter an EL-number',
        variant: 'destructive',
      });
      return;
    }

    if (!validateELNumber(manualInput)) {
      toast({
        title: 'Invalid EL-number format',
        description:
          'Please check the EL-number format. Expected formats: 123456, 10 123 45, or EL123456',
        variant: 'destructive',
      });
      return;
    }

    onScan(manualInput.trim());
    setManualInput('');
    onClose();
  };

  const startCamera = async () => {
    try {
      setIsScanning(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      toast({
        title: 'Camera started',
        description:
          'Point camera at the EL-number barcode. Note: Web-based barcode scanning has limited accuracy.',
      });
    } catch (error) {
      setIsScanning(false);
      toast({
        title: 'Camera access failed',
        description: 'Unable to access camera. Please use manual input.',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Camera Section */}
          {isWebCamSupported && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Camera Scanning</h3>

              {!isScanning ? (
                <Button
                  onClick={startCamera}
                  variant="outline"
                  className="w-full"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      className="w-full rounded-lg bg-black"
                      autoPlay
                      playsInline
                      muted
                    />
                    <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-20 border-2 border-red-500 rounded">
                        <div className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 absolute -top-6 left-0 rounded">
                          Align barcode here
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={stopCamera}
                    variant="outline"
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Stop Camera
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Note: Web-based scanning has limited accuracy. Consider
                    using manual input for better results.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Manual Input Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Keyboard className="h-4 w-4" />
              Manual Input
            </h3>

            <div className="space-y-2">
              <Label htmlFor="el-number">EL-Number</Label>
              <Input
                id="el-number"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="e.g., 123456, 10 123 45, or EL123456"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleManualSubmit();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Supported formats: 6-8 digits, spaced (10 123 45), or with EL
                prefix
              </p>
            </div>

            <Button
              onClick={handleManualSubmit}
              className="w-full"
              disabled={!manualInput.trim()}
            >
              Add EL-Number
            </Button>
          </div>

          {/* Info Section */}
          <div className="bg-muted p-3 rounded-lg">
            <h4 className="text-sm font-medium mb-2">About EL-Numbers</h4>
            <p className="text-xs text-muted-foreground">
              EL-numbers are Norwegian electrical product identifiers from
              EFObasen database. They help identify electrical materials and
              components for work orders.
            </p>
          </div>

          {/* Close Button */}
          <Button variant="outline" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
