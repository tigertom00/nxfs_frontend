'use client';

import { useState, useEffect } from 'react';

// Extend window interface for search timeout
declare global {
  interface Window {
    searchTimeout?: NodeJS.Timeout;
  }
}
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  materialsAPI,
  jobMaterialsAPI,
  suppliersAPI,
  elNumberLookupAPI,
  memoCategoriesAPI,
} from '@/lib/api';
import {
  Material,
  JobMaterial,
  Supplier,
  RecentJobMaterial,
  UserBasic,
} from '@/lib/api';
import { BarcodeScanner } from '@/components/features/memo/shared/barcode-scanner';
import { MaterialDetailModal } from '@/components/features/memo/shared/material-detail-modal';
import { AdvancedMaterialSearch } from '@/components/features/memo/shared/advanced-material-search';
import { efoService, parseElNumber } from '@/lib/efo-api';
import { useToast } from '@/hooks/use-toast';
import { useUIStore } from '@/stores';
import { useIntl } from '@/hooks/use-intl';
import {
  Package,
  Scan,
  Star,
  Plus,
  Minus,
  X,
  Search,
  Heart,
  Clock,
  Loader2,
  Trash2,
  Info,
  AlertTriangle,
  User,
  Users,
} from 'lucide-react';

interface MaterialManagerProps {
  jobId: number;
  ordreNr?: string; // Order number for API filtering
}

interface SelectedMaterial extends Material {
  quantity: number;
}

