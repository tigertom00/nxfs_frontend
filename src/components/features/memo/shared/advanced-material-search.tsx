'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { materialsAPI } from '@/lib/api';
import { useDebounce } from '@/hooks';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Material, Supplier, MaterialSearchParams, PaginatedMaterialResponse } from '@/types/api';
import { useIntl } from '@/hooks/use-intl';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Filter,
  X,
  Barcode,
  Hash,
  Building2,
  Package2,
  Star,
  AlertTriangle,
  CheckCircle,
  Ruler,
} from 'lucide-react';
import { MaterialSearchPagination } from './material-search-pagination';

interface AdvancedMaterialSearchProps {
  suppliers: Supplier[];
  onResults: (filteredMaterials: Material[], pagination?: PaginatedMaterialResponse['pagination']) => void;
  trigger?: React.ReactNode;
  initialSearchParams?: MaterialSearchParams;
}

interface SearchFilters {
  generalSearch: string;
  elNumber: string;
  gtinNumber: string;
  productNumber: string;
  supplier: string;
  categoryBlock: string;
  brand: string;
  favoritesOnly: boolean;
  approvedOnly: boolean;
  inStockOnly: boolean;
  excludeDiscontinued: boolean;
  // Dimension filters
  heightMin: string;
  heightMax: string;
  widthMin: string;
  widthMax: string;
  lengthMin: string;
  lengthMax: string;
  weightMin: string;
  weightMax: string;
}

