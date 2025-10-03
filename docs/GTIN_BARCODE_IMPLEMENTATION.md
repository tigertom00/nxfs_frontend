# GTIN Barcode Scanning Implementation

## Overview

The memo app now supports scanning both GTIN barcodes (found on product packaging) and EL-numbers (Norwegian electrical product identifiers).

## How It Works

### 1. Barcode Scanner Component

The barcode scanner (`src/components/features/memo/shared/barcode-scanner.tsx`) now validates both:

- **EL-numbers**: 6-8 digit Norwegian electrical product identifiers
  - Formats: `123456`, `10 123 45`, `EL123456`
- **GTIN barcodes**: 8-14 digit global trade item numbers
  - Formats: EAN-8 (8 digits), UPC-A (12 digits), EAN-13 (13 digits), GTIN-14 (14 digits)
  - Example from screenshot: `7020160582119`

### 2. Material Lookup Flow

When a product code is scanned or entered:

1. **Detect code type**: Determine if it's a GTIN or EL-number
2. **Search local materials**: Check if product exists in local `allMaterials` array
   - For GTIN: Search by `gtin_number` field
   - For EL-number: Search by `el_nr` field
3. **Search API database**: Use `materialsAPI.checkDuplicates()` endpoint
   - For GTIN: `checkDuplicates({ gtin_number: "7020160582119" })`
   - For EL-number: Regular EL lookup
4. **EFObasen lookup**: If not found in database, query EFObasen via N8N
   - For GTIN: Call `elNumberLookupAPI.lookupGTIN(gtin)`
   - For EL-number: Call `elNumberLookupAPI.lookupELNumber(el_nr)`

### 3. API Integration

#### Material Check Duplicates Endpoint

```typescript
// Search by GTIN
const result = await materialsAPI.checkDuplicates({
  gtin_number: '7020160582119',
});
```

**API Request:**

```http
GET /app/memo/matriell/check_duplicates/?gtin_number=7020160582119
```

#### N8N Lookup Endpoints

```typescript
// GTIN lookup (NEW)
const result = await elNumberLookupAPI.lookupGTIN('7020160582119');

// EL-number lookup (existing)
const result = await elNumberLookupAPI.lookupELNumber('7020160');
```

**N8N Webhook Request:**

```http
POST https://n8n.nxfs.no/webhook/el_nr_lookup
Content-Type: application/json
Authorization: {NEXT_PUBLIC_N8N_SECRET_KEY}

{
  "gtin_number": "7020160582119"  // For GTIN lookup
}

OR

{
  "el_nr": "7020160"  // For EL-number lookup
}
```

## N8N Workflow Setup for GTIN Lookup

### Current Status

✅ EL-number lookup is fully functional
⚠️ GTIN lookup requires N8N workflow configuration

### Required N8N Workflow Changes

The N8N workflow at `https://n8n.nxfs.no/webhook/el_nr_lookup` needs to:

1. **Accept GTIN parameter** in addition to `el_nr`
2. **Query EFObasen by GTIN** (if EFObasen supports it)
3. **Alternative: GTIN-to-EL conversion** (lookup GTIN in external service, get EL-number)

### Option 1: Direct GTIN Lookup in EFObasen

If EFObasen supports GTIN search:

```javascript
// N8N Code Node
const input = $input.first().json;
const gtin = input.gtin_number;
const el_nr = input.el_nr;

let searchUrl;
if (gtin) {
  // Search by GTIN
  searchUrl = `https://efobasen.efo.no/API/VisProdukt/HentProduktinfo`;
  // POST body: { "GTIN": gtin }
} else {
  // Search by EL-number
  searchUrl = `https://efobasen.efo.no/API/VisProdukt/HentProduktinfo`;
  // POST body: { "Produktnr": el_nr }
}

// Return product data with all fields including gtin_number
```

### Option 2: GTIN-to-EL Conversion

If EFObasen only supports EL-number lookup:

1. **Use external GTIN database** (e.g., GS1, ean-search.org API)
2. **Extract manufacturer/product info**
3. **Search EFObasen by product name or manufacturer**
4. **Match and return result**

Example flow:

```
[Webhook] → [Check if GTIN or EL] → [If GTIN: Query GS1 API] → [Extract product name]
  → [Search EFObasen by name] → [Return matched product with EL-number]
