// Regression tests for MIC standard-property Other companion inputs.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "..", "content.js"), "utf8");
const start = source.indexOf("  async function fillSelectOrOther(");
const end = source.indexOf("  function sameOption(", start);
assert.ok(start >= 0 && end > start, "MIC property-selection helper must exist");

const normalize = value => String(value || "")
  .toLowerCase()
  .replace(/\s+/g, "")
  .replace(/[：:：*＊()（）\[\]【】,，;；。.-_/\\]/g, "");
const sameOption = (a, b) => normalize(a) === normalize(b);

function makeFill({ onChange = () => {} } = {}) {
  const events = [];
  const waitFor = async predicate => {
    if (predicate()) return true;
    await Promise.resolve();
    return Boolean(predicate());
  };
  const fill = new Function(
    "normalize",
    "sameOption",
    "triggerFieldFocus",
    "syncSelectAttribute",
    "dispatchEditableEvents",
    "applyValue",
    "waitFor",
    source.slice(start, end) + "\nreturn fillSelectOrOther;"
  )(
    normalize,
    sameOption,
    () => events.push("focus"),
    () => events.push("sync"),
    control => {
      events.push("change");
      onChange(control);
    },
    (control, value) => { control.value = value; },
    waitFor
  );
  return { fill, events };
}

const opt = (label, id) => ({
  value: id,
  textContent: label,
  getAttribute: name => name === "cz-html" ? label : ""
});
const select = options => ({ options, value: "" });
const noOtherInput = { querySelector: () => null };

async function run() {
  let field = select([opt("250×122", "1"), opt("Other", "-1")]);
  let result = makeFill();
  assert.equal(await result.fill(field, "Other", noOtherInput, true), true,
    "Other remains a valid standalone option when no companion input is rendered");
  assert.equal(field.value, "-1");

  field = select([opt("Other", "-1")]);
  const blankCompanion = { value: "", disabled: true, style: { display: "none" } };
  result = makeFill();
  assert.equal(await result.fill(field, "Other", {
    querySelector: () => blankCompanion
  }, true), false,
  "Other must not be reported as complete when its companion input exists but is blank");
  assert.equal(field.value, "-1");
  assert.equal(blankCompanion.value, "");

  field = select([opt("Other", "-1")]);
  const existingCompanion = { value: "E-Paper", disabled: false, style: { display: "" } };
  result = makeFill();
  assert.equal(await result.fill(field, "Other", {
    querySelector: () => existingCompanion
  }, true), true,
  "An already-populated Other companion input is complete");

  field = select([opt("LCD", "1"), opt("Other", "-1")]);
  const delayedCompanion = { value: "", disabled: true, style: { display: "none" } };
  let companionRendered = false;
  result = makeFill({
    onChange: control => {
      if (control.value === "-1") companionRendered = true;
    }
  });
  assert.equal(await result.fill(field, "Other: E-Paper", {
    querySelector: () => companionRendered ? delayedCompanion : null
  }, true), true,
  "The explicit Other: value syntax must fill a companion input rendered after selection");
  assert.equal(field.value, "-1");
  assert.equal(delayedCompanion.value, "E-Paper");
  assert.equal(delayedCompanion.disabled, false);
  assert.equal(delayedCompanion.style.display, "");

  field = select([opt("LCD", "1"), opt("Other", "-1")]);
  const directCompanion = { value: "", disabled: true, style: { display: "none" } };
  result = makeFill();
  assert.equal(await result.fill(field, "E-Paper", {
    querySelector: () => directCompanion
  }, true), true,
  "A product-specific value must select Other and populate its companion input");
  assert.equal(field.value, "-1");
  assert.equal(directCompanion.value, "E-Paper");

  field = select([opt("LCD", "1")]);
  result = makeFill();
  assert.equal(await result.fill(field, "E-Paper", noOtherInput, true), false,
    "A custom value must not be reported as filled when no Other option exists");

  field = select([opt("LCD", "1"), opt("Other", "-1")]);
  result = makeFill();
  assert.equal(await result.fill(field, "Other: E-Paper", noOtherInput, true), false,
    "An explicit custom value must not be reported as filled when no companion input appears");

  assert.match(source, /input\.J-prop-other, input\[name='industryPropOtherValue'\]/,
    "Extraction and filling must recognize both supported MIC companion-input selectors");
  assert.equal((source.match(/typeof field\.otherInputSupported/g) || []).length, 2,
    "Both edit Context and Category Schema must preserve otherInputSupported");
  assert.match(source, /const otherInputSupported = Boolean\(other \|\| otherOption\)/,
    "Category fields with an Other option must expose the generated companion-input capability");
  assert.match(source, /value = selectedIsOther && otherInputSupported/,
    "A blank Other companion must not be exported as the literal value Other");

  console.log("MIC_OTHER_COMPANION_INPUT_TEST=PASS");
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
