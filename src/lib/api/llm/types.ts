import { PaginatedResponse } from '../shared/types';

// LLM Provider types
export interface LLMProvider {
  id: number;
  name: string;
  url: string;
  description: string;
  description_nb: string;
  strengths_en: string[];
  strengths_no: string[];
  pricing: string;
  pricing_nb: string;
  icon: string | null;
  tags: number[]; // Array of tag IDs
  created_at: string;
  updated_at: string;
}

export interface CreateLLMProviderPayload {
  name: string;
  url: string;
  description: string;
  description_nb: string;
  strengths_en: string[];
  strengths_no: string[];
  pricing: string;
  pricing_nb: string;
  icon?: File | string | null;
  tag_ids: number[]; // Required field based on API response
}

export type UpdateLLMProviderPayload = Partial<CreateLLMProviderPayload>;

export interface LLMProviderTest {
  provider_id: number;
  test_prompt: string;
  response?: string;
  success: boolean;
  error?: string;
  response_time?: number;
  tokens_used?: number;
}

// Response types
export type GetLLMProvidersResponse = LLMProvider[];
export type GetLLMProviderResponse = LLMProvider;
export type CreateLLMProviderResponse = LLMProvider;
export type UpdateLLMProviderResponse = LLMProvider;
export type DeleteLLMProviderResponse = void;
export type TestLLMProviderResponse = LLMProviderTest;
