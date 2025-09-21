/**
 * EFO EFObasen API Integration
 *
 * This service integrates with the Norwegian Electrical Trade Association (EFO)
 * EFObasen database for electrical materials lookup by EL-number.
 *
 * API Information:
 * - Standard API: 24,000 NOK/year for internal business systems
 * - Custom API: Price by agreement
 * - Contact: elektroforeningen@efo.no
 * - Database: 250,000+ electrical products
 *
 * To enable this integration:
 * 1. Contact EFO at elektroforeningen@efo.no
 * 2. Sign API agreement and get credentials
 * 3. Add EFO_API_URL and EFO_API_KEY to environment variables
 * 4. Set EFO_API_ENABLED=true in environment
 */

import { materialsAPI } from './api';
import { Material, CreateMaterialPayload } from '@/types/api';

// EFO API Response Types
export interface EFOProduct {
  el_nr: number;
  productName: string;
  manufacturer: string;
  supplierName: string;
  description: string;
  category: string;
  price?: number;
  availability?: string;
  specifications?: Record<string, any>;
  etimClass?: string;
  environmentalInfo?: Record<string, any>;
}

export interface EFOSearchResponse {
  products: EFOProduct[];
  totalCount: number;
  page: number;
  pageSize: number;
}

class EFOService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly enabled: boolean;
  private readonly scraperUrl: string;
  private readonly scraperEnabled: boolean;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_EFO_API_URL || '';
    this.apiKey = process.env.NEXT_PUBLIC_EFO_API_KEY || '';
    this.enabled = process.env.NEXT_PUBLIC_EFO_API_ENABLED === 'true';
    this.scraperUrl = process.env.NEXT_PUBLIC_N8N_URL?.replace('/webhook/nxfs', '/webhook/efobasen-lookup') || 'https://n8n.nxfs.no/webhook/efobasen-lookup';
    this.scraperEnabled = process.env.NEXT_PUBLIC_EFO_SCRAPER_ENABLED === 'true';
  }

  /**
   * Check if EFO API integration is enabled and configured
   */
  isEnabled(): boolean {
    return this.enabled && !!this.baseUrl && !!this.apiKey;
  }

  /**
   * Check if N8N scraper is enabled
   */
  isScraperEnabled(): boolean {
    return this.scraperEnabled || !this.isEnabled();
  }

  /**
   * Search for products by EL-number using N8N scraper
   */
  async searchByElNumberScraper(elNumber: string | number): Promise<EFOProduct | null> {
    try {
      const response = await fetch(this.scraperUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          el_number: typeof elNumber === 'string' ? parseInt(elNumber) : elNumber,
          force_update: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`EFO scraper error: ${response.status}`);
      }

      const data = await response.json();

      // Convert scraped data to EFOProduct format
      if (data && data.el_nr) {
        return {
          el_nr: data.el_nr,
          productName: data.title || '',
          manufacturer: data.manufacturer || '',
          supplierName: data.supplier || '',
          description: data.description || '',
          category: data.category || '',
          price: data.price || undefined,
          availability: data.availability || undefined,
          specifications: data.specifications || {},
        };
      }

      return null;
    } catch (error) {
      console.error('EFO scraper failed:', error);
      return null;
    }
  }

  /**
   * Search for products by EL-number (tries scraper first, then API, then mock)
   */
  async searchByElNumber(elNumber: string | number): Promise<EFOProduct | null> {
    // Try N8N scraper first (if enabled)
    if (this.isScraperEnabled()) {
      const scraperResult = await this.searchByElNumberScraper(elNumber);
      if (scraperResult) {
        return scraperResult;
      }
    }

    // Fall back to official API if available
    if (this.isEnabled()) {
      try {
        const response = await fetch(`${this.baseUrl}/products/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            el_nr: typeof elNumber === 'string' ? parseInt(elNumber) : elNumber,
          }),
        });

        if (response.ok) {
          const data: EFOSearchResponse = await response.json();
          return data.products.length > 0 ? data.products[0] : null;
        }
      } catch (error) {
        console.error('EFO API search failed:', error);
      }
    }

    // Final fallback to mock data
    return await this.mockSearchByElNumber(elNumber);
  }

  /**
   * Search for products by text query
   */
  async searchByText(query: string, page = 1, pageSize = 20): Promise<EFOSearchResponse | null> {
    if (!this.isEnabled()) {
      console.warn('EFO API not enabled or configured');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/products/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query,
          page,
          pageSize,
        }),
      });

      if (!response.ok) {
        throw new Error(`EFO API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('EFO API search failed:', error);
      return null;
    }
  }

  /**
   * Convert EFO product to local material format
   */
  convertToMaterial(efoProduct: EFOProduct, supplierId: number): CreateMaterialPayload {
    return {
      leverandor_id: supplierId,
      el_nr: efoProduct.el_nr,
      tittel: efoProduct.productName,
      info: [
        efoProduct.description,
        efoProduct.manufacturer && `Manufacturer: ${efoProduct.manufacturer}`,
        efoProduct.category && `Category: ${efoProduct.category}`,
        efoProduct.etimClass && `ETIM: ${efoProduct.etimClass}`,
      ].filter(Boolean).join(' | '),
    };
  }

  /**
   * Lookup and import material from EFO database
   */
  async lookupAndImportMaterial(elNumber: string | number, supplierId: number): Promise<Material | null> {
    const efoProduct = await this.searchByElNumber(elNumber);

    if (!efoProduct) {
      return null;
    }

    try {
      // Convert EFO product to local material format
      const materialPayload = this.convertToMaterial(efoProduct, supplierId);

      // Create material in local database
      const newMaterial = await materialsAPI.createMaterial(materialPayload);

      return newMaterial;
    } catch (error) {
      console.error('Failed to import material from EFO:', error);
      throw error;
    }
  }

  /**
   * Demo/fallback search using mock data
   * Remove this when real API is available
   */
  async mockSearchByElNumber(elNumber: string | number): Promise<EFOProduct | null> {
    // Mock EFO data for demonstration
    const mockProducts: EFOProduct[] = [
      {
        el_nr: 123456,
        productName: "LED-pære E27 9W 2700K",
        manufacturer: "Philips",
        supplierName: "Elektro Grossist AS",
        description: "LED-pære med E27 sokkel, 9W effekt, varmhvitt lys 2700K",
        category: "Belysning",
        price: 89.90,
        availability: "På lager",
        etimClass: "EC000123",
      },
      {
        el_nr: 234567,
        productName: "Jordfeilbryter 16A 30mA",
        manufacturer: "Schneider Electric",
        supplierName: "El-Grossisten",
        description: "Jordfeilbryter 2-polet 16A 30mA Type A",
        category: "Sikkerhetsutstyr",
        price: 245.00,
        availability: "På lager",
        etimClass: "EC000456",
      },
      {
        el_nr: 345678,
        productName: "Kabel NYM-J 3x1.5mm² 100m",
        manufacturer: "Nexans",
        supplierName: "Kabel Norge AS",
        description: "Installasjonskabel NYM-J 3x1.5mm² på 100m trommel",
        category: "Kabler",
        price: 1250.00,
        availability: "Bestillingsvare",
        etimClass: "EC000789",
      },
    ];

    const normalizedElNumber = typeof elNumber === 'string' ? parseInt(elNumber) : elNumber;
    return mockProducts.find(p => p.el_nr === normalizedElNumber) || null;
  }
}

// Export singleton instance
export const efoService = new EFOService();

// Helper function to parse EL-number from various formats
export function parseElNumber(input: string): number | null {
  // Remove common prefixes and clean the string
  const cleaned = input
    .replace(/^(EL|el)[:\s-]*/i, '')
    .replace(/[^\d]/g, '');

  const number = parseInt(cleaned);

  // Validate EL-number range (typically 6-8 digits)
  if (isNaN(number) || number < 100000 || number > 99999999) {
    return null;
  }

  return number;
}

// Export types for use in components
export type { EFOProduct, EFOSearchResponse };