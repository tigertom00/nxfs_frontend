'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layouts/navbar';
import ChatBot from '@/components/features/chat/chatbot';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore, useUIStore } from '@/stores';
import { useDebounce } from '@/hooks';
import { llmProvidersAPI, LLMProvider } from '@/lib/api';
import { toast } from 'sonner';
import { CreateProviderDialog } from '@/components/features/llm-providers';
import {
  Search,
  Settings,
  Plus,
  Filter,
  ExternalLink,
  Trash2,
  Edit,
  Eye,
} from 'lucide-react';

export default function LLMProvidersPage() {
  const {
    isAuthenticated,
    user,
    isLoading: authLoading,
    initialize,
  } = useAuthStore();
  const { language, theme } = useUIStore();
  const router = useRouter();

  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Debounce search term to avoid excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Authentication and theme initialization
  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark', 'purple');
    document.documentElement.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch providers
  const fetchProviders = async () => {
    try {
      setIsLoading(true);
      const data = await llmProvidersAPI.getProviders();
      setProviders(data);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      toast.error(
        language === 'no'
          ? 'Kunne ikke hente leverandører'
          : 'Failed to fetch providers'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProviders();
    }
  }, [isAuthenticated]);

  // Filter providers based on search and tags
  const filteredProviders = providers.filter((provider) => {
    const description =
      language === 'no' ? provider.description_nb : provider.description;
    const strengths =
      language === 'no' ? provider.strengths_no : provider.strengths_en;

    const matchesSearch =
      provider.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      strengths.some((strength) =>
        strength.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );

    const matchesTag =
      selectedTag === 'all' || provider.tags.includes(parseInt(selectedTag));

    return matchesSearch && matchesTag;
  });

  // Get unique tag IDs for filter dropdown
  const availableTags = [...new Set(providers.flatMap((p) => p.tags))];

  const handleDeleteProvider = async (providerId: number) => {
    try {
      await llmProvidersAPI.deleteProvider(providerId);
      setProviders((prev) => prev.filter((p) => p.id !== providerId));
      toast.success(
        language === 'no' ? 'Leverandør slettet' : 'Provider deleted'
      );
    } catch (error) {
      toast.error(
        language === 'no'
          ? 'Kunne ikke slette leverandør'
          : 'Failed to delete provider'
      );
    }
  };

  const handleProviderCreated = (newProvider: LLMProvider) => {
    setProviders((prev) => [newProvider, ...prev]);
  };

  const texts = {
    title: language === 'no' ? 'LLM-leverandører' : 'LLM Providers',
    subtitle:
      language === 'no'
        ? 'Administrer og utforsk AI-modeller og plattformer'
        : 'Manage and explore AI models and platforms',
    addProvider: language === 'no' ? 'Legg til leverandør' : 'Add Provider',
    searchPlaceholder:
      language === 'no' ? 'Søk etter leverandører...' : 'Search providers...',
    allTags: language === 'no' ? 'Alle kategorier' : 'All Categories',
    searchAndFilters:
      language === 'no' ? 'Søk og filter' : 'Search and Filters',
    noProviders: language === 'no' ? 'Ingen leverandører' : 'No Providers',
    noProvidersDescription:
      language === 'no'
        ? 'Kom i gang ved å legge til din første LLM-leverandør'
        : 'Get started by adding your first LLM provider',
    noMatchingProviders:
      language === 'no'
        ? 'Ingen samsvarende leverandører'
        : 'No Matching Providers',
    tryDifferentSearch:
      language === 'no'
        ? 'Prøv et annet søk eller filter'
        : 'Try a different search or filter',
    addFirstProvider:
      language === 'no' ? 'Legg til første leverandør' : 'Add First Provider',
    showingResults:
      language === 'no'
        ? 'Viser {count} av {total} leverandører'
        : 'Showing {count} of {total} providers',
    totalProviders:
      language === 'no' ? 'Totalt leverandører' : 'Total Providers',
    availableTags:
      language === 'no' ? 'Tilgjengelige kategorier' : 'Available Categories',
    visitSite: language === 'no' ? 'Besøk nettsted' : 'Visit Site',
    edit: language === 'no' ? 'Rediger' : 'Edit',
    delete: language === 'no' ? 'Slett' : 'Delete',
    viewDetails: language === 'no' ? 'Se detaljer' : 'View Details',
    strengths: language === 'no' ? 'Styrker' : 'Strengths',
    pricing: language === 'no' ? 'Priser' : 'Pricing',
    loading: language === 'no' ? 'Laster...' : 'Loading...',
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{texts.loading}</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    return null; // Will redirect to sign in
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="text-foreground p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg api-gradient flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{texts.title}</h1>
                <p className="text-muted-foreground">{texts.subtitle}</p>
              </div>
            </div>
            <CreateProviderDialog onProviderCreated={handleProviderCreated}>
              <Button className="api-gradient hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                {texts.addProvider}
              </Button>
            </CreateProviderDialog>
          </div>

          {/* Search and Filters */}
          <Card className="hover-lift border-l-4 border-l-api-accent-border">
            <CardHeader>
              <CardTitle>{texts.searchAndFilters}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={texts.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="w-full sm:w-48">
                  <Select value={selectedTag} onValueChange={setSelectedTag}>
                    <SelectTrigger>
                      <SelectValue>
                        <div className="flex items-center">
                          <Filter className="w-4 h-4 mr-2" />
                          {selectedTag === 'all'
                            ? texts.allTags
                            : `Tag ${selectedTag}`}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{texts.allTags}</SelectItem>
                      {availableTags.map((tagId) => (
                        <SelectItem key={tagId} value={tagId.toString()}>
                          Tag {tagId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Providers Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card
                  key={index}
                  className="animate-pulse hover-lift border-l-4 border-l-api-accent-border"
                >
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-muted rounded w-16"></div>
                        <div className="h-6 bg-muted rounded w-20"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProviders.length === 0 ? (
            <Card className="text-center py-12 hover-lift border-l-4 border-l-api-accent-border">
              <CardContent>
                <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {providers.length === 0
                    ? texts.noProviders
                    : texts.noMatchingProviders}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {providers.length === 0
                    ? texts.noProvidersDescription
                    : texts.tryDifferentSearch}
                </p>
                {providers.length === 0 && (
                  <CreateProviderDialog
                    onProviderCreated={handleProviderCreated}
                  >
                    <Button className="api-gradient hover:opacity-90">
                      <Plus className="w-4 h-4 mr-2" />
                      {texts.addFirstProvider}
                    </Button>
                  </CreateProviderDialog>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProviders.map((provider) => {
                const description =
                  language === 'no'
                    ? provider.description_nb
                    : provider.description;
                const strengths =
                  language === 'no'
                    ? provider.strengths_no
                    : provider.strengths_en;
                const pricing =
                  language === 'no' ? provider.pricing_nb : provider.pricing;

                return (
                  <Card
                    key={provider.id}
                    className="h-full hover-lift border-l-4 border-l-api-accent-border"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          {provider.icon && (
                            <div className="w-10 h-10 rounded-lg overflow-hidden">
                              <img
                                src={provider.icon}
                                alt={`${provider.name} icon`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <CardTitle className="text-lg">
                              {provider.name}
                            </CardTitle>
                            <div className="flex gap-2 mt-1">
                              <Badge className="api-accent-bg text-xs">
                                {pricing}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProvider(provider.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <CardDescription className="text-sm leading-relaxed">
                        {description}
                      </CardDescription>

                      <div>
                        <h4 className="text-sm font-semibold mb-2">
                          {texts.strengths}
                        </h4>
                        <ul className="space-y-1">
                          {strengths.slice(0, 3).map((strength, index) => (
                            <li
                              key={index}
                              className="text-sm text-muted-foreground flex items-start"
                            >
                              <span className="w-1 h-1 bg-primary rounded-full mt-2 mr-2 flex-shrink-0" />
                              {strength}
                            </li>
                          ))}
                          {strengths.length > 3 && (
                            <li className="text-sm text-muted-foreground">
                              + {strengths.length - 3} more
                            </li>
                          )}
                        </ul>
                      </div>

                      {provider.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {provider.tags.map((tagId) => (
                            <Badge
                              key={tagId}
                              variant="secondary"
                              className="text-xs"
                            >
                              Tag {tagId}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <Button
                        onClick={() =>
                          window.open(
                            provider.url,
                            '_blank',
                            'noopener,noreferrer'
                          )
                        }
                        className="w-full"
                        size="sm"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {texts.visitSite}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Stats */}
          {!isLoading && providers.length > 0 && (
            <Card className="hover-lift border-l-4 border-l-api-accent-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {texts.showingResults
                      .replace('{count}', filteredProviders.length.toString())
                      .replace('{total}', providers.length.toString())}
                  </span>
                  <div className="flex gap-4">
                    <span>
                      {texts.totalProviders}: {providers.length}
                    </span>
                    <span>
                      {texts.availableTags}: {availableTags.length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <ChatBot />
    </div>
  );
}
