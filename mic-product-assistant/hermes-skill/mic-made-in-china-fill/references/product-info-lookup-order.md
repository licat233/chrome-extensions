# Product Information Lookup Order for MIC Uploads

When preparing MIC product upload data, follow this lookup sequence to ensure accuracy:

## 1. gbrain Query (Primary Source)

Query gbrain first for product knowledge that may already be structured from previous sessions:

```bash
# Example queries
mcp_gbrain_query(query="HM-CSP-480 LED strip voltage power specifications")
mcp_gbrain_search(query="CSP strip light 480LEDs")
```

**Why first:** gbrain contains compiled truths from previous product analysis sessions, including extracted spec sheet data, PI pricing, and user-confirmed parameters.

## 2. Product Knowledge Base V3

If gbrain lacks data, check the Excel KB:

**Path:** `~/Desktop/work/products/ARMOR_Product_Knowledge_Base_V3_*.xlsx`

**Sheet structure:**
- Product specifications (voltage, power, dimensions, certifications)
- SEO keywords and marketing copy
- Pricing tiers and MOQ
- Variant SKUs and relationships

## 3. MIC Product Export CSV

For existing MIC listings being updated or duplicated:

**Path:** `~/Desktop/work/products/data/armor-MIC-products-*.csv`

**Use case:** Extract current field values, pricing, and category assignments from live MIC products.

## 4. Session Search

Search past sessions for product-specific discussions:

```bash
session_search(query="HM-CSP-480 specifications")
```

## 5. User Confirmation (Final Resort)

If critical parameters (voltage, power, certifications, pricing) are missing after all above sources, explicitly ask the user:

> "[Parameter] not found in product KB or gbrain. Please confirm: [specific question]"

**Never fabricate:** Voltage, power, certifications, dimensions, pricing, or HS codes must come from authoritative sources, never invented.
