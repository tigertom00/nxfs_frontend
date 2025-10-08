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
import { MapPin, Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { suggestNextJobOrderNumber } from '@/lib/time-utils';
import { JobOrderValidator } from '../shared/job-order-validator';

interface NewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: (job: Job) => void;
}

// Kartverket API for Norwegian addresses (punktsok = point search for reverse geocoding)
const KARTVERKET_API = 'https://ws.geonorge.no/adresser/v1/punktsok';

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
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [searchResults, setSearchResults] = useState<AddressData[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [addressSearchTimeout, setAddressSearchTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const [existingOrderNumbers, setExistingOrderNumbers] = useState<string[]>(
    []
  );
  const [formData, setFormData] = useState<CreateJobPayload>({
    ordre_nr: '',
    tittel: '',
    adresse: '',
    postnummer: '',
    poststed: '',
    telefon_nr: '',
    beskrivelse: '',
    ferdig: false,
  });

  // Load existing order numbers and generate next order number when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadExistingNumbers = async () => {
        try {
          const response = await jobsAPI.getJobs();

          // Handle paginated response
          const jobs = Array.isArray(response)
            ? response
            : response.results || [];

          const orderNumbers = jobs.map((job) => job.ordre_nr);
          setExistingOrderNumbers(orderNumbers);

          // Generate next available order number (convert strings to numbers for calculation)
          const orderNumbersAsNumbers = orderNumbers
            .map((num) => parseInt(num, 10))
            .filter((num) => !isNaN(num));
          const nextOrderNr = suggestNextJobOrderNumber(orderNumbersAsNumbers);
          setFormData((prev) => ({ ...prev, ordre_nr: String(nextOrderNr) }));
        } catch (error) {
          // Fallback to simple generation
          const currentYear = new Date().getFullYear();
          const yearCode = (currentYear - 2017) % 10;
          const nextOrderNr = yearCode * 1000 + 1; // Start with sequence 1
          setFormData((prev) => ({ ...prev, ordre_nr: String(nextOrderNr) }));
        }
      };

      loadExistingNumbers();
    }
  }, [isOpen]);

  const getCurrentLocation = async (): Promise<LocationCoords> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      // Check if we're in a secure context
      if (!window.isSecureContext) {
        reject(
          new Error(
            'Geolocation requires HTTPS or localhost. Please access via localhost:3000 or use HTTPS.'
          )
        );
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
          // Provide user-friendly error messages
          let errorMessage = 'Could not get your location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                'Location permission denied. Please enable location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage =
                'Location information unavailable. Please check your device settings.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  };

  interface AddressData {
    adresse: string;
    postnummer: string;
    poststed: string;
  }

  const reverseGeocode = async (
    coords: LocationCoords
  ): Promise<AddressData> => {
    try {
      // punktsok endpoint requires radius parameter, default to 100 meters
      const url = `${KARTVERKET_API}?lat=${coords.latitude}&lon=${coords.longitude}&radius=100&treffPerSide=1`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to get address: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.adresser && data.adresser.length > 0) {
        const address = data.adresser[0];

        // Extract structured address data
        const addressData: AddressData = {
          adresse: address.adressetekst || '',
          postnummer: address.postnummer || '',
          poststed: address.poststed || '',
        };

        return addressData;
      }

      throw new Error('No address found within 100m radius');
    } catch (error) {
      throw error;
    }
  };

  const searchAddress = async (searchText: string): Promise<AddressData[]> => {
    try {
      if (!searchText || searchText.trim().length < 3) {
        return [];
      }

      const url = `https://ws.geonorge.no/adresser/v1/sok?sok=${encodeURIComponent(searchText)}&treffPerSide=5`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Search failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.adresser && data.adresser.length > 0) {
        const results: AddressData[] = data.adresser.map((address: any) => ({
          adresse: address.adressetekst || '',
          postnummer: address.postnummer || '',
          poststed: address.poststed || '',
        }));
        return results;
      }

      return [];
    } catch (error) {
      throw error;
    }
  };

  const extractStreetNameWithoutNumber = (address: string): string => {
    // Remove street number from address (e.g., "Stortingsgata 4" -> "Stortingsgata")
    // Match common Norwegian address patterns
    return address.replace(/\s+\d+[A-Za-z]?(\s|$).*$/, '').trim();
  };

  const handleUseCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const coords = await getCurrentLocation();

      const addressData = await reverseGeocode(coords);

      // Auto-fill title with street name (without number)
      const streetName = extractStreetNameWithoutNumber(addressData.adresse);

      setFormData((prev) => ({
        ...prev,
        tittel: streetName || prev.tittel, // Only update if we got a valid street name
        adresse: addressData.adresse,
        postnummer: addressData.postnummer,
        poststed: addressData.poststed,
      }));

      toast({
        title: 'Location detected',
        description: `${addressData.adresse}, ${addressData.postnummer} ${addressData.poststed}`,
      });
    } catch (error) {
      toast({
        title: 'Location error',
        description:
          error instanceof Error
            ? error.message
            : 'Could not get current location. Please enter address manually.',
        variant: 'destructive',
      });
    } finally {
      setGettingLocation(false);
    }
  };

  const handleAddressLookup = async (silent = false) => {
    setSearchingAddress(true);
    setShowResults(false);
    try {
      const results = await searchAddress(formData.adresse || '');

      if (results.length === 0) {
        if (!silent) {
          toast({
            title: 'No results',
            description:
              'No addresses found matching your search. Try a different query.',
            variant: 'destructive',
          });
        }
      } else {
        setSearchResults(results);
        setShowResults(true);
      }
    } catch (error) {
      if (!silent) {
        toast({
          title: 'Search error',
          description:
            error instanceof Error
              ? error.message
              : 'Could not search for address. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setSearchingAddress(false);
    }
  };

  const handleAddressChange = (value: string) => {
    handleInputChange('adresse', value);
    setShowResults(false);

    // Clear existing timeout
    if (addressSearchTimeout) {
      clearTimeout(addressSearchTimeout);
    }

    // Auto-search if user has typed 7+ characters
    if (value.trim().length >= 7) {
      const timeout = setTimeout(() => {
        handleAddressLookup(true); // Silent mode - no error toasts
      }, 2000); // 2 second delay
      setAddressSearchTimeout(timeout);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (addressSearchTimeout) {
        clearTimeout(addressSearchTimeout);
      }
    };
  }, [addressSearchTimeout]);

  const handleSelectAddress = (addressData: AddressData) => {
    setFormData((prev) => ({
      ...prev,
      adresse: addressData.adresse,
      postnummer: addressData.postnummer,
      poststed: addressData.poststed,
    }));
    setShowResults(false);
    setSearchResults([]);
    toast({
      title: 'Address selected',
      description: `${addressData.adresse}, ${addressData.postnummer} ${addressData.poststed}`,
    });
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
        ordre_nr: '',
        tittel: '',
        adresse: '',
        postnummer: '',
        poststed: '',
        telefon_nr: '',
        beskrivelse: '',
        ferdig: false,
      });
    } catch (error) {
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

        {/* Actions - Moved to top for mobile accessibility */}
        <div className="flex gap-3 pb-4 border-b flex-shrink-0">
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

            {/* Address Section */}
            <div className="space-y-2">
              <Label>Address Information</Label>
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

              <div className="space-y-2 pt-2">
                <div className="relative">
                  <Label htmlFor="adresse" className="text-sm">
                    Street Address
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="adresse"
                      value={formData.adresse}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      placeholder="e.g., Stortingsgata 4"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleAddressLookup(false)}
                      disabled={
                        searchingAddress ||
                        !formData.adresse ||
                        formData.adresse.trim().length < 3
                      }
                      title="Search for postal code and city"
                    >
                      {searchingAddress ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Search Results Dropdown - directly below address field */}
                  {showResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {searchResults.map((result, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSelectAddress(result)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors border-b border-border last:border-b-0 focus:outline-none focus:bg-muted"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-foreground truncate">
                              {result.adresse}
                            </span>
                            <span className="text-muted-foreground whitespace-nowrap text-xs">
                              {result.postnummer} {result.poststed}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="postnummer" className="text-sm">
                      Postal Code
                    </Label>
                    <Input
                      id="postnummer"
                      value={formData.postnummer}
                      onChange={(e) => {
                        handleInputChange('postnummer', e.target.value);
                        setShowResults(false); // Hide results when user manually edits
                      }}
                      placeholder="e.g., 0158"
                      maxLength={4}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="poststed" className="text-sm">
                      City
                    </Label>
                    <Input
                      id="poststed"
                      value={formData.poststed}
                      onChange={(e) => {
                        handleInputChange('poststed', e.target.value);
                        setShowResults(false); // Hide results when user manually edits
                      }}
                      placeholder="e.g., Oslo"
                      className="mt-1"
                    />
                  </div>
                </div>
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
      </DialogContent>
    </Dialog>
  );
}