export function AdvancedMaterialSearch({
  suppliers,
  onResults,
  trigger,
  initialSearchParams,
}: AdvancedMaterialSearchProps) {
  const { t } = useIntl();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Material[]>([]);
  const [pagination, setPagination] = useState<PaginatedMaterialResponse['pagination'] | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    generalSearch: initialSearchParams?.search || '',
    elNumber: initialSearchParams?.el_nr || '',
    gtinNumber: initialSearchParams?.gtin_number || '',
    productNumber: initialSearchParams?.varenummer || '',
    supplier: initialSearchParams?.leverandor?.toString() || 'all',
    categoryBlock: initialSearchParams?.kategori_blokknummer || '',
    brand: initialSearchParams?.varemerke || '',
    favoritesOnly: initialSearchParams?.favorites || false,
    approvedOnly: initialSearchParams?.approved || false,
    inStockOnly: initialSearchParams?.in_stock || false,
    excludeDiscontinued: initialSearchParams?.discontinued === false,
    heightMin: initialSearchParams?.hoyde_min?.toString() || '',
    heightMax: initialSearchParams?.hoyde_max?.toString() || '',
    widthMin: initialSearchParams?.bredde_min?.toString() || '',
    widthMax: initialSearchParams?.bredde_max?.toString() || '',
    lengthMin: initialSearchParams?.lengde_min?.toString() || '',
    lengthMax: initialSearchParams?.lengde_max?.toString() || '',
    weightMin: initialSearchParams?.vekt_min?.toString() || '',
    weightMax: initialSearchParams?.vekt_max?.toString() || '',
  });

  // Debounce search to avoid too many API calls
  const debouncedFilters = useDebounce(filters, 500);

  // Perform search with backend API
  const performSearch = async (searchFilters: SearchFilters, page: number = 1) => {
    try {
      setLoading(true);

      // Build search parameters for backend API
      const params: MaterialSearchParams = {
        page_size: 25, // Smaller page size for modal
        page,
      };

      // Text search fields
      if (searchFilters.generalSearch.trim()) {
        params.search = searchFilters.generalSearch.trim();
      }
      if (searchFilters.elNumber.trim()) {
        params.el_nr = searchFilters.elNumber.trim();
      }
      if (searchFilters.gtinNumber.trim()) {
        params.gtin_number = searchFilters.gtinNumber.trim();
      }
      if (searchFilters.productNumber.trim()) {
        params.varenummer = searchFilters.productNumber.trim();
      }
      if (searchFilters.brand.trim()) {
        params.varemerke = searchFilters.brand.trim();
      }
      if (searchFilters.categoryBlock.trim()) {
        params.kategori_blokknummer = searchFilters.categoryBlock.trim();
      }

      // Foreign key filters
      if (searchFilters.supplier && searchFilters.supplier !== 'all') {
        params.leverandor = parseInt(searchFilters.supplier);
      }

      // Boolean filters
      if (searchFilters.favoritesOnly) {
        params.favorites = true;
      }
      if (searchFilters.approvedOnly) {
        params.approved = true;
      }
      if (searchFilters.inStockOnly) {
        params.in_stock = true;
      }
      if (searchFilters.excludeDiscontinued) {
        params.discontinued = false;
      }

      // Dimension range filters
      if (searchFilters.heightMin) {
        const val = parseFloat(searchFilters.heightMin);
        if (!isNaN(val)) params.hoyde_min = val;
      }
      if (searchFilters.heightMax) {
        const val = parseFloat(searchFilters.heightMax);
        if (!isNaN(val)) params.hoyde_max = val;
      }
      if (searchFilters.widthMin) {
        const val = parseFloat(searchFilters.widthMin);
        if (!isNaN(val)) params.bredde_min = val;
      }
      if (searchFilters.widthMax) {
        const val = parseFloat(searchFilters.widthMax);
        if (!isNaN(val)) params.bredde_max = val;
      }
      if (searchFilters.lengthMin) {
        const val = parseFloat(searchFilters.lengthMin);
        if (!isNaN(val)) params.lengde_min = val;
      }
      if (searchFilters.lengthMax) {
        const val = parseFloat(searchFilters.lengthMax);
        if (!isNaN(val)) params.lengde_max = val;
      }
      if (searchFilters.weightMin) {
        const val = parseFloat(searchFilters.weightMin);
        if (!isNaN(val)) params.vekt_min = val;
      }
      if (searchFilters.weightMax) {
        const val = parseFloat(searchFilters.weightMax);
        if (!isNaN(val)) params.vekt_max = val;
      }

      // Perform the search
      const result = await materialsAPI.searchMaterials(params);
      // Update local state
      setSearchResults(result.results);
      setPagination(result.pagination);

      // Also call parent callback
      onResults(result.results, result.pagination);

    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: 'Search Failed',
        description: 'Failed to search materials. Please try again.',
        variant: 'destructive',
      });
      setSearchResults([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    performSearch(filters, page);
  };

  // Auto-search when filters change (debounced)
  useEffect(() => {
    if (isOpen) {
      performSearch(debouncedFilters);
    }
  }, [debouncedFilters, isOpen]);

  const applyFilters = () => {
    performSearch(filters);
    setIsOpen(false);
  };

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      generalSearch: '',
      elNumber: '',
      gtinNumber: '',
      productNumber: '',
      supplier: 'all',
      categoryBlock: '',
      brand: '',
      favoritesOnly: false,
      approvedOnly: false,
      inStockOnly: false,
      excludeDiscontinued: true,
      heightMin: '',
      heightMax: '',
      widthMin: '',
      widthMax: '',
      lengthMin: '',
      lengthMax: '',
      weightMin: '',
      weightMax: '',
    };
    setFilters(clearedFilters);
    performSearch(clearedFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.generalSearch.trim()) count++;
    if (filters.elNumber.trim()) count++;
    if (filters.gtinNumber.trim()) count++;
    if (filters.productNumber.trim()) count++;
    if (filters.supplier && filters.supplier !== 'all') count++;
    if (filters.categoryBlock.trim()) count++;
    if (filters.brand.trim()) count++;
    if (filters.favoritesOnly) count++;
    if (filters.approvedOnly) count++;
    if (filters.inStockOnly) count++;
    if (!filters.excludeDiscontinued) count++; // Inverted logic
    // Count dimension filters
    if (filters.heightMin || filters.heightMax) count++;
    if (filters.widthMin || filters.widthMax) count++;
    if (filters.lengthMin || filters.lengthMax) count++;
    if (filters.weightMin || filters.weightMax) count++;
    return count;
  };

  // Categories will be handled by backend filtering with kategori_blokknummer

  const activeFilterCount = getActiveFilterCount();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Advanced Search
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 h-5 w-5 rounded-full p-0 text-xs"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Material Search
          </DialogTitle>
          <DialogDescription>
            Search electrical components using multiple criteria with real-time backend filtering
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* General Search */}
          <div className="space-y-2">
            <Label htmlFor="general-search">General Search</Label>
            <Input
              id="general-search"
              placeholder="Search across all fields..."
              value={filters.generalSearch}
              onChange={(e) =>
                setFilters({ ...filters, generalSearch: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Searches in title, technical description, product designation, manufacturer, EL-number, GTIN, and product number
            </p>
          </div>

          <Separator />

          {/* Specific Number Searches */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Identification Numbers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="el-number">EL-Number</Label>
                <Input
                  id="el-number"
                  placeholder="e.g., 4017332265546"
                  value={filters.elNumber}
                  onChange={(e) =>
                    setFilters({ ...filters, elNumber: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gtin-number">GTIN/EAN Barcode</Label>
                <Input
                  id="gtin-number"
                  placeholder="e.g., 4022903076278"
                  value={filters.gtinNumber}
                  onChange={(e) =>
                    setFilters({ ...filters, gtinNumber: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-number">Product Number</Label>
                <Input
                  id="product-number"
                  placeholder="e.g., 91030438200"
                  value={filters.productNumber}
                  onChange={(e) =>
                    setFilters({ ...filters, productNumber: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Categorization */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package2 className="h-4 w-4" />
              Categories & Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Manufacturer</Label>
                <Select
                  value={filters.supplier}
                  onValueChange={(value) =>
                    setFilters({ ...filters, supplier: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manufacturer..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Manufacturers</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem
                        key={supplier.id}
                        value={supplier.id.toString()}
                      >
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-block">Category Block</Label>
                <Input
                  id="category-block"
                  placeholder="e.g., 10, 11, 12"
                  value={filters.categoryBlock}
                  onChange={(e) =>
                    setFilters({ ...filters, categoryBlock: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  2-digit category block number
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  placeholder="e.g., Nexans, ABB"
                  value={filters.brand}
                  onChange={(e) =>
                    setFilters({ ...filters, brand: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Status Filters */}
          <div>
            <h3 className="font-semibold mb-3">Status Filters</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.favoritesOnly}
                  onChange={(e) =>
                    setFilters({ ...filters, favoritesOnly: e.target.checked })
                  }
                  className="rounded"
                />
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Show favorites only</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.approvedOnly}
                  onChange={(e) =>
                    setFilters({ ...filters, approvedOnly: e.target.checked })
                  }
                  className="rounded"
                />
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Show approved only</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.inStockOnly}
                  onChange={(e) =>
                    setFilters({ ...filters, inStockOnly: e.target.checked })
                  }
                  className="rounded"
                />
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm">In stock only</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.excludeDiscontinued}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      excludeDiscontinued: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm">Exclude discontinued</span>
              </label>
            </div>
          </div>

          <Separator />

          {/* Dimension Filters */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Dimension Filters (mm/g)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height-min">Height Min</Label>
                <Input
                  id="height-min"
                  type="number"
                  placeholder="Min mm"
                  value={filters.heightMin}
                  onChange={(e) =>
                    setFilters({ ...filters, heightMin: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height-max">Height Max</Label>
                <Input
                  id="height-max"
                  type="number"
                  placeholder="Max mm"
                  value={filters.heightMax}
                  onChange={(e) =>
                    setFilters({ ...filters, heightMax: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width-min">Width Min</Label>
                <Input
                  id="width-min"
                  type="number"
                  placeholder="Min mm"
                  value={filters.widthMin}
                  onChange={(e) =>
                    setFilters({ ...filters, widthMin: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width-max">Width Max</Label>
                <Input
                  id="width-max"
                  type="number"
                  placeholder="Max mm"
                  value={filters.widthMax}
                  onChange={(e) =>
                    setFilters({ ...filters, widthMax: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="length-min">Length Min</Label>
                <Input
                  id="length-min"
                  type="number"
                  placeholder="Min mm"
                  value={filters.lengthMin}
                  onChange={(e) =>
                    setFilters({ ...filters, lengthMin: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="length-max">Length Max</Label>
                <Input
                  id="length-max"
                  type="number"
                  placeholder="Max mm"
                  value={filters.lengthMax}
                  onChange={(e) =>
                    setFilters({ ...filters, lengthMax: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight-min">Weight Min</Label>
                <Input
                  id="weight-min"
                  type="number"
                  placeholder="Min g"
                  value={filters.weightMin}
                  onChange={(e) =>
                    setFilters({ ...filters, weightMin: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight-max">Weight Max</Label>
                <Input
                  id="weight-max"
                  type="number"
                  placeholder="Max g"
                  value={filters.weightMax}
                  onChange={(e) =>
                    setFilters({ ...filters, weightMax: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button onClick={applyFilters} disabled={loading} className="flex-1">
              {loading ? (
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-foreground" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Searching...' : 'Apply Filters'}
            </Button>
            <Button variant="outline" onClick={clearFilters} disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
