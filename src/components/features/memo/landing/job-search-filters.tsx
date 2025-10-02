'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { useDebounce } from '@/hooks';

interface JobSearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: 'all' | 'active' | 'completed';
  onStatusFilterChange: (status: 'all' | 'active' | 'completed') => void;
  totalCount: number;
  loading: boolean;
  onRefresh: () => void;
}

export function JobSearchFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  totalCount,
  loading,
  onRefresh,
}: JobSearchFiltersProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const debouncedSearchQuery = useDebounce(localSearchQuery, 300);

  // Update parent when debounced search changes
  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) {
      onSearchChange(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, searchQuery, onSearchChange]);

  // Update local state when prop changes (e.g., from external clear)
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const handleClearSearch = () => {
    setLocalSearchQuery('');
    onSearchChange('');
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'all':
        return 'default';
      case 'active':
        return 'secondary';
      case 'completed':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs by title, order number, or address..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {localSearchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
              >
                ×
              </Button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                onStatusFilterChange(value as 'all' | 'active' | 'completed')
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Active Filters Display */}
        <div className="flex flex-wrap gap-2 mt-3">
          {searchQuery && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: "{searchQuery}"
              <button
                onClick={handleClearSearch}
                className="ml-1 hover:bg-muted rounded-full w-4 h-4 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge
              variant={getStatusBadgeVariant(statusFilter)}
              className="flex items-center gap-1"
            >
              Status: {statusFilter === 'active' ? 'Active' : 'Completed'}
              <button
                onClick={() => onStatusFilterChange('all')}
                className="ml-1 hover:bg-muted rounded-full w-4 h-4 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </Badge>
          )}

          {/* Results count */}
          <Badge variant="outline" className="ml-auto">
            {totalCount} {totalCount === 1 ? 'job' : 'jobs'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
