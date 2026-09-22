# Product Information Lookup Order for MIC Uploads

This reference describes the current EAO source order for MIC product preparation.

## 1. Authoritative originals

Use the actual product datasheet, manual, test/certification document, approved PI/commercial document, or explicit current user/company confirmation for exact values. These sources outrank existing MIC copy and AI inference.

## 2. WeKnora Document/RAG

Use WeKnora to retrieve ARMOR product/company knowledge and locate grounded facts. A retrieval result does not upgrade an unsupported value into an authoritative technical fact. Conflicts with an original source remain visible.

## 3. Current MIC edit-page context

For an existing listing, use the Chrome extension extraction with schema mic-product-edit-context/v1.

It is authoritative for current form fields, current standard/custom-property structure, current options, required flags and current page capabilities.

It is existing-state evidence for product/commercial values, not higher authority than current product originals.

## 4. MIC Verified Keyword Library

For title/keyword work, read the relevant WeKnora Wiki page under operations/mic/keywords/*.

Only human-collected terms with source and collection date are VERIFIED_MIC_KEYWORD.

AI-generated related phrases are DERIVED_TERM and must never be described as hot, trending, high-volume or verified keywords.

## 5. Ledger

Use Ledger to check prior MIC titles, keywords and optimization work when available. Ledger records what was done; it is not product-fact authority.

## 6. User confirmation

Ask for confirmation when a material field is missing or conflicting and the task cannot be completed safely without it.

Never fabricate technical values, certifications, packaging, pricing, MOQ, logistics, warranty or commercial terms.

## Deprecated source patterns

Do not use gbrain, old desktop product spreadsheets, Obsidian/Vault paths, or session memory as current EAO product-fact authority.
