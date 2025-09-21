'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { materialsAPI, jobMaterialsAPI, suppliersAPI } from '@/lib/api';
import { Material, JobMaterial, Supplier } from '@/types/api';
import { BarcodeScanner } from '@/components/features/memo/shared/barcode-scanner';
import { efoService, parseElNumber } from '@/lib/efo-api';
import { useToast } from '@/hooks/use-toast';
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
} from 'lucide-react';

interface MaterialManagerProps {
  jobId: number;
}

interface SelectedMaterial extends Material {
  quantity: number;
}

export function MaterialManager({ jobId }: MaterialManagerProps) {
  const { toast } = useToast();
  const [showScanner, setShowScanner] = useState(false);
  const [showMaterialDialog, setShowMaterialDialog] = useState(false);
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [jobMaterials, setJobMaterials] = useState<JobMaterial[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentMaterials, setRecentMaterials] = useState<Material[]>([]);
  const [favoriteMaterials, setFavoriteMaterials] = useState<Material[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Load materials and job materials
  useEffect(() => {
    loadMaterials();
    loadJobMaterials();
    loadRecentMaterials();
    loadSuppliers();
  }, [jobId]);

  const loadMaterials = async () => {
    try {
      const materials = await materialsAPI.getMaterials();
      setAllMaterials(materials);

      // Filter favorites
      const favorites = materials.filter(m => m.is_favorite);
      setFavoriteMaterials(favorites);
    } catch (error) {
      console.error('Failed to load materials:', error);
    }
  };

  const loadJobMaterials = async () => {
    try {
      const jobMaterials = await jobMaterialsAPI.getJobMaterials();
      const jobSpecificMaterials = jobMaterials.filter(jm => jm.jobb === jobId);
      setJobMaterials(jobSpecificMaterials);
    } catch (error) {
      console.error('Failed to load job materials:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const suppliersData = await suppliersAPI.getSuppliers();
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    }
  };

  const loadRecentMaterials = () => {
    // Load from localStorage - materials used in the last 30 days
    const recentKey = 'memo-recent-materials';
    const stored = localStorage.getItem(recentKey);
    if (stored) {
      try {
        const recent = JSON.parse(stored);
        const validRecent = recent.filter((item: any) =>
          Date.now() - item.lastUsed < 30 * 24 * 60 * 60 * 1000 // 30 days
        );
        const materialIds = validRecent.map((item: any) => item.materialId);
        const recentMats = allMaterials.filter(m => materialIds.includes(m.id));
        setRecentMaterials(recentMats);
      } catch (error) {
        console.error('Failed to load recent materials:', error);
      }
    }
  };

  const addToRecent = (material: Material) => {
    const recentKey = 'memo-recent-materials';
    const stored = localStorage.getItem(recentKey);
    let recent = [];

    if (stored) {
      try {
        recent = JSON.parse(stored);
      } catch (error) {
        recent = [];
      }
    }

    // Remove existing entry for this material
    recent = recent.filter((item: any) => item.materialId !== material.id);

    // Add to front
    recent.unshift({
      materialId: material.id,
      lastUsed: Date.now(),
    });

    // Keep only last 20 items
    recent = recent.slice(0, 20);

    localStorage.setItem(recentKey, JSON.stringify(recent));
    loadRecentMaterials();
  };

  const handleScanELNumber = () => {
    setShowScanner(true);
  };

  const handleELNumberScanned = async (elNumber: string) => {
    // Parse EL-number
    const parsedELNumber = parseElNumber(elNumber);

    if (!parsedELNumber) {
      toast({
        title: 'Invalid EL-Number',
        description: `Could not parse EL-number from: ${elNumber}`,
        variant: 'destructive',
      });
      return;
    }

    // First, check if material already exists locally
    const existingMaterial = allMaterials.find(m => m.el_nr === parsedELNumber);

    if (existingMaterial) {
      addMaterialToSelection(existingMaterial);
      toast({
        title: 'Material Found',
        description: `Added ${existingMaterial.tittel || 'Untitled'} to selection`,
      });
      return;
    }

    // If not found locally, try EFO database
    try {
      setLoading(true);
      toast({
        title: 'Searching EFO Database',
        description: `Looking up EL-number: ${parsedELNumber}`,
      });

      // Try EFO API first (will fallback to mock if not configured)
      let efoProduct = null;
      if (efoService.isEnabled()) {
        efoProduct = await efoService.searchByElNumber(parsedELNumber);
      } else {
        // Use mock data for demonstration
        efoProduct = await efoService.mockSearchByElNumber(parsedELNumber);
      }

      if (efoProduct) {
        // Found in EFO database, import it
        const defaultSupplier = suppliers.find(s =>
          s.name.toLowerCase().includes('efo') ||
          s.name.toLowerCase().includes('elektro')
        ) || suppliers[0];

        if (!defaultSupplier) {
          toast({
            title: 'No Supplier Available',
            description: 'Please add suppliers before importing materials',
            variant: 'destructive',
          });
          return;
        }

        const newMaterial = await efoService.lookupAndImportMaterial(
          parsedELNumber,
          defaultSupplier.id
        );

        if (newMaterial) {
          // Reload materials and add to selection
          await loadMaterials();
          addMaterialToSelection(newMaterial);
          toast({
            title: 'Material Imported from EFO',
            description: `Added ${newMaterial.tittel || 'Untitled'} to selection`,
          });
        }
      } else {
        toast({
          title: 'Material Not Found',
          description: `No material found with EL-number: ${parsedELNumber}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to lookup EL-number:', error);
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
    setSelectedMaterials(prev => {
      const existing = prev.find(sm => sm.id === material.id);
      if (existing) {
        return prev.map(sm =>
          sm.id === material.id
            ? { ...sm, quantity: sm.quantity + 1 }
            : sm
        );
      } else {
        return [...prev, { ...material, quantity: 1 }];
      }
    });
  };

  const updateMaterialQuantity = (materialId: number, change: number) => {
    setSelectedMaterials(prev =>
      prev.map(sm => {
        if (sm.id === materialId) {
          const newQuantity = Math.max(0, sm.quantity + change);
          return newQuantity === 0
            ? null
            : { ...sm, quantity: newQuantity };
        }
        return sm;
      }).filter(Boolean) as SelectedMaterial[]
    );
  };

  const clearMaterialQuantity = (materialId: number) => {
    setSelectedMaterials(prev => prev.filter(sm => sm.id !== materialId));
  };

  const filteredMaterials = allMaterials.filter(material =>
    !searchQuery ||
    material.tittel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.el_nr?.toString().includes(searchQuery) ||
    material.leverandor.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToJob = async () => {
    if (selectedMaterials.length === 0) {
      toast({
        title: 'No Materials Selected',
        description: 'Please select materials before adding to job',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Add each selected material to the job
      for (const selectedMaterial of selectedMaterials) {
        await jobMaterialsAPI.createJobMaterial({
          matriell_id: selectedMaterial.id,
          jobb: jobId,
          antall: selectedMaterial.quantity,
        });

        // Add to recent materials
        addToRecent(selectedMaterial);
      }

      // Reload job materials
      await loadJobMaterials();

      // Clear selection
      setSelectedMaterials([]);
      setShowMaterialDialog(false);

      toast({
        title: 'Materials Added',
        description: `${selectedMaterials.length} material(s) added to job`,
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

  const handleRemoveFromJob = async (jobMaterial: JobMaterial) => {
    try {
      await jobMaterialsAPI.deleteJobMaterial(jobMaterial.id);
      await loadJobMaterials();
      toast({
        title: 'Material Removed',
        description: 'Material removed from job',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove material from job',
        variant: 'destructive',
      });
    }
  };

  const handleToggleFavorite = async (material: Material) => {
    try {
      await materialsAPI.toggleFavorite(material.id);
      // Reload materials to get updated favorite status
      await loadMaterials();
    } catch (error) {
      // Error is already handled by the API call
    }
  };

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Materials ({jobMaterials.length})</h3>
        </div>
        <Dialog open={showMaterialDialog} onOpenChange={setShowMaterialDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Materials to Job</DialogTitle>
              <DialogDescription>
                Select materials to add to this work order. Use scanner, search, or browse categories.
              </DialogDescription>
            </DialogHeader>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button
                onClick={handleScanELNumber}
                variant="outline"
                className="h-12 justify-start"
              >
                <Scan className="h-4 w-4 mr-2" />
                Scan EL-Number
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Selection Summary */}
            {selectedMaterials.length > 0 && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-sm">Selected Materials ({selectedMaterials.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedMaterials.map(material => (
                    <div key={material.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{material.tittel || 'Untitled'}</p>
                        <p className="text-xs text-muted-foreground">
                          {material.leverandor.name} • EL: {material.el_nr}
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
                        <span className="w-8 text-center font-medium">{material.quantity}</span>
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
                          onClick={() => updateMaterialQuantity(material.id, 10)}
                        >
                          +10
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
                    Add to Job
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Material Tabs */}
            <Tabs defaultValue="recent" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="favorites">Favorites</TabsTrigger>
                <TabsTrigger value="all">All Materials</TabsTrigger>
              </TabsList>

              <TabsContent value="recent" className="space-y-2">
                {recentMaterials.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent materials</p>
                    <p className="text-xs">Materials you use will appear here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                    {recentMaterials.map(material => (
                      <MaterialCard
                        key={material.id}
                        material={material}
                        onSelect={addMaterialToSelection}
                        onToggleFavorite={handleToggleFavorite}
                        isSelected={selectedMaterials.some(sm => sm.id === material.id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="favorites" className="space-y-2">
                {favoriteMaterials.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No favorite materials</p>
                    <p className="text-xs">Mark materials as favorites for quick access</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                    {favoriteMaterials.map(material => (
                      <MaterialCard
                        key={material.id}
                        material={material}
                        onSelect={addMaterialToSelection}
                        onToggleFavorite={handleToggleFavorite}
                        isSelected={selectedMaterials.some(sm => sm.id === material.id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="all" className="space-y-2">
                <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                  {filteredMaterials.map(material => (
                    <MaterialCard
                      key={material.id}
                      material={material}
                      onSelect={addMaterialToSelection}
                      onToggleFavorite={handleToggleFavorite}
                      isSelected={selectedMaterials.some(sm => sm.id === material.id)}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* EFO Integration Info */}
            <div className="text-xs text-muted-foreground text-center border-t pt-3 mt-4">
              {efoService.isEnabled() ? (
                <div className="space-y-1">
                  <p>✅ EFO Official API Active</p>
                  <p>Scan EL-numbers to import materials from EFObasen (250,000+ products)</p>
                </div>
              ) : efoService.isScraperEnabled() ? (
                <div className="space-y-1">
                  <p>🤖 N8N Puppeteer Scraper Mode</p>
                  <p>Free EFObasen integration via n8n-nodes-puppeteer</p>
                  <p>💰 Saves 24,000 NOK/year vs official API</p>
                  <p className="text-xs">Requires: n8n community node installation</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p>📱 Demo Mode - Mock EL-number data</p>
                  <p>Options: N8N scraper (free) or EFO API (24,000 NOK/year)</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Job Materials */}
      {jobMaterials.length > 0 ? (
        <div className="space-y-2">
          {jobMaterials.map(jobMaterial => (
            <div key={jobMaterial.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {jobMaterial.matriell.tittel || 'Untitled'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {jobMaterial.matriell.leverandor.name} • EL: {jobMaterial.matriell.el_nr}
                </p>
                {jobMaterial.antall && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    Qty: {jobMaterial.antall}
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRemoveFromJob(jobMaterial)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No materials added yet</p>
          <p className="text-sm">Add materials to track usage on this job</p>
        </div>
      )}

      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleELNumberScanned}
        title="Scan EL-Number"
      />
    </div>
  );
}

interface MaterialCardProps {
  material: Material;
  onSelect: (material: Material) => void;
  onToggleFavorite?: (material: Material) => void;
  isSelected: boolean;
}

function MaterialCard({ material, onSelect, onToggleFavorite, isSelected }: MaterialCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(material);
  };

  return (
    <div
      onClick={() => onSelect(material)}
      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm">{material.tittel || 'Untitled'}</p>
            {onToggleFavorite && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleFavoriteClick}
                className="h-6 w-6 p-0"
              >
                <Heart
                  className={`h-3 w-3 ${
                    material.is_favorite
                      ? 'fill-red-500 text-red-500'
                      : 'text-muted-foreground hover:text-red-500'
                  }`}
                />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {material.leverandor.name}
          </p>
          <div className="flex gap-2 mt-1">
            {material.el_nr && (
              <Badge variant="outline" className="text-xs">
                EL: {material.el_nr}
              </Badge>
            )}
            {material.is_favorite && (
              <Badge variant="secondary" className="text-xs">
                <Star className="h-3 w-3 mr-1" />
                Favorite
              </Badge>
            )}
          </div>
        </div>
        {isSelected && (
          <div className="text-primary">
            <Plus className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}