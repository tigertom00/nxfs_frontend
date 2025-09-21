# N8N EFObasen Scraper Workflow

This document outlines how to create an N8N workflow to scrape electrical materials from EFObasen.no and store them in your database, avoiding the 24,000 NOK/year API cost.

## 🎯 Overview

**Goal:** Scrape product data from EFObasen.no by EL-number and store in local database
**Cost:** Free (vs 24,000 NOK/year for official API)
**Update Frequency:** On-demand or scheduled

## 🔍 EFObasen URL Patterns

Based on research, EFObasen uses these URL patterns:

- **Product Page:** `https://efobasen.no/produkt/{product_id}`
- **Search:** `https://efobasen.no/søk?q={el_number}`
- **API Endpoints:** `https://efobasen.no/API/` (various endpoints)

## 🔧 N8N Workflow Structure

### Workflow 1: EL-Number Lookup & Scrape

```
[Webhook Trigger]
    ↓
[HTTP Request - Search EFObasen]
    ↓
[HTML Extract - Parse Search Results]
    ↓
[HTTP Request - Get Product Details]
    ↓
[HTML Extract - Parse Product Data]
    ↓
[PostgreSQL - Store in Database]
    ↓
[Respond with Product Data]
```

### Workflow 2: Bulk Scraping (Scheduled)

```
[Schedule Trigger - Daily/Weekly]
    ↓
[PostgreSQL - Get EL-numbers to update]
    ↓
[Loop through EL-numbers]
    ↓
[HTTP Request - Get Product Data]
    ↓
[HTML Extract - Parse Product]
    ↓
[PostgreSQL - Update Database]
    ↓
[Log Results]
```

## 📝 N8N Workflow Configuration

### 1. Webhook Trigger Node

**URL:** `https://n8n.nxfs.no/webhook/efobasen-lookup`

**HTTP Method:** POST

**Request Body:**
```json
{
  "el_number": "123456",
  "force_update": false
}
```

### 2. Check Database First

**Node Type:** PostgreSQL
**Operation:** Execute Query

```sql
SELECT * FROM scraped_materials
WHERE el_nr = {{ $json.el_number }}
AND updated_at > NOW() - INTERVAL '7 days';
```

### 3. HTTP Request - Search EFObasen

**URL:** `https://efobasen.no/søk?q={{ $json.el_number }}`

**Headers:**
```json
{
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "no-NO,no;q=0.8,en-US;q=0.5,en;q=0.3",
  "Accept-Encoding": "gzip, deflate, br",
  "Connection": "keep-alive",
  "Upgrade-Insecure-Requests": "1"
}
```

### 4. HTML Extract - Parse Search Results

**CSS Selectors:**
- Product Links: `.product-item a[href*="/produkt/"]`
- Product IDs: Extract from href pattern `/produkt/(\d+)`

### 5. HTTP Request - Get Product Details

**URL:** `https://efobasen.no/produkt/{{ $json.product_id }}`

### 6. HTML Extract - Parse Product Data

**CSS Selectors to Extract:**
```javascript
{
  "el_nr": ".el-number, .product-number",
  "title": "h1.product-title, .product-name",
  "manufacturer": ".manufacturer, .brand",
  "supplier": ".supplier, .leverandor",
  "description": ".product-description, .beskrivelse",
  "specifications": ".specifications tr",
  "price": ".price, .pris",
  "availability": ".availability, .tilgjengelighet",
  "category": ".category, .kategori",
  "image_url": ".product-image img[src]"
}
```

### 7. Data Transformation

**Node Type:** Code (JavaScript)

```javascript
// Clean and structure the scraped data
const productData = {
  el_nr: parseInt($input.first().json.el_nr?.replace(/\D/g, '') || '0'),
  title: $input.first().json.title?.trim(),
  manufacturer: $input.first().json.manufacturer?.trim(),
  supplier: $input.first().json.supplier?.trim(),
  description: $input.first().json.description?.trim(),
  category: $input.first().json.category?.trim(),
  price: parseFloat($input.first().json.price?.replace(/[^\d.,]/g, '').replace(',', '.') || '0'),
  availability: $input.first().json.availability?.trim(),
  image_url: $input.first().json.image_url,
  scraped_at: new Date().toISOString(),
  source_url: `https://efobasen.no/produkt/${$input.first().json.product_id}`
};

