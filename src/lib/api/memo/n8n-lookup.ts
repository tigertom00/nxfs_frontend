import axios from 'axios';
import { env } from '@/lib/env';
import { handleApiError } from '../shared/error-handler';
import { CreateMaterialResponse, EFOBasenImportPayload } from './types';
import { materialsAPI } from './materials';

// N8N Product Lookup API (EL-number and GTIN support)
export const elNumberLookupAPI = {
  // Lookup product by EL number using N8N webhook
  lookupELNumber: async (el_nr: string | number): Promise<any> => {
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

  // Lookup product by GTIN using N8N webhook
  // Note: This requires the N8N workflow to support GTIN lookup
  lookupGTIN: async (gtin: string): Promise<any> => {
    try {
      const response = await axios.post(
        'https://n8n.nxfs.no/webhook/el_nr_lookup',
        { gtin_number: gtin },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: env.NEXT_PUBLIC_N8N_SECRET_KEY,
          },
        }
      );
      return response.data;
    } catch (error) {
      handleApiError(error, 'Looking up GTIN');
      throw error;
    }
  },

  // Universal lookup - detects if input is EL-number or GTIN
  lookupProduct: async (productCode: string): Promise<any> => {
    const cleanCode = productCode.replace(/\s/g, '');
    const isGTIN = /^\d{8,14}$/.test(cleanCode) && cleanCode.length >= 10;

    if (isGTIN) {
      return elNumberLookupAPI.lookupGTIN(cleanCode);
    } else {
      return elNumberLookupAPI.lookupELNumber(cleanCode);
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