export function MaterialManager({ jobId, ordreNr }: MaterialManagerProps) {
  const { toast } = useToast();
  const { language } = useUIStore();
  const { t } = useIntl();
  const [showScanner, setShowScanner] = useState(false);
  const [showMaterialDialog, setShowMaterialDialog] = useState(false);
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [jobMaterials, setJobMaterials] = useState<JobMaterial[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<
    SelectedMaterial[]
  >([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentMaterials, setRecentMaterials] = useState<RecentJobMaterial[]>(
    []
  );
  const [favoriteMaterials, setFavoriteMaterials] = useState<Material[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedMaterialForDetail, setSelectedMaterialForDetail] =
    useState<Material | null>(null);
  const [displayMaterials, setDisplayMaterials] = useState<Material[]>([]);
  const [showingSearchResults, setShowingSearchResults] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const [materialTab, setMaterialTab] = useState('view');
  const [elNumberInput, setElNumberInput] = useState('');
  const [elLookupResult, setElLookupResult] = useState<any>(null);
  const [showELResult, setShowELResult] = useState(false);
  const [recentMaterialsFilter, setRecentMaterialsFilter] = useState<
    'my' | 'all'
  >('my');
  const [materialToRemove, setMaterialToRemove] = useState<JobMaterial | null>(
    null
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [categories, setCategories] = useState<any[]>([]);

  // Load materials and job materials
  useEffect(() => {
    const loadData = async () => {
      await loadMaterials(); // Load materials first
      await loadRecentMaterials(); // Load recent materials from server
    };

    loadData();
    loadJobMaterials();
    loadFavoriteMaterials();
    loadSuppliers();
    loadCategories();
  }, [jobId]);

  const loadMaterials = async () => {
    try {
      const result = await materialsAPI.getAllMaterials(); // Use backward compatible method
      const materials = Array.isArray(result) ? result : [];
      setAllMaterials(materials);
      setDisplayMaterials(materials); // Initialize display materials
    } catch (error) {
      // Set empty arrays on error to prevent map errors
      setAllMaterials([]);
      setDisplayMaterials([]);
    }
  };

  const loadFavoriteMaterials = async () => {
    try {
      const favorites = await materialsAPI.getFavorites();

      // Handle paginated response - extract results array
      const favoritesArray = Array.isArray(favorites)
        ? favorites
        : favorites?.results && Array.isArray(favorites.results)
          ? favorites.results
          : [];

      setFavoriteMaterials(favoritesArray);
    } catch (error) {
      setFavoriteMaterials([]);
    }
  };

  const loadJobMaterials = async () => {
    try {
      // API expects numeric job ID
      const jobIdToUse = ordreNr ? parseInt(ordreNr) : jobId;

      const jobMaterials = await jobMaterialsAPI.getJobMaterials({
        jobb: jobIdToUse.toString(),
      });

      // Handle paginated response - extract results array
      const jobMaterialsArray = Array.isArray(jobMaterials)
        ? jobMaterials
        : jobMaterials?.results && Array.isArray(jobMaterials.results)
          ? jobMaterials.results
          : [];
      const jobSpecificMaterials = jobMaterialsArray.filter(
        (jm) => jm.jobb === jobIdToUse.toString()
      );
      setJobMaterials(jobSpecificMaterials);
    } catch (error) {
      setJobMaterials([]);
    }
  };

  const loadSuppliers = async () => {
    try {
      const suppliersData = await suppliersAPI.getSuppliers({
        page_size: 1000, // Get all suppliers
      });
      const suppliersArray = Array.isArray(suppliersData)
        ? suppliersData
        : suppliersData?.results || [];
      setSuppliers(suppliersArray);
    } catch (error) {
      setSuppliers([]);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await memoCategoriesAPI.getCategories({
        page_size: 1000, // Get all categories
      });
      const categoriesArray = Array.isArray(categoriesData)
        ? categoriesData
        : categoriesData?.results || [];
      setCategories(categoriesArray);
    } catch (error) {
      setCategories([]);
    }
  };

  const loadRecentMaterials = async (filter?: 'my' | 'all') => {
    try {
      const filterToUse = filter || recentMaterialsFilter;

      // Load recent materials from server - last 30 days by default
      const recentJobMaterials = await jobMaterialsAPI.getRecentJobMaterials({
        days: 30,
        all_users: filterToUse === 'all',
      });

      setRecentMaterials(recentJobMaterials);
    } catch (error) {
      setRecentMaterials([]);
    }
  };

  // Refresh recent materials after adding materials to jobs
  const refreshRecentMaterials = async () => {
    await loadRecentMaterials();
  };

  // Handle filter change for recent materials
  const handleRecentMaterialsFilterChange = async (filter: 'my' | 'all') => {
    setRecentMaterialsFilter(filter);
    await loadRecentMaterials(filter);
  };

  // Helper function to safely get user display info
  const getUserDisplay = (user?: UserBasic | number) => {
    if (!user || typeof user === 'number') {
      return { displayName: 'Unknown', initials: '?', avatar: null };
    }
    const displayName = user.display_name || user.username;
    const initials = displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    return {
      displayName,
      initials,
      avatar: user.profile_picture,
      email: user.email,
      phone: user.phone,
    };
  };

  const handleScanELNumber = () => {
    setShowScanner(true);
  };

  const handleELNumberLookup = async () => {
    // Remove spaces and check if we have a valid EL number
    const rawElNumber = elNumberInput.replace(/\s/g, '');
    if (!rawElNumber.trim()) {
      toast({
        title: 'Enter EL Number',
        description: 'Please enter an EL number to lookup',
        variant: 'destructive',
      });
      return;
    }

    await handleELNumberScanned(rawElNumber);
  };

  const handleImportFromEL = async (elData: any) => {
    try {
      setLoading(true);

      // Format the data for EFObasen import - capture ALL available fields
      // Ensure leverandor is in the correct format (object with navn field)
      const formattedData = {
        // Basic info
        el_nr: elData.el_nr,
        tittel: elData.tittel,
        varemerke: elData.varemerke,
        varenummer: elData.varenummer,
        gtin_number: elData.gtin_number,
        info: elData.info,
        teknisk_beskrivelse: elData.teknisk_beskrivelse,
        varebetegnelse: elData.varebetegnelse,

        // Dimensions and weight
        hoyde: elData.hoyde,
        bredde: elData.bredde,
        lengde: elData.lengde,
        vekt: elData.vekt,

        // URLs and files
        bilder: elData.bilder ? JSON.stringify(elData.bilder) : undefined, // Convert array to JSON string
        fdv: elData.fdv,
        produktblad: elData.produktblad,
        produkt_url: elData.produkt_url,
        cpr_sertifikat: elData.cpr_sertifikat,
        miljoinformasjon: elData.miljoinformasjon,

        // Status flags
        approved: elData.approved !== undefined ? elData.approved : true,
        discontinued:
          elData.discontinued !== undefined ? elData.discontinued : false,
        in_stock: elData.in_stock !== undefined ? elData.in_stock : true,

        // Category
        kategori: elData.kategori,

        // Format leverandor - handle both string and object formats
        leverandor:
          typeof elData.leverandor === 'string'
            ? { navn: elData.leverandor }
            : elData.leverandor?.navn
              ? elData.leverandor
              : { navn: 'Unknown Supplier' },
      };

      // Use the EFObasen import endpoint which handles supplier creation
      const importedMaterial =
        await elNumberLookupAPI.importFromEFObasen(formattedData);

      if (importedMaterial) {
        // Reload materials to include the new one
        await loadMaterials();

        // Add the imported material directly to selection
        // importedMaterial is the Material object returned from the API
        addMaterialToSelection(importedMaterial);

        setShowELResult(false);
        setElLookupResult(null);
        setElNumberInput('');
        setSearchQuery('');
        setShowingSearchResults(false);

        toast({
          title: 'Material Imported',
          description: `Successfully imported ${elData.tittel || 'material'} and added to selection`,
        });
      }
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: 'Failed to import material. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleELNumberScanned = async (productCode: string) => {
    // Determine if it's a GTIN or EL-number
    const cleanCode = productCode.replace(/\s/g, '');
    const isGTIN = /^\d{8,14}$/.test(cleanCode) && cleanCode.length >= 10; // GTIN is typically 12-13 digits
    const isELNumber =
      /^\d{6,8}$/.test(cleanCode) || /^EL\d{6,8}$/i.test(cleanCode);

    // First, check if material already exists locally
    let existingMaterial: Material | undefined = undefined;

    if (isGTIN) {
      // Search by GTIN in local materials
      existingMaterial = allMaterials.find(
        (m) => m.gtin_number && m.gtin_number.toString() === cleanCode
      );

      if (existingMaterial) {
        addMaterialToSelection(existingMaterial);
        toast({
          title: 'Material Found (GTIN)',
          description: `Added ${existingMaterial.tittel || 'Untitled'} to selection`,
        });
        return;
      }

      // Search in API by GTIN
      try {
        const duplicates = await materialsAPI.checkDuplicates({
          gtin_number: cleanCode,
        });

        // Handle different response formats
        let material: Material | null = null;

        // Check if it's an array format (direct Material[])
        if (Array.isArray(duplicates) && duplicates.length > 0) {
          material = duplicates[0];
        }
        // Check if it's paginated format (PaginatedResponse<Material>)
        else if ('results' in duplicates && Array.isArray(duplicates.results) && duplicates.results.length > 0) {
          material = duplicates.results[0];
        }

        if (material) {
          addMaterialToSelection(material);
          toast({
            title: 'Material Found in Database (GTIN)',
            description: `Added ${material.tittel || 'Untitled'} to selection`,
          });
          return;
        }

        // If no exact match, try fuzzy search with first 11 digits (for product variants)
        if (cleanCode.length >= 11) {
          const gtinPrefix = cleanCode.substring(0, 11);
          const fuzzyResults = await materialsAPI.getMaterials({
            search: gtinPrefix,
            page_size: 5,
          });

          const fuzzyMaterials = Array.isArray(fuzzyResults)
            ? fuzzyResults
            : fuzzyResults.results || [];

          // Find materials where GTIN starts with the same 11 digits
          const variantMatches = fuzzyMaterials.filter(
            (m) => m.gtin_number && m.gtin_number.startsWith(gtinPrefix)
          );

          if (variantMatches.length > 0) {
            // Found a variant - use the first match
            addMaterialToSelection(variantMatches[0]);
            toast({
              title: 'Material Found (Variant)',
              description: `Added ${variantMatches[0].tittel || 'Untitled'} - GTIN variant detected`,
            });
            return;
          }
        }
      } catch (error) {
        console.error('GTIN database search error:', error);
        // Continue to EFObasen lookup even if database search fails
      }
    } else if (isELNumber) {
      // Parse EL-number
      const parsedELNumber = parseElNumber(cleanCode);

      if (!parsedELNumber) {
        toast({
          title: 'Invalid Product Code',
          description: `Could not parse product code from: ${productCode}`,
          variant: 'destructive',
        });
        return;
      }

      // Search by EL-number in local materials
      existingMaterial = allMaterials.find(
        (m) => m.el_nr && m.el_nr.toString() === parsedELNumber.toString()
      );

      if (existingMaterial) {
        addMaterialToSelection(existingMaterial);
        toast({
          title: 'Material Found (EL-Number)',
          description: `Added ${existingMaterial.tittel || 'Untitled'} to selection`,
        });
        return;
      }
    } else {
      toast({
        title: 'Invalid Product Code',
        description: `Please scan a valid GTIN barcode or EL-number`,
        variant: 'destructive',
      });
      return;
    }

    // If not found locally, use N8N lookup (EFObasen) - only for EL-numbers
    if (isGTIN) {
      // GTIN not found - inform user that EFObasen lookup isn't available for GTINs
      toast({
        title: 'Material Not Found',
        description:
          'Product not in database. EFObasen lookup by GTIN is not available - please use EL-number instead.',
        variant: 'destructive',
      });
      return;
    }

    // EL-number lookup in EFObasen
    try {
      setLoading(true);
      toast({
        title: 'Looking up EL-Number',
        description: `Searching for product: ${cleanCode}`,
      });

      const parsedELNumber = parseElNumber(cleanCode);
      const lookupResult = await elNumberLookupAPI.lookupELNumber(
        parsedELNumber!
      );

      // N8N returns an array, get the first item
      const materialData = Array.isArray(lookupResult)
        ? lookupResult[0]
        : lookupResult;

      if (materialData && (materialData.el_nr || materialData.tittel)) {
        // N8N returns data directly, wrap it in the expected structure
        setElLookupResult({ success: true, data: materialData });
        setShowELResult(true);
        toast({
          title: 'Product Found in EFObasen',
          description: `Found material data for ${cleanCode}`,
        });
      } else {
        toast({
          title: 'Material Not Found',
          description: `No material found with EL-number: ${cleanCode}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Lookup Failed',
        description: 'Failed to search for material. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addMaterialToSelection = (material: Material) => {
    setSelectedMaterials((prev) => {
      const existing = prev.find((sm) => sm.id === material.id);
      if (existing) {
        return prev.map((sm) =>
          sm.id === material.id ? { ...sm, quantity: sm.quantity + 1 } : sm
        );
      } else {
        return [...prev, { ...material, quantity: 1 }];
      }
    });
  };

  const updateMaterialQuantity = (materialId: number, change: number) => {
    setSelectedMaterials(
      (prev) =>
        prev
          .map((sm) => {
            if (sm.id === materialId) {
              const newQuantity = Math.max(0, sm.quantity + change);
              return newQuantity === 0
                ? null
                : { ...sm, quantity: newQuantity };
            }
            return sm;
          })
          .filter(Boolean) as SelectedMaterial[]
    );
  };

  const clearMaterialQuantity = (materialId: number) => {
    setSelectedMaterials((prev) => prev.filter((sm) => sm.id !== materialId));
  };

  // Apply category and supplier filters to materials
  const applyFilters = (materials: Material[]) => {
    return materials.filter((material) => {
      // Category filter
      const matchesCategory =
        selectedCategory === 'all' ||
        material.kategori?.id?.toString() === selectedCategory;

      // Supplier filter
      const matchesSupplier =
        selectedSupplier === 'all' ||
        material.leverandor?.id?.toString() === selectedSupplier;

      return matchesCategory && matchesSupplier;
    });
  };

  const filteredMaterials = Array.isArray(displayMaterials)
    ? displayMaterials.filter((material) => {
        // Text search filter
        const matchesSearch =
          !searchQuery ||
          material.tittel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          material.el_nr?.includes(searchQuery) ||
          material.gtin_number?.includes(searchQuery) ||
          material.varenummer?.includes(searchQuery) ||
          material.teknisk_beskrivelse
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          material.varebetegnelse
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          material.info?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          material.varemerke
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          material.leverandor?.navn
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase());

        // Category filter
        const matchesCategory =
          selectedCategory === 'all' ||
          material.kategori?.id?.toString() === selectedCategory;

        // Supplier filter
        const matchesSupplier =
          selectedSupplier === 'all' ||
          material.leverandor?.id?.toString() === selectedSupplier;

        return matchesSearch && matchesCategory && matchesSupplier;
      })
    : [];

  // Apply filters to display materials when showing search results
  const filteredDisplayMaterials = applyFilters(displayMaterials);

  const handleAddToJob = async () => {
    if (selectedMaterials.length === 0) {
      toast({
        title: 'No Materials Selected',
        description: 'Please select materials before adding to job',
        variant: 'destructive',
      });
      return;
    }

    // Validate that all materials have valid IDs
    const invalidMaterials = selectedMaterials.filter(
      (m) => !m.id || m.id <= 0
    );
    if (invalidMaterials.length > 0) {
      toast({
        title: 'Invalid Materials',
        description:
          'Some materials are missing valid IDs. Please try refreshing.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      let hasUpdates = false;

      // Add each selected material to the job
      for (const selectedMaterial of selectedMaterials) {
        // Check if this material already exists in the job
        const existingJobMaterial = jobMaterials.find(
          (jm) => jm.matriell.id === selectedMaterial.id
        );

        if (existingJobMaterial) {
          // Remove the old entry first
          await jobMaterialsAPI.deleteJobMaterial(existingJobMaterial.id);
          hasUpdates = true;
        }

        // Add with new quantity
        await jobMaterialsAPI.createJobMaterial({
          matriell_id: selectedMaterial.id,
          jobb: ordreNr || String(jobId),
          antall: selectedMaterial.quantity,
        });

        // Material will now appear in recent automatically via server
      }

      // Reload job materials and refresh recent materials
      await loadJobMaterials();
      await refreshRecentMaterials();

      // Clear selection
      setSelectedMaterials([]);

      toast({
        title: hasUpdates ? 'Materials Updated' : 'Materials Added',
        description: `${selectedMaterials.length} material(s) ${hasUpdates ? 'updated on' : 'added to'} job`,
      });
    } catch (error) {
      toast({
        title: 'Error Adding Materials',
        description: 'Failed to add materials to job',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!materialToRemove) return;

    try {
      await jobMaterialsAPI.deleteJobMaterial(materialToRemove.id);
      await loadJobMaterials();
      toast({
        title: language === 'no' ? 'Materiale fjernet' : 'Material Removed',
        description:
          language === 'no'
            ? 'Materialet er fjernet fra jobben'
            : 'Material removed from job',
      });
    } catch (error) {
      toast({
        title: language === 'no' ? 'Feil' : 'Error',
        description:
          language === 'no'
            ? 'Kunne ikke fjerne materiale fra jobben'
            : 'Failed to remove material from job',
        variant: 'destructive',
      });
    } finally {
      setMaterialToRemove(null);
    }
  };

  const handleToggleFavorite = async (material: Material) => {
    try {
      await materialsAPI.toggleFavorite(material.id);
      // Reload materials and favorites to get updated status
      await loadMaterials();
      await loadFavoriteMaterials();
    } catch (error) {
      // Error is already handled by the API call
    }
  };

  // Optimized search using API search endpoint
  const performOptimizedSearch = async (searchTerm: string) => {
    try {
      setLoading(true);
      const result = await materialsAPI.searchMaterials({
        search: searchTerm,
        page: 1,
        page_size: 20, // Limit results for better performance
      });

      const materials = 'results' in result ? result.results : result;
      const materialsArray = Array.isArray(materials) ? materials : [];

      // Sort results: exact matches first, then others
      const sortedMaterials = materialsArray.sort((a, b) => {
        const aExact = a.el_nr === searchTerm.replace(/\s/g, '');
        const bExact = b.el_nr === searchTerm.replace(/\s/g, '');
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return 0;
      });

      setDisplayMaterials(sortedMaterials);
      setShowingSearchResults(true);
    } catch (error) {
      // Fallback to local search
      const materialsArray = Array.isArray(allMaterials) ? allMaterials : [];
      const searchResults = materialsArray.filter(
        (material) =>
          material.el_nr?.includes(searchTerm) ||
          material.tittel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          material.gtin_number?.includes(searchTerm) ||
          material.varenummer?.includes(searchTerm)
      );

      // Sort results: exact matches first, then others
      const sortedResults = searchResults.sort((a, b) => {
        const aExact = a.el_nr === searchTerm.replace(/\s/g, '');
        const bExact = b.el_nr === searchTerm.replace(/\s/g, '');
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return 0;
      });

      setDisplayMaterials(sortedResults);
      setShowingSearchResults(true);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMaterial = (jobMaterial: JobMaterial) => {
    // Add the material to selected materials with current quantity for editing
    const materialToEdit = {
      ...jobMaterial.matriell,
      quantity: jobMaterial.antall || 1,
    };

    setSelectedMaterials([materialToEdit]);

    toast({
      title: 'Material Added for Editing',
      description: 'Adjust quantity below and click "Add to Job" to update',
    });
  };

  return (
    <div className="space-y-4">
      {/* Material Management Tabs */}
      <Tabs
        value={materialTab}
        onValueChange={setMaterialTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="view">{t('memo.materials.viewTab')}</TabsTrigger>
          <TabsTrigger value="add">{t('memo.materials.addTab')}</TabsTrigger>
        </TabsList>

        {/* View Tab - Compact expandable list */}
        <TabsContent value="view" className="space-y-0">
          <div className="bg-card border rounded-lg p-4 space-y-4">
            {/* Header inside card */}
            <div className="flex items-center justify-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">
                {t('memo.materials.title')} ({jobMaterials.length})
              </h3>
            </div>
            {jobMaterials.length > 0 ? (
              <div className="space-y-2">
                {jobMaterials.map((jobMaterial) => (
                  <MaterialListItem
                    key={jobMaterial.id}
                    jobMaterial={jobMaterial}
                    onRemove={setMaterialToRemove}
                    onViewDetail={setSelectedMaterialForDetail}
                    onEdit={handleEditMaterial}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('memo.materials.noMaterials')}</p>
                <p className="text-sm">
                  {t('memo.materials.noMaterialsDescription')}
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Add Tab - EL number lookup and quick add */}
        <TabsContent value="add" className="space-y-0">
          <div className="bg-card border rounded-lg p-4 space-y-4">
            {/* Header inside card */}
            <div className="flex items-center justify-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">
                {t('memo.materials.title')} ({jobMaterials.length})
              </h3>
            </div>
            {/* EL Number Input with Scan */}
            <div className="space-y-2">
              <Label htmlFor="el-number-input">
                {t('memo.materials.elNumberLabel')}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="el-number-input"
                  placeholder={t('memo.materials.elNumberPlaceholder')}
                  value={elNumberInput}
                  onChange={(e) => {
                    // Only allow digits and limit to 7 characters
                    const rawValue = e.target.value.replace(/\D/g, '');
                    const limitedValue = rawValue.slice(0, 7);

                    // Format with spaces: XX XXX XX
                    let formattedValue = limitedValue;
                    if (limitedValue.length >= 2) {
                      formattedValue = limitedValue.slice(0, 2);
                      if (limitedValue.length >= 3) {
                        formattedValue += ' ' + limitedValue.slice(2, 5);
                        if (limitedValue.length >= 6) {
                          formattedValue += ' ' + limitedValue.slice(5, 7);
                        }
                      }
                    }

                    setElNumberInput(formattedValue);

                    // Auto-switch to add tab and search when typing (use raw value for search)
                    if (limitedValue.trim()) {
                      setMaterialTab('add');
                      setActiveTab('search');
                      setSearchQuery(limitedValue);

                      // Only search when we have at least 5 digits for EL numbers to avoid too many partial matches
                      if (limitedValue.length >= 5) {
                        // Use optimized search to query the database
                        performOptimizedSearch(limitedValue);
                      } else {
                        setShowingSearchResults(false);
                        setDisplayMaterials([]);
                      }
                    } else {
                      setShowingSearchResults(false);
                      setDisplayMaterials([]);
                    }
                  }}
                  className="w-32"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleELNumberLookup();
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleELNumberLookup}
                  disabled={loading}
                >
                  <Search className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleScanELNumber}
                >
                  <Scan className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* EL Lookup Result */}
            {showELResult && elLookupResult && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    {t('memo.materials.elLookupResult')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">
                        {t('memo.materials.elNumber')}
                      </span>{' '}
                      {elLookupResult.data.el_nr}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">
                        {t('memo.materials.titleLabel')}
                      </span>{' '}
                      {elLookupResult.data.tittel || 'N/A'}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">
                        {t('memo.materials.description')}
                      </span>{' '}
                      {elLookupResult.data.info || 'N/A'}
                    </div>
                    {elLookupResult.data.varemerke && (
                      <div className="text-sm">
                        <span className="font-medium">
                          {t('memo.materials.brand')}
                        </span>{' '}
                        {elLookupResult.data.varemerke}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleImportFromEL(elLookupResult.data)}
                      disabled={loading}
                    >
                      {loading && (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      )}
                      {t('memo.materials.importAndAdd')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowELResult(false);
                        setElLookupResult(null);
                      }}
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Add Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-2"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="search">
                  {t('memo.materials.searchTab')}
                </TabsTrigger>
                <TabsTrigger value="recent">
                  {t('memo.materials.recentTab')}
                </TabsTrigger>
                <TabsTrigger value="favorites">
                  {t('memo.materials.favoritesTab')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="recent" className="space-y-2">
                {/* Filter Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t('memo.materials.filterLabel')}
                  </span>
                  <ToggleGroup
                    type="single"
                    value={recentMaterialsFilter}
                    onValueChange={(value) =>
                      value &&
                      handleRecentMaterialsFilterChange(value as 'my' | 'all')
                    }
                    className="h-7"
                  >
                    <ToggleGroupItem value="my" className="h-7 px-2 text-xs">
                      <User className="h-3 w-3 mr-1" />
                      {t('memo.materials.filterMy')}
                    </ToggleGroupItem>
                    <ToggleGroupItem value="all" className="h-7 px-2 text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {t('memo.materials.filterAll')}
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                {recentMaterials.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {t('memo.materials.noRecentMaterials')}
                    </p>
                    <p className="text-xs mt-1">
                      {recentMaterialsFilter === 'my'
                        ? t('memo.materials.noRecentMaterialsMy')
                        : t('memo.materials.noRecentMaterialsAll')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-44 overflow-y-auto">
                    {recentMaterials.map((recentItem) => {
                      const userDisplay =
                        recentItem.user && typeof recentItem.user !== 'number'
                          ? getUserDisplay(recentItem.user)
                          : null;

                      return (
                        <div key={recentItem.id} className="space-y-1">
                          <CompactMaterialCard
                            material={recentItem.matriell}
                            onSelect={addMaterialToSelection}
                            onViewDetail={setSelectedMaterialForDetail}
                            searchQuery={searchQuery}
                          />
                          <div className="text-xs text-muted-foreground pl-2 pb-1 flex items-center gap-2 justify-between">
                            <span>
                              {t('memo.materials.usedIn')}{' '}
                              {typeof recentItem.jobb === 'number'
                                ? `Job #${recentItem.jobb}`
                                : recentItem.jobb.tittel ||
                                  recentItem.jobb.ordre_nr}
                              {recentItem.antall > 1 &&
                                ` • ${t('memo.materials.qty')}: ${recentItem.antall}`}
                            </span>
                            {userDisplay && recentMaterialsFilter === 'all' && (
                              <span className="flex items-center gap-1.5 text-xs bg-muted px-2 py-1 rounded-full">
                                <Avatar className="h-4 w-4">
                                  <AvatarImage
                                    src={userDisplay.avatar || undefined}
                                  />
                                  <AvatarFallback className="text-[8px]">
                                    {userDisplay.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">
                                  {userDisplay.displayName}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="favorites" className="space-y-2">
                {favoriteMaterials.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <Heart className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {t('memo.materials.noFavoriteMaterials')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {favoriteMaterials.map((material) => (
                      <CompactMaterialCard
                        key={material.id}
                        material={material}
                        onSelect={addMaterialToSelection}
                        onViewDetail={setSelectedMaterialForDetail}
                        searchQuery={searchQuery}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="search" className="space-y-2">
                <div className="space-y-2">
                  {/* Category and Supplier Filters */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">
                        {t('memo.materials.category')}
                      </Label>
                      <Select
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                      >
                        <SelectTrigger className="h-8 text-xs max-w-full">
                          <SelectValue className="truncate overflow-hidden text-ellipsis whitespace-nowrap" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t('memo.materials.allCategories')}
                          </SelectItem>
                          {categories.map((cat: any) => (
                            <SelectItem
                              key={cat.id}
                              value={cat.id.toString()}
                            >
                              {cat.blokknummer}: {cat.kategori}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">
                        {t('memo.materials.supplier')}
                      </Label>
                      <Select
                        value={selectedSupplier}
                        onValueChange={setSelectedSupplier}
                      >
                        <SelectTrigger className="h-8 text-xs max-w-full">
                          <SelectValue className="truncate overflow-hidden text-ellipsis whitespace-nowrap" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t('memo.materials.allSuppliers')}
                          </SelectItem>
                          {suppliers.map((sup) => (
                            <SelectItem key={sup.id} value={sup.id.toString()}>
                              {sup.navn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Input
                    placeholder={t('memo.materials.search')}
                    value={searchQuery}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchQuery(value);

                      // Debounced search for better performance
                      if (value.length >= 3) {
                        clearTimeout(window.searchTimeout);
                        window.searchTimeout = setTimeout(() => {
                          performOptimizedSearch(value);
                        }, 300);
                      } else if (value.length === 0) {
                        setShowingSearchResults(false);
                        setDisplayMaterials([]);
                      }
                    }}
                    className="text-sm"
                  />

                  {/* Search Results */}
                  {showingSearchResults && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {filteredDisplayMaterials.length > 0
                            ? t('memo.materials.foundMaterials', {
                                count: filteredDisplayMaterials.length,
                              })
                            : t('memo.materials.noMaterialsInDB')}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowingSearchResults(false);
                            setDisplayMaterials([]);
                            setElNumberInput('');
                            setSearchQuery('');
                            setSelectedCategory('all');
                            setSelectedSupplier('all');
                          }}
                        >
                          <X className="h-3 w-3 mr-1" />
                          {t('common.close')}
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {filteredDisplayMaterials.length > 0 && (
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {filteredDisplayMaterials.map((material) => (
                              <CompactMaterialCard
                                key={material.id}
                                material={material}
                                onSelect={addMaterialToSelection}
                                onViewDetail={setSelectedMaterialForDetail}
                                searchQuery={searchQuery}
                              />
                            ))}
                          </div>
                        )}

                        {/* Show EFObasen lookup option when we have an EL number search */}
                        {elNumberInput.trim() &&
                          elNumberInput.replace(/\s/g, '').length >= 6 && (
                            <div className="text-center py-4 border rounded-lg bg-muted/20">
                              {filteredDisplayMaterials.length === 0 ? (
                                <>
                                  <Package className="h-8 w-8 mx-auto mb-3 opacity-50" />
                                  <p className="text-sm text-muted-foreground mb-3">
                                    {t('memo.materials.noMaterialsFound', {
                                      search: elNumberInput,
                                    })}
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm text-muted-foreground mb-3">
                                  {t('memo.materials.notFindingWhat')}
                                </p>
                              )}
                              <Button
                                size="sm"
                                onClick={handleELNumberLookup}
                                disabled={loading}
                              >
                                {loading && (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                )}
                                <Search className="h-3 w-3 mr-1" />
                                {t('memo.materials.lookupInEFO')}
                              </Button>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Default search results when not showing EL search */}
                  {!showingSearchResults && (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {filteredMaterials.slice(0, 10).map((material) => (
                        <CompactMaterialCard
                          key={material.id}
                          material={material}
                          onSelect={addMaterialToSelection}
                          onViewDetail={setSelectedMaterialForDetail}
                          searchQuery={searchQuery}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>
      </Tabs>

      {/* Selection Summary - Show when materials are selected */}
      {selectedMaterials.length > 0 && (
        <Card className="border-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {t('memo.materials.selectedMaterials')} (
              {selectedMaterials.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedMaterials.map((material, index) => (
              <div
                key={material.id || `temp-${index}`}
                className="flex items-center justify-between p-2 bg-muted rounded"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {material.tittel || 'Untitled'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {material.leverandor?.navn ||
                      (material.leverandor
                        ? `Supplier ID: ${material.leverandor.id}`
                        : 'Unknown Supplier')}
                    {material.el_nr && ` • EL: ${material.el_nr}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateMaterialQuantity(material.id, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-medium">
                    {material.quantity}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateMaterialQuantity(material.id, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => clearMaterialQuantity(material.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              onClick={handleAddToJob}
              disabled={loading}
              className="w-full"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('memo.materials.addToJob')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Hidden dialogs and components */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleELNumberScanned}
        title="Scan EL-Number"
      />

      <MaterialDetailModal
        material={selectedMaterialForDetail}
        isOpen={!!selectedMaterialForDetail}
        onClose={() => setSelectedMaterialForDetail(null)}
        onToggleFavorite={handleToggleFavorite}
        onSelect={addMaterialToSelection}
      />

      {/* Remove Material Confirmation Dialog */}
      <ConfirmDialog
        open={materialToRemove !== null}
        onOpenChange={(open) => !open && setMaterialToRemove(null)}
        onConfirm={handleConfirmRemove}
        title={
          language === 'no'
            ? 'Bekreft fjerning av materiale'
            : 'Confirm material removal'
        }
        description={
          materialToRemove
            ? language === 'no'
              ? `Er du sikker på at du vil fjerne "${materialToRemove.matriell.tittel || 'Uten tittel'}" (${materialToRemove.matriell.el_nr || 'Ingen EL#'}) fra denne jobben? Denne handlingen kan ikke angres.`
              : `Are you sure you want to remove "${materialToRemove.matriell.tittel || 'Untitled'}" (${materialToRemove.matriell.el_nr || 'No EL#'}) from this job? This action cannot be undone.`
            : ''
        }
        confirmText={language === 'no' ? 'Fjern' : 'Remove'}
        cancelText={language === 'no' ? 'Avbryt' : 'Cancel'}
        variant="destructive"
      />
    </div>
  );
}

// Expandable list item for the View tab
interface MaterialListItemProps {
  jobMaterial: JobMaterial;
  onRemove: (jobMaterial: JobMaterial) => void;
  onViewDetail: (material: Material) => void;
  onEdit: (jobMaterial: JobMaterial) => void;
  onToggleFavorite: (material: Material) => void;
}

function MaterialListItem({
  jobMaterial,
  onRemove,
  onViewDetail,
  onEdit,
  onToggleFavorite,
}: MaterialListItemProps) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useIntl();

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Compact row - always visible */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {jobMaterial.matriell.el_nr || 'No EL#'}
              </span>
              <span className="text-sm text-muted-foreground">
                {jobMaterial.matriell.tittel || 'Untitled'}
              </span>
            </div>
          </div>
          {jobMaterial.antall && (
            <Badge variant="secondary" className="text-xs">
              {t('memo.materials.qty')}: {jobMaterial.antall}
            </Badge>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-3 border-t bg-muted/20">
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              {jobMaterial.matriell.leverandor?.navn ||
                (jobMaterial.matriell.leverandor
                  ? `Supplier ID: ${jobMaterial.matriell.leverandor.id}`
                  : 'Unknown Supplier')}
              {jobMaterial.matriell.gtin_number &&
                ` • GTIN: ${jobMaterial.matriell.gtin_number}`}
            </div>
            {jobMaterial.matriell.varemerke && (
              <div className="text-xs text-muted-foreground">
                Brand: {jobMaterial.matriell.varemerke}
              </div>
            )}
            {jobMaterial.matriell.teknisk_beskrivelse && (
              <div className="text-xs text-muted-foreground">
                {jobMaterial.matriell.teknisk_beskrivelse}
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetail(jobMaterial.matriell);
                }}
              >
                <Info className="h-3 w-3 mr-1" />
                {t('memo.materials.viewDetails')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(jobMaterial);
                }}
              >
                {t('memo.materials.edit')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(jobMaterial.matriell);
                }}
              >
                <Heart
                  className={`h-3 w-3 ${jobMaterial.matriell.favorites ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`}
                />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(jobMaterial);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact material card for Add and Search tabs
interface CompactMaterialCardProps {
  material: Material;
  onSelect: (material: Material) => void;
  onViewDetail?: (material: Material) => void;
  searchQuery?: string;
}

function CompactMaterialCard({
  material,
  onSelect,
  onViewDetail,
  searchQuery,
}: CompactMaterialCardProps) {
  const { t } = useIntl();
  // Check if this is an exact EL number match
  const isExactMatch =
    searchQuery && material.el_nr === searchQuery.replace(/\s/g, '');

  return (
    <div
      className={`flex items-center justify-between p-2 border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors ${isExactMatch ? 'border-primary bg-primary/10 shadow-sm' : ''}`}
    >
      <div
        className="flex-1 cursor-pointer"
        onClick={() => onViewDetail?.(material)}
      >
        <div className="flex items-center gap-2">
          <span
            className={`font-medium text-sm ${isExactMatch ? 'text-primary' : ''}`}
          >
            {material.el_nr || 'No EL#'}
          </span>
          {isExactMatch && (
            <Badge variant="default" className="text-xs">
              {t('memo.materials.exactMatch')}
            </Badge>
          )}
          <span className="text-sm text-muted-foreground truncate">
            {material.tittel || 'Untitled'}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {material.leverandor?.navn ||
            (material.leverandor
              ? `${t('memo.materials.supplier')} ID: ${material.leverandor.id}`
              : t('memo.materials.unknownSupplier'))}
          {material.varemerke && ` • ${material.varemerke}`}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {material.favorites && (
          <Star className="h-3 w-3 text-yellow-500 fill-current" />
        )}
        {material.discontinued && (
          <AlertTriangle className="h-3 w-3 text-red-500" />
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(material);
          }}
          className="h-6 w-6 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
