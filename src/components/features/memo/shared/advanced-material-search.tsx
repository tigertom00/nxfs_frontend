'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Material, Supplier } from '@/types/api';
import { useIntl } from '@/hooks/use-intl';
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
} from 'lucide-react';

interface AdvancedMaterialSearchProps {
  materials: Material[];
  suppliers: Supplier[];
  onResults: (filteredMaterials: Material[]) => void;
  trigger?: React.ReactNode;
}

interface SearchFilters {
  generalSearch: string;
  elNumber: string;
  eanNumber: string;
  articleNumber: string;
  supplier: string;
  category: string;
  typeDesignation: string;
  favoritesOnly: boolean;
  approvedOnly: boolean;
  excludeDiscontinued: boolean;
}

export function AdvancedMaterialSearch({
  materials,
  suppliers,
  onResults,
  trigger,
}: AdvancedMaterialSearchProps) {
  const { t } = useIntl();
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    generalSearch: '',
    elNumber: '',
    eanNumber: '',
    articleNumber: '',
    supplier: '',
    category: '',
    typeDesignation: '',
    favoritesOnly: false,
    approvedOnly: false,
    excludeDiscontinued: true,
  });

  const applyFilters = () => {
    let filtered = materials;

    // General search across multiple fields
    if (filters.generalSearch.trim()) {
      const searchTerm = filters.generalSearch.toLowerCase().trim();
      filtered = filtered.filter(
        (material) =>
          material.tittel?.toLowerCase().includes(searchTerm) ||
          material.norwegian_description?.toLowerCase().includes(searchTerm) ||
          material.english_description?.toLowerCase().includes(searchTerm) ||
          material.german_description?.toLowerCase().includes(searchTerm) ||
          material.type_designation?.toLowerCase().includes(searchTerm) ||
          material.leverandor.name.toLowerCase().includes(searchTerm) ||
          material.el_nr?.includes(searchTerm) ||
          material.ean_number?.includes(searchTerm) ||
          material.article_number?.includes(searchTerm)
      );
    }

    // Specific field filters
    if (filters.elNumber.trim()) {
      filtered = filtered.filter((material) =>
        material.el_nr?.includes(filters.elNumber.trim())
      );
    }

    if (filters.eanNumber.trim()) {
      filtered = filtered.filter((material) =>
        material.ean_number?.includes(filters.eanNumber.trim())
      );
    }

    if (filters.articleNumber.trim()) {
      filtered = filtered.filter((material) =>
        material.article_number?.includes(filters.articleNumber.trim())
      );
    }

    if (filters.supplier) {
      filtered = filtered.filter(
        (material) => material.leverandor.id.toString() === filters.supplier
      );
    }

    if (filters.category) {
      filtered = filtered.filter(
        (material) => material.category === filters.category
      );
    }

    if (filters.typeDesignation.trim()) {
      filtered = filtered.filter((material) =>
        material.type_designation
          ?.toLowerCase()
          .includes(filters.typeDesignation.toLowerCase().trim())
      );
    }

    // Boolean filters
    if (filters.favoritesOnly) {
      filtered = filtered.filter((material) => material.favorites);
    }

    if (filters.approvedOnly) {
      filtered = filtered.filter((material) => material.approved);
    }

    if (filters.excludeDiscontinued) {
      filtered = filtered.filter((material) => !material.discontinued);
    }

    onResults(filtered);
    setIsOpen(false);
  };

  const clearFilters = () => {
    setFilters({
      generalSearch: '',
      elNumber: '',
      eanNumber: '',
      articleNumber: '',
      supplier: '',
      category: '',
      typeDesignation: '',
      favoritesOnly: false,
      approvedOnly: false,
      excludeDiscontinued: true,
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.generalSearch.trim()) count++;
    if (filters.elNumber.trim()) count++;
    if (filters.eanNumber.trim()) count++;
    if (filters.articleNumber.trim()) count++;
    if (filters.supplier) count++;
    if (filters.category) count++;
    if (filters.typeDesignation.trim()) count++;
    if (filters.favoritesOnly) count++;
    if (filters.approvedOnly) count++;
    if (!filters.excludeDiscontinued) count++; // Inverted logic
    return count;
  };

  // Get unique categories from materials
  const categories = Array.from(
    new Set(materials.map((m) => m.category).filter(Boolean))
  ).sort();

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
            Search through {materials.length} electrical components using
            multiple criteria
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
              Searches in title, descriptions, manufacturer, EL-number, EAN, and
              article number
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
                <Label htmlFor="ean-number">EAN Barcode</Label>
                <Input
                  id="ean-number"
                  placeholder="e.g., 4022903076278"
                  value={filters.eanNumber}
                  onChange={(e) =>
                    setFilters({ ...filters, eanNumber: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="article-number">Article Number</Label>
                <Input
                  id="article-number"
                  placeholder="e.g., 91030438200"
                  value={filters.articleNumber}
                  onChange={(e) =>
                    setFilters({ ...filters, articleNumber: e.target.value })
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
                    <SelectItem value="">All Manufacturers</SelectItem>
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
                <Label htmlFor="category">Category</Label>
                <Select
                  value={filters.category}
                  onValueChange={(value) =>
                    setFilters({ ...filters, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type-designation">Type Designation</Label>
                <Input
                  id="type-designation"
                  placeholder="e.g., LS37K11"
                  value={filters.typeDesignation}
                  onChange={(e) =>
                    setFilters({ ...filters, typeDesignation: e.target.value })
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

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button onClick={applyFilters} className="flex-1">
              <Search className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
