# N8N Puppeteer Community Node Setup for EFObasen Scraping

This guide shows how to use the `n8n-nodes-puppeteer` community node for scraping EFObasen, which is much cleaner than manual Puppeteer installation.

## 🚀 **Installation Options**

### **Option 1: Community Nodes Panel (Easiest)**

1. **Access N8N Admin Panel:**
   - Go to `http://your-n8n-instance:5678`
   - Navigate to `Settings` → `Community Nodes`

2. **Install the Node:**
   - Click `Install a community node`
   - Enter: `n8n-nodes-puppeteer`
   - Click `Install`
   - Wait for installation to complete

3. **Restart N8N:**
   ```bash
   docker restart n8n-container
   ```

### **Option 2: Docker Environment Variables (Recommended)**

If using Docker, add to your environment:

```yaml
# docker-compose.yml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    environment:
      - N8N_COMMUNITY_PACKAGES=n8n-nodes-puppeteer
      - PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
    ports:
      - "5678:5678"
    volumes:
      - n8n_data:/home/node/.n8n
```

### **Option 3: Custom Docker Image (Production)**

```dockerfile
# n8n-with-puppeteer.Dockerfile
FROM n8nio/n8n:latest

USER root

# Install Chrome dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

USER node

# Install Puppeteer community node
RUN npm install n8n-nodes-puppeteer

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
```

## 🔧 **EFObasen Scraping Workflow with Puppeteer Node**

### **Workflow Structure:**

```
[Webhook Trigger]
    ↓
[Validate EL Number]
    ↓
[Puppeteer - Navigate to EFObasen]
    ↓
[Puppeteer - Search for Product]
    ↓
[Puppeteer - Extract Product Data]
    ↓
[Format and Return Data]
```

### **Node Configurations:**

#### **1. Webhook Trigger**
- **Path:** `efobasen-puppeteer-lookup`
- **Method:** POST
- **Response Mode:** Response Node

#### **2. Puppeteer - Navigate and Search**

**Node Type:** `Puppeteer`
**Operation:** `Get Page Content`

**Configuration:**
```json
{
  "url": "https://efobasen.no",
  "waitUntil": "networkidle2",
  "timeout": 30000,
  "viewport": {
    "width": 1280,
    "height": 720
  },
  "options": {
    "args": [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu"
    ]
  }
}
```

#### **3. Puppeteer - Search and Extract**

**Node Type:** `Puppeteer`
**Operation:** `Custom Script`

**Script:**
```javascript
// Custom Puppeteer script for EFObasen
async function scrapeEFObasen(page, context) {
  const elNumber = context.getNodeParameter('elNumber');

  try {
    // Navigate to search
    await page.goto(`https://efobasen.no/søk?q=${elNumber}`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for Angular to load
    await page.waitForTimeout(5000);

    // Try to find search results with various selectors
    const productData = await page.evaluate(() => {
      // Common selectors for product listings
      const selectors = [
        '.product-card',
        '.search-result',
        '.product-item',
        '.result-item',
        '[data-product]',
        '.mat-card',
        '.product-list-item',
        '.search-result-item'
      ];

      let product = null;

      // Try each selector to find product data
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          const element = elements[0];

          // Extract text from various possible child elements
          const getTextFromSelectors = (parent, selectors) => {
            for (const sel of selectors) {
              const el = parent.querySelector(sel);
              if (el && el.textContent) {
                return el.textContent.trim();
              }
            }
            return null;
          };

          product = {
            title: getTextFromSelectors(element, [
              'h1', 'h2', 'h3', '.title', '.name', '.product-name',
              '.product-title', '[data-title]'
            ]),
            manufacturer: getTextFromSelectors(element, [
              '.manufacturer', '.brand', '.produsent', '.leverandor',
              '.supplier', '[data-manufacturer]'
            ]),
            description: getTextFromSelectors(element, [
              '.description', '.beskrivelse', '.info', '.details',
              '.product-description', '[data-description]'
            ]),
            elNumber: getTextFromSelectors(element, [
              '.el-number', '.el-nr', '.product-number', '[data-el-nr]'
            ]),
            price: getTextFromSelectors(element, [
              '.price', '.pris', '.cost', '[data-price]'
            ]),
            availability: getTextFromSelectors(element, [
              '.availability', '.tilgjengelighet', '.stock', '[data-availability]'
            ]),
            category: getTextFromSelectors(element, [
              '.category', '.kategori', '.type', '[data-category]'
            ]),
            selector_used: selector,
            element_count: elements.length
          };
          break;
        }
      }

      // If no structured data found, try to get any visible text
      if (!product) {
        const bodyText = document.body.innerText;
        const hasResults = bodyText.toLowerCase().includes('søk') ||
                          bodyText.toLowerCase().includes('resultat') ||
                          bodyText.toLowerCase().includes('produkt');

        product = {
          error: 'No structured product data found',
          hasSearchInterface: hasResults,
          pageText: bodyText.substring(0, 500) + '...',
          url: window.location.href
        };
      }

      return product;
    });

    return {
      success: true,
      data: productData,
      elNumber: elNumber,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      elNumber: elNumber,
      timestamp: new Date().toISOString()
    };
  }
}