```

### Option 3: Database Mapping Table

Maintain a mapping table in your database:

```sql
CREATE TABLE gtin_el_mapping (
  gtin VARCHAR(14) PRIMARY KEY,
  el_nr VARCHAR(8) NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Populate from EFObasen data
INSERT INTO gtin_el_mapping (gtin, el_nr, verified)
SELECT gtin_number, el_nr, TRUE
FROM scraped_materials
WHERE gtin_number IS NOT NULL;
```

N8N workflow:

```
[Webhook with GTIN] → [Query mapping table] → [If found: use EL-number]
  → [Query EFObasen] → [Return result]
```

## User Experience

### Scanning GTIN Barcodes

When users scan a GTIN barcode (e.g., `7020160582119`):

1. ✅ **Scanner validates** and accepts the code
2. ✅ **Checks local materials** for matching `gtin_number`
3. ✅ **Queries API database** using `checkDuplicates({ gtin_number })`
4. ⚠️ **EFObasen lookup** (requires N8N workflow)
   - If configured: Returns product data
   - If not configured: Shows error: "GTIN Lookup Not Available"

### Current Limitations

- **GTIN lookup in EFObasen**: Not yet configured (requires N8N workflow update)
- **Workaround**: Users can manually enter the EL-number if known

### Improved Error Messages

The scanner now provides helpful error messages:

- "Invalid product code format" → User knows to check the barcode
- "GTIN Lookup Not Available" → User knows to try EL-number instead
- "Material Found (GTIN)" → User confirms successful GTIN match
- "Material Found (EL-Number)" → User confirms successful EL-number match

## Testing

### Test GTIN: 7020160582119

This is the GTIN from your screenshot. To test:

1. **Navigate to memo job page**
2. **Click "Add" tab** in materials section
3. **Click scan icon** or enter manually
4. **Scan or type**: `7020160582119`
5. **Expected behavior**:
   - Scanner accepts the code
   - Searches local materials
   - Searches API database
   - Shows "GTIN Lookup Not Available" (until N8N is configured)

### Test EL-Number: 7020160

To test EL-number lookup:

1. Extract EL-number from GTIN (if there's a pattern)
2. Enter in scanner: `7020160`
3. Should trigger EL-number lookup in EFObasen

## Next Steps

1. ✅ **Frontend changes complete**
2. ⏳ **Configure N8N workflow** for GTIN support
   - Add GTIN parameter handling
   - Implement GTIN-to-EL conversion or direct GTIN lookup
3. ⏳ **Test end-to-end flow**
   - Scan GTIN barcode
   - Verify EFObasen returns correct product
   - Import and add to job
4. ⏳ **Populate GTIN data** in existing materials
   - Scrape GTIN from EFObasen
   - Update material records

## API Endpoints Reference

### Material Lookup by GTIN

```http
GET https://api.nxfs.no/app/memo/matriell/check_duplicates/?gtin_number=7020160582119
Authorization: Token {your-token}
```

### N8N GTIN Lookup

```http
POST https://n8n.nxfs.no/webhook/el_nr_lookup
Content-Type: application/json
Authorization: {NEXT_PUBLIC_N8N_SECRET_KEY}

{
  "gtin_number": "7020160582119"
}
```

### N8N EL-Number Lookup

```http
POST https://n8n.nxfs.no/webhook/el_nr_lookup
Content-Type: application/json
Authorization: {NEXT_PUBLIC_N8N_SECRET_KEY}

{
  "el_nr": "7020160"
}
```

## Questions to Address

1. **Does EFObasen API support GTIN lookup?**
   - Check EFObasen API documentation
   - Test with `POST /API/VisProdukt/HentProduktinfo` with GTIN parameter

2. **Is there a relationship between GTIN and EL-number?**
   - Example: GTIN `7020160582119` → EL-number `7020160` or `2016058`?
   - Check if first 7-8 digits of GTIN match EL-number

3. **Should we use an external GTIN database?**
   - GS1 Database (https://www.gs1.org/services/verified-by-gs1)
   - EAN-Search.org API (https://www.ean-search.org/)
   - Build our own mapping table

## Related Files

- `src/components/features/memo/shared/barcode-scanner.tsx` - Scanner validation
- `src/components/features/memo/job-detail/material-manager.tsx` - Material lookup logic
- `src/lib/api/memo/n8n-lookup.ts` - N8N API integration
- `src/lib/api/memo/materials.ts` - Material API (checkDuplicates)
- `src/lib/api/memo/types.ts` - TypeScript types (includes gtin_number)
