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
import { Scan, X, Camera, Keyboard, Type } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { createWorker } from 'tesseract.js';
import {
  extractNorwegianELNumber,
  normalizeOCRText,
  formatELNumber,
} from '@/lib/ocr-utils';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  title?: string;
}

// Norwegian EL-number and GTIN validation patterns
// EL-numbers: 6-8 digits, sometimes with spaces or hyphens
// GTIN: 8, 12, 13, or 14 digits (EAN-8, UPC-A, EAN-13, GTIN-14)
const EL_NUMBER_PATTERNS = [
  /^\d{6,8}$/, // Simple 6-8 digit number
  /^\d{2}\s?\d{3}\s?\d{2,3}$/, // Format like "10 123 45" or "10 123 456"
  /^\d{2}-?\d{3}-?\d{2,3}$/, // Format like "10-123-45" or "10-123-456"
  /^EL\d{6,8}$/i, // Format like "EL123456"
];

const GTIN_PATTERNS = [
  /^\d{8}$/, // EAN-8
  /^\d{12}$/, // UPC-A
  /^\d{13}$/, // EAN-13 (most common for products)
  /^\d{14}$/, // GTIN-14
];

export function BarcodeScanner({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Product Code',
}: BarcodeScannerProps) {
  const { toast } = useToast();
  const [manualInput, setManualInput] = useState('');
  const [isWebCamSupported, setIsWebCamSupported] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<'barcode' | 'text'>('barcode');
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);
  const [detectedText, setDetectedText] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const ocrIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const ocrWorkerRef = useRef<any>(null);

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
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
      if (ocrIntervalRef.current) {
        clearInterval(ocrIntervalRef.current);
        ocrIntervalRef.current = null;
      }
      if (ocrWorkerRef.current) {
        ocrWorkerRef.current.terminate();
        ocrWorkerRef.current = null;
      }
      setIsScanning(false);
      setIsOCRProcessing(false);
      setDetectedText('');
    }
  }, [isOpen]);

  const validateProductCode = (code: string): {
    isValid: boolean;
    type: 'el_number' | 'gtin' | 'unknown';
  } => {
    // Remove any whitespace
    const cleanCode = code.trim();

    // Check if it's an EL-number
    if (EL_NUMBER_PATTERNS.some((pattern) => pattern.test(cleanCode))) {
      return { isValid: true, type: 'el_number' };
    }

    // Check if it's a GTIN
    if (GTIN_PATTERNS.some((pattern) => pattern.test(cleanCode))) {
      return { isValid: true, type: 'gtin' };
    }

    return { isValid: false, type: 'unknown' };
  };

  const handleManualSubmit = () => {
    if (!manualInput.trim()) {
      toast({
        title: 'Invalid input',
        description: 'Please enter an EL-number or GTIN barcode',
        variant: 'destructive',
      });
      return;
    }

    const validation = validateProductCode(manualInput);

    if (!validation.isValid) {
      toast({
        title: 'Invalid product code format',
        description:
          'Please check the format. Expected: EL-number (6-8 digits) or GTIN barcode (8-14 digits)',
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

      // Initialize the barcode reader
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      // Get available video devices
      const videoInputDevices = await codeReader.listVideoInputDevices();

      if (videoInputDevices.length === 0) {
        throw new Error('No camera found');
      }

      // Prefer back camera on mobile devices
      const backCamera = videoInputDevices.find((device) =>
        device.label.toLowerCase().includes('back')
      );
      const selectedDeviceId = backCamera
        ? backCamera.deviceId
        : videoInputDevices[0].deviceId;

      toast({
        title: 'Camera started',
        description: 'Point camera at the product barcode or EL-number',
      });

      // Start continuous barcode scanning
      if (videoRef.current) {
        await codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result, error) => {
            if (result) {
              const scannedCode = result.getText();

              // Stop scanning and process the code
              stopCamera();

              const validation = validateProductCode(scannedCode);

              if (validation.isValid) {
                const codeType =
                  validation.type === 'gtin' ? 'GTIN' : 'EL-Number';
                toast({
                  title: 'Barcode scanned successfully',
                  description: `${codeType}: ${scannedCode}`,
                });
                onScan(scannedCode);
                setManualInput('');
                onClose();
              } else {
                toast({
                  title: 'Invalid product code format',
                  description: `Scanned: ${scannedCode}. Please try again or use manual input.`,
                  variant: 'destructive',
                });
                setManualInput(scannedCode); // Pre-fill manual input for editing
              }
            }

            // Ignore NotFoundException errors (no barcode in frame yet)
            if (error && !(error instanceof NotFoundException)) {
              console.error('Barcode scanning error:', error);
            }
          }
        );
      }
    } catch (error) {
      console.error('Camera initialization error:', error);
      setIsScanning(false);
      toast({
        title: 'Camera access failed',
        description: 'Unable to access camera. Please use manual input.',
        variant: 'destructive',
      });
    }
  };

  const startOCRScanning = async () => {
    try {
      setIsScanning(true);
      setIsOCRProcessing(true);
      setDetectedText('Initializing OCR...');

      // Initialize Tesseract worker once
      if (!ocrWorkerRef.current) {
        ocrWorkerRef.current = await createWorker('eng'); // English is faster and works for numbers
        setDetectedText('OCR ready');
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        toast({
          title: 'OCR Scanner Started',
          description: 'Point camera at Norwegian EL-number (NO XX XXX XX)',
        });

        setIsOCRProcessing(false);

        // Start OCR processing every 3 seconds (give more time for processing)
        ocrIntervalRef.current = setInterval(async () => {
          await processOCRFrame();
        }, 3000);
      }
    } catch (error) {
      console.error('Camera initialization error:', error);
      setIsScanning(false);
      setIsOCRProcessing(false);
      toast({
        title: 'Camera access failed',
        description: 'Unable to access camera. Please use manual input.',
        variant: 'destructive',
      });
    }
  };

  const processOCRFrame = async () => {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      isOCRProcessing ||
      !isScanning ||
      !ocrWorkerRef.current
    ) {
      return;
    }

    try {
      setIsOCRProcessing(true);
      setDetectedText('Processing...');

      // Capture current video frame to canvas
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      // Use smaller resolution for faster processing
      const scale = 0.5;
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Enhance contrast for better OCR
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      context.putImageData(imageData, 0, 0);

      // Run OCR using persistent worker
      const {
        data: { text },
      } = await ocrWorkerRef.current.recognize(canvas);

      console.log('OCR detected text:', text);

      // Show full text on screen for debugging (limit to 200 chars)
      const displayText = text.substring(0, 200) || 'No text detected';
      setDetectedText(displayText);

      // Normalize and extract Norwegian EL-number
      const normalizedText = normalizeOCRText(text);
      const elNumber = extractNorwegianELNumber(normalizedText);

      console.log('Normalized text:', normalizedText);
      console.log('Extracted EL-number:', elNumber);

      if (elNumber) {
        // Found Norwegian EL-number!
        stopCamera();
        const formattedNumber = formatELNumber(elNumber);

        toast({
          title: 'Norwegian EL-Number Found',
          description: `Detected: NO ${formattedNumber}`,
        });

        onScan(elNumber);
        setManualInput('');
        onClose();
      } else if (text && text.trim().length > 0) {
        // Text was detected but no Norwegian EL-number found
        toast({
          title: 'No Norwegian EL-Number Found',
          description: `Detected text but no "NO XX XXX XX" pattern. Try repositioning.`,
          variant: 'destructive',
        });
      } else {
        // No text detected at all
        toast({
          title: 'No Text Detected',
          description: 'Try moving closer or improving lighting.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      setDetectedText('Error: ' + (error as Error).message);
    } finally {
      setIsOCRProcessing(false);
    }
  };

  const stopCamera = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (ocrIntervalRef.current) {
      clearInterval(ocrIntervalRef.current);
      ocrIntervalRef.current = null;
    }
    setIsScanning(false);
    setIsOCRProcessing(false);
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

              {/* Scan Mode Toggle */}
              {!isScanning && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setScanMode('barcode')}
                    variant={scanMode === 'barcode' ? 'default' : 'outline'}
                    className="flex-1"
                    size="sm"
                  >
                    <Scan className="h-4 w-4 mr-2" />
                    Barcode
                  </Button>
                  <Button
                    onClick={() => setScanMode('text')}
                    variant={scanMode === 'text' ? 'default' : 'outline'}
                    className="flex-1"
                    size="sm"
                  >
                    <Type className="h-4 w-4 mr-2" />
                    Text (NO)
                  </Button>
                </div>
              )}

              {!isScanning ? (
                <Button
                  onClick={
                    scanMode === 'barcode' ? startCamera : startOCRScanning
                  }
                  variant="outline"
                  className="w-full"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {scanMode === 'barcode'
                    ? 'Scan Barcode'
                    : 'Scan Norwegian Text'}
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
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-20 border-2 border-red-500 rounded">
                        <div className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 absolute -top-6 left-0 rounded">
                          {scanMode === 'barcode'
                            ? 'Align barcode here'
                            : 'Align NO text here'}
                        </div>
                      </div>
                    </div>
                    {scanMode === 'text' && detectedText && (
                      <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-90 text-white text-xs px-3 py-2 rounded max-h-32 overflow-y-auto">
                        <div className="font-bold mb-1">OCR Detected:</div>
                        <div className="whitespace-pre-wrap break-words">
                          {detectedText}
                        </div>
                      </div>
                    )}
                    {isOCRProcessing && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Processing...
                      </div>
                    )}
                  </div>

                  {/* Manual OCR capture button */}
                  {scanMode === 'text' && (
                    <Button
                      onClick={() => processOCRFrame()}
                      disabled={isOCRProcessing}
                      className="w-full"
                    >
                      <Scan className="h-4 w-4 mr-2" />
                      {isOCRProcessing ? 'Processing...' : 'Capture Now'}
                    </Button>
                  )}

                  <Button
                    onClick={stopCamera}
                    variant="outline"
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Stop Camera
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    {scanMode === 'barcode'
                      ? 'Hold the barcode steady in the frame. Scanning will happen automatically.'
                      : 'Click "Capture Now" when label is clearly visible, or wait for auto-scan every 3 seconds.'}
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
              <Label htmlFor="product-code">EL-Number or GTIN</Label>
              <Input
                id="product-code"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="e.g., 123456 or 7020160582119"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleManualSubmit();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                EL-number (6-8 digits) or GTIN barcode (8-14 digits)
              </p>
            </div>

            <Button
              onClick={handleManualSubmit}
              className="w-full"
              disabled={!manualInput.trim()}
            >
              Add Product
            </Button>
          </div>

          {/* Info Section */}
          <div className="bg-muted p-3 rounded-lg">
            <h4 className="text-sm font-medium mb-2">About Product Codes</h4>
            <p className="text-xs text-muted-foreground">
              Scan GTIN barcodes (found on product packaging) or enter EL-numbers
              (Norwegian electrical product identifiers from EFObasen database)
              to quickly find and add materials.
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