return await scrapeEFObasen(page, context);
```

#### **4. Format Response**

**Node Type:** `Code`

```javascript
// Format the Puppeteer response
const data = $input.first().json;

if (data.success && data.data && !data.data.error) {
  // Successful scraping
  const product = data.data;

  return [{
    json: {
      el_nr: parseInt(data.elNumber) || null,
      title: product.title || 'Unknown',
      manufacturer: product.manufacturer || 'Unknown',
      supplier: product.manufacturer || 'Unknown',
      description: product.description || '',
      category: product.category || 'Unknown',
      price: product.price ? parseFloat(product.price.replace(/[^\d.,]/g, '').replace(',', '.')) : null,
      availability: product.availability || 'Unknown',
      scraped_at: data.timestamp,
      source: 'efobasen_puppeteer',
      selector_used: product.selector_used,
      raw_data: product
    }
  }];
} else {
  // Scraping failed or no data found
  return [{
    json: {
      error: data.error || data.data?.error || 'Unknown error',
      el_number: data.elNumber,
      debug_info: data.data,
      timestamp: data.timestamp,
      source: 'efobasen_puppeteer_failed'
    }
  }];
}
```

## 🧪 **Testing the Setup**

### **1. Test Puppeteer Installation**

Create a simple test workflow:

```javascript
// Test node - just navigate to a simple page
{
  "url": "https://example.com",
  "waitUntil": "load"
}
```

### **2. Test EFObasen Access**

```javascript
// Test if we can reach EFObasen
{
  "url": "https://efobasen.no",
  "waitUntil": "networkidle2",
  "timeout": 30000
}
```

### **3. Test Search Functionality**

Try with a known EL-number and see what structure we get back.

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **Node not appearing after installation:**
   - Restart N8N completely
   - Check the community nodes are enabled
   - Verify installation in Settings → Community Nodes

2. **Chrome/Chromium issues:**
   - Add the recommended Docker args
   - Ensure Chrome is installed in container
   - Set `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`

3. **Memory issues:**
   - Increase Docker memory limits
   - Add `--disable-dev-shm-usage` flag
   - Use `--single-process` for low memory

4. **Timeout issues:**
   - Increase timeout values
   - Use `networkidle2` instead of `load`
   - Add manual waits with `waitForTimeout`

## 📋 **Next Steps**

1. **Install the community node**
2. **Import the workflow**
3. **Test with EFObasen**
4. **Refine selectors based on actual structure**
5. **Add error handling and retries**
6. **Set up scheduled updates**

## 💡 **Advantages of Community Node**

- ✅ **Clean installation** - No manual Puppeteer setup
- ✅ **Built-in Chrome** - Handles browser dependencies
- ✅ **N8N Integration** - Native node with proper UI
- ✅ **Maintained** - Community updates and fixes
- ✅ **Documentation** - Better examples and guides
- ✅ **Performance** - Optimized for N8N workflows

This approach is much cleaner than manual Puppeteer installation and should work perfectly for EFObasen scraping! 🎉