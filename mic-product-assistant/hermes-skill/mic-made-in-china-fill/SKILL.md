---
name: mic-made-in-china-fill
description: Generate paste-ready text for MIC Product Assistant from current MIC edit-page context and source-grounded product decisions. This Skill owns the Chrome Bulk Fill text protocol only; it is not ARMOR product-fact authority and does not invent hot keywords.
---

# MIC Product Assistant — Bulk Fill Protocol

## Purpose

Convert already-decided MIC product data into the exact plain-text format consumed by the Chrome extension.

In EAO, business decisions belong to armor-mic-product-optimization:
- ARMOR facts -> authoritative originals / WeKnora Document/RAG;
- verified MIC keywords -> WeKnora Wiki operations/mic/keywords/*;
- current MIC fields/options -> mic-product-edit-context/v1;
- prior work -> Ledger.

This Skill does not replace those sources.

## Current page contract

When the user supplies extracted JSON with schema mic-product-edit-context/v1, use it as the current form contract.

Prefer:
- bulkFillFieldName;
- current field presence;
- required;
- current options;
- capabilities when present.

From contract version 1.1:
- center word is single-select;
- keyword capacity is read from runtime capabilities when available;
- plugin fill limit is not a target quota;
- absent fields must not be forced from stale templates.

If a field is not present in current context, omit it unless the user is creating a new listing and has separately confirmed the target field/category.

## Output contract

Return plain text only for plugin-ready requests.

Use exact section headings, in this canonical order when they contain fields:

1. # 基本信息
2. # 产品亮点
3. # 产品属性
4. # 规格管理
5. # FOB价格设置
6. # 计量单位
7. # 包裹尺寸
8. # 发货效率信息
9. # 样品单交易设置
10. # 其他信息设置
11. # FAQ

Each field line uses 字段名：内容.

Use semicolons for multi-value fields.

Do not include Markdown tables, JSON, code fences, commentary or empty fields inside the paste-ready output.

The canonical Bulk Fill contract omits 产品展示, 运费信息/freight-template mutation, and 产品详情 rich-text modules. Those remain manual/separate work even if legacy code paths can still populate some text fields.

## Center word

Output exactly one center word.

When the extracted context provides center-word candidates, the chosen value must match one of those candidates. The plugin selects the first matching requested value and synchronizes a single selection.

Do not output 3-6 center words.

## Keywords

Use keyword decisions produced by the MIC business workflow.

Rules:
- runtime capabilities determine current supported capacity when available;
- the plugin fill implementation currently caps accepted keyword inputs at 20;
- never fill all available slots merely because they exist;
- never invent hot keywords to reach a quota;
- human-verified keywords and AI-derived terms remain distinguishable upstream.

A plugin-ready field may use 关键词：term 1; term 2; term 3 or numbered keyword fields when current context requires them.

## Attributes and options

For current edit pages:
- MIC standard attributes come from current mic_standard_property fields;
- fixed MIC attributes come from current mic_builtin_property fields;
- user-added custom attributes come from user_added_custom_attribute;
- select/radio/checkbox values should use current page option text.

Do not create duplicate custom attributes for a meaning already represented by a standard property.

## Specifications and pricing

Use only supplied/source-grounded values.

FOB output must use exactly one pricing mode: spec/fixed price, ladder price, or range price. Do not mix modes.

## Fact safety

Never default or invent port, price, MOQ, stock, package dimensions/weight, lead time, samples, payment terms, production capacity, HS code, certifications, IP rating, electrical/performance values or warranty.

If the source does not support a value, omit it.

## Action boundary

This Skill returns text. It does not authorize live MIC editing, media upload, account mutation or publication.