return [{ json: productData }];
```

### 8. Store in Database

**Node Type:** PostgreSQL
**Operation:** Insert/Update

```sql
INSERT INTO scraped_materials (
  el_nr, title, manufacturer, supplier, description,
  category, price, availability, image_url,
  scraped_at, source_url, updated_at
) VALUES (
  {{ $json.el_nr }},
  '{{ $json.title }}',
  '{{ $json.manufacturer }}',
  '{{ $json.supplier }}',
  '{{ $json.description }}',
  '{{ $json.category }}',
  {{ $json.price }},
  '{{ $json.availability }}',
  '{{ $json.image_url }}',
  '{{ $json.scraped_at }}',
  '{{ $json.source_url }}',
  NOW()
) ON CONFLICT (el_nr) DO UPDATE SET
  title = EXCLUDED.title,
  manufacturer = EXCLUDED.manufacturer,
  supplier = EXCLUDED.supplier,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  availability = EXCLUDED.availability,
  image_url = EXCLUDED.image_url,
  source_url = EXCLUDED.source_url,
  updated_at = NOW()
RETURNING *;
```

## 🗄️ Database Schema

```sql
-- Create table for scraped materials
CREATE TABLE scraped_materials (
  id SERIAL PRIMARY KEY,
  el_nr INTEGER UNIQUE NOT NULL,
  title VARCHAR(255),
  manufacturer VARCHAR(255),
  supplier VARCHAR(255),
  description TEXT,
  category VARCHAR(255),
  price DECIMAL(10,2),
  availability VARCHAR(100),
  image_url TEXT,
  specifications JSONB,
  scraped_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  source_url TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Index for fast EL-number lookups
CREATE INDEX idx_scraped_materials_el_nr ON scraped_materials(el_nr);
CREATE INDEX idx_scraped_materials_updated_at ON scraped_materials(updated_at);
CREATE INDEX idx_scraped_materials_title ON scraped_materials USING gin(to_tsvector('norwegian', title));
```

## 🔄 Error Handling & Rate Limiting

### Rate Limiting
- Add delays between requests (2-5 seconds)
- Respect robots.txt
- Use rotating User-Agents
- Implement retry logic with exponential backoff

### Error Handling
```javascript
// In N8N Code node
try {
  // Scraping logic here
} catch (error) {
  return [{
    json: {
      error: true,
      message: error.message,
      el_nr: $input.first().json.el_number,
      timestamp: new Date().toISOString()
    }
  }];
}
```

## 🚀 Integration with Frontend

### Update EFO Service

```typescript
// src/lib/efo-api.ts - Add scraper integration
export const efoScraperService = {
  async lookupElNumber(elNumber: string | number): Promise<EFOProduct | null> {
    try {
      const response = await fetch('https://n8n.nxfs.no/webhook/efobasen-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          el_number: elNumber,
          force_update: false
        }),
      });

      if (!response.ok) {
        throw new Error(`Scraper API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('EFO scraper failed:', error);
      return null;
    }
  }
};
```

## 📋 Deployment Checklist

- [ ] Create N8N workflows on n8n.nxfs.no
- [ ] Set up database tables
- [ ] Configure webhook endpoints
- [ ] Test with sample EL-numbers
- [ ] Implement rate limiting
- [ ] Add error logging
- [ ] Schedule bulk updates
- [ ] Monitor scraping success rate
- [ ] Update frontend integration

## ⚖️ Legal Considerations

- Respect EFObasen's robots.txt
- Use reasonable request frequencies
- Don't overload their servers
- Consider caching scraped data
- Review Norwegian web scraping laws
- Use scraped data responsibly

## 🔧 Maintenance

- Monitor for site structure changes
- Update CSS selectors as needed
- Track scraping success rates
- Clean up old/invalid data
- Regular data validation

---

**Cost Comparison:**
- Official EFO API: 24,000 NOK/year
- N8N Scraping Solution: ~200 NOK/month (server costs)
- **Savings: ~22,600 NOK/year** 💰