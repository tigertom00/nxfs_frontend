'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { jobsAPI } from '@/lib/api';
import { Job, CreateJobPayload } from '@/lib/api';
import { MapPin, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { suggestNextJobOrderNumber } from '@/lib/time-utils';
import { JobOrderValidator } from '../shared/job-order-validator';

interface NewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: (job: Job) => void;
}

// Kartverket API for Norwegian addresses
const KARTVERKET_API = 'https://ws.geonorge.no/adresser/v1/punkt';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

export function NewJobModal({
  isOpen,
  onClose,
  onJobCreated,
}: NewJobModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [existingOrderNumbers, setExistingOrderNumbers] = useState<number[]>(
    []
  );
  const [formData, setFormData] = useState<CreateJobPayload>({
    ordre_nr: 0,
    tittel: '',
    adresse: '',
    telefon_nr: '',
    beskrivelse: '',
    ferdig: false,
  });

  // Load existing order numbers and generate next order number when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadExistingNumbers = async () => {
        try {
          const jobs = await jobsAPI.getJobs();
          const orderNumbers = jobs.map((job) => job.ordre_nr);
          setExistingOrderNumbers(orderNumbers);

          // Generate next available order number
          const nextOrderNr = suggestNextJobOrderNumber(orderNumbers);
          setFormData((prev) => ({ ...prev, ordre_nr: nextOrderNr }));
        } catch (error) {
          console.error('Failed to load existing jobs:', error);
          // Fallback to simple generation
          const currentYear = new Date().getFullYear();
          const yearCode = (currentYear - 2017) % 10;
          const nextOrderNr = yearCode * 1000 + 1; // Start with sequence 1
          setFormData((prev) => ({ ...prev, ordre_nr: nextOrderNr }));
        }
      };

      loadExistingNumbers();
    }
  }, [isOpen]);

  const getCurrentLocation = async (): Promise<LocationCoords> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  };

  const reverseGeocode = async (coords: LocationCoords): Promise<string> => {
    try {
      const response = await fetch(
        `${KARTVERKET_API}?lon=${coords.longitude}&lat=${coords.latitude}&utkoordsys=4258`
      );

      if (!response.ok) {
        throw new Error('Failed to get address');
      }

      const data = await response.json();

      if (data.adresser && data.adresser.length > 0) {
        const address = data.adresser[0];
        // Format: Street number, Postal code City
        return `${address.adressetekst}, ${address.postnummer} ${address.poststed}`;
      }

      throw new Error('No address found');
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw error;
    }
  };

  const handleUseCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const coords = await getCurrentLocation();
      const address = await reverseGeocode(coords);

      setFormData((prev) => ({ ...prev, adresse: address }));

      toast({
        title: 'Location detected',
        description: 'Current address has been filled in',
      });
    } catch (error) {
      console.error('Location error:', error);
      toast({
        title: 'Location error',
        description:
          'Could not get current location. Please enter address manually.',
        variant: 'destructive',
      });
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.ordre_nr || !formData.tittel) {
      toast({
        title: 'Missing information',
        description: 'Please fill in order number and title',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const newJob = await jobsAPI.createJob(formData);
      onJobCreated(newJob);

      // Reset form
      setFormData({
        ordre_nr: 0,
        tittel: '',
        adresse: '',
        telefon_nr: '',
        beskrivelse: '',
        ferdig: false,
      });
    } catch (error) {
      console.error('Failed to create job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateJobPayload, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Create New Job</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Order Number */}
            <JobOrderValidator
              value={formData.ordre_nr}
              onChange={(orderNumber) =>
                handleInputChange('ordre_nr', orderNumber)
              }
              existingOrderNumbers={existingOrderNumbers}
              required
            />

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="tittel">Job Title *</Label>
              <Input
                id="tittel"
                value={formData.tittel}
                onChange={(e) => handleInputChange('tittel', e.target.value)}
                placeholder="e.g., Electrical Installation"
                required
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="adresse">Address</Label>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUseCurrentLocation}
                  disabled={gettingLocation}
                  className="w-full transition-colors hover:bg-muted"
                >
                  {gettingLocation ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4 mr-2" />
                  )}
                  Use Current Location
                </Button>
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => handleInputChange('adresse', e.target.value)}
                  placeholder="Or enter address manually"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="telefon_nr">Phone Number</Label>
              <Input
                id="telefon_nr"
                type="tel"
                value={formData.telefon_nr}
                onChange={(e) =>
                  handleInputChange('telefon_nr', e.target.value)
                }
                placeholder="+47 xxx xx xxx"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="beskrivelse">Description</Label>
              <Textarea
                id="beskrivelse"
                value={formData.beskrivelse}
                onChange={(e) =>
                  handleInputChange('beskrivelse', e.target.value)
                }
                placeholder="Job description..."
                rows={3}
              />
            </div>
          </form>
        </div>

        {/* Actions - Fixed at bottom */}
        <div className="flex gap-3 pt-4 border-t flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Job'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
