import {
  BaseSearchParams,
  PaginatedResponse,
  UserBasic,
} from '../shared/types';

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
  created_at: string;
  updated_at: string;
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
  tittel?: string;
  adresse?: string;
  postnummer?: string; // 4-digit postal code (e.g., "0158")
  poststed?: string; // City/postal area (e.g., "Oslo")
  telefon_nr?: string;
  beskrivelse?: string;
  ferdig: boolean;
  latitude?: number | null;
  longitude?: number | null;
  geocoded_at?: string | null;
  geocode_accuracy?: 'exact' | 'approximate' | 'failed' | null;
  distance?: number; // Distance in meters from user location (calculated by backend)
  total_hours?: number;
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
  user: UserBasic | number; // Full user object or ID for backward compatibility
  jobb: string;
  jobb_tittel?: string; // Job title for convenience
  timer: number;
  dato: string;
  beskrivelse: string | null;
  created_at: string;
  updated_at: string;
}

// Active Timer Session types
export interface ActiveTimerSession {
  id: number;
  user: number;
  jobb: string;
  start_time: string; // ISO timestamp
  last_ping: string; // ISO timestamp
  elapsed_seconds: number; // Calculated by server
  is_paused?: boolean; // Pause state
  paused_at?: string; // ISO timestamp when paused
  total_paused_seconds?: number; // Total accumulated pause time
}

export interface StartTimerSessionPayload {
  jobb: string; // Order number
}

export interface StopTimerSessionPayload {
  beskrivelse?: string; // Optional description for time entry
}

export type StartTimerSessionResponse = ActiveTimerSession;
export type GetActiveTimerSessionResponse = ActiveTimerSession | null;
export type StopTimerSessionResponse = TimeEntry; // Returns created time entry

// Job Image types
export interface JobImage {
  id: number;
  name: string;
  image: string;
  jobb: string;
  created_at: string;
}

// Job File types
export interface JobFile {
  id: number;
  name: string;
  file: string;
  file_type?: string;
  file_size?: number;
  jobb: string;
  created_at: string;
  updated_at: string;
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
  ordre_nr?: string;
  tittel?: string;
  ferdig?: boolean;
  created_after?: string;
  created_before?: string;
  ordering?: string; // e.g., '-ordre_nr' for descending, 'ordre_nr' for ascending
}

export interface NearbyJobsParams {
  lat: number;
  lon: number;
  radius?: number; // Default 100 meters
  ferdig?: boolean;
}

export interface SupplierSearchParams extends BaseSearchParams {
  navn?: string;
}

export interface MemoCategorySearchParams extends BaseSearchParams {
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
  adresse?: string;
  postnummer?: string; // 4-digit postal code
  poststed?: string; // City/postal area
  telefon_nr?: string;
  beskrivelse?: string;
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
export type GetMaterialsResponse = Material[] | PaginatedResponse<Material>;
export type GetMaterialsPaginatedResponse = PaginatedResponse<Material>;
export type GetMaterialResponse = Material;
export type CreateMaterialResponse = Material;
export type UpdateMaterialResponse = Material;

export type GetJobsResponse = Job[] | PaginatedResponse<Job>;
export type GetJobsPaginatedResponse = PaginatedResponse<Job>;
export type GetJobResponse = Job;
export type CreateJobResponse = Job;
export type UpdateJobResponse = Job;

export type GetJobMaterialsResponse =
  | JobMaterial[]
  | PaginatedResponse<JobMaterial>;
export type GetJobMaterialResponse = JobMaterial;
export type CreateJobMaterialResponse = JobMaterial;
export type UpdateJobMaterialResponse = JobMaterial;

export type GetSuppliersResponse = Supplier[] | PaginatedResponse<Supplier>;
export type GetSupplierResponse = Supplier;
export type CreateSupplierResponse = Supplier;
export type UpdateSupplierResponse = Supplier;

export type GetMemoCategoriesResponse =
  | ElectricalCategory[]
  | PaginatedResponse<ElectricalCategory>;
export type GetMemoCategoryResponse = ElectricalCategory;

export type GetTimeEntriesResponse = TimeEntry[] | PaginatedResponse<TimeEntry>;
export type GetTimeEntryResponse = TimeEntry;
export type CreateTimeEntryResponse = TimeEntry;
export type UpdateTimeEntryResponse = TimeEntry;

// New enhanced time tracking types
export interface UserTimeStats {
  today: {
    hours: number;
    entries: number;
  };
  yesterday: {
    hours: number;
    entries: number;
  };
  total_user: {
    hours: number;
    entries: number;
  };
  total_all_users: {
    hours: number;
    entries: number;
  };
}

export interface TimeEntryWithJob extends TimeEntry {
  jobb_details?: {
    ordre_nr: string;
    tittel?: string;
  };
}

export interface DateGroupedTimeEntries {
  [date: string]: {
    date: string;
    total_hours: number;
    entries: TimeEntryWithJob[];
  };
}

export interface GetTimeEntriesByDateParams {
  start_date?: string;
  end_date?: string;
  user_id?: number;
  jobb?: string;
}

// Recent job materials types
export interface RecentJobMaterial {
  id: number;
  matriell: Material;
  jobb: Job | number; // Full job object or ID for backward compatibility
  antall: number;
  transf: boolean;
  user?: UserBasic | number; // Full user object or ID for backward compatibility
  created_at: string;
  updated_at: string;
}

export interface GetRecentJobMaterialsParams {
  days?: number;
  jobb_id?: string;
  user_id?: number;
  all_users?: boolean;
}

export type GetRecentJobMaterialsResponse = RecentJobMaterial[];

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
