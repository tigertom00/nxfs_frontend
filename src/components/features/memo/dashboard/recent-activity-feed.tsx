'use client';

import { RecentActivity } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Activity,
  Package,
  Briefcase,
  Calendar,
  ExternalLink,
  Clock,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RecentActivityFeedProps {
  activity: RecentActivity;
  expanded?: boolean;
}

export function RecentActivityFeed({ activity, expanded = false }: RecentActivityFeedProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString('no-NO');
    }
  };

  const handleJobClick = (orderNumber: string) => {
    router.push(`/memo/job/${orderNumber}`);
  };

  const displayLimit = expanded ? 20 : 5;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
          <Badge variant="outline" className="ml-auto">
            {activity.jobs.length + activity.materials.length} items
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Recent Jobs */}
          {activity.jobs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">Recent Jobs</span>
                <Badge variant="secondary" className="text-xs">
                  {activity.jobs.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {activity.jobs.slice(0, Math.floor(displayLimit / 2)).map((job) => (
                  <div
                    key={job.ordre_nr}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => handleJobClick(job.ordre_nr)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className={`p-2 rounded-full ${
                          job.ferdig
                            ? 'bg-green-100 dark:bg-green-900'
                            : 'bg-yellow-100 dark:bg-yellow-900'
                        }`}>
                          {job.ferdig ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          ) : (
                            <Clock className="h-3 w-3 text-yellow-600" />
                          )}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">#{job.ordre_nr}</span>
                          <Badge
                            variant={job.ferdig ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {job.ferdig ? 'Completed' : 'Active'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {job.tittel || 'Untitled Job'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(job.created_at)}
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activity.jobs.length > 0 && activity.materials.length > 0 && (
            <Separator />
          )}

          {/* Recent Materials */}
          {activity.materials.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-sm">Recent Materials</span>
                <Badge variant="secondary" className="text-xs">
                  {activity.materials.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {activity.materials.slice(0, Math.ceil(displayLimit / 2)).map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
                          <Package className="h-3 w-3 text-purple-600" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {material.el_nr && (
                            <Badge variant="outline" className="text-xs font-mono">
                              {material.el_nr}
                            </Badge>
                          )}
                          <span className="font-medium text-sm truncate">
                            {material.tittel || 'Untitled Material'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {material.varemerke && (
                            <span className="truncate">{material.varemerke}</span>
                          )}
                          {material.leverandor_name && (
                            <>
                              <span>•</span>
                              <span className="truncate">{material.leverandor_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(material.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* View More Button */}
          {!expanded && (activity.jobs.length > Math.floor(displayLimit / 2) || activity.materials.length > Math.ceil(displayLimit / 2)) && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => router.push('/memo/dashboard?tab=activity')}
              >
                View All Activity
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            </div>
          )}

          {/* Empty State */}
          {activity.jobs.length === 0 && activity.materials.length === 0 && (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}