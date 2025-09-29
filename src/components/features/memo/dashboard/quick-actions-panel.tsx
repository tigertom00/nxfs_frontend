'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Zap,
  Plus,
  Star,
  TrendingUp,
  Building2,
  Package,
  Briefcase,
  ExternalLink,
  Search,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface QuickActionsPanelProps {
  quickAccess: {
    popular_materials: Array<{
      id: number;
      el_nr: string;
      tittel: string;
      usage_count: number;
      leverandor_name: string;
    }>;
    favorite_materials: Array<{
      id: number;
      el_nr: string;
      tittel: string;
      leverandor_name: string;
    }>;
    active_jobs: Array<{
      ordre_nr: string;
      tittel: string;
      created_at: string;
    }>;
    popular_suppliers: Array<{
      id: number;
      navn: string;
      material_count: number;
    }>;
  };
}

export function QuickActionsPanel({ quickAccess }: QuickActionsPanelProps) {
  const router = useRouter();

  const handleJobClick = (orderNumber: string) => {
    router.push(`/memo/job/${orderNumber}`);
  };

  const handleNewJob = () => {
    router.push('/memo?action=new');
  };

  const handleSearchMaterials = () => {
    router.push('/memo?tab=materials');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('no-NO');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={handleNewJob} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Job
            </Button>
            <Button variant="outline" onClick={handleSearchMaterials} className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Materials
            </Button>
            <Button variant="outline" onClick={() => router.push('/memo/admin')} className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Admin Panel
            </Button>
            <Button variant="outline" onClick={() => router.push('/memo')} className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              View All Jobs
            </Button>
          </div>

          <Separator />

          {/* Active Jobs */}
          {quickAccess.active_jobs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">Active Jobs</span>
                <Badge variant="secondary" className="text-xs">
                  {quickAccess.active_jobs.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {quickAccess.active_jobs.slice(0, 3).map((job) => (
                  <div
                    key={job.ordre_nr}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => handleJobClick(job.ordre_nr)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">#{job.ordre_nr}</span>
                      <span className="text-sm text-muted-foreground truncate">
                        {job.tittel || 'Untitled'}
                      </span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </div>
                ))}
              </div>
              {quickAccess.active_jobs.length > 3 && (
                <Button variant="ghost" size="sm" onClick={() => router.push('/memo')}>
                  View {quickAccess.active_jobs.length - 3} more jobs
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Popular Materials & Suppliers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Popular Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Popular Materials */}
          {quickAccess.popular_materials.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-sm">Most Used Materials</span>
              </div>
              <div className="space-y-2">
                {quickAccess.popular_materials.slice(0, 4).map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {material.el_nr && (
                        <Badge variant="outline" className="text-xs font-mono">
                          {material.el_nr}
                        </Badge>
                      )}
                      <span className="text-sm truncate">{material.tittel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {material.usage_count} uses
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {quickAccess.popular_materials.length > 0 && quickAccess.favorite_materials.length > 0 && (
            <Separator />
          )}

          {/* Favorite Materials */}
          {quickAccess.favorite_materials.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-sm">Favorite Materials</span>
              </div>
              <div className="space-y-2">
                {quickAccess.favorite_materials.slice(0, 3).map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {material.el_nr && (
                        <Badge variant="outline" className="text-xs font-mono">
                          {material.el_nr}
                        </Badge>
                      )}
                      <span className="text-sm truncate">{material.tittel}</span>
                    </div>
                    <Star className="h-3 w-3 text-yellow-600" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {(quickAccess.favorite_materials.length > 0 || quickAccess.popular_materials.length > 0) &&
           quickAccess.popular_suppliers.length > 0 && (
            <Separator />
          )}

          {/* Popular Suppliers */}
          {quickAccess.popular_suppliers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-sm">Top Suppliers</span>
              </div>
              <div className="space-y-2">
                {quickAccess.popular_suppliers.slice(0, 3).map((supplier) => (
                  <div
                    key={supplier.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                  >
                    <span className="text-sm font-medium">{supplier.navn}</span>
                    <Badge variant="outline" className="text-xs">
                      {supplier.material_count} materials
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {quickAccess.popular_materials.length === 0 &&
           quickAccess.favorite_materials.length === 0 &&
           quickAccess.popular_suppliers.length === 0 && (
            <div className="text-center py-4">
              <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No popular items yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}