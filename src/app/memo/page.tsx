'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/layouts/navbar';
import { useAuthStore } from '@/stores';
import { jobsAPI, Job } from '@/lib/api';
import { NewJobModal } from '@/components/features/memo/landing/new-job-modal';
import { EditJobModal } from '@/components/features/memo/landing/edit-job-modal';
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
import { Input } from '@/components/ui/input';
import {
  Plus,
  MapPin,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks';

export default function MemoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isInitialized } = useAuthStore();

  // State
  const [nearbyJobs, setNearbyJobs] = useState<Job[]>([]);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [locationChecked, setLocationChecked] = useState(false);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [showEditJobModal, setShowEditJobModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 500);

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
          radius: 1000,
          ferdig: false,
        });

        setNearbyJobs(nearby);

        if (nearby.length > 0) {
          toast({
            title: 'Nearby jobs found!',
            description: `Found ${nearby.length} job${nearby.length > 1 ? 's' : ''} within 1000m`,
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

  // Fetch jobs with search and pagination
  useEffect(() => {
    const fetchJobs = async () => {
      if (!isAuthenticated) return;

      setLoading(true);
      try {
        const isNumericSearch = debouncedSearch && /^\d+$/.test(debouncedSearch);

        // If searching by number, fetch all jobs to filter client-side
        const response = await jobsAPI.getJobs({
          search: !isNumericSearch ? debouncedSearch || undefined : undefined,
          page: isNumericSearch ? undefined : currentPage,
          page_size: isNumericSearch ? 100 : pageSize, // Get more results for numeric search
          ferdig: false,
          ordering: '-ordre_nr', // Sort by ordre_nr descending (highest first)
        });

        // Handle both paginated and array responses
        let jobs: Job[] = [];
        if (Array.isArray(response)) {
          jobs = response;
        } else {
          jobs = response.results || [];
        }

        // If search query is numeric, filter client-side for partial matches
        if (isNumericSearch) {
          jobs = jobs.filter((job) =>
            job.ordre_nr.toString().includes(debouncedSearch)
          );

          // For numeric search, implement client-side pagination
          const startIdx = (currentPage - 1) * pageSize;
          const endIdx = startIdx + pageSize;
          const totalFiltered = jobs.length;
          jobs = jobs.slice(startIdx, endIdx);

          setAllJobs(jobs);
          setTotalCount(totalFiltered);
          setTotalPages(Math.ceil(totalFiltered / pageSize));
        } else {
          // Sort by ordre_nr (highest to lowest)
          jobs.sort((a, b) => {
            const numA = parseInt(a.ordre_nr.toString());
            const numB = parseInt(b.ordre_nr.toString());
            return numB - numA;
          });

          setAllJobs(jobs);
          if (Array.isArray(response)) {
            setTotalCount(jobs.length);
            setTotalPages(Math.ceil(jobs.length / pageSize));
          } else {
            setTotalCount(response.count || 0);
            setTotalPages(response.page_info?.total_pages || 1);
          }
        }
      } catch (error) {
        setAllJobs([]);
        setTotalCount(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [isAuthenticated, debouncedSearch, currentPage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Handle job selection
  const handleJobSelect = (ordreNr: string | number) => {
    router.push(`/memo/job/${ordreNr}`);
  };

  // Handle edit job
  const handleEditJob = (job: Job, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedJob(job);
    setShowEditJobModal(true);
  };

  // Handle new job creation
  const handleJobCreated = (newJob: Job) => {
    setShowNewJobModal(false);
    router.push(`/memo/job/${newJob.ordre_nr}`);
  };

  // Handle job updated
  const handleJobUpdated = (updatedJob: Job) => {
    setAllJobs((prev) =>
      prev.map((job) =>
        job.ordre_nr === updatedJob.ordre_nr ? updatedJob : job
      )
    );
    setShowEditJobModal(false);
    toast({
      title: 'Job updated',
      description: `Job #${updatedJob.ordre_nr} has been updated successfully`,
    });
  };

  // Handle job deleted
  const handleJobDeleted = (ordreNr: string) => {
    setAllJobs((prev) => prev.filter((job) => job.ordre_nr !== ordreNr));
    setTotalCount((prev) => prev - 1);
    setShowEditJobModal(false);
    toast({
      title: 'Job deleted',
      description: `Job #${ordreNr} has been deleted successfully`,
    });
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
      <div className="min-h-screen bg-background pb-24">
        <main className="container mx-auto px-4 py-8 max-w-4xl">
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
                    <Card
                      className="bg-card border-border hover-lift cursor-pointer"
                      onClick={() => handleJobSelect(job.ordre_nr)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold">
                                Job #{job.ordre_nr}
                              </h3>
                              {job.distance !== undefined && (
                                <span className="text-sm font-medium text-green-600">
                                  {Math.round(job.distance)}m away
                                </span>
                              )}
                            </div>
                            {job.tittel && (
                              <p className="text-muted-foreground">
                                {job.tittel}
                              </p>
                            )}
                            {job.adresse && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
                                <MapPin className="h-3 w-3" />
                                {job.adresse}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Jobs List with Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    All Jobs
                  </CardTitle>
                  <CardDescription>
                    Search by job number, title, or address
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search jobs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Loading State */}
                  {loading && (
                    <div className="py-8 text-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p>Loading jobs...</p>
                    </div>
                  )}

                  {/* Jobs List */}
                  {!loading && allJobs.length > 0 && (
                    <div className="space-y-2">
                      {allJobs.map((job, index) => (
                        <motion.div
                          key={job.ordre_nr}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                          onClick={() => handleJobSelect(job.ordre_nr)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-foreground">
                                  Job #{job.ordre_nr}
                                </h3>
                                {job.total_hours > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    {Math.round(job.total_hours / 60)}h
                                  </span>
                                )}
                              </div>
                              {job.tittel && (
                                <p className="text-sm text-foreground truncate">
                                  {job.tittel}
                                </p>
                              )}
                              {job.adresse && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {job.adresse}
                                  {job.poststed && `, ${job.poststed}`}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleEditJob(job, e)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Empty State */}
                  {!loading && allJobs.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground">
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No jobs found</p>
                      {searchQuery && (
                        <p className="text-sm mt-2">
                          Try a different search term
                        </p>
                      )}
                    </div>
                  )}

                  {/* Pagination */}
                  {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages} ({totalCount} total)
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </main>
      </div>

      {/* Floating Action Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        className="fixed bottom-6 left-6 z-40"
      >
        <Button
          onClick={() => setShowNewJobModal(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </motion.div>

      {/* New Job Modal */}
      <NewJobModal
        isOpen={showNewJobModal}
        onClose={() => setShowNewJobModal(false)}
        onJobCreated={handleJobCreated}
      />

      {/* Edit Job Modal */}
      <EditJobModal
        isOpen={showEditJobModal}
        onClose={() => setShowEditJobModal(false)}
        onJobUpdated={handleJobUpdated}
        onJobDeleted={handleJobDeleted}
        job={selectedJob}
      />

      <ChatBot />
    </>
  );
}
