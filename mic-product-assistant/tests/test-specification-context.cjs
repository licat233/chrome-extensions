// Targeted regression: run with "node tests/test-specification-context.cjs" from mic-product-assistant.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "..", "content.js"), "utf8");
function functionSource(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, `Missing function source: ${startMarker}`);
  return source.slice(start, end);
}

const addTemplateSource = functionSource(
  "  function addSpecificationTemplateFields(",
  "\n  function extractFobPricing("
);
const addTemplate = new Function(
  "addField",
  `${addTemplateSource}\nreturn addSpecificationTemplateFields;`
)((section, field) => section.fields.push(field));

const helpText = "为了提升买家购物体验，建议填写一个规格，最多可填写300种组合规格";
const specRoot = {
  querySelectorAll: () => [],
  querySelector: selector => {
    if (selector === ".J-btn-addSpecGroup") return { textContent: "添加规格" };
    if (selector === ".J-specsMng-header .help-desc") return { textContent: helpText };
    return null;
  }
};
const extractSpecificationsSource = functionSource(
  "  function extractSpecifications(",
  "\n  function addSpecificationTemplateFields("
);
const extractSpecifications = new Function(
  "findSectionRoot",
  "getSpecGroups",
  "markSectionExists",
  "addSpecificationTemplateFields",
  `${extractSpecificationsSource}\nreturn extractSpecifications;`
)(
  () => specRoot,
  () => [],
  section => { section.exists = true; },
  addTemplate
);

const section = { name: "规格管理", fields: [] };
extractSpecifications(section, (target, field) => target.fields.push(field), target => { target.exists = true; });
assert.equal(section.exists, true);
assert.equal(section.empty, true);
assert.equal(section.fields.length, 2);
assert.deepEqual(
  section.fields.map(field => [field.fieldName, field.bulkFillFieldName]),
  [["规格1名称", "规格名称"], ["规格1值1", "规格值"]]
);
for (const field of section.fields) {
  assert.equal(field.fieldOrigin, "mic_builtin");
  assert.equal(field.required, false, "MIC help text says recommended, not platform-required");
  assert.equal(field.active, false, "empty-state fields are created dynamically after clicking Add Specification");
  assert.match(field.fieldType, /动态字段/);
  assert.match(field.domLocator, /J-btn-addSpecGroup/);
}

const capabilitiesSource = functionSource(
  "  function extractPageCapabilities() {",
  "\n  function extractBasicInformation("
);
const keywordRoot = { querySelectorAll: () => [], querySelector: () => null };
const capabilities = new Function(
  "findSectionRoot",
  "getCenterWordControls",
  "isVisible",
  "isDisplayed",
  "findAddHighlightButton",
  "findAddFaqButton",
  "getSpecGroups",
  "findAddSpecGroupButton",
  "getSpecValueInputs",
  "findAddSpecValueButton",
  "cleanText",
  `${capabilitiesSource}\nreturn extractPageCapabilities;`
)(
  name => {
    if (name === "keywords" || name === "basicInfo") return keywordRoot;
    if (name === "specManagement") return specRoot;
    return null;
  },
  () => [],
  () => true,
  () => true,
  () => null,
  () => null,
  () => [],
  root => root.querySelector(".J-btn-addSpecGroup"),
  () => [],
  () => null,
  value => String(value || "").trim()
)();

assert.equal(capabilities.specManagementExists, true);
assert.equal(capabilities.specGroupsRendered, 0);
assert.equal(capabilities.specGroupAddSupported, true);
assert.equal(capabilities.specGroupPluginInputCeiling, 10);
assert.equal(capabilities.specValueSlotsRendered, 0);
assert.equal(capabilities.specValueAddSupported, null, "value-add control is not observable until a group exists");
assert.equal(capabilities.specValueAddSupportedAfterGroupCreation, true);
assert.equal(capabilities.specValuePluginInputCeiling, 20);
assert.equal(capabilities.specRecommendedMinimumGroups, 1);
assert.equal(capabilities.specCombinationPlatformLimit, 300);
assert.equal(capabilities.specRecommendationText, helpText);

const categorySchemaMapping = functionSource(
  "  function extractCategoryFormSchema() {",
  "\n  function extractPageCapabilities("
);
assert.match(categorySchemaMapping, /section\.empty \? \{ empty: true \}/);
assert.match(categorySchemaMapping, /typeof field\.active === "boolean"/);

const valueCreatorSource = functionSource(
  "  async function getSequentialSpecValueInput(",
  "\n  function getSpecGroups("
);
assert.match(valueCreatorSource, /attempts < 20/);

console.log("MIC_SPECIFICATION_CONTEXT_TEST=PASS");
