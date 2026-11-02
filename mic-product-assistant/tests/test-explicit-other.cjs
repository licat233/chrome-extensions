// Targeted regression: run with "node tests/test-explicit-other.cjs" from mic-product-assistant.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "..", "content.js"), "utf8");
const start = source.indexOf("  function fillSelectOrOther(");
const end = source.indexOf("  function sameOption(", start);
assert.ok(start >= 0 && end > start, "MIC property-selection helper must exist");
const make = new Function(
  "normalize", "sameOption", "triggerFieldFocus", "syncSelectAttribute",
  "dispatchEditableEvents", "applyValue",
  source.slice(start, end) + "\nreturn fillSelectOrOther;"
);
const normalize = x => String(x || "").toLowerCase().trim();
const sameOption = (a, b) => normalize(a) === normalize(b);
const events = [];
const fill = make(normalize, sameOption, () => events.push("focus"),
  () => events.push("sync"), () => events.push("change"),
  (control, value) => { control.value = value; });
const opt = (label, id) => ({
  value: id, textContent: label,
  getAttribute: name => name === "cz-html" ? label : ""
});
const select = options => ({ options, value: "" });
const noOther = { querySelector: () => null };
let field = select([opt("250×122", "1"), opt("Other", "-1")]);
assert.equal(fill(field, "Other", noOther, true), true);
assert.equal(field.value, "-1");
field = select([opt("250×122", "1")]);
assert.equal(fill(field, "Other", noOther, true), false);
field = select([opt("Another", "1")]);
assert.equal(fill(field, "Other", noOther, true), false);
field = select([opt("Other", "-1")]);
const companion = { value: "", disabled: true, style: { display:"none" } };
assert.equal(fill(field, "296 x 152", { querySelector: () => companion }, true), true);
assert.equal(companion.value, "296 x 152");
assert.equal(field.value, "-1");
console.log("MIC_EXPLICIT_OTHER_OPTION_TEST=PASS");
