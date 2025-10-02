'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/layouts/navbar';
import { useAuthStore } from '@/stores';
import { jobsAPI, Job } from '@/lib/api';
import { NewJobModal } from '@/components/features/memo/landing/new-job-modal';
import { ThemeInitializer } from '@/components/features/memo/shared/theme-initializer';
import ChatBot from '@/components/features/chat/chatbot';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Plus, MapPin, Loader2, Search, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export default function MemoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isInitialized } = useAuthStore();

  // State
  const [nearbyJobs, setNearbyJobs] = useState<Job[]>([]);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [locationChecked, setLocationChecked] = useState(false);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Get current location
  const getCurrentLocation = async (): Promise<{
    latitude: number;
    longitude: number;
  }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      if (!window.isSecureContext) {
        reject(new Error('Geolocation requires HTTPS or localhost.'));
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
          let errorMessage = 'Could not get your location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    });
  };

  // Check for nearby jobs on page load
  useEffect(() => {
    const checkNearbyJobs = async () => {
      if (!isAuthenticated || locationChecked) return;

      setCheckingLocation(true);
      setLocationChecked(true);

      try {
        const currentLocation = await getCurrentLocation();
        const nearby = await jobsAPI.getNearbyJobs({
          lat: currentLocation.latitude,
          lon: currentLocation.longitude,
          radius: 100,
          ferdig: false,
        });

        setNearbyJobs(nearby);

        if (nearby.length > 0) {
          toast({
            title: 'Nearby jobs found!',
            description: `Found ${nearby.length} job${nearby.length > 1 ? 's' : ''} within 100m`,
          });
        }
      } catch (error) {
        // Silently fail - location is optional
      } finally {
        setCheckingLocation(false);
      }
    };

    checkNearbyJobs();
  }, [isAuthenticated, locationChecked, toast]);

  // Search for jobs
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const choices = await jobsAPI.getJobChoices({
        search: query,
        limit: 50,
        ferdig: false,
      });

      setSearchResults(
        choices.map((choice) => ({
          value: choice.value.toString(),
          label: choice.label,
        }))
      );
    } catch (error) {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle job selection from search
  const handleJobSelect = (ordreNr: string) => {
    setSearchOpen(false);
    router.push(`/memo/job/${ordreNr}`);
  };

  // Handle new job creation
  const handleJobCreated = (newJob: Job) => {
    setShowNewJobModal(false);
    router.push(`/memo/job/${newJob.ordre_nr}`);
  };

  // Show loading or redirect while checking auth
  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ThemeInitializer />
      <Navbar />
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold text-foreground">NXFS Memo</h1>
              <p className="text-muted-foreground">Work Order Management</p>
            </div>

            {/* Nearby Jobs Section */}
            {checkingLocation && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-card border-border">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center gap-3 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Checking for nearby jobs...</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {!checkingLocation && nearbyJobs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-green-600">
                  <MapPin className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Nearby Jobs</h2>
                </div>

                {nearbyJobs.map((job, index) => (
                  <motion.div
                    key={job.ordre_nr}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-card border-border hover-lift cursor-pointer group">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <CardTitle className="text-xl">
                              Job #{job.ordre_nr}
                            </CardTitle>
                            {job.tittel && (
                              <CardDescription className="text-base">
                                {job.tittel}
                              </CardDescription>
                            )}
                            {job.adresse && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
                                <MapPin className="h-3 w-3" />
                                {job.adresse}
                              </p>
                            )}
                            {job.distance !== undefined && (
                              <p className="text-sm font-medium text-green-600 mt-1">
                                {Math.round(job.distance)}m away
                              </p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={() => handleJobSelect(job.ordre_nr)}
                          className="w-full"
                          size="lg"
                        >
                          Enter Job
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Main Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Search Job */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Search for Job
                  </CardTitle>
                  <CardDescription>
                    Search by job number, title, or address
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={searchOpen}
                        className="w-full justify-between h-12 text-left"
                      >
                        <span
                          className={cn(
                            'truncate',
                            !searchQuery && 'text-muted-foreground'
                          )}
                        >
                          {searchQuery || 'Type to search jobs...'}
                        </span>
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search jobs..."
                          value={searchQuery}
                          onValueChange={handleSearch}
                        />
                        <CommandList>
                          {searchLoading && (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                              Searching...
                            </div>
                          )}
                          {!searchLoading &&
                            searchQuery &&
                            searchResults.length === 0 && (
                              <CommandEmpty>No jobs found.</CommandEmpty>
                            )}
                          {!searchLoading && searchResults.length > 0 && (
                            <CommandGroup heading="Jobs">
                              {searchResults.map((result) => (
                                <CommandItem
                                  key={result.value}
                                  value={result.value}
                                  onSelect={() => handleJobSelect(result.value)}
                                  className="cursor-pointer"
                                >
                                  {result.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </CardContent>
              </Card>

              {/* Create New Job */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Create New Job
                  </CardTitle>
                  <CardDescription>Start a new work order</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setShowNewJobModal(true)}
                    className="w-full"
                    size="lg"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    New Job
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </main>
      </div>

      {/* New Job Modal */}
      <NewJobModal
        isOpen={showNewJobModal}
        onClose={() => setShowNewJobModal(false)}
        onJobCreated={handleJobCreated}
      />

      <ChatBot />
    </>
  );
}
