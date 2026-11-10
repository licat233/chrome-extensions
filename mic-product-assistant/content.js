(() => {
  if (window.__MIC_BULK_FILL_CONTENT_LOADED__) return;
  window.__MIC_BULK_FILL_CONTENT_LOADED__ = true;
  let cancelPendingCenterWordFill = null;

  const MULTI_VALUE_KEYS = [
    "关键词",
    "keyword",
    "keywords",
    "中心词",
    "产品亮点",
    "适用门店",
    "支付方式"
  ];

  const KEY_ALIASES = new Map([
    ["产品名称", ["产品名称", "product name", "title"]],
    ["中心词", ["中心词", "core word", "core keyword"]],
    ["关键词", ["关键词", "keyword", "keywords"]],
    ["产品分组", ["产品分组", "group"]],
    ["产品型号", ["产品型号", "model", "model no", "model number"]],
    ["产品亮点1", ["产品亮点1", "亮点1", "highlight 1"]],
    ["产品亮点2", ["产品亮点2", "亮点2", "highlight 2"]],
    ["产品亮点3", ["产品亮点3", "亮点3", "highlight 3"]],
    ["适用门店", ["适用门店", "applicable store", "store"]],
    ["安装方式", ["安装方式", "installation"]],
    ["内容支持", ["内容支持", "content support"]],
    ["显示颜色", ["显示颜色", "display color", "color"]],
    ["分辨率", ["分辨率", "resolution"]],
    ["屏幕尺寸", ["屏幕尺寸", "screen size", "size"]],
    ["显示技术", ["显示技术", "display technology"]],
    ["运输包装", ["运输包装", "transport package", "package"]],
    ["规格", ["规格", "specification"]],
    ["商标", ["商标", "trademark", "brand"]],
    ["原产地", ["原产地", "origin", "place of origin"]],
    ["Package Gross Weight", ["package gross weight", "package gross we", "包裹毛重"]],
    ["Logic", ["logic"]],
    ["Weight", ["weight", "重量"]],
    ["Update Efficiency", ["update efficiency"]],
    ["Work Efficiency", ["work efficiency"]],
    ["Technology", ["technology", "技术"]],
    ["Power Supply Mode", ["power supply mode", "power supply mod", "供电"]],
    ["计量单位", ["计量单位", "unit"]],
    ["单个包裹内产品数量", ["单个包裹内产品数量", "products per package"]],
    ["单个包裹长", ["单个包裹长", "package length", "长"]],
    ["单个包裹宽", ["单个包裹宽", "package width", "宽"]],
    ["单个包裹高", ["单个包裹高", "package height", "高"]],
    ["单个包裹毛重", ["单个包裹毛重", "gross weight"]],
    ["港口", ["港口", "port"]],
    ["提供样品", ["提供样品", "sample"]],
    ["样品单价", ["样品单价", "sample price"]],
    ["样品单位", ["样品单位", "sample unit"]],
    ["单次最多拿样数量", ["单次最多拿样数量", "最大拿样数量", "最多拿样数量", "样品数量", "max sample quantity", "max samples count"]],
    ["样品描述", ["样品描述", "sample description"]],
    ["支付方式", ["支付方式", "payment", "payment method"]],
    ["产量", ["产量", "production capacity", "capacity"]],
    ["海关编码", ["海关编码", "hs code"]],
    ["产品详情", ["产品详情", "product details", "description", "overview"]],
    ["FAQ问题1", ["faq问题1", "问题1", "faq question 1"]],
    ["FAQ答案1", ["faq答案1", "答案1", "faq answer 1"]]
  ]);

  const SECTION_ALIASES = [
    { names: ["基本信息", "产品信息", "basic information"], selector: ".bd.J-bd:has([data-anchor='prodName']), .product-form-wrap .bd.J-bd:first-of-type" },
    { names: ["产品展示", "图片视频", "product display"], root: "productDisplay" },
    { names: ["产品亮点", "亮点", "highlights"], root: "highlights" },
    { names: ["产品属性", "标准属性", "自定义属性", "attributes", "custom attributes"], root: "customProperties" },
    { names: ["规格管理", "specification management", "spec management"], root: "specManagement" },
    { names: ["FOB价格设置", "fob价格设置", "价格设置", "fob price", "pricing"], root: "specSku" },
    { names: ["计量单位", "unit"], root: "unit" },
    { names: ["包裹尺寸", "package dimensions", "package"], root: "package" },
    { names: ["运费信息", "shipping", "freight"], root: "shipping" },
    { names: ["发货效率信息", "发货效率", "delivery efficiency"], root: "sent" },
    { names: ["样品单交易设置", "样品交易设置", "样品", "sample"], root: "sample" },
    { names: ["其他信息设置", "其它信息", "其他信息", "other information"], root: "otherInfo" },
    { names: ["FAQ", "常见问题"], root: "faq" },
    { names: ["产品详情", "details", "product details"], root: "detail" }
  ];

  const SIMPLE_FIELD_BINDINGS = [
    { key: "产品名称", root: "basicInfo", selector: "textarea[name='prodName']" },
    { key: "产品型号", root: "basicInfo", selector: "input[name='prodModel']" },
    { key: "运输包装", root: "customProperties", selector: "input[name='prodPacking']" },
    { key: "规格", root: "customProperties", selector: "input[name='prodStandard']" },
    { key: "商标", root: "customProperties", selector: "input[name='prodTrademark']" },
    { key: "原产地", root: "customProperties", selector: "input[name='prodOrigin']" },
    { key: "单个包裹内产品数量", root: "package", selector: "input[name='packProdNum']" },
    { key: "单个包裹长", root: "package", selector: "input[name='packDepth']" },
    { key: "单个包裹宽", root: "package", selector: "input[name='packWidth']" },
    { key: "单个包裹高", root: "package", selector: "input[name='packHeight']" },
    { key: "单个包裹毛重", root: "package", selector: "input[name='grossWeight']" },
    { key: "港口", root: "sent", selector: "input.J-port" },
    { key: "产量", root: "otherInfo", selector: "input[name='prodProductivity']" },
    { key: "海关编码", root: "otherInfo", selector: "input[name='hsCode']" }
  ];

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "MIC_PRODUCT_INFO_EXTRACT") {
      try {
        sendResponse({ ok: true, data: extractProductEditContext() });
      } catch (error) {
        sendResponse({ ok: false, error: error.message });
      }
      return false;
    }

    if (message.type === "MIC_CATEGORY_FORM_SCHEMA_EXTRACT") {
      try {
        sendResponse({ ok: true, data: extractCategoryFormSchema() });
      } catch (error) {
        sendResponse({ ok: false, error: error.message });
      }
      return false;
    }

    if (message.type !== "MIC_BULK_FILL_APPLY") {
      return false;
    }

    (async () => {
      try {
        sendResponse(await fillPage(message.text || "", true));
      } catch (error) {
        sendResponse({ filled: [], unmatched: [{ key: "错误", value: error.message }] });
      }
    })();
    return true;
  });

  function extractProductEditContext() {
    const sections = [];
    const addSection = (name) => {
      const section = { name, fields: [] };
      sections.push(section);
      return section;
    };
    const markSectionExists = (section) => {
      section.exists = true;
      return section;
    };
    const addField = (section, field) => {
      if (!field?.fieldName) return;
      const options = uniqueOptions(field.options);
      section.fields.push({
        fieldName: field.fieldName,
        bulkFillFieldName: field.bulkFillFieldName || field.fieldName,
        fieldOrigin: field.fieldOrigin || "mic_builtin",
        fieldType: field.fieldType || "页面字段（MIC 默认）",
        required: Boolean(field.required),
        controlType: field.controlType || "text",
        value: field.value ?? "",
        ...(options.length ? { options } : {}),
        ...(typeof field.otherInputSupported === "boolean" ? { otherInputSupported: field.otherInputSupported } : {}),
        ...(field.otherInputLocator ? { otherInputLocator: field.otherInputLocator } : {}),
        ...(field.domLocator ? { domLocator: field.domLocator } : {}),
        ...(typeof field.active === "boolean" ? { active: field.active } : {})
      });
    };

    extractBasicInformation(addSection("基本信息"), addField);
    extractHighlights(addSection("产品亮点"), addField);
    extractProductAttributes(addSection("产品属性"), addField);
    extractSpecifications(addSection("规格管理"), addField, markSectionExists);
    extractFobPricing(addSection("FOB价格设置"), addField);
    extractUnit(addSection("计量单位"), addField);
    extractSimpleSection(addSection("包裹尺寸"), addField, "package", [
      ["单个包裹内产品数量", "input[name='packProdNum']"],
      ["单个包裹长", "input[name='packDepth']"],
      ["单个包裹宽", "input[name='packWidth']"],
      ["单个包裹高", "input[name='packHeight']"],
      ["单个包裹毛重", "input[name='grossWeight']"]
    ]);
    extractSimpleSection(addSection("运费信息"), addField, "shipping", [
      ["运费模板", "select[name='logTemplateId']"]
    ]);
    extractDelivery(addSection("发货效率信息"), addField);
    extractSample(addSection("样品单交易设置"), addField);
    extractOtherInformation(addSection("其他信息设置"), addField);
    extractFaq(addSection("FAQ"), addField);

    const extractedSections = sections
      .filter((section) => section.fields.length || section.exists)
      .map((section) => ({
        name: section.name,
        ...(section.exists ? { exists: true } : {}),
        ...(section.empty ? { empty: true } : {}),
        fields: section.fields
      }));
    const fields = extractedSections.flatMap((section) => section.fields);
    const customFields = fields.filter((field) => field.fieldOrigin === "user_added_custom_attribute");
    const populatedFields = fields.filter((field) => hasExtractedValue(field.value));
    const category = cleanText(
      document.querySelector(".selected-catlog .J-selected-cat-text, .selected-catlog .J-selected-cat-text span")?.textContent ||
      document.querySelector("[data-anchor='cateCode'] .J-selector-text")?.textContent || ""
    );

    return {
      schema: "mic-product-edit-context/v1",
      contractVersion: "1.1",
      purpose: "供 AI 理解当前 MIC 产品编辑页的可回填表单字段，并基于原值逐字段优化",
      extractedAt: new Date().toISOString(),
      page: { category },
      classificationGuide: {
        mic_standard_property: "MIC 根据产品目录默认提供的标准属性，不是用户手动新增",
        mic_builtin_property: "MIC 产品属性区固定自带字段，不是用户手动新增",
        user_added_custom_attribute: "用户通过“添加自定义属性”手动新增的属性名与属性值",
        mic_builtin: "MIC 页面默认自带的普通表单字段"
      },
      summary: {
        sectionCount: extractedSections.length,
        fieldCount: fields.length,
        defaultFieldCount: fields.length - customFields.length,
        customFieldCount: customFields.length,
        populatedFieldCount: populatedFields.length
      },
      capabilities: extractPageCapabilities(),
      sections: extractedSections
    };
  }

  function extractCategoryFormSchema() {
    const context = extractProductEditContext();
    const excludedCurrentProductCustomAttributes = [];
    const excludedNonBulkFillFields = [];

    const sections = (context.sections || [])
      .map((section) => {
        const fields = (section.fields || []).flatMap((field) => {
          const bulkFillFieldName = field.bulkFillFieldName || field.fieldName;

          if (field.fieldOrigin === "user_added_custom_attribute") {
            excludedCurrentProductCustomAttributes.push({
              section: section.name,
              fieldName: field.fieldName
            });
            return [];
          }

          if (["产品分组", "FOB价格模式"].includes(bulkFillFieldName)) {
            excludedNonBulkFillFields.push({
              section: section.name,
              fieldName: field.fieldName
            });
            return [];
          }

          return [{
            fieldName: field.fieldName,
            bulkFillFieldName,
            fieldOrigin: field.fieldOrigin,
            fieldType: field.fieldType,
            required: Boolean(field.required),
            controlType: field.controlType,
            ...(typeof field.active === "boolean" ? { active: field.active } : {}),
            ...(field.options?.length ? { options: field.options } : {}),
            ...(typeof field.otherInputSupported === "boolean" ? { otherInputSupported: field.otherInputSupported } : {}),
            ...(field.otherInputLocator ? { otherInputLocator: field.otherInputLocator } : {}),
            ...(field.domLocator ? { domLocator: field.domLocator } : {})
          }];
        });

        if (!fields.length && !section.exists) return null;
        return {
          name: section.name,
          ...(section.exists ? { exists: true } : {}),
          ...(section.empty ? { empty: true } : {}),
          fields
        };
      })
      .filter(Boolean);

    const fields = sections.flatMap((section) => section.fields);
    const standardProperties = fields.filter((field) => field.fieldOrigin === "mic_standard_property");

    return {
      schema: "mic-category-form-schema/v1",
      contractVersion: "1.0",
      purpose: "供 AI 复用某个 MIC 类别的真实表单结构；不包含当前产品值，不作为产品事实来源",
      capturedAt: context.extractedAt || new Date().toISOString(),
      category: {
        label: context.page?.category || ""
      },
      source: {
        kind: "mic-product-edit-context/v1",
        productValuesRemoved: true,
        userAddedCustomAttributesExcluded: true,
        nonBulkFillFieldsExcluded: true
      },
      summary: {
        sectionCount: sections.length,
        fieldCount: fields.length,
        standardPropertyCount: standardProperties.length,
        excludedCurrentProductCustomAttributeCount: excludedCurrentProductCustomAttributes.length,
        excludedNonBulkFillFieldCount: excludedNonBulkFillFields.length
      },
      capabilities: context.capabilities || {},
      sections
    };
  }

  function extractPageCapabilities() {
    const keywordRoot = findSectionRoot("keywords") || findSectionRoot("basicInfo");
    const keywordControls = keywordRoot
      ? [...keywordRoot.querySelectorAll("textarea[name=\'prodKeyword\'], .J-keyword-value")].filter(isVisible)
      : [];
    const highlightRoot = findSectionRoot("highlights");
    const faqRoot = findSectionRoot("faq");
    const highlightControls = highlightRoot
      ? [...highlightRoot.querySelectorAll("textarea.highlight-text, textarea[placeholder=\'请输入产品亮点\']")].filter(isDisplayed)
      : [];
    const faqBlocks = faqRoot ? [...faqRoot.querySelectorAll(".atom-faq")] : [];
    const customRoot = findSectionRoot("customProperties");
    const customRows = customRoot ? [...customRoot.querySelectorAll(".J-selfprop")] : [];
    const specRoot = findSectionRoot("specManagement");
    const specGroups = specRoot ? getSpecGroups(specRoot) : [];
    const specGroupAddButton = specRoot ? findAddSpecGroupButton(specRoot) : null;
    const specValueSlotsRendered = specGroups.reduce(
      (total, group) => total + getSpecValueInputs(group).length,
      0
    );
    const specHelpText = cleanText(
      specRoot?.querySelector(".J-specsMng-header .help-desc")?.textContent || ""
    );
    const specCombinationLimitMatch = specHelpText.match(/最多可填写\s*(\d+)\s*种组合规格/);
    const specValueAddSupported = specGroups.length
      ? specGroups.every((group) => Boolean(findAddSpecValueButton(group)))
      : null;

    return {
      centerWordMode: "single",
      centerWordCandidateCount: getCenterWordControls().length,
      centerWordDeferredSupported: Boolean(findSectionRoot("basicInfo")?.querySelector("textarea[name='prodName']")),
      keywordSlotsRendered: keywordControls.length,
      keywordAddSupported: Boolean(keywordRoot?.querySelector(".J-keyword-add")),
      keywordPluginInputCeiling: 20,
      customAttributeSlotsRendered: customRows.length,
      customAttributeAddSupported: Boolean(customRoot?.querySelector(".J-prop-add") ||
        customRows.some((row) => !row.querySelector("input[name='customPropName']")?.value.trim())),
      customAttributePluginInputCeiling: 15,
      highlightSlotsRendered: highlightControls.length,
      highlightAddSupported: Boolean(highlightRoot && findAddHighlightButton(highlightRoot)),
      highlightPluginInputCeiling: 20,
      faqSlotsRendered: faqBlocks.length,
      faqAddSupported: Boolean(faqRoot && findAddFaqButton(faqRoot)),
      faqPluginInputCeiling: 12,
      specManagementExists: Boolean(specRoot),
      specGroupsRendered: specGroups.length,
      specGroupAddSupported: Boolean(specGroupAddButton),
      specGroupPluginInputCeiling: 10,
      specValueSlotsRendered,
      specValueAddSupported,
      specValueAddSupportedAfterGroupCreation: true,
      specValuePluginInputCeiling: 20,
      specRecommendedMinimumGroups: /建议填写一个规格/.test(specHelpText) ? 1 : null,
      specCombinationPlatformLimit: specCombinationLimitMatch ? Number(specCombinationLimitMatch[1]) : null,
      specRecommendationText: specHelpText || null,
      shippingTemplateBulkFill: Boolean(findSectionRoot("shipping")?.querySelector("select[name='logTemplateId']")),
      explicitOtherOptionSupported: true,
      productDetailBulkFill: false
    };
  }

  function extractBasicInformation(section, addField) {
    const root = findSectionRoot("basicInfo") || document;
    addControlField(section, addField, "产品名称", root.querySelector("textarea[name='prodName']"));

    // Center-word options are generated after the product title changes. Preserve
    // the field as an inactive dynamic target even when no candidates are rendered.
    const centerWords = getCenterWordControls();
    const candidateReady = centerWords.length > 0;
    if (root.querySelector("textarea[name='prodName']") || candidateReady) {
      addField(section, {
        fieldName: "中心词",
        fieldType: candidateReady ? "页面字段（MIC 默认）" : "动态字段（填写产品名称后生成候选词）",
        controlType: "checkbox-group",
        value: centerWords.filter((item) => item.checked).map(centerWordText),
        options: centerWords.map(centerWordText),
        domLocator: "input[name='prodCenterWord']",
        active: candidateReady
      });
    }

    [...root.querySelectorAll("textarea[name='prodKeyword']")].forEach((control, index) => {
      addControlField(section, addField, `关键词${index + 1}`, control, {
        bulkFillFieldName: index === 0 ? "关键词" : `关键词${index + 1}`
      });
    });

    const groupRoot = root.querySelector("[data-anchor='groupId']");
    if (groupRoot) {
      const groupLabel = groupRoot.querySelector(".J-selector-text, .choice-selt-inner")?.cloneNode(true);
      groupLabel?.querySelectorAll("i").forEach((icon) => icon.replaceWith(" > "));
      addField(section, {
        fieldName: "产品分组",
        controlType: "selector",
        value: cleanText(groupLabel?.textContent || "")
      });
    }
    addControlField(section, addField, "产品型号", root.querySelector("input[name='prodModel']"));
  }

  function extractHighlights(section, addField) {
    const root = findSectionRoot("highlights");
    if (!root) return;
    [...root.querySelectorAll("textarea.highlight-text, textarea[placeholder='请输入产品亮点']")]
      .forEach((control, index) => addControlField(section, addField, `产品亮点${index + 1}`, control));
  }

  function extractProductAttributes(section, addField) {
    const root = findSectionRoot("customProperties");
    if (!root) return;

    [...root.querySelectorAll(".J-stand-prop")].forEach((block) => {
      const label = cleanFieldLabel(block.querySelector(".form-label")?.textContent || "") || block.getAttribute("cz-name") || "标准属性";
      const boxes = [...block.querySelectorAll("input[type='checkbox'][name='propertyValue']")];
      const select = block.querySelector("select[name='propertyValue']");
      const other = block.querySelector("input.J-prop-other, input[name='industryPropOtherValue']");
      let value = "";
      let options = [];
      let controlType = "text";
      if (boxes.length) {
        controlType = "checkbox-group";
        options = boxes.map(choiceText);
        value = boxes.filter((item) => item.checked).map((item) => item.value === "-1" && other?.value ? other.value : choiceText(item));
      } else if (select) {
        controlType = "select";
        options = selectOptions(select);
        const selectedOption = select.options[select.selectedIndex];
        const selectedIsOther = select.value === "-1" ||
          [selectedOption?.textContent, selectedOption?.getAttribute("cz-html") || ""]
            .some((label) => ["other", "others", "其他"].includes(normalize(label)));
        value = selectedIsOther && other ? String(other.value || "").trim() : selectedOptionText(select);
      }
      addField(section, {
        fieldName: label,
        fieldOrigin: "mic_standard_property",
        fieldType: "标准属性（MIC 默认）",
        required: isRequiredField(block),
        controlType,
        value,
        options,
        otherInputSupported: Boolean(other),
        ...(other ? { otherInputLocator: getDomLocator(other) } : {}),
        domLocator: getDomLocator(select || boxes[0])
      });
    });

    const fixedProperties = [
      ["运输包装", "input[name='prodPacking']"],
      ["规格", "input[name='prodStandard']"],
      ["商标", "input[name='prodTrademark']"],
      ["原产地", "input[name='prodOrigin']"]
    ];
    fixedProperties.forEach(([fieldName, selector]) => {
      const control = root.querySelector(selector);
      if (!control) return;
      addField(section, {
        fieldName,
        fieldOrigin: "mic_builtin_property",
        fieldType: "固定属性（MIC 默认）",
        required: isRequiredField(control.closest(".form-item")),
        controlType: "text",
        value: control.value || "",
        domLocator: getDomLocator(control)
      });
    });

    [...root.querySelectorAll(".J-selfprop")].forEach((row, index) => {
      const nameInput = row.querySelector("input[name='customPropName']");
      const valueInput = row.querySelector("input[name='customPropValue']");
      if (!nameInput || !valueInput) return;
      addField(section, {
        fieldName: nameInput.value.trim() || `未命名自定义属性${index + 1}`,
        fieldOrigin: "user_added_custom_attribute",
        fieldType: "自定义属性（手动添加）",
        controlType: "custom-attribute-pair",
        value: valueInput.value || "",
        bulkFillFieldName: nameInput.value.trim() || `未命名自定义属性${index + 1}`,
        domLocator: `${getDomLocator(nameInput)} + ${getDomLocator(valueInput)}`
      });
    });
  }

  function extractSpecifications(section, addField, markSectionExists) {
    const root = findSectionRoot("specManagement");
    if (!root) return;
    markSectionExists(section);
    const groups = [...root.querySelectorAll(".spec-group")];
    if (!groups.length) {
      section.empty = true;
      addSpecificationTemplateFields(section, addField);
      return;
    }
    groups.forEach((group, groupIndex) => {
      const groupNumber = groupIndex + 1;
      addControlField(section, addField, `规格${groupNumber}名称`, group.querySelector("input[name='specName'], .J-inp-specName"), {
        bulkFillFieldName: groupIndex === 0 ? "规格名称" : `规格${groupNumber}名称`
      });
      [...group.querySelectorAll("input[name='specValue'], .J-inp-specValue")].forEach((control, valueIndex) => {
        addControlField(section, addField, `规格${groupNumber}值${valueIndex + 1}`, control, {
          bulkFillFieldName: groupIndex === 0 ? "规格值" : `规格${groupNumber}值`
        });
      });
    });
  }

  function addSpecificationTemplateFields(section, addField) {
    addField(section, {
      fieldName: "规格1名称",
      bulkFillFieldName: "规格名称",
      fieldOrigin: "mic_builtin",
      fieldType: "动态字段（当前未渲染；需先点击添加规格）",
      required: false,
      controlType: "text",
      value: "",
      active: false,
      domLocator: "button.J-btn-addSpecGroup -> input[name='specName']"
    });
    addField(section, {
      fieldName: "规格1值1",
      bulkFillFieldName: "规格值",
      fieldOrigin: "mic_builtin",
      fieldType: "动态字段（当前未渲染；需先点击添加规格）",
      required: false,
      controlType: "text-list",
      value: "",
      active: false,
      domLocator: "button.J-btn-addSpecGroup -> input[name='specValue']"
    });
  }

  function extractFobPricing(section, addField) {
    const root = findSectionRoot("specSku");
    if (!root) return;
    const modeControls = [...root.querySelectorAll("input[name='fobPriceType']")];
    const activeMode = modeControls.find((item) => item.checked)?.value || "";
    addField(section, {
      fieldName: "FOB价格模式",
      bulkFillFieldName: "FOB价格模式",
      controlType: "radio-group",
      value: activeMode === "0" ? "一口价/按规格价格销售" : activeMode === "1" ? "阶梯价销售" : activeMode === "2" ? "区间价销售" : "",
      options: ["一口价/按规格价格销售", "阶梯价销售", "区间价销售"],
      domLocator: "input[name='fobPriceType']"
    });

    if (activeMode === "0") {
      const fixedRows = getSkuPriceRows(root);
      fixedRows.forEach((row, index) => {
        [
          ["规格最小起订量", "input[name='skuMinOrder'], input[name='skuMinOrder_one']"],
          ["规格商品编码", "input[name='skuCode'], input[name='skuCode_one']"],
          ["规格库存", "input[name='skuStock'], input[name='skuStock_one']"],
          ["规格单价", "input[name='skuPrice'], input[name='skuPrice_one']"]
        ].forEach(([name, selector]) => addControlField(section, addField, fixedRows.length > 1 ? `${name}${index + 1}` : name, row.querySelector(selector)));
      });
      return;
    }

    if (activeMode === "1") {
      [...root.querySelectorAll("tr.J-ladder-item")].forEach((row, index) => {
        addControlField(section, addField, `价格区间${index + 1}起订量`, row.querySelector("input.J-ladderMOQ"));
        addControlField(section, addField, `价格区间${index + 1}单价`, row.querySelector("input.J-ladderprice"));
      });
      addControlField(section, addField, "库存", root.querySelector("input.J-ladderstock"));
      return;
    }

    if (activeMode === "2") {
      [
        ["区间价最小起订量", "input.J-reference-MOQ"],
        ["区间价最低价", "input.J-reference-price1"],
        ["区间价最高价", "input.J-reference-price2"],
        ["区间价库存", "input[name='prodStockNewOfBase']"]
      ].forEach(([name, selector]) => addControlField(section, addField, name, root.querySelector(selector)));
    }
  }

  function extractUnit(section, addField) {
    const root = findSectionRoot("unit");
    if (!root) return;
    const mode = getCurrentFobPriceMode();
    const selector = mode === "0" ? "select[name='prodMinimumOrderTypeOfNegotiate']" : mode === "2" ? "select[name='prodMinimumOrderTypeOfBase']" : "select[name='prodMinimumOrderTypeOfLadder']";
    addControlField(section, addField, "计量单位", root.querySelector(selector));
  }

  function extractSimpleSection(section, addField, rootName, bindings) {
    const root = findSectionRoot(rootName);
    if (!root) return;
    bindings.forEach(([name, selector]) => addControlField(section, addField, name, root.querySelector(selector)));
  }

  function extractDelivery(section, addField) {
    const root = findSectionRoot("sent");
    if (!root) return;
    const quantity = [...root.querySelectorAll("input[name='stockingNum']")];
    const days = [...root.querySelectorAll("input[name='stockingDay']")];
    for (let index = 0; index < Math.max(quantity.length, days.length); index += 1) {
      const rowNumber = index + 1;
      addControlField(section, addField, `发货期数量${rowNumber}`, quantity[index], {
        bulkFillFieldName: index === 0 ? "发货期数量" : `发货期数量${rowNumber}`
      });
      addControlField(section, addField, `发货期时间${rowNumber}`, days[index], {
        bulkFillFieldName: index === 0 ? "发货期时间" : `发货期时间${rowNumber}`
      });
    }
    addControlField(section, addField, "港口", root.querySelector("input.J-port"));
  }

  function extractSample(section, addField) {
    const root = findSectionRoot("sample");
    if (!root) return;
    addChoiceGroupField(section, addField, "提供样品", [...root.querySelectorAll("input[name='provideMode']")]);
    addControlField(section, addField, "样品单价", root.querySelector("input[name='samplesPrice']"));
    addControlField(section, addField, "样品单位", root.querySelector("select[name='samplesPricePacking']"));
    addControlField(section, addField, "单次最多拿样数量", root.querySelector("input[name='maxSamplesCount']"));
    addControlField(section, addField, "样品描述", root.querySelector("input[name='samplesDesc']"));
  }

  function extractOtherInformation(section, addField) {
    const root = findSectionRoot("otherInfo");
    if (!root) return;
    addChoiceGroupField(section, addField, "支付方式", [...root.querySelectorAll("input[name='prodPaymentType']")], true);
    addControlField(section, addField, "其他支付方式", root.querySelector("input[name='prodPaymentTypeOther']"));
    addControlField(section, addField, "产量", root.querySelector("input[name='prodProductivity']"));
    addControlField(section, addField, "海关编码", root.querySelector("input[name='hsCode']"));
  }

  function extractFaq(section, addField) {
    const root = findSectionRoot("faq");
    if (!root) return;
    [...root.querySelectorAll(".atom-faq")].forEach((block, index) => {
      const controls = block.querySelectorAll("textarea");
      addControlField(section, addField, `FAQ问题${index + 1}`, controls[0]);
      addControlField(section, addField, `FAQ答案${index + 1}`, controls[1]);
    });
  }

  function addControlField(section, addField, fieldName, control, extra = {}) {
    if (!control) return;
    const fieldRoot = control.closest(".form-item, tr, .atom-faq__field") || control.parentElement;
    const type = (control.type || control.tagName || "text").toLowerCase();
    const isSelect = control.tagName === "SELECT";
    addField(section, {
      fieldName,
      required: isRequiredField(fieldRoot),
      controlType: isSelect ? "select" : type,
      value: isSelect ? selectedOptionText(control) : control.value || "",
      options: isSelect ? selectOptions(control) : [],
      domLocator: getDomLocator(control),
      ...extra
    });
  }

  function addChoiceGroupField(section, addField, fieldName, controls, multiple = false) {
    if (!controls.length) return;
    const selected = controls.filter((item) => item.checked).map(choiceText);
    addField(section, {
      fieldName,
      required: isRequiredField(controls[0].closest(".form-item")),
      controlType: multiple ? "checkbox-group" : "radio-group",
      value: multiple ? selected : selected[0] || "",
      options: controls.map(choiceText),
      domLocator: getDomLocator(controls[0])
    });
  }

  function choiceText(control) {
    return cleanText(control.getAttribute("cz-html") || control.closest("label")?.textContent || control.value || "");
  }

  function selectedOptionText(select) {
    const option = select?.selectedOptions?.[0] || [...(select?.options || [])].find((item) => item.selected);
    const text = cleanText(option?.getAttribute("cz-html") || option?.textContent || "");
    return /^(请选择|please select)$/i.test(text) ? "" : text;
  }

  function selectOptions(select) {
    return [...(select?.options || [])]
      .map((option) => cleanText(option.getAttribute("cz-html") || option.textContent || ""))
      .filter((text) => text && !/^(请选择|please select)$/i.test(text));
  }

  function uniqueOptions(values = []) {
    return [...new Set(
      values
        .map((value) => cleanText(value))
        .filter((text) => text && !/^(请选择|please select)$/i.test(text))
    )];
  }

  function getDomLocator(control) {
    if (!control) return "";
    const tag = control.tagName?.toLowerCase() || "input";
    const name = control.getAttribute("name");
    if (name) return `${tag}[name='${cssEscape(name)}']`;
    const id = control.id;
    if (id) return `#${cssEscape(id)}`;
    const className = [...control.classList || []].find(Boolean);
    return className ? `${tag}.${cssEscape(className)}` : tag;
  }

  function cssEscape(value) {
    return String(value || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  }

  function isRequiredField(root) {
    if (!root) return false;
    const requirement = root.querySelector("[data-required='true']");
    if (requirement) return true;
    const marker = root.querySelector(".form-label em, .form-label-edit em");
    if (!marker) return false;
    return marker.style.display !== "none" && getComputedStyle(marker).display !== "none";
  }

  function hasExtractedValue(value) {
    return Array.isArray(value) ? value.some(hasExtractedValue) : String(value ?? "").trim().length > 0;
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function cleanMultilineText(value) {
    return String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n\s*\n+/g, "\n\n")
      .trim();
  }

  async function fillPage(text, shouldApply) {
    const entries = parseBulkText(text);
    const direct = await fillKnownMadeInChinaFields(entries, shouldApply);
    const directlyFilledKeys = new Set(direct.filled.map((item) => item.key));
    const filled = [...direct.filled];
    const unmatched = entries.filter((entry) =>
      !wasDirectlyFilled(entry.key, directlyFilledKeys) && !shouldIgnoreUnboundEntry(entry.key)
    );

    return { filled, unmatched, skippedHighlights: direct.skippedHighlights ?? 0 };
  }

  function wasDirectlyFilled(key, filledKeys) {
    if (filledKeys.has(key)) return true;
    const normalizedKey = normalize(key).replace(/\d+$/, "");
    for (const filledKey of filledKeys) {
      const normalizedFilled = normalize(filledKey).replace(/\d+$/, "");
      if (normalizedKey && normalizedKey === normalizedFilled) return true;
    }
    return false;
  }

  function shouldIgnoreUnboundEntry(key) {
    const normalizedKey = normalize(key);
    return ["产品分组"].some((item) => normalizedKey === normalize(item));
  }

  async function fillKnownMadeInChinaFields(entries, shouldApply) {
    const filled = [];
    const get = makeEntryGetter(entries);
    const exactGet = makeExactEntryGetter(entries);
    const fobPriceMode = determineFobPriceMode(get, getCurrentFobPriceMode());
    const pageIdentity = readPageIdentity();

    fillProductNameBeforeCenterWord(get, shouldApply, filled);
    await fillCenterWord(get, shouldApply, filled);
    fillSimpleBoundFields(get, shouldApply, filled, new Set(["产品名称"]));
    await fillKeywords(entries, shouldApply, filled);
    const skippedHighlights = await fillHighlights(get, shouldApply, filled);
    await fillKnownProperties(get, shouldApply, filled);
    await fillDynamicStandardProperties(entries, shouldApply, filled);
    await fillCustomProperties(entries, get, shouldApply, filled);
    await fillSpecManagement(entries, shouldApply, filled);
    await fillFobPrices(get, shouldApply, filled, fobPriceMode);
    fillUnit(get, shouldApply, filled);
    fillPaymentMethods(get, shouldApply, filled);
    fillSampleMode(get, shouldApply, filled);
    fillSampleFields(get, shouldApply, filled);
    fillProductDetails(get, shouldApply, filled);
    await fillDeliveryEfficiency(exactGet, shouldApply, filled);
    fillFreightTemplate(get, shouldApply, filled);
    await fillFaq(exactGet, shouldApply, filled);

    if (shouldApply) {
      restorePageIdentity(pageIdentity);
      await sleep(120);
      restorePageIdentity(pageIdentity);
    }

    return { filled, skippedHighlights };
  }

  function readPageIdentity() {
    const form = document.querySelector("form.J-addProduct-form");
    const draftId = document.querySelector("input[name='draftId'], #draftId")?.value || "";
    let prodId = "";
    try {
      prodId = new URL(location.href).searchParams.get("prodId") || "";
    } catch (_error) {
      prodId = "";
    }

    return { form, draftId, prodId };
  }

  function restorePageIdentity(identity) {
    if (!identity) return;

    const form = identity.form?.isConnected ? identity.form : document.querySelector("form.J-addProduct-form");
    if (!form) return;

    if (identity.draftId) {
      const draftInput = form.querySelector("input[name='draftId'], #draftId") || document.querySelector("input[name='draftId'], #draftId");
      if (draftInput && !draftInput.value) {
        setNativeValue(draftInput, identity.draftId);
        dispatchEditableEvents(draftInput);
      }
    }

    if (identity.prodId && !form.querySelector("input[name='prodId']")) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "prodId";
      input.value = identity.prodId;
      form.prepend(input);
    }
  }

  function fillProductNameBeforeCenterWord(get, shouldApply, filled) {
    const binding = SIMPLE_FIELD_BINDINGS.find((item) => item.key === "产品名称");
    if (!binding) return;
    const value = get(binding.key);
    if (!value) return;
    const control = queryBinding(binding);
    if (!control || !isFillableKnownControl(control)) return;
    if (shouldApply) {
      applyProductNameWithoutBlur(control, value);
    }
    filled.push({ key: binding.key, value, target: `${binding.root} ${binding.selector}`, score: 120 });
  }

  function applyProductNameWithoutBlur(control, value) {
    triggerFieldFocus(control);
    setNativeValue(control, fitControlValue(control, value));
    dispatchFieldEvent(control, "beforeinput", window.InputEvent || Event, { inputType: "insertText", data: null });
    control.dispatchEvent(new Event("input", { bubbles: true }));
    control.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function fillSimpleBoundFields(get, shouldApply, filled, skipKeys = new Set()) {
    for (const binding of SIMPLE_FIELD_BINDINGS) {
      if (skipKeys.has(binding.key)) continue;
      const value = get(binding.key);
      if (!value) continue;
      const control = queryBinding(binding);
      if (!control || !isFillableKnownControl(control)) continue;
      if (shouldApply) applyValue(control, value, binding.key);
      filled.push({ key: binding.key, value, target: `${binding.root} ${binding.selector}`, score: 120 });
    }
  }

  async function fillCenterWord(get, shouldApply, filled) {
    const requestedValues = splitValues(get("中心词", "core word", "core keyword"));
    if (!requestedValues.length) return;

    if (!shouldApply) {
      const result = findMatchingCenterWord(requestedValues);
      if (result?.match) {
        filled.push({ key: "中心词", value: centerWordText(result.match), target: centerWordLocator(result.match), score: 120 });
      }
      return;
    }

    // Refresh the MIC candidate list after updating the title, and do not
    // count this field as filled until a matching on-page option is selected.
    const beforeSnapshot = createCenterWordSnapshot();
    cancelPendingCenterWordFill?.();
    const titleBinding = SIMPLE_FIELD_BINDINGS.find((binding) => binding.key === "产品名称");
    const titleControl = titleBinding ? queryBinding(titleBinding) : null;
    if (titleControl) triggerTitleBlurForCenterWords(titleControl);
    const result = await new Promise((resolve) => {
      cancelPendingCenterWordFill = waitForFreshMatchingCenterWord(requestedValues, beforeSnapshot, {
        timeout: 6000,
        settleDelay: 350,
        onMatch: resolve,
        onTimeout: () => resolve(null)
      });
    });
    if (!result?.match) return;

    selectSingleCenterWord(result.match, result.controls);
    filled.push({
      key: "中心词",
      value: centerWordText(result.match),
      target: centerWordLocator(result.match),
      score: 120
    });
  }

  function triggerTitleBlurForCenterWords(titleControl) {
    if (!titleControl) return;
    triggerFieldBlur(titleControl);
    clickOutsideControl(titleControl);
  }

  function clickOutsideControl(control) {
    const fallback = document.querySelector(".J-center-words, .form-item:not([data-anchor='prodName']), .J-bd-title") || document.body || document.documentElement;
    if (!fallback || fallback === control) return;
    dispatchMouseIntent(fallback);
  }

  function waitForFreshMatchingCenterWord(requestedValues, previousSnapshot, options = {}) {
    const timeout = options.timeout ?? 6000;
    const settleDelay = options.settleDelay ?? 350;
    const onMatch = options.onMatch || (() => {});
    const onTimeout = options.onTimeout || (() => {});
    let observer = null;
    let timeoutTimer = 0;
    let settleTimer = 0;
    let checkFrame = 0;
    let done = false;

    const cleanup = () => {
      if (done) return;
      done = true;
      if (timeoutTimer) clearTimeout(timeoutTimer);
      if (settleTimer) clearTimeout(settleTimer);
      if (checkFrame) cancelAnimationFrame(checkFrame);
      observer?.disconnect();
      if (cancelPendingCenterWordFill === cleanup) cancelPendingCenterWordFill = null;
    };

    const runMatch = () => {
      if (done) return;
      const result = findMatchingCenterWord(requestedValues);
      if (!result?.match) return;
      cleanup();
      onMatch(result);
    };

    const selectAfterSettled = () => {
      if (done) return;
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(runMatch, settleDelay);
    };

    const check = () => {
      checkFrame = 0;
      if (done || !isFreshCenterWordState(previousSnapshot)) return;
      if (findMatchingCenterWord(requestedValues)?.match) selectAfterSettled();
    };

    const scheduleCheck = () => {
      if (done || checkFrame) return;
      checkFrame = requestAnimationFrame(check);
    };

    const target = getCenterWordObserverTarget();
    if (target && typeof MutationObserver === "function") {
      observer = new MutationObserver(scheduleCheck);
      observer.observe(target, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class"]
      });
    }

    setTimeout(scheduleCheck, 0);
    timeoutTimer = setTimeout(() => { cleanup(); onTimeout(); }, timeout);
    return cleanup;
  }

  function createCenterWordSnapshot() {
    const controls = getCenterWordControls();
    return {
      controls: new Set(controls),
      signature: centerWordSignature(controls)
    };
  }

  function isFreshCenterWordState(previousSnapshot) {
    const controls = getCenterWordControls();
    if (!controls.length) return false;
    if (!previousSnapshot) return true;
    if (controls.some((control) => !previousSnapshot.controls.has(control))) return true;
    return centerWordSignature(controls) !== previousSnapshot.signature;
  }

  function centerWordSignature(controls = getCenterWordControls()) {
    return controls
      .map((control) => [
        centerWordText(control),
        control.value || "",
        control.id || ""
      ].join(":"))
      .join("|");
  }

  function findMatchingCenterWord(requestedValues) {
    const controls = getCenterWordControls();
    if (!controls.length) return null;
    for (const requested of requestedValues) {
      const match = controls.find((control) => sameOption(requested, centerWordText(control)));
      if (match) return { match, controls };
    }
    return null;
  }

  function getCenterWordBox() {
    return document.querySelector(".center-words-box.J-center-words-box, .J-center-words-box, .center-words-box");
  }

  function getCenterWordObserverTarget() {
    return document.querySelector(".form-item.center-words, .J-center-words, .center-words")
      || getCenterWordBox()
      || document.documentElement
      || document.body;
  }

  function getCenterWordControls() {
    const centerWordBox = getCenterWordBox();
    const selectors = [
      ".J-center-words input[name='prodCenterWord']",
      ".center-words input[name='prodCenterWord']",
      ".J-center-words-box input[type='checkbox']",
      "input[name='prodCenterWord']",
      "input[name*='CenterWord' i]",
      "input[name*='centerWord' i]"
    ];
    const controls = selectors.flatMap((selector) => [...document.querySelectorAll(selector)]);
    if (centerWordBox) {
      controls.unshift(...centerWordBox.querySelectorAll("input[type='checkbox'], input[type='radio'], input[name='prodCenterWord']"));
    }
    return uniqueControls(controls)
      .filter((control) => !control.disabled && !isHiddenCenterWordControl(control) && centerWordText(control));
  }

  function uniqueControls(controls) {
    return [...new Set(controls)];
  }

  function isHiddenCenterWordControl(control) {
    const root = control.closest(".J-center-words, .center-words, .form-item") || control;
    const style = window.getComputedStyle?.(root);
    return style?.display === "none" || style?.visibility === "hidden";
  }

  function centerWordText(control) {
    const label = control.closest("label");
    const explicitLabel = control.id ? document.querySelector(`label[for="${CSS.escape(control.id)}"]`) : null;
    return cleanText(
      control.getAttribute("cz-html")
      || control.getAttribute("data-word")
      || control.getAttribute("data-value")
      || control.value
      || label?.textContent
      || explicitLabel?.textContent
      || control.parentElement?.textContent
      || ""
    );
  }

  function centerWordLocator(control) {
    if (control.id) return `#${control.id}`;
    if (control.name) return `input[name='${control.name}']`;
    return "input[name='prodCenterWord']";
  }

  function selectSingleCenterWord(target, controls) {
    const clickable = target.closest("label") || (target.id && document.querySelector(`label[for="${CSS.escape(target.id)}"]`)) || target;
    triggerFieldFocus(target);
    if (!target.checked) clickCenterWordChoice(clickable);
    for (const control of controls) {
      const checked = control === target;
      syncCheckedAttribute(control, checked);
      control.dispatchEvent(new Event("input", { bubbles: true }));
      control.dispatchEvent(new Event("change", { bubbles: true }));
    }
    triggerFieldBlur(target);
  }

  function clickCenterWordChoice(clickable) {
    for (const type of ["mouseover", "mouseenter", "mousedown", "mouseup"]) {
      clickable.dispatchEvent(new MouseEvent(type, { bubbles: type !== "mouseenter", cancelable: true, view: window }));
    }
    try {
      clickable.click?.();
    } catch (_error) {
      // Hidden legacy checkbox; final state is synced by selectSingleCenterWord().
    }
  }

  function queryBinding(binding) {
    const root = findSectionRoot(binding.root);
    if (!root) return null;
    return root.querySelector(binding.selector);
  }

  function makeEntryGetter(entries) {
    const byKey = new Map();
    for (const entry of entries) {
      byKey.set(normalize(entry.key), entry.value);
    }

    return (...keys) => {
      for (const key of keys) {
        const exact = byKey.get(normalize(key));
        if (exact) return exact;

        const aliases = getAliases(key).map(normalize);
        for (const [entryKey, value] of byKey.entries()) {
          if (aliases.some((alias) => entryKey === alias)) return value;
        }
      }
      return "";
    };
  }

  function makeExactEntryGetter(entries) {
    const byKey = new Map();
    for (const entry of entries) {
      byKey.set(normalize(entry.key), entry.value);
    }

    return (...keys) => {
      for (const key of keys) {
        const exact = byKey.get(normalize(key));
        if (exact) return exact;
      }
      return "";
    };
  }

  async function fillKeywords(entries, shouldApply, filled) {
    const exactEntries = new Map(entries.map((entry) => [normalize(entry.key), entry.value]));
    const joined = exactEntries.get(normalize("关键词")) || exactEntries.get(normalize("keywords")) || "";
    const values = joined ? splitValues(joined) : [];
    for (let index = 1; index <= 20; index += 1) {
      const single = exactEntries.get(normalize(`关键词${index}`)) || exactEntries.get(normalize(`keyword${index}`));
      if (single) values[index - 1] = single;
    }

    const keywordValues = values.filter(Boolean).slice(0, 20);
    for (let index = 0; index < keywordValues.length; index += 1) {
      const control = await getSequentialKeywordControl(index, shouldApply);
      if (!control) break;
      const value = keywordValues[index];
      if (shouldApply) applyValue(control, value, `关键词${index + 1}`);
      filled.push({ key: index === 0 ? "关键词" : `关键词${index + 1}`, value, target: `textarea[name='prodKeyword'] #${index + 1}`, score: 120 });
    }
  }

  async function getSequentialKeywordControl(index, shouldApply) {
    const root = findSectionRoot("keywords");
    if (!root) return null;

    for (let attempts = 0; attempts < 8; attempts += 1) {
      const controls = [...root.querySelectorAll("textarea[name='prodKeyword'], .J-keyword-value")].filter(isVisible);
      if (controls[index]) return controls[index];

      if (!shouldApply) return null;

      const previous = controls[index - 1];
      if (previous && !previous.value.trim()) return null;

      const button = root.querySelector(".J-keyword-add");
      if (!button) return null;
      button.click();
      await sleep(160);
    }
    return null;
  }

  async function fillHighlights(get, shouldApply, filled) {
    const values = [];
    for (let index = 0; index < 20; index += 1) {
      const value = get(`产品亮点${index + 1}`, `亮点${index + 1}`, `highlight ${index + 1}`);
      if (!value) break;
      values.push({ key: `产品亮点${index + 1}`, value });
    }

    let skippedHighlights = 0;
    for (let index = 0; index < values.length; index += 1) {
      const control = await getSequentialHighlightControl(index, shouldApply);
      if (!control) {
        skippedHighlights = values.length - index;
        break;
      }
      const { key, value } = values[index];
      if (shouldApply) applyValue(control, value, key);
      filled.push({ key, value, target: `#highlightRoot textarea #${index + 1}`, score: 120 });
    }
    if (shouldApply) syncModuleJson("J-highlightJsonStr", "highlight", values.slice(0, values.length - skippedHighlights).map((item) => item.value));
    return skippedHighlights;
  }

  async function getSequentialHighlightControl(index, shouldApply) {
    const root = findSectionRoot("highlights");
    if (!root) return null;
    for (let attempts = 0; attempts < 8; attempts += 1) {
      const controls = [...root.querySelectorAll("textarea.highlight-text, textarea[placeholder='请输入产品亮点']")].filter(isDisplayed);
      if (controls[index]) return controls[index];

      if (!shouldApply) return null;

      const previous = controls[index - 1];
      if (previous && !previous.value.trim()) return null;

      const button = findAddHighlightButton(root);
      if (!button) return null;
      button.click();
      await sleep(160);
    }
    return null;
  }

  function findAddHighlightButton(root) {
    const selectors = [
      ".J-add-highlight",
      ".J-highlight-add",
      ".add-highlight",
      ".atom-button--button"
    ];
    for (const selector of selectors) {
      const button = root.querySelector(selector);
      if (button && isVisible(button) && /添加亮点|Add\s*Highlight/i.test(button.textContent || button.title || "")) return button;
    }

    const allButtons = [...root.querySelectorAll("button, a, [role='button']")];
    return allButtons.find((el) => /添加亮点|Add\s*Highlight/i.test(el.textContent || el.title || "")) || null;
  }

  async function fillFaq(exactGet, shouldApply, filled) {
    const faqValues = [];
    for (let index = 0; index < 12; index += 1) {
      const question = exactGet(`FAQ问题${index + 1}`, `问题${index + 1}`, `faq question ${index + 1}`);
      const answer = exactGet(`FAQ答案${index + 1}`, `答案${index + 1}`, `faq answer ${index + 1}`);
      if (!question && !answer) continue;

      const block = await getSequentialFaqBlock(index, shouldApply);
      if (!block) break;

      const textareas = block.querySelectorAll("textarea");
      if (question && textareas[0]) {
        if (shouldApply) applyModuleTextareaValue(textareas[0], question);
        filled.push({ key: `FAQ问题${index + 1}`, value: question, target: `#faqRoot question #${index + 1}`, score: 120 });
      }
      if (answer && textareas[1]) {
        if (shouldApply) applyModuleTextareaValue(textareas[1], answer);
        filled.push({ key: `FAQ答案${index + 1}`, value: answer, target: `#faqRoot answer #${index + 1}`, score: 120 });
      }
      faqValues.push({ question, answer });
    }
    if (shouldApply) syncModuleJson("J-faqJsonStr", "faq", faqValues);
  }

  async function getSequentialFaqBlock(index, shouldApply) {
    const root = findSectionRoot("faq");
    if (!root) return null;
    for (let attempts = 0; attempts < 8; attempts += 1) {
      const blocks = [...root.querySelectorAll(".atom-faq")];
      if (blocks[index]) return blocks[index];

      if (!shouldApply) return null;

      const previous = blocks[index - 1];
      if (previous) {
        const textareas = previous.querySelectorAll("textarea");
        if ([...textareas].some((textarea) => !textarea.value.trim())) return null;
      }

      const button = findAddFaqButton(root);
      if (!button) return null;
      button.click();
      await sleep(180);
    }
    return null;
  }

  function findAddFaqButton(root = document) {
    const buttons = [...root.querySelectorAll("button, a, [role='button']")];
    return buttons.find((el) => /添加FAQ|Add\s*FAQ/i.test(el.textContent || el.title || "")) || null;
  }

  function syncModuleJson(textareaId, blockName, items) {
    const textarea = document.getElementById(textareaId);
    if (!textarea || !items.length) return;

    let current = null;
    try {
      current = JSON.parse(textarea.value || textarea.textContent || "");
    } catch {
      current = null;
    }

    const block = current?.block?.find?.((item) => item.name === blockName) || { name: blockName, sign: `${blockName}-${Date.now()}` };
    const dataItem = {
      name: blockName,
      sign: block.sign,
      data: blockName === "faq"
        ? { list: items, items, faqList: items }
        : { list: items, items, highlightList: items },
      value: blockName === "faq"
        ? { list: items, items, faqList: items }
        : { list: items, items, highlightList: items }
    };

    const next = {
      dsl: current?.dsl || 1,
      block: current?.block?.length ? current.block : [block],
      data: [dataItem]
    };

    triggerFieldFocus(textarea);
    setNativeValue(textarea, JSON.stringify(next));
    textarea.textContent = textarea.value;
    dispatchEditableEvents(textarea);
  }

  async function fillKnownProperties(get, shouldApply, filled) {
    const propAliases = [
      ["适用门店", "Store Type"],
      ["安装方式", "Mounting Type"],
      ["内容支持", "Content Support"],
      ["显示颜色", "Color Options"],
      ["分辨率", "Resolution"],
      ["屏幕尺寸", "Screen Size"],
      ["显示技术", "Display Technology"],
      ["认证", "Certification"],
      ["功率", "Power"],
      ["发光颜色", "Emitting Color"],
      ["电压", "Voltage"],
      ["防护等级", "IP Rating"]
    ];

    for (const [key, english] of propAliases) {
      const value = get(key, english);
      if (!value) continue;
      const block = findPropertyBlock(key, english);
      if (!block) continue;

      if (block.getAttribute("cz-type") === "checkbox") {
        const values = splitValues(value);
        const boxes = [...block.querySelectorAll("input[type='checkbox']")];
        for (const box of boxes) {
          const label = box.getAttribute("cz-html") || box.closest("label")?.textContent || "";
          const shouldCheck = values.some((item) => sameOption(item, label));
          if (shouldApply && box.checked !== shouldCheck) box.click();
          if (shouldApply) syncCheckedAttribute(box, shouldCheck);
        }
      } else {
        const select = block.querySelector("select");
        if (!select || !(await fillSelectOrOther(select, value, block, shouldApply))) continue;
      }

      filled.push({ key, value, target: `.J-stand-prop ${english}`, score: 120 });
    }
  }

  async function fillDynamicStandardProperties(entries, shouldApply, filled) {
    const exact = new Map(entries.map((entry) => [normalize(entry.key), entry.value]));
    const alreadyFilled = new Set(filled.map((item) => normalize(item.key)));

    const root = findSectionRoot("customProperties");
    if (!root) return;
    const blocks = [...root.querySelectorAll(".J-stand-prop")];
    for (const block of blocks) {
      const label = cleanFieldLabel(block.querySelector(".form-label")?.textContent || "");
      const english = block.getAttribute("cz-name") || "";
      const value = exact.get(normalize(label)) || exact.get(normalize(english));
      if (!value || alreadyFilled.has(normalize(label)) || alreadyFilled.has(normalize(english))) continue;

      if (block.getAttribute("cz-type") === "checkbox") {
        const values = splitValues(value);
        const boxes = [...block.querySelectorAll("input[type='checkbox']")];
        for (const box of boxes) {
          const optionLabel = box.getAttribute("cz-html") || box.closest("label")?.textContent || "";
          const shouldCheck = values.some((item) => sameOption(item, optionLabel));
          if (shouldApply && box.checked !== shouldCheck) box.click();
          if (shouldApply) syncCheckedAttribute(box, shouldCheck);
        }
      } else {
        const select = block.querySelector("select");
        if (!select || !(await fillSelectOrOther(select, value, block, shouldApply))) continue;
      }

      filled.push({ key: label || english, value, target: `.J-stand-prop ${english || label}`, score: 115 });
    }
  }

  function cleanFieldLabel(text) {
    return String(text || "")
      .replace(/\*/g, "")
      .replace(/[：:]\s*$/, "")
      .trim();
  }

  async function fillSpecManagement(entries, shouldApply, filled) {
    const sectionEntries = getSpecManagementEntries(entries);
    const groups = parseSpecGroups(sectionEntries);
    if (!groups.length) return;

    for (let index = 0; index < groups.length; index += 1) {
      const group = groups[index];
      const specGroup = await getSequentialSpecGroup(index, shouldApply);
      if (!specGroup) break;

      const nameInput = specGroup.querySelector("input[name='specName'], .J-inp-specName");
      if (group.name && nameInput) {
        if (shouldApply) applyValue(nameInput, group.name, `规格${index + 1}名称`);
        filled.push({ key: index === 0 ? "规格名称" : `规格${index + 1}名称`, value: group.name, target: `specName #${index + 1}`, score: 120 });
      }

      for (let valueIndex = 0; valueIndex < group.values.length; valueIndex += 1) {
        const valueInput = await getSequentialSpecValueInput(specGroup, valueIndex, shouldApply);
        if (!valueInput) break;
        const value = group.values[valueIndex];
        if (shouldApply) applyValue(valueInput, value, `规格${index + 1}值${valueIndex + 1}`);
        filled.push({ key: index === 0 ? `规格值${valueIndex + 1}` : `规格${index + 1}值${valueIndex + 1}`, value, target: `specValue group ${index + 1} #${valueIndex + 1}`, score: 120 });
      }
    }
  }

  function getSpecManagementEntries(entries) {
    const aliases = SECTION_ALIASES
      .find((section) => section.root === "specManagement")
      ?.names.map(normalize) || [normalize("规格管理")];
    const scoped = entries.filter((entry) => aliases.includes(normalize(entry.section)));
    if (scoped.length) return scoped;

    // Keep old, headerless input compatible. If the text uses section headers,
    // specification fields must be under the actual 规格管理 section.
    return entries.some((entry) => entry.section) ? [] : entries;
  }

  function parseSpecGroups(entries) {
    const exact = new Map(entries.map((entry) => [normalize(entry.key), entry.value]));
    const groups = [];

    const defaultName = exact.get(normalize("规格名称")) || exact.get(normalize("规格管理名称")) || exact.get(normalize("spec name"));
    const defaultValues = exact.get(normalize("规格值")) || exact.get(normalize("规格管理值")) || exact.get(normalize("spec values"));
    if (defaultName || defaultValues) {
      groups.push({
        name: defaultName || "Specification",
        values: splitValues(defaultValues || "")
      });
    }

    for (let index = 1; index <= 10; index += 1) {
      const name = exact.get(normalize(`规格${index}名称`)) || exact.get(normalize(`规格名称${index}`)) || exact.get(normalize(`spec${index}name`));
      const joinedValues = exact.get(normalize(`规格${index}值`)) || exact.get(normalize(`规格值${index}`)) || exact.get(normalize(`spec${index}values`));
      const values = joinedValues ? splitValues(joinedValues) : [];

      for (let valueIndex = 1; valueIndex <= 20; valueIndex += 1) {
        const single = exact.get(normalize(`规格${index}值${valueIndex}`)) || exact.get(normalize(`规格值${index}-${valueIndex}`));
        if (single) values[valueIndex - 1] = single;
      }

      if (name || values.length) {
        groups[index - 1] = {
          name: name || `Specification ${index}`,
          values: values.filter(Boolean)
        };
      }
    }

    return groups.filter((group) => group && (group.name || group.values.length));
  }

  async function getSequentialSpecGroup(index, shouldApply) {
    const root = findSectionRoot("specManagement");
    if (!root) return null;
    for (let attempts = 0; attempts < 12; attempts += 1) {
      const groups = getSpecGroups(root);
      if (groups[index]) return groups[index];

      if (!shouldApply) return null;

      const button = findAddSpecGroupButton(root);
      if (!button) return null;

      if (button.disabled) {
        await sleep(100);
        continue;
      }

      const previousCount = groups.length;
      button.click();
      await waitFor(() => getSpecGroups(root).length > previousCount, 1400);
    }
    return null;
  }

  async function getSequentialSpecValueInput(specGroup, index, shouldApply) {
    for (let attempts = 0; attempts < 20; attempts += 1) {
      const inputs = getSpecValueInputs(specGroup);
      if (inputs[index]) return inputs[index];

      if (!shouldApply) return null;

      const button = findAddSpecValueButton(specGroup);
      if (!button) return null;

      if (button.disabled) {
        await sleep(100);
        continue;
      }

      const previousCount = inputs.length;
      button.click();
      await waitFor(() => getSpecValueInputs(specGroup).length > previousCount, 1200);
    }
    return null;
  }

  function getSpecGroups(root) {
    return [...root.querySelectorAll(".spec-group")];
  }

  function getSpecValueInputs(specGroup) {
    return [...specGroup.querySelectorAll("input[name='specValue'], .J-inp-specValue")];
  }

  function findAddSpecGroupButton(root) {
    return root.querySelector(".J-btn-addSpecGroup") ||
      [...root.querySelectorAll("button, [role='button']")]
        .find((button) => /^(\+\s*)?添加规格$/i.test(cleanText(button.textContent || button.title || ""))) ||
      null;
  }

  function findAddSpecValueButton(specGroup) {
    return specGroup.querySelector(".J-btn-addSpecValue") ||
      [...specGroup.querySelectorAll("button, [role='button']")]
        .find((button) => /^(\+\s*)?添加(规格值)?$/i.test(cleanText(button.textContent || button.title || ""))) ||
      null;
  }

  async function fillFixedPrice(get, shouldApply, filled) {
    const binding = await activateFobPriceMode("0", shouldApply);
    const section = binding?.section;
    if (!section) return;

    const values = getSkuPriceDefaults(get);
    const skuRows = getSkuPriceRows(section);

    if (skuRows.length) {
      fillSkuPriceRows(skuRows, values, shouldApply, filled);
      if (shouldApply) syncProdSkuHidden(binding.root, "0");
      return;
    }

    const fields = [
      ["规格最小起订量", "input[name='skuMinOrder_one'], input[name='skuMinOrder'], .J-sku-MOQ"],
      ["规格商品编码", "input[name='skuCode_one'], input[name='skuCode']"],
      ["规格库存", "input[name='skuStock_one'], input[name='skuStock']"],
      ["规格单价", "input[name='skuPrice_one'], input[name='skuPrice']"]
    ];

    for (const [key, selector] of fields) {
      const value = get(key);
      const control = section.querySelector(selector);
      if (!value || !control) continue;
      if (shouldApply) {
        enableFobControl(control);
        applyValue(control, value, key);
      }
      filled.push({ key, value, target: selector, score: 110 });
    }

    if (shouldApply) {
      const pricingRadio = findSingleSpecMoqRadio(section);
      if (pricingRadio && !pricingRadio.checked) {
        enableFobControl(pricingRadio);
        pricingRadio.click();
        pricingRadio.dispatchEvent(new Event("change", { bubbles: true }));
        syncRadioGroupAttribute(pricingRadio);
      }
      syncProdSkuHidden(binding.root, "0");
    }
  }

  function getSkuPriceDefaults(get) {
    return {
      minOrder: get("规格最小起订量", "SKU最小起订量", "最小起订量"),
      code: get("规格商品编码", "SKU商品编码", "商品编码"),
      stock: get("规格库存", "SKU库存", "库存", "Stock"),
      price: get("规格单价", "SKU单价", "单价", "Price")
    };
  }

  function getSkuPriceRows(section) {
    const rows = [...section.querySelectorAll(".sku-info-table-body tbody tr")].filter((row) =>
      row.querySelector("input[name='skuMinOrder'], input[name='skuCode'], input[name='skuStock'], input[name='skuPrice']")
    );
    if (rows.length) return rows;
    return [...section.querySelectorAll("tr.min-order-fixed")].filter((row) =>
      row.querySelector("input[name='skuMinOrder_one'], input[name='skuCode_one'], input[name='skuStock_one'], input[name='skuPrice_one']")
    );
  }

  function fillSkuPriceRows(rows, values, shouldApply, filled) {
    const fields = [
      { key: "规格最小起订量", value: values.minOrder, selector: "input[name='skuMinOrder'], input[name='skuMinOrder_one'], .J-sku-MOQ", label: "skuMinOrder" },
      { key: "规格商品编码", value: values.code, selector: "input[name='skuCode'], input[name='skuCode_one']", label: "skuCode" },
      { key: "规格库存", value: values.stock, selector: "input[name='skuStock'], input[name='skuStock_one']", label: "skuStock" },
      { key: "规格单价", value: values.price, selector: "input[name='skuPrice'], input[name='skuPrice_one']", label: "skuPrice" }
    ];

    for (const field of fields) {
      if (!field.value) continue;
      let count = 0;
      for (const row of rows) {
        const control = row.querySelector(field.selector);
        if (!control) continue;
        if (shouldApply) {
          enableFobControl(control);
          applyValue(control, field.value, field.key);
        }
        count += 1;
      }
      if (count) {
        filled.push({ key: field.key, value: field.value, target: `${field.label} x ${count}`, score: 120 });
      }
    }
  }

  function findSingleSpecMoqRadio(section) {
    const radios = [...section.querySelectorAll("input[name='pricingStrategy']")];
    return radios.find((radio) => normalize(getNearbyText(radio)).includes(normalize("单规格最小起订量"))) || radios[0] || null;
  }

  // Guard only unambiguous name-equivalent native attributes.
  // Semantic overlap beyond these aliases remains an upstream AI review task.
  function canonicalMicAttributeName(value) {
    const compact = normalize(value).replace(/[\s_\-\/()]+/g, "");
    const aliases = {
      "pixelpitch": "像素间距", "像素间距": "像素间距",
      "iprating": "ip等级", "ip等级": "ip等级",
      "certification": "认证", "certifications": "认证", "认证": "认证",
      "pixeldensity": "像素密度", "像素密度": "像素密度",
      "brightness": "brightness", "亮度": "brightness",
      "specification": "规格", "规格": "规格",
      "trademark": "商标", "商标": "商标",
      "countryoforigin": "原产地", "原产地": "原产地"
    };
    return aliases[compact] || compact;
  }

  async function fillCustomProperties(entries, get, shouldApply, filled) {
    const reserved = new Set([
      "产品名称", "中心词", "关键词", "产品分组", "产品型号", "产品亮点1", "产品亮点2", "产品亮点3",
      "适用门店", "安装方式", "内容支持", "显示颜色", "分辨率", "屏幕尺寸", "显示技术", "运输包装",
      "规格名称", "规格管理名称", "规格值", "规格管理值", "规格最小起订量", "规格商品编码", "规格库存", "规格单价", "库存",
      "认证", "Certification", "功率", "Power", "发光颜色", "Emitting Color", "电压", "Voltage", "防护等级", "IP Rating",
      "规格", "商标", "原产地", "价格区间1起订量", "价格区间1单价", "价格区间1库存", "价格区间2起订量",
      "价格区间2单价", "价格区间2库存", "价格区间3起订量", "价格区间3单价", "价格区间3库存",
      "价格区间4起订量", "价格区间4单价", "价格区间4库存", "价格区间5起订量", "价格区间5单价", "价格区间5库存",
      "区间价最小起订量", "区间价最低价", "区间价最高价", "区间价库存",
      "计量单位", "单个包裹内产品数量", "单个包裹长", "单个包裹宽", "单个包裹高", "单个包裹毛重",
      "港口", "提供样品", "样品单价", "样品单位", "单次最多拿样数量", "样品描述", "支付方式",
      "产量", "海关编码", "产品详情", "FAQ问题1", "FAQ答案1", "FAQ问题2", "FAQ答案2", "FAQ问题3", "FAQ答案3",
      "发货期数量", "发货期时间", "运费模板", "Package Gross Weight"
    ].map(normalize));

    const customRoot = findSectionRoot("customProperties");
    if (!customRoot) return;
    const rows = [...customRoot.querySelectorAll(".J-selfprop")];
    const customMap = new Map();
    for (const row of rows) {
      const nameInput = row.querySelector("input[name='customPropName']");
      const valueInput = row.querySelector("input[name='customPropValue']");
      if (nameInput && valueInput) customMap.set(normalize(nameInput.value), valueInput);
    }
    const customNameInputs = [...customRoot.querySelectorAll("input[name='customPropName']")];
    for (const entry of customNameInputs) {
      const value = get(entry.value);
      const rowValue = entry.closest(".J-selfprop")?.querySelector("input[name='customPropValue']");
      if (!value || !rowValue) continue;
      if (shouldApply) applyValue(rowValue, value, entry.value);
      filled.push({ key: entry.value, value, target: `customProp ${entry.value}`, score: 120 });
    }

    const nativeNames = new Set(
      [...customRoot.querySelectorAll(".J-stand-prop")]
        .map((block) => cleanFieldLabel(block.querySelector(".form-label")?.textContent || "") || block.getAttribute("cz-name") || "")
        .filter(Boolean)
        .map(canonicalMicAttributeName)
    );
    ["运输包装", "规格", "商标", "原产地"].forEach((name) => nativeNames.add(canonicalMicAttributeName(name)));
    const existingNames = new Set(
      [...customMap.keys()].filter(Boolean).map(canonicalMicAttributeName)
    );
    const customEntries = entries.filter((entry) => shouldUseCustomProperty(entry.key));
    const usedCustomKeys = new Set(filled.map((item) => normalize(item.key)));
    const MAX_CUSTOM_PROPS = 15;
    const occupiedRows = rows.filter((row) => row.querySelector("input[name='customPropName']")?.value.trim()).length;
    let addedCount = 0;
    for (let index = 0; index < customEntries.length; index += 1) {
      const entry = customEntries[index];
      if (usedCustomKeys.has(normalize(entry.key))) continue;
      const semanticName = canonicalMicAttributeName(entry.key);
      if (nativeNames.has(semanticName) || existingNames.has(semanticName)) continue;
      if (occupiedRows + addedCount >= MAX_CUSTOM_PROPS) break;
      const row = await getSequentialCustomPropertyRow(shouldApply);
      if (!row) break;
      const nameInput = row.querySelector("input[name='customPropName']");
      const valueInput = row.querySelector("input[name='customPropValue']");
      if (shouldApply) {
        applyValue(nameInput, entry.key, "自定义属性名");
        applyValue(valueInput, entry.value, entry.key);
      }
      filled.push({ key: entry.key, value: entry.value, target: `customProp ${entry.key}`, score: 120 });
      usedCustomKeys.add(normalize(entry.key));
      existingNames.add(semanticName);
      addedCount += 1;
    }

    for (const [normalizedName, control] of customMap.entries()) {
      if (reserved.has(normalizedName)) continue;
      if (usedCustomKeys.has(normalizedName)) continue;
      const value = get(normalizedName);
      if (!value) continue;
      if (shouldApply) applyValue(control, value, normalizedName);
      filled.push({ key: normalizedName, value, target: "customProp", score: 110 });
    }
  }

  async function getSequentialCustomPropertyRow(shouldApply) {
    const root = findSectionRoot("customProperties");
    if (!root) return null;
    const queryRows = () => [...root.querySelectorAll(".J-selfprop")];

    for (let attempts = 0; attempts < 8; attempts += 1) {
      const rows = queryRows();
      const emptyRow = rows.find((row) => {
        const nameInput = row.querySelector("input[name='customPropName']");
        const valueInput = row.querySelector("input[name='customPropValue']");
        return nameInput && valueInput && !nameInput.value.trim() && !valueInput.value.trim();
      });
      if (emptyRow) return emptyRow;

      if (!shouldApply) return null;

      const incompleteRow = rows.find((row) => {
        const nameInput = row.querySelector("input[name='customPropName']");
        const valueInput = row.querySelector("input[name='customPropValue']");
        return nameInput && valueInput && (!nameInput.value.trim() || !valueInput.value.trim());
      });
      if (incompleteRow) return null;

      const button = root.querySelector(".J-prop-add");
      if (!button) return null;
      button.click();
      await sleep(160);
    }
    return null;
  }

  async function fillLadderPrices(get, shouldApply, filled) {
    const binding = await activateFobPriceMode("1", shouldApply);
    const section = binding?.section;
    if (!section) return;

    for (let index = 0; index < 5; index += 1) {
      const num = index + 1;
      const moq = get(`价格区间${num}起订量`, `阶梯价${num}起订量`, `MOQ${num}`);
      const price = get(`价格区间${num}单价`, `阶梯价${num}单价`, `Price${num}`);
      if (!moq && !price) continue;

      const rowControls = await getSequentialLadderControls(section, index, shouldApply);
      if (!rowControls) break;
      const { moqInput, priceInput } = rowControls;

      if (moq && moqInput) {
        if (shouldApply) applyValue(moqInput, moq, `价格区间${num}起订量`);
        filled.push({ key: `价格区间${num}起订量`, value: moq, target: `J-ladderMOQ #${index + 1}`, score: 120 });
      }
      if (price && priceInput) {
        if (shouldApply) applyValue(priceInput, price, `价格区间${num}单价`);
        filled.push({ key: `价格区间${num}单价`, value: price, target: `J-ladderprice #${index + 1}`, score: 120 });
      }
    }

    const stock = get(`价格区间1库存`, `价格区间2库存`, `价格区间3库存`, `价格区间4库存`, `价格区间5库存`, `阶梯价1库存`, `阶梯价2库存`, `库存`, `Stock`);
    if (stock) {
      const stockInput = section.querySelector("#prodStockNewOfLadder0, input.J-ladderstock");
      if (stockInput) {
        if (shouldApply) {
          enableFobControl(stockInput);
          applyValue(stockInput, stock, "库存");
          syncDirectSaleNum(binding.root, stock);
        }
        filled.push({ key: "库存", value: stock, target: "#prodStockNewOfLadder0", score: 120 });
      }
    }

    if (shouldApply) syncProdSkuHidden(binding.root, "1");
  }

  async function getSequentialLadderControls(section, index, shouldApply) {
    for (let attempts = 0; attempts < 8; attempts += 1) {
      const rows = [...section.querySelectorAll("tr.J-ladder-item")];
      const row = rows[index];
      if (row) {
        const moqInput = row.querySelector("input.J-ladderMOQ, input[name='prodMinimumOrderOfLadder']");
        const priceInput = row.querySelector("input.J-ladderprice, input[name='prodPriceNewOfLadder']");
        if (!moqInput || !priceInput) return null;
        if (shouldApply) {
          enableFobControl(moqInput);
          enableFobControl(priceInput);
        }
        return {
          moqInput,
          priceInput
        };
      }

      if (!shouldApply) return null;

      const previous = rows[index - 1];
      const previousMoq = previous?.querySelector("input.J-ladderMOQ, input[name='prodMinimumOrderOfLadder']");
      const previousPrice = previous?.querySelector("input.J-ladderprice, input[name='prodPriceNewOfLadder']");
      if ((previousMoq && !previousMoq.value.trim()) || (previousPrice && !previousPrice.value.trim())) return null;

      const button = section.querySelector(".J-add-ladder");
      if (!button) return null;
      button.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      button.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await sleep(180);
    }
    return null;
  }

  async function fillReferencePrices(get, shouldApply, filled) {
    const binding = await activateFobPriceMode("2", shouldApply);
    const section = binding?.section;
    if (!section) return;

    const fields = [
      ["区间价最小起订量", "input[name='prodMinimumOrderOfBase'], .J-reference-MOQ"],
      ["区间价最低价", "input[name='prodPriceNewStartOfBase'], .J-reference-price1"],
      ["区间价最高价", "input[name='prodPriceNewEndOfBase'], .J-reference-price2"],
      ["区间价库存", "input[name='prodStockNewOfBase'], #prodStockNewOfBase"]
    ];

    for (const [key, selector] of fields) {
      const value = get(key);
      const control = section.querySelector(selector);
      if (!value || !control) continue;
      if (shouldApply) {
        enableFobControl(control);
        applyValue(control, value, key);
        if (key === "区间价库存") syncDirectSaleNum(binding.root, value);
      }
      filled.push({ key, value, target: selector, score: 120 });
    }

    if (shouldApply) syncProdSkuHidden(binding.root, "2");
  }

  function getCurrentFobPriceMode() {
    const root = findSectionRoot("specSku") || document;
    const checked = root.querySelector("input[name='fobPriceType']:checked");
    return checked?.value || null;
  }

  function determineFobPriceMode(get, currentMode = null) {
    const explicitMode = normalizeFobPriceMode(get("FOB价格模式", "FOB价格类型", "价格模式", "价格类型", "定价方式"));
    if (explicitMode) return explicitMode;

    if (get("区间价最低价") || get("区间价最高价") || get("区间价最小起订量") || get("区间价库存")) return "2";
    if (get("价格区间1起订量") || get("价格区间1单价") || get("阶梯价1起订量") || get("阶梯价1单价")) return "1";
    if (get("规格最小起订量") || get("规格单价") || get("规格库存") || get("规格商品编码")) return "0";
    return null;
  }

  function normalizeFobPriceMode(value) {
    const text = normalize(value);
    if (!text) return null;
    if (/(多规格|规格报价|sku|按规格|fixed|spec)/i.test(text)) return "0";
    if (/(阶梯|区间价格|ladder|tier)/i.test(text)) return "1";
    if (/(参考|范围|价格区间|reference|range)/i.test(text)) return "2";
    return null;
  }

  function syncDirectSaleNum(root, value) {
    const input = root?.querySelector("input[type='hidden'][name='directSaleNum'], #directSaleNum");
    if (!input || !value) return;
    setNativeValue(input, value);
    dispatchEditableEvents(input);
  }

  function syncProdSkuHidden(root, mode) {
    const input = root?.querySelector("input[type='hidden'][name='prodSku']");
    if (!input?.value) return;

    let data;
    try {
      data = JSON.parse(input.value);
    } catch (_error) {
      return;
    }

    if (mode === "0") syncSkuModeHidden(root, data);
    if (mode === "1") syncLadderModeHidden(root, data);
    if (mode === "2") syncReferenceModeHidden(root, data);

    setNativeValue(input, JSON.stringify(data));
    dispatchEditableEvents(input);
  }

  function syncSkuModeHidden(root, data) {
    data.pricingStrategy = getCheckedPricingStrategy(root) || data.pricingStrategy || 2;
    const section = root.querySelector(".J-sku-price");
    if (!section) return;

    const rows = getSkuPriceRows(section);
    if (!Array.isArray(data.skus) || !rows.length) return;

    rows.forEach((row, index) => {
      const sku = data.skus[index];
      if (!sku) return;
      copyInputValueToObject(row, sku, "skuMinOrder", "input[name='skuMinOrder'], input[name='skuMinOrder_one']");
      copyInputValueToObject(row, sku, "skuCode", "input[name='skuCode'], input[name='skuCode_one']");
      copyInputValueToObject(row, sku, "skuStock", "input[name='skuStock'], input[name='skuStock_one']");
      copyInputValueToObject(row, sku, "skuPrice", "input[name='skuPrice'], input[name='skuPrice_one']");
    });
  }

  function syncLadderModeHidden(root, data) {
    normalizeNonSkuProdSkuData(root, data);
    data.pricingStrategy = 1;
    const section = root.querySelector(".J-ladder-price");
    if (!section) return;
    const rows = [...section.querySelectorAll("tr.J-ladder-item")];
    const ladderPrices = rows.map((row) => ({
      minOrder: valueOf(row.querySelector("input.J-ladderMOQ, input[name='prodMinimumOrderOfLadder']")),
      price: valueOf(row.querySelector("input.J-ladderprice, input[name='prodPriceNewOfLadder']"))
    })).filter((item) => item.minOrder || item.price);
    const stock = valueOf(section.querySelector("#prodStockNewOfLadder0, input.J-ladderstock"));
    if (ladderPrices.length) {
      data.ladderPrices = ladderPrices;
      data.ladders = ladderPrices;
    }
    if (stock) {
      data.stock = stock;
      data.directSaleNum = stock;
    }
  }

  function syncReferenceModeHidden(root, data) {
    normalizeNonSkuProdSkuData(root, data);
    data.pricingStrategy = 0;
    const section = root.querySelector(".J-reference-price");
    if (!section) return;
    const minOrder = valueOf(section.querySelector("input[name='prodMinimumOrderOfBase'], .J-reference-MOQ"));
    const priceStart = valueOf(section.querySelector("input[name='prodPriceNewStartOfBase'], .J-reference-price1"));
    const priceEnd = valueOf(section.querySelector("input[name='prodPriceNewEndOfBase'], .J-reference-price2"));
    const stock = valueOf(section.querySelector("input[name='prodStockNewOfBase'], #prodStockNewOfBase"));
    Object.assign(data, {
      prodMinimumOrderOfBase: minOrder || data.prodMinimumOrderOfBase,
      prodPriceNewStartOfBase: priceStart || data.prodPriceNewStartOfBase,
      prodPriceNewEndOfBase: priceEnd || data.prodPriceNewEndOfBase,
      prodStockNewOfBase: stock || data.prodStockNewOfBase,
      directSaleNum: stock || data.directSaleNum
    });
  }

  function normalizeNonSkuProdSkuData(root, data) {
    if (!Array.isArray(data.skus)) return;

    const versionSku = readFirstSkuVersion(root);
    const existing = data.skus[0] || {};
    const stock = valueOf(root.querySelector("#prodStockNewOfLadder0, input.J-ladderstock, input[name='prodStockNewOfBase'], #prodStockNewOfBase"));
    data.skus = [{
      specs: [],
      skuCode: null,
      skuMinOrder: null,
      skuPrice: null,
      skuStock: stock || existing.skuStock || 0,
      stockVersion: versionSku.stockVersion ?? existing.stockVersion,
      skuId: versionSku.skuId ?? existing.skuId
    }];
  }

  function readFirstSkuVersion(root) {
    const input = root?.querySelector("input[name='skuPageVersionData'], #skuPageVersionData") ||
      document.querySelector("input[name='skuPageVersionData'], #skuPageVersionData");
    if (!input?.value) return {};

    try {
      const data = JSON.parse(input.value);
      return Array.isArray(data) && data[0] ? data[0] : {};
    } catch (_error) {
      return {};
    }
  }

  function getCheckedPricingStrategy(root) {
    const checked = root.querySelector(".J-sku-price input[name='pricingStrategy']:checked");
    const value = checked?.value;
    return value === "" || value == null ? null : Number(value);
  }

  function copyInputValueToObject(row, target, prop, selector) {
    const value = valueOf(row.querySelector(selector));
    if (value !== "") target[prop] = value;
  }

  function valueOf(control) {
    return control?.value?.trim?.() || "";
  }

  async function activateFobPriceMode(mode, shouldApply) {
    const root = findSectionRoot("specSku");
    if (!root) return null;

    const bindings = {
      "0": { section: ".J-sku-price", unitWrap: ".J-unit-wrap-negotiate", radio: "input[name='fobPriceType'][value='0']" },
      "1": { section: ".J-ladder-price", unitWrap: ".J-unit-wrap-ladder", radio: "input[name='fobPriceType'][value='1']" },
      "2": { section: ".J-reference-price", unitWrap: ".J-unit-wrap-reference", radio: "input[name='fobPriceType'][value='2']" }
    };
    const binding = bindings[mode];
    if (!binding) return null;

    const radio = root.querySelector(binding.radio);
    const section = root.querySelector(binding.section);
    if (!section) return null;

    if (shouldApply && radio) {
      enableFobControl(radio);
      radio.closest("label")?.click();
      radio.checked = true;
      radio.dispatchEvent(new Event("input", { bubbles: true }));
      radio.dispatchEvent(new Event("change", { bubbles: true }));
      syncRadioGroupAttribute(radio);
    }

    if (shouldApply) {
      bindFobModeDom(root, section, binding.unitWrap);
      await waitFor(() => isDisplayed(section), 800);
      bindFobModeDom(root, section, binding.unitWrap);
    }

    return { root, section, radio };
  }

  function bindFobModeDom(root, activeSection, activeUnitWrapSelector) {
    for (const area of root.querySelectorAll(".J-fobPrice")) {
      const isTarget = area === activeSection;
      area.style.display = isTarget ? "block" : "none";
      if (isTarget) {
        area.classList.remove("J-ignore", "J-submit-ignore");
      } else {
        area.classList.add("J-ignore", "J-submit-ignore");
        for (const control of area.querySelectorAll("input, select, textarea")) {
          control.disabled = true;
          control.setAttribute("disabled", "disabled");
        }
      }
    }
    for (const wrap of document.querySelectorAll(".J-unit-wrap-negotiate, .J-unit-wrap-ladder, .J-unit-wrap-reference")) {
      wrap.style.display = wrap.matches(activeUnitWrapSelector) ? "" : "none";
      if (wrap.matches(activeUnitWrapSelector)) wrap.classList.remove("J-ignore", "J-submit-ignore");
    }
    for (const control of activeSection.querySelectorAll("input[disabled], select[disabled], textarea[disabled]")) {
      enableFobControl(control);
    }
  }

  function enableFobControl(control) {
    control.disabled = false;
    control.removeAttribute("disabled");
  }

  async function fillFobPrices(get, shouldApply, filled, mode = null) {
    mode = mode || determineFobPriceMode(get);
    if (!mode) return;

    if (mode === "0") {
      await fillFixedPrice(get, shouldApply, filled);
    } else if (mode === "1") {
      await fillLadderPrices(get, shouldApply, filled);
    } else if (mode === "2") {
      await fillReferencePrices(get, shouldApply, filled);
    }
  }

  function fillUnit(get, shouldApply, filled) {
    const value = get("计量单位", "unit");
    if (!value) return;

    const root = findSectionRoot("unit");
    if (!root) return;
    const selects = [
      ...root.querySelectorAll([
        "select.J-ladder-unitselect",
        "select[name='prodMinimumOrderTypeOfLadder']",
        "select[name='prodMinimumOrderTypeOfBase']",
        "select[name='prodMinimumOrderTypeOfNegotiate']"
      ].join(","))
    ];
    const uniqueSelects = [...new Set(selects)].filter((select) => !select.disabled);
    if (!uniqueSelects.length) return;

    if (shouldApply) {
      for (const select of uniqueSelects) fillSelect(select, value);
    }

    filled.push({ key: "计量单位", value, target: "计量单位下拉框", score: 115 });
  }

  function shouldUseCustomProperty(key) {
    const reserved = new Set([
      "产品名称", "中心词", "关键词", "产品分组", "产品型号", "产品亮点1", "产品亮点2", "产品亮点3",
      "适用门店", "安装方式", "内容支持", "显示颜色", "分辨率", "屏幕尺寸", "显示技术", "运输包装",
      "规格名称", "规格管理名称", "规格值", "规格管理值", "规格最小起订量", "规格商品编码", "规格库存", "规格单价", "库存",
      "认证", "Certification", "功率", "Power", "发光颜色", "Emitting Color", "电压", "Voltage", "防护等级", "IP Rating",
      "规格", "商标", "原产地", "价格区间1起订量", "价格区间1单价", "价格区间1库存", "价格区间2起订量",
      "价格区间2单价", "价格区间2库存", "价格区间3起订量", "价格区间3单价", "价格区间3库存",
      "价格区间4起订量", "价格区间4单价", "价格区间4库存", "价格区间5起订量", "价格区间5单价", "价格区间5库存",
      "区间价最小起订量", "区间价最低价", "区间价最高价", "区间价库存",
      "计量单位", "单个包裹内产品数量", "单个包裹长", "单个包裹宽", "单个包裹高", "单个包裹毛重",
      "港口", "提供样品", "样品单价", "样品单位", "单次最多拿样数量", "样品描述", "支付方式",
      "产量", "海关编码", "产品详情", "发货期数量", "发货期时间", "运费模板", "Package Gross Weight"
    ].map(normalize));

    if (reserved.has(normalize(key))) return false;
    if (/^规格\d*(名称|值)|^规格(名称|值)\d|^spec\d*/i.test(key)) return false;
    if (/^faq(问题|答案)|^(问题|答案)\d+|^faqquestion|^faqanswer/i.test(key)) return false;
    if (/^关键词\d+$/i.test(key)) return false;
    if (/^产品亮点\d+$/i.test(key)) return false;
    if (/^价格区间\d+(起订量|单价|库存)$/i.test(key)) return false;
    if (/^阶梯价\d+(起订量|单价|库存)$/i.test(key)) return false;
    if (normalize(key) === normalize("库存")) return false;
    if (/^区间价/i.test(key)) return false;
    if (/^发货期/i.test(key)) return false;
    return true;
  }

  const SECTION_ROOTS = {
    basicInfo: ".bd.J-bd:has([data-anchor='prodName'])",
    productDisplay: ".form-item[data-anchor='picIds'], [data-anchor='picIds']",
    specManagement: ".bd.J-bd.spec-mng[data-anchor='specsMng']",
    specSku: ".bd.J-bd[data-anchor='skuFob']",
    customProperties: ".bd.J-properties-wrap.J-bd[data-anchor='prodAttrs']",
    ladderPrices: ".bd.J-bd[data-anchor='skuFob']",
    highlights: "#highlightRoot",
    faq: "#faqRoot",
    keywords: ".form-item[data-anchor='prodKeyword']",
    detail: ".prod-desc[data-anchor='prodDescript'], #detailRoot",
    unit: ".bd.J-bd[data-anchor='unit']",
    package: ".bd.J-bd[data-anchor='package']",
    shipping: ".bd.J-bd[data-anchor='shipping']",
    sent: ".bd.J-bd[data-anchor='sent']",
    sample: ".bd.J-bd[data-anchor='sample']",
    otherInfo: ".bd.J-bd[data-anchor='other'], .bd.J-bd[data-anchor='otherInfo'], .bd.J-bd:has(input[name='prodPaymentType'])"
  };

  function findSectionRoot(name) {
    const selector = SECTION_ROOTS[name];
    if (!selector) return null;
    return document.querySelector(selector);
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function waitFor(predicate, timeout = 1000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (predicate()) return true;
      await sleep(80);
    }
    return false;
  }

  function fillPaymentMethods(get, shouldApply, filled) {
    const value = get("支付方式", "payment method");
    if (!value) return;

    const values = splitValues(value);
    const root = findSectionRoot("otherInfo");
    const boxes = root ? [...root.querySelectorAll("input[name='prodPaymentType']")] : [];
    for (const box of boxes) {
      const label = box.closest("label")?.textContent || "";
      const shouldCheck = values.some((item) => sameOption(item, label));
      if (shouldApply && box.checked !== shouldCheck) box.click();
      if (shouldApply) syncCheckedAttribute(box, shouldCheck);
    }
    filled.push({ key: "支付方式", value, target: "input[name='prodPaymentType']", score: 120 });
  }

  function fillSampleMode(get, shouldApply, filled) {
    const value = get("提供样品");
    const implicitYes = ["样品单价", "样品单位", "单次最多拿样数量", "样品描述"].some((key) => Boolean(get(key)));
    if (!value && !implicitYes) return;
    const yes = value ? isYesValue(value) : true;
    const root = findSectionRoot("sample");
    const control = root?.querySelector(`input[name='provideMode'][value='${yes ? "1" : "0"}']`);
    if (control) {
      if (shouldApply && !control.checked) control.click();
      if (shouldApply) syncRadioGroupAttribute(control);
      if (shouldApply && yes) enableSampleControls();
      filled.push({ key: "提供样品", value: value || "是", target: `input[name='provideMode'][value='${yes ? "1" : "0"}']`, score: 120 });
    }
  }

  function fillSampleFields(get, shouldApply, filled) {
    const root = findSectionRoot("sample");
    if (!root) return;
    const fields = [
      ["样品单价", "input[name='samplesPrice']"],
      ["样品单位", "select[name='samplesPricePacking']"],
      ["单次最多拿样数量", "input[name='maxSamplesCount']"],
      ["样品描述", "input[name='samplesDesc']"]
    ];

    if (shouldApply) enableSampleControls();

    for (const [key, selector] of fields) {
      const value = get(key);
      const control = root.querySelector(selector);
      if (!value || !control) continue;
      if (shouldApply) applyValue(control, value, key);
      filled.push({ key, value, target: selector, score: 115 });
    }
  }

  function enableSampleControls() {
    const root = findSectionRoot("sample");
    if (!root) return;
    for (const row of root.querySelectorAll(".J-sample-price, .J-max-sample-count, .J-sample-desc")) {
      row.style.display = "";
      row.classList.remove("J-ignore");
    }
    for (const control of root.querySelectorAll("input[name='samplesPrice'], select[name='samplesPricePacking'], input[name='maxSamplesCount'], input[name='samplesDesc']")) {
      control.disabled = false;
    }
  }

  function isYesValue(value) {
    const normalizedValue = normalize(value);
    return ["是", "yes", "true", "1"].some((item) => normalizedValue.includes(normalize(item)));
  }

  function fillProductDetails(get, shouldApply, filled) {
    const value = get("产品详情", "product details", "description", "overview");
    if (!value) return;

    filled.push({ key: "产品详情", value, target: "跳过：需在产品详情编辑器页面手动编辑", score: 0 });
  }

  function htmlFromPlainText(value) {
    return String(value)
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
      .join("");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function fillFreightTemplate(get, shouldApply, filled) {
    const root = findSectionRoot("shipping");
    const select = root?.querySelector("select[name='logTemplateId']");
    if (!select) return;
    const requested = get("运费模板") || "官方物流运费模板（默认推荐）";
    const choices = [...select.options];
    const match = choices.find((option) => normalize(option.textContent) === normalize(requested)) ||
      (normalize(requested) === normalize("官方物流运费模板（默认推荐）")
        ? choices.find((option) =>
            normalize(option.textContent).includes("官方物流") &&
            normalize(option.textContent).includes("默认推荐"))
        : null);
    if (!match || !match.value) return;
    if (shouldApply) {
      triggerFieldFocus(select);
      select.value = match.value;
      dispatchEditableEvents(select);
      if (select.value !== match.value) return;
    }
    filled.push({ key: "运费模板", value: cleanText(match.textContent), target: "select[name='logTemplateId']", score: 120 });
  }

  async function fillDeliveryEfficiency(exactGet, shouldApply, filled) {
    const values = [];
    const num1 = exactGet("发货期数量", "发货期数量1", "stockingNum", "stockingNum1");
    const day1 = exactGet("发货期时间", "发货期时间1", "stockingDay", "stockingDay1");
    if (num1 || day1) values.push({ num: num1, day: day1 });

    for (let index = 2; index <= 3; index += 1) {
      const num = exactGet(`发货期数量${index}`, `stockingNum${index}`);
      const day = exactGet(`发货期时间${index}`, `stockingDay${index}`);
      if (num || day) values.push({ num, day });
    }

    for (let index = 0; index < values.length; index += 1) {
      const row = await getSequentialStockingRow(index, shouldApply);
      if (!row) break;
      const { numInput, dayInput } = row;
      const { num, day } = values[index];
      if (num && numInput) {
        if (shouldApply) applyValue(numInput, num, `发货期数量${index + 1}`);
        filled.push({ key: `发货期数量${index + 1}`, value: num, target: `stockingNum #${index + 1}`, score: 120 });
      }
      if (day && dayInput) {
        if (shouldApply) applyValue(dayInput, day, `发货期时间${index + 1}`);
        filled.push({ key: `发货期时间${index + 1}`, value: day, target: `stockingDay #${index + 1}`, score: 120 });
      }
    }
  }

  async function getSequentialStockingRow(index, shouldApply) {
    const root = findSectionRoot("sent");
    if (!root) return null;

    for (let attempts = 0; attempts < 8; attempts += 1) {
      const numInputs = [...root.querySelectorAll("input[name='stockingNum']")];
      const dayInputs = [...root.querySelectorAll("input[name='stockingDay']")];
      if (numInputs[index] && dayInputs[index]) {
        return { numInput: numInputs[index], dayInput: dayInputs[index] };
      }

      if (!shouldApply) return null;

      const previousNum = numInputs[index - 1];
      const previousDay = dayInputs[index - 1];
      if ((previousNum && !previousNum.value.trim()) || (previousDay && !previousDay.value.trim())) return null;

      const button = root.querySelector(".J-add-stock");
      if (!button) return null;
      button.click();
      await sleep(180);
    }
    return null;
  }

  function findPropertyBlock(chinese, english) {
    const root = findSectionRoot("customProperties");
    if (!root) return null;
    const blocks = [...root.querySelectorAll(".J-stand-prop")];
    return blocks.find((block) => {
      const label = block.querySelector(".form-label")?.textContent || "";
      const czName = block.getAttribute("cz-name") || "";
      return normalize(label).includes(normalize(chinese)) || normalize(czName).includes(normalize(english));
    });
  }

  async function fillSelectOrOther(select, value, block, shouldApply = true) {
    const rawValue = String(value ?? "").trim();
    const explicitOtherValue = rawValue.match(/^other(?:s)?\s*[:：=]\s*(.+)$/i);
    const normalizedValue = normalize(rawValue);
    const explicitOther = Boolean(explicitOtherValue) || normalizedValue === "other" || normalizedValue === "others";
    const customValue = explicitOtherValue
      ? explicitOtherValue[1].trim()
      : explicitOther ? "" : rawValue;

    const isOtherOption = (item) => {
      if (!item) return false;
      const labels = [item.textContent, item.getAttribute("cz-html") || ""].map(normalize);
      return item.value === "-1" || labels.some((label) =>
        label === "other" || label === "others" || label === "其他" || label.startsWith("other")
      );
    };
    const findOtherOption = () => [...select.options].find(isOtherOption);
    const findOtherInput = () =>
      block?.querySelector("input.J-prop-other, input[name='industryPropOtherValue']") || null;

    const selectOption = async (option) => {
      if (!option) return false;
      if (!shouldApply) return true;
      triggerFieldFocus(select);
      select.value = option.value;
      syncSelectAttribute(select);
      dispatchEditableEvents(select);
      return select.value === option.value;
    };

    const fillCompanion = async (requestedCustomValue) => {
      if (!shouldApply) {
        const existingInput = findOtherInput();
        return requestedCustomValue ? true : existingInput ? Boolean(String(existingInput.value || "").trim()) : true;
      }

      let otherInput = findOtherInput();
      if (!otherInput) {
        await waitFor(() => Boolean(findOtherInput()), requestedCustomValue ? 1200 : 800);
        otherInput = findOtherInput();
      }
      if (!otherInput) return !requestedCustomValue;

      otherInput.disabled = false;
      if (otherInput.style) otherInput.style.display = "";

      if (requestedCustomValue) {
        applyValue(otherInput, requestedCustomValue, "Other");
        return normalize(otherInput.value) === normalize(requestedCustomValue);
      }

      // Selecting Other is not complete when MIC has rendered a blank
      // companion input. Do not report a false success to the user/EAO.
      return Boolean(String(otherInput.value || "").trim());
    };

    // "Other: E-Paper" is accepted for clarity. Prefer the custom value alone
    // (e.g. "E-Paper"); both forms select Other and fill its companion input.
    const option = explicitOther
      ? findOtherOption()
      : [...select.options].find((item) =>
          sameOption(rawValue, item.textContent) || sameOption(rawValue, item.getAttribute("cz-html") || "")
        );

    if (option) {
      if (!(await selectOption(option))) return false;
      if (!isOtherOption(option)) return true;
      return fillCompanion(customValue);
    }

    // A product-specific value not present in the select must use the real
    // Other option and its dynamically-rendered companion input.
    const otherOption = findOtherOption();
    if (!otherOption || explicitOther) return false;
    if (!(await selectOption(otherOption))) return false;
    return fillCompanion(customValue);
  }

  function sameOption(value, label) {
    const a = normalize(value).replace(/pixels?/g, "").replace(/inch|英寸/g, "");
    const b = normalize(label).replace(/pixels?/g, "").replace(/inch|英寸/g, "");
    return Boolean(a && b && (a === b || a.includes(b) || b.includes(a)));
  }

  function isFillableKnownControl(control) {
    return control && canFill(control) && !control.disabled;
  }

  function parseBulkText(text) {
    const trimmed = text.trim();
    if (!trimmed) return [];

    const jsonEntries = parseJsonEntries(trimmed);
    if (jsonEntries.length) return jsonEntries;

    const entries = [];
    let current = null;
    let currentSection = "";
    for (const rawLine of trimmed.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line) continue;
      if (line.startsWith("#")) {
        currentSection = cleanSectionName(line);
        current = null;
        continue;
      }

      const bullet = line.replace(/^[-*•]\s*/, "");
      const pair = bullet.match(/^([^:：=]{1,60})\s*[:：=]\s*(.*)$/);
      if (pair) {
        current = { key: pair[1].trim(), value: pair[2].trim(), section: currentSection };
        entries.push(current);
      } else if (current && looksLikeContinuation(current.key)) {
        current.value = `${current.value}\n${bullet}`.trim();
      }
    }

    return entries.filter((entry) => entry.key && entry.value);
  }

  function cleanSectionName(line) {
    return String(line || "")
      .replace(/^#+\s*/, "")
      .replace(/^[-–—]+\s*/, "")
      .replace(/[（(].*?[）)]/g, "")
      .trim();
  }

  function parseJsonEntries(text) {
    if (!/^[{[]/.test(text)) return [];
    try {
      const parsed = JSON.parse(text);
      const flat = [];
      flattenJson(parsed, "", flat);
      return flat;
    } catch {
      return [];
    }
  }

  function flattenJson(value, prefix, out) {
    if (Array.isArray(value)) {
      out.push({ key: prefix, value: value.join("; ") });
      return;
    }

    if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        flattenJson(child, prefix ? `${prefix}.${key}` : key, out);
      }
      return;
    }

    out.push({ key: prefix, value: String(value ?? "") });
  }

  function expandEntries(entries) {
    const expanded = [];
    for (const entry of entries) {
      if (isMultiValueKey(entry.key)) {
        const values = splitValues(entry.value);
        if (entry.key.includes("关键词") || /keywords?/i.test(entry.key)) {
          values.forEach((value, index) => expanded.push({ ...entry, key: `${entry.key}${index + 1}`, value }));
        } else {
          expanded.push(entry);
        }
      } else {
        expanded.push(entry);
      }
    }
    return expanded;
  }

  function splitValues(value) {
    return String(value ?? "")
      .split(/\r?\n|[;；]/)
      .map((part) => part.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean);
  }

  function isMultiValueKey(key) {
    const normalized = normalize(key);
    return MULTI_VALUE_KEYS.some((item) => normalized.includes(normalize(item)));
  }

  function looksLikeContinuation(key) {
    return isMultiValueKey(key) || /详情|description|overview|答案|answer/i.test(key);
  }

  function getAliases(key) {
    const base = key.replace(/\d+$/, "").replace(/价格区间\d+/, "价格区间");
    const aliases = [key, base];

    for (const [canonical, values] of KEY_ALIASES.entries()) {
      const normalizedKey = normalize(base);
      if (normalize(canonical) === normalizedKey || values.some((value) => normalizedKey === normalize(value))) {
        aliases.push(canonical, ...values);
      }
    }

    if (/价格区间\d+起订量/.test(key)) aliases.push("最小起订量", "MOQ", "采购数量");
    if (/价格区间\d+单价/.test(key)) aliases.push("单价", "price", "US$");
    if (/价格区间\d+库存/.test(key)) aliases.push("库存", "stock");

    return [...new Set(aliases)];
  }

  function canFill(control) {
    const type = (control.getAttribute("type") || "").toLowerCase();
    return !["file", "button", "submit", "reset", "image"].includes(type);
  }

  function applyValue(control, value, key) {
    const type = (control.getAttribute("type") || "").toLowerCase();
    if (type === "checkbox" || type === "radio") {
      fillChoice(control, value);
      return;
    }

    if (control.tagName === "SELECT") {
      fillSelect(control, value);
      return;
    }

    if (control.isContentEditable) {
      triggerFieldFocus(control);
      control.textContent = fitControlValue(control, value);
      dispatchEditableEvents(control);
      return;
    }

    const fittedValue = fitControlValue(control, value);

    if (isRichModuleTextarea(control)) {
      fillByUserLikeTextInput(control, fittedValue);
      return;
    }

    triggerFieldFocus(control);
    setNativeValue(control, fittedValue);
    dispatchEditableEvents(control);

  }

  function fitControlValue(control, value) {
    const text = String(value ?? "");
    const maxLength = Number(control.getAttribute("maxlength") || control.maxLength || -1);
    if (Number.isFinite(maxLength) && maxLength > 0 && text.length > maxLength) {
      return text.slice(0, maxLength);
    }
    return text;
  }

  function isRichModuleTextarea(control) {
    return control.matches?.("#highlightRoot textarea, #faqRoot textarea");
  }

  function fillByUserLikeTextInput(control, value) {
    triggerFieldFocus(control);
    control.select?.();
    const inserted = document.execCommand?.("insertText", false, value);
    if (!inserted) setNativeValue(control, value);
    dispatchEditableEvents(control);
  }

  function applyModuleTextareaValue(control, value) {
    triggerFieldFocus(control);
    setNativeValue(control, fitControlValue(control, value));
    dispatchEditableEvents(control);
  }

  function setNativeValue(control, value) {
    const prototype = control instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    if (setter) setter.call(control, value);
    else control.value = value;
    if (control instanceof HTMLTextAreaElement) {
      control.defaultValue = value;
      control.textContent = value;
    } else if (control instanceof HTMLInputElement) {
      control.defaultValue = value;
      control.setAttribute("value", value);
    }
  }

  function fillSelect(select, value) {
    triggerFieldFocus(select);
    const normalizedValue = normalize(value);
    const normalizedAliases = unitAliases(value).map(normalize);
    const option = [...select.options].find((item) => {
      const optionValues = [
        item.textContent,
        item.value,
        item.getAttribute("cz-unit"),
        item.getAttribute("cz-html")
      ].map(normalize);
      return optionValues.some((optionValue) =>
        optionValue && (optionValue.includes(normalizedValue) || normalizedValue.includes(optionValue) || normalizedAliases.includes(optionValue))
      );
    });
    if (option) {
      select.value = option.value;
    } else {
      const other = [...select.options].find((item) => item.value === "99" || item.value === "-1" || normalize(item.textContent).includes("其他") || normalize(item.textContent).includes("other"));
      if (other) select.value = other.value;
    }
    syncSelectAttribute(select);
    dispatchEditableEvents(select);
  }

  function syncSelectAttribute(select) {
    for (const option of select.options) {
      if (option.value === select.value) {
        option.selected = true;
        option.setAttribute("selected", "selected");
      } else {
        option.selected = false;
        option.removeAttribute("selected");
      }
    }
  }

  function unitAliases(value) {
    const normalizedValue = normalize(value);
    const aliases = {
      meter: ["米", "m"],
      metre: ["米", "m"],
      meters: ["米", "m"],
      metres: ["米", "m"],
      piece: ["个", "pcs", "pc"],
      pieces: ["个", "pcs", "pc"],
      pcs: ["个", "piece", "pieces"],
      pc: ["个", "piece", "pieces"],
      kilogram: ["千克", "kg"],
      kilograms: ["千克", "kg"],
      kg: ["千克", "kilogram"],
      carton: ["箱"],
      box: ["箱"],
      boxes: ["箱"],
      set: ["套"],
      sets: ["套"],
      roll: ["卷"],
      rolls: ["卷"]
    };
    return aliases[normalizedValue] || [];
  }

  function fillChoice(control, value) {
    triggerFieldFocus(control);
    const type = (control.getAttribute("type") || "").toLowerCase();
    const normalizedValue = normalize(value);
    const nearby = normalize(getNearbyText(control));
    const shouldCheck = ["是", "yes", "true", "1"].some((yes) => normalizedValue.includes(normalize(yes))) || nearby.includes(normalizedValue);
    if (control.checked !== shouldCheck) {
      control.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
    control.checked = shouldCheck;
    if (type === "radio") syncRadioGroupAttribute(control);
    else syncCheckedAttribute(control, shouldCheck);
    dispatchEditableEvents(control);
  }

  function syncCheckedAttribute(control, checked = control.checked) {
    control.checked = checked;
    control.defaultChecked = checked;
    if (checked) control.setAttribute("checked", "checked");
    else control.removeAttribute("checked");
  }

  function syncRadioGroupAttribute(control) {
    if ((control.getAttribute("type") || "").toLowerCase() !== "radio" || !control.name) {
      syncCheckedAttribute(control);
      return;
    }
    for (const item of document.querySelectorAll(`input[type='radio'][name="${CSS.escape(control.name)}"]`)) {
      syncCheckedAttribute(item, item === control);
    }
  }

  function dispatchEditableEvents(control) {
    dispatchFieldEvent(control, "beforeinput", window.InputEvent || Event, { inputType: "insertText", data: null });
    control.dispatchEvent(new Event("input", { bubbles: true }));
    control.dispatchEvent(new Event("change", { bubbles: true }));
    triggerFieldBlur(control);
  }

  function triggerFieldFocus(control) {
    if (!control || typeof control.dispatchEvent !== "function") return;
    dispatchMouseIntent(control);
    try {
      control.focus?.();
    } catch (_error) {
      // Some hidden controls cannot be focused; synthetic focus events still notify validators.
    }
    dispatchFieldEvent(control, "focus", window.FocusEvent || Event);
    dispatchFieldEvent(control, "focusin", window.FocusEvent || Event);
  }

  function triggerFieldBlur(control) {
    if (!control || typeof control.dispatchEvent !== "function") return;
    dispatchFieldEvent(control, "blur", window.FocusEvent || Event);
    dispatchFieldEvent(control, "focusout", window.FocusEvent || Event);
    try {
      control.blur?.();
    } catch (_error) {
      // Ignore unfocusable controls.
    }
  }

  function dispatchMouseIntent(control) {
    for (const type of ["mouseover", "mouseenter", "mousedown", "mouseup", "click"]) {
      control.dispatchEvent(new MouseEvent(type, { bubbles: type !== "mouseenter", cancelable: true, view: window }));
    }
  }

  function dispatchFieldEvent(control, type, EventConstructor = Event, extra = {}) {
    try {
      control.dispatchEvent(new EventConstructor(type, { bubbles: type === "focusin" || type === "focusout" || type === "beforeinput", cancelable: true, ...extra }));
    } catch (_error) {
      control.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
    }
  }

  function getNearbyText(control) {
    const parts = [];
    let node = control;
    for (let depth = 0; depth < 4 && node; depth += 1) {
      const previous = node.previousElementSibling;
      if (previous) parts.push(previous.textContent);
      const parent = node.parentElement;
      if (parent) {
        parts.push(parent.getAttribute("aria-label"));
        parts.push(parent.querySelector("label")?.textContent);
        parts.push(parent.textContent?.slice(0, 220));
      }
      node = parent;
    }
    return compact(parts).join(" ");
  }

  function isVisible(element) {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  }

  function isDisplayed(element) {
    const style = getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden";
  }

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[：:：*＊()（）\[\]【】,，;；。.\-_/\\]/g, "");
  }

  function compact(values) {
    return values
      .map((value) => String(value || "").trim())
      .filter(Boolean);
  }
})();
