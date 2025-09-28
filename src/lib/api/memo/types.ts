import { BaseSearchParams, PaginatedResponse, ChoiceItem, BulkOperationResponse } from '../shared/types';

// Material types
export interface Material {
  id: number;
  el_nr: string | null;
  tittel: string | null;
  varemerke: string | null;
  varenummer: string | null;
  gtin_number: string | null;
  info: string | null;
  teknisk_beskrivelse: string | null;
  varebetegnelse: string | null;
  hoyde: number | null;
  bredde: number | null;
  lengde: number | null;
  vekt: number | null;
  bilder: string | null;
  produktblad: string | null;
  produkt_url: string | null;
  fdv: string | null;
  cpr_sertifikat: string | null;
  miljoinformasjon: string | null;
  approved: boolean;
  discontinued: boolean;
  in_stock: boolean;
  favorites: boolean;
  leverandor: Supplier | null;
  kategori: ElectricalCategory | null;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: number;
  navn: string;
  telefon: string | null;
  hjemmeside: string | null;
  addresse: string | null;
  poststed: string | null;
  postnummer: string | null;
  epost: string | null;
}

export interface ElectricalCategory {
  id: number;
  blokknummer: string;
  kategori: string;
  beskrivelse: string | null;
}

// Job types
export interface Job {
  ordre_nr: string;
  tittel: string;
  ferdig: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobMaterial {
  id: number;
  matriell: Material;
  jobb: string;
  antall: number;
  transf: boolean;
  created_at: string;
}

// Time tracking types
export interface TimeEntry {
  id: number;
  user: number;
  jobb: string;
  timer: number;
  dato: string;
  beskrivelse: string | null;
  created_at: string;
  updated_at: string;
}

// Job Image types
export interface JobImage {
  id: number;
  name: string;
  image: string;
  jobb: string;
  created_at: string;
}

// Search parameters
export interface MaterialSearchParams extends BaseSearchParams {
  el_nr?: string;
  tittel?: string;
  varemerke?: string;
  approved?: boolean;
  favorites?: boolean;
  in_stock?: boolean;
  discontinued?: boolean;
  kategori_blokknummer?: string;
  leverandor_name?: string;
}

export interface JobSearchParams extends BaseSearchParams {
  tittel?: string;
  ferdig?: boolean;
  created_after?: string;
  created_before?: string;
}

export interface SupplierSearchParams extends BaseSearchParams {
  navn?: string;
}

export interface CategorySearchParams extends BaseSearchParams {
  blokknummer?: string;
  kategori?: string;
}

export interface TimeEntrySearchParams extends BaseSearchParams {
  user?: number;
  jobb?: string;
  dato_after?: string;
  dato_before?: string;
  this_month?: boolean;
  this_week?: boolean;
  timer_min?: number;
  timer_max?: number;
}

// Request payloads
export interface CreateMaterialPayload {
  el_nr?: string;
  tittel?: string;
  varemerke?: string;
  varenummer?: string;
  gtin_number?: string;
  info?: string;
  teknisk_beskrivelse?: string;
  varebetegnelse?: string;
  hoyde?: number;
  bredde?: number;
  lengde?: number;
  vekt?: number;
  bilder?: File | string;
  produktblad?: string;
  produkt_url?: string;
  fdv?: string;
  cpr_sertifikat?: string;
  miljoinformasjon?: string;
  approved?: boolean;
  discontinued?: boolean;
  in_stock?: boolean;
  favorites?: boolean;
  leverandor?: number;
  kategori?: number;
}

export type UpdateMaterialPayload = Partial<CreateMaterialPayload>;

export interface CreateJobPayload {
  ordre_nr: string;
  tittel: string;
  ferdig?: boolean;
}

export type UpdateJobPayload = Partial<CreateJobPayload>;

export interface CreateJobMaterialPayload {
  matriell_id: number;
  jobb: string;
  antall: number;
  transf?: boolean;
}

export interface CreateTimeEntryPayload {
  user: number;
  jobb: string;
  timer: number;
  dato: string;
  beskrivelse?: string;
}

export type UpdateTimeEntryPayload = Partial<CreateTimeEntryPayload>;

// Response types
export type GetMaterialsResponse = Material[];
export type GetMaterialsPaginatedResponse = PaginatedResponse<Material>;
export type GetMaterialResponse = Material;
export type CreateMaterialResponse = Material;
export type UpdateMaterialResponse = Material;

export type GetJobsResponse = Job[];
export type GetJobsPaginatedResponse = PaginatedResponse<Job>;
export type GetJobResponse = Job;
export type CreateJobResponse = Job;
export type UpdateJobResponse = Job;

export type GetJobMaterialsResponse = JobMaterial[];
export type GetJobMaterialResponse = JobMaterial;
export type CreateJobMaterialResponse = JobMaterial;
export type UpdateJobMaterialResponse = JobMaterial;

export type GetSuppliersResponse = Supplier[];
export type GetSupplierResponse = Supplier;
export type CreateSupplierResponse = Supplier;
export type UpdateSupplierResponse = Supplier;

export type GetCategoriesResponse = ElectricalCategory[];
export type GetCategoryResponse = ElectricalCategory;

export type GetTimeEntriesResponse = TimeEntry[];
export type GetTimeEntryResponse = TimeEntry;
export type CreateTimeEntryResponse = TimeEntry;
export type UpdateTimeEntryResponse = TimeEntry;

// Dashboard types
export interface DashboardStats {
  materials: {
    total: number;
    favorites: number;
    approved: number;
    in_stock: number;
    discontinued: number;
    approval_rate: number;
  };
  jobs: {
    total: number;
    completed: number;
    active: number;
    completion_rate: number;
    total_hours: number;
  };
  suppliers: {
    total: number;
    with_materials: number;
    utilization_rate: number;
  };
  categories: {
    total: number;
    with_materials: number;
    utilization_rate: number;
  };
  time_tracking: {
    total_entries: number;
    entries_this_month: number;
  };
}

export interface RecentActivity {
  materials: Array<{
    id: number;
    el_nr: string;
    tittel: string;
    varemerke: string;
    leverandor_name: string;
    created_at: string;
  }>;
  jobs: Array<{
    ordre_nr: string;
    tittel: string;
    ferdig: boolean;
    created_at: string;
  }>;
  time_entries: Array<{
    id: number;
    beskrivelse: string;
    timer: number;
    dato: string;
    jobb_tittel: string;
    user: string;
    created_at: string;
  }>;
}

// Bulk operations
export interface BulkMaterialUpdatePayload {
  action: 'update_status' | 'delete' | 'approve' | 'set_stock';
  el_nrs: string[];
  data?: {
    approved?: boolean;
    in_stock?: boolean;
    discontinued?: boolean;
    favorites?: boolean;
  };
}

export interface BulkFavoritePayload {
  action: 'add' | 'remove';
  el_nrs: string[];
}

export interface MaterialValidationPayload {
  el_nr?: string;
  tittel?: string;
  leverandor?: string;
  kategori?: string;
  [key: string]: any;
}

export interface MaterialValidationResponse {
  valid: boolean;
  errors: string[];
  warnings: string[];
  data_summary: {
    el_nr?: string;
    tittel?: string;
    leverandor?: string;
    kategori?: string;
    has_gtin: boolean;
  };
}

// EFO Basen import
export interface EFOBasenImportPayload {
  el_nr?: string;
  tittel?: string;
  varemerke?: string;
  leverandor?: {
    navn: string;
    telefon?: string;
    hjemmeside?: string;
    addresse?: string;
    poststed?: string;
    postnummer?: string;
    epost?: string;
  };
  kategori?: string;
  [key: string]: any;
}