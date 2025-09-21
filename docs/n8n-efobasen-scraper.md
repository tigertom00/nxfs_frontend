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

### 3. Browser Automation - Navigate to EFObasen

**Note:** EFObasen is an Angular SPA, so we need browser automation instead of simple HTTP requests.

**Option A: Use Puppeteer in N8N Code Node**

```javascript
// Install puppeteer in your N8N instance
const puppeteer = require('puppeteer');

async function scrapeEFObasen(elNumber) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    // Navigate to search page
    await page.goto(`https://efobasen.no/søk?q=${elNumber}`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Try to find search results
    const productData = await page.evaluate(() => {
      // Look for various possible selectors
      const selectors = [
        '.product-card',
        '.search-result',
        '.product-item',
        '[data-el-nr]',
        '.result-item'
      ];

      let product = null;

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          const element = elements[0];
          product = {
            title: element.querySelector('h1, h2, h3, .title, .name')?.textContent?.trim(),
            manufacturer: element.querySelector('.manufacturer, .brand, .produsent')?.textContent?.trim(),
            description: element.querySelector('.description, .beskrivelse')?.textContent?.trim(),
            elNumber: element.querySelector('.el-number, .el-nr')?.textContent?.trim(),
            selector_used: selector
          };
          break;
        }
      }

      return product || { error: 'No product found', html_snippet: document.body.innerHTML.substring(0, 1000) };
    });

    return productData;
  } finally {
    await browser.close();
  }
}

// Main execution
const elNumber = $input.first().json.el_number;
const result = await scrapeEFObasen(elNumber);
return [{ json: { ...result, el_number: elNumber } }];
```

**Option B: Use Browser Automation Service**

Alternative: Use a service like ScrapingBee, ScrapFly, or Browserless.io

### 4. Alternative: Network Monitoring Approach

Since EFObasen is an SPA, we can also try to intercept network requests:

```javascript
// In Puppeteer code node
const puppeteer = require('puppeteer');

async function interceptEFObasenAPI(elNumber) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Collect network requests
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('api') || request.url().includes('search')) {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      });
    }
  });

  // Collect responses
  const responses = [];
  page.on('response', response => {
    if (response.url().includes('api') || response.url().includes('search')) {
      responses.push({
        url: response.url(),
        status: response.status(),
        headers: response.headers()
      });
    }
  });

  try {
    await page.goto(`https://efobasen.no/søk?q=${elNumber}`, {
      waitUntil: 'networkidle2'
    });

    await page.waitForTimeout(5000);

    return { requests, responses, el_number: elNumber };
  } finally {
    await browser.close();
  }
}
```

### 5. Simplified Mock Approach (Immediate Solution)

For immediate testing, enhance the mock data with more realistic Norwegian electrical products:

```javascript
// Enhanced mock data based on real EFObasen patterns
const mockEFOProducts = [
  {
    el_nr: 123456,
    title: "LED-pære E27 9W 2700K dimbar",
    manufacturer: "Philips",
    supplier: "Elektro Grossist AS",
    description: "LED-pære med E27 sokkel, 9W effekt, varmhvitt lys 2700K, dimbar",
    category: "Belysning - LED pærer",
    price: 89.90,
    availability: "På lager",
    image_url: "https://example.com/led-bulb.jpg"
  },
  {
    el_nr: 234567,
    title: "Jordfeilbryter 2-pol 16A 30mA Type A",
    manufacturer: "Schneider Electric",
    supplier: "El-Grossisten",
    description: "Jordfeilbryter 2-polet 16A 30mA Type A for boliger",
    category: "Sikkerhetsutstyr - Jordfeilbrytere",
    price: 245.00,
    availability: "På lager"
  }
  // Add more realistic products...
];
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