// LLM Provider types
export interface LLMProvider {
  id: number;
  name: string;
  description?: string;
  provider_type: 'openai' | 'anthropic' | 'google' | 'huggingface' | 'local' | 'other';
  base_url?: string;
  api_key?: string;
  model_name: string;
  max_tokens?: number;
  temperature?: number;
  is_active: boolean;
  icon?: string;
  strengths?: string[];
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateLLMProviderPayload {
  name: string;
  description?: string;
  provider_type: 'openai' | 'anthropic' | 'google' | 'huggingface' | 'local' | 'other';
  base_url?: string;
  api_key?: string;
  model_name: string;
  max_tokens?: number;
  temperature?: number;
  is_active?: boolean;
  icon?: File | string;
  strengths?: string[];
  tags?: string[];
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