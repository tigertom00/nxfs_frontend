import axios from 'axios';
import { env } from '@/lib/env';
import { handleApiError } from '../shared/error-handler';
import { CreateMaterialResponse, EFOBasenImportPayload } from './types';
import { materialsAPI } from './materials';

// N8N EL Number Lookup API
export const elNumberLookupAPI = {
  // Lookup EL number using N8N webhook
  lookupELNumber: async (el_nr: string): Promise<any> => {
    try {
      const response = await axios.post(
        'https://n8n.nxfs.no/webhook/el_nr_lookup',
        { el_nr },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: env.NEXT_PUBLIC_N8N_SECRET_KEY,
          },
        }
      );
      return response.data;
    } catch (error) {
      handleApiError(error, 'Looking up EL number');
      throw error;
    }
  },

  // Import material from EFObasen using the new endpoint
  importFromEFObasen: async (
    efoData: EFOBasenImportPayload
  ): Promise<CreateMaterialResponse> => {
    try {
      // Use the materials API EFObasen import endpoint
      return await materialsAPI.importFromEFObasen(efoData);
    } catch (error) {
      handleApiError(error, 'Importing material from EFObasen');
      throw error;
    }
  },
};
