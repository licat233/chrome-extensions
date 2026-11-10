---
name: mic-made-in-china-fill
description: Generate paste-ready text for MIC Product Assistant from an actual current edit-page context or a captured MIC category form schema. This Skill owns the Chrome Bulk Fill text protocol only; it is not ARMOR product-fact authority, category-template authority, or keyword-popularity authority.
---

# MIC Product Assistant — Bulk Fill Protocol

## Purpose

Convert already-decided MIC product data into the exact plain-text format consumed by the Chrome extension.

In EAO:
- ARMOR facts come from authoritative originals / WeKnora Document-RAG;
- MIC platform rules and verified keywords come from WeKnora Wiki;
- current listing structure comes from `mic-product-edit-context/v1`;
- reusable new-listing structure comes from `mic-category-form-schema/v1`;
- prior work comes from Ledger;
- `armor-mic-product-optimization` makes the business decision.

This Skill only translates the final decision into Bulk Fill text.

## Structural contract priority

Use exactly one structural authority in this order:

1. Current `mic-product-edit-context/v1` when supplied.
2. Matching `mic-category-form-schema/v1` for the target MIC category.
3. If neither exists, do not fall back to a generic MIC field template. Return `MIC_FORM_SCHEMA_REQUIRED`.

Current edit-page Context outranks a saved Category Schema because MIC can change category fields.

## Category Form Schema

`mic-category-form-schema/v1` is structure only.

It contains field names, `bulkFillFieldName`, required flags, control types, current options and capabilities, but it intentionally removes current product values.

The Chrome exporter also excludes current product user-added custom attributes so one product's custom fields do not silently become category-wide requirements.

When generating a new listing from a Category Schema:
- output only sections/fields represented by that schema, except repeatable rows explicitly supported by its capabilities;
- for ordinary select fields, use an exact current option text;
- for a select field with `otherInputSupported: true` and an `Other` option, output the source-grounded custom value itself (for example, `显示技术：E-Paper`), not the literal `Other`; the extension will select `Other` and fill its companion input;
- `Other: E-Paper` is also accepted when an explicit option-plus-value form is useful;
- never output `Other` alone when the field exposes a companion input; if no source-grounded custom value exists, omit the field rather than leaving the companion input blank;
- do not inject fields from an old generic template;
- do not use the schema as evidence for product values.

## Current edit-page Context

For `mic-product-edit-context/v1`:
- use fields actually present;
- use `bulkFillFieldName`;
- respect current `required` and `options`;
- preserve and follow `otherInputSupported` / `otherInputLocator` when present;
- when a selected `Other` has an empty companion input, treat the field as incomplete, not as the completed value `Other`;
- respect capabilities when present;
- omit stale fields absent from the current page.

## Output contract

Return plain text only for plugin-ready requests.

Use `# 板块名称` plus `字段名：内容` lines. Include only sections that contain fields supported by the chosen structural contract.

Do not include Markdown tables, JSON, code fences, commentary or empty fields inside the paste-ready output.

The canonical Bulk Fill contract omits Product Display, freight-template mutation and Product Details rich-text modules.

## Center word

Output one center word only. When candidates are supplied by the current Context/Schema, select from those candidates.

## Keywords

Keyword quantity and priority come from current MIC business rules, not from the plugin's technical ceiling.

`keywordPluginInputCeiling` only describes how many inputs the extension can technically process.

Never invent hot/trending/high-volume claims to fill slots.

## Attributes and options

Use only attributes represented by the current Context/Category Schema.

Do not duplicate a standard property as a custom attribute.

A Category Schema's field presence does not prove a product-specific value. Values still require upstream product evidence. In particular, `otherInputSupported: true` describes an additional MIC text input; it does not authorize guessing what belongs in that input.

## Specifications and pricing

Use only source-grounded values and exactly one pricing mode.

## Fact safety

Never default or invent port, price, MOQ, stock, package dimensions/weight, lead time, samples, payment terms, production capacity, HS code, certifications, IP rating, electrical/performance values or warranty.

Unknown values are omitted.

## Action boundary

This Skill returns text. It does not authorize live MIC editing, media upload, account mutation or publication.
