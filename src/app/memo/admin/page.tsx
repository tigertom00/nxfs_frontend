'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layouts/navbar';
import { useAuthStore } from '@/stores';
import {
  jobsAPI,
  suppliersAPI,
  materialsAPI,
  timeTrackingAPI,
  Job,
  Supplier,
  Material,
  TimeEntry,
} from '@/lib/api';
import { ThemeInitializer } from '@/components/features/memo/shared/theme-initializer';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase,
  Building2,
  Package,
  Clock,
  Users,
  BarChart3,
  Plus,
  ExternalLink,
  FileText,
} from 'lucide-react';

export default function MemoAdminPage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuthStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalHours: 0,
    totalSuppliers: 0,
    totalMaterials: 0,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated) {return;}

      try {
        setLoading(true);

        const [jobsData, suppliersData, materialsData, timeEntriesData] =
          await Promise.all([
            jobsAPI.getJobs(),
            suppliersAPI.getSuppliers(),
            materialsAPI.getMaterials(),
            timeTrackingAPI.getTimeEntries(),
          ]);

        // Extract arrays from potentially paginated responses
        const jobsArray = Array.isArray(jobsData)
          ? jobsData
          : jobsData.results || [];
        const suppliersArray = Array.isArray(suppliersData)
          ? suppliersData
          : suppliersData.results || [];
        const materialsArray = Array.isArray(materialsData)
          ? materialsData
          : materialsData.results || [];
        const timeEntriesArray = Array.isArray(timeEntriesData)
          ? timeEntriesData
          : timeEntriesData.results || [];

        setJobs(jobsArray);
        setSuppliers(suppliersArray);
        setMaterials(materialsArray);
        setTimeEntries(timeEntriesArray);

        // Calculate stats
        const activeJobs = jobsArray.filter((job) => !job.ferdig).length;
        const completedJobs = jobsArray.filter((job) => job.ferdig).length;
        const totalHours = jobsArray.reduce(
          (sum, job) => sum + (job.total_hours || 0),
          0
        );

        setStats({
          totalJobs: jobsArray.length,
          activeJobs,
          completedJobs,
          totalHours,
          totalSuppliers: suppliersArray.length,
          totalMaterials: materialsArray.length,
        });
      } catch (error) {
        // Error handled by API layer
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('no-NO');
  };

  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  // Show loading or redirect while checking auth
  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <>
        <ThemeInitializer />
        <Navbar />
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ThemeInitializer />
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">📊 Memo Admin</h1>
              <p className="text-muted-foreground">
                Work Order Management Dashboard
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push('/memo/dashboard')}
                variant="outline"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button
                onClick={() => router.push('/memo/reports')}
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                Reports
              </Button>
              <Button onClick={() => router.push('/memo')} variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Go to Mobile App
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Jobs
                </CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalJobs}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeJobs} active, {stats.completedJobs} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Hours
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTime(stats.totalHours)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all projects
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
                <p className="text-xs text-muted-foreground">
                  Active suppliers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Materials</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalMaterials}</div>
                <p className="text-xs text-muted-foreground">In database</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Time Entries
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{timeEntries.length}</div>
                <p className="text-xs text-muted-foreground">
                  Total logged entries
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Rate
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalJobs > 0
                    ? Math.round((stats.activeJobs / stats.totalJobs) * 100)
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  Jobs in progress
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for different data views */}
          <Tabs defaultValue="jobs" className="space-y-4">
            <TabsList>
              <TabsTrigger value="jobs">Jobs</TabsTrigger>
              <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="timeentries">Time Entries</TabsTrigger>
            </TabsList>

            {/* Jobs Tab */}
            <TabsContent value="jobs">
              <Card>
                <CardHeader>
                  <CardTitle>Work Orders</CardTitle>
                  <CardDescription>
                    All work orders in the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job) => (
                        <TableRow key={job.ordre_nr}>
                          <TableCell className="font-medium">
                            #{job.ordre_nr}
                          </TableCell>
                          <TableCell>{job.tittel || 'Untitled'}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {job.adresse || 'No address'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={job.ferdig ? 'default' : 'secondary'}
                            >
                              {job.ferdig ? 'Completed' : 'Active'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatTime(job.total_hours || 0)}
                          </TableCell>
                          <TableCell>{formatDate(job.created_at)}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                router.push(`/memo/job/${job.ordre_nr}`)
                              }
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Suppliers Tab */}
            <TabsContent value="suppliers">
              <Card>
                <CardHeader>
                  <CardTitle>Suppliers</CardTitle>
                  <CardDescription>
                    Material suppliers in the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suppliers.map((supplier) => (
                        <TableRow key={supplier.id}>
                          <TableCell>{supplier.id}</TableCell>
                          <TableCell className="font-medium">
                            {supplier.navn}
                          </TableCell>
                          <TableCell>
                            {supplier.hjemmeside ? (
                              <a
                                href={supplier.hjemmeside}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {supplier.hjemmeside}
                              </a>
                            ) : (
                              'No URL'
                            )}
                          </TableCell>
                          <TableCell>
                            {supplier.created_at
                              ? formatDate(supplier.created_at)
                              : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Materials Tab */}
            <TabsContent value="materials">
              <Card>
                <CardHeader>
                  <CardTitle>Materials</CardTitle>
                  <CardDescription>
                    Available materials and components
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>EL-Number</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materials.map((material) => (
                        <TableRow key={material.id}>
                          <TableCell>{material.id}</TableCell>
                          <TableCell className="font-medium">
                            {material.tittel || 'Untitled'}
                          </TableCell>
                          <TableCell>
                            {material.el_nr ? (
                              <Badge variant="outline">{material.el_nr}</Badge>
                            ) : (
                              'No EL-nr'
                            )}
                          </TableCell>
                          <TableCell>
                            {material.leverandor?.navn || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            {material.varemerke || 'No brand'}
                          </TableCell>
                          <TableCell>
                            {material.kategori ? (
                              <Badge variant="secondary">
                                {material.kategori.blokknummer} -{' '}
                                {material.kategori.kategori}
                              </Badge>
                            ) : (
                              'No category'
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {material.approved && (
                                <Badge variant="default" className="text-xs">
                                  ✓
                                </Badge>
                              )}
                              {material.favorites && (
                                <Badge variant="secondary" className="text-xs">
                                  ★
                                </Badge>
                              )}
                              {material.discontinued && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  ⚠
                                </Badge>
                              )}
                              {!material.in_stock && (
                                <Badge variant="outline" className="text-xs">
                                  ∅
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDate(material.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Time Entries Tab */}
            <TabsContent value="timeentries">
              <Card>
                <CardHeader>
                  <CardTitle>Time Entries</CardTitle>
                  <CardDescription>All logged time entries</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Job</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timeEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{entry.id}</TableCell>
                          <TableCell>
                            <Badge variant="outline">#{entry.jobb}</Badge>
                          </TableCell>
                          <TableCell>User {typeof entry.user === 'object' ? entry.user.id : entry.user}</TableCell>
                          <TableCell>{formatTime(entry.timer || 0)}</TableCell>
                          <TableCell>
                            {entry.dato ? formatDate(entry.dato) : 'No date'}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {entry.beskrivelse || 'No description'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
