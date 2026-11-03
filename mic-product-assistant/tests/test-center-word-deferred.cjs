// Targeted regression: center word is a dynamic field when MIC has no title-generated candidates.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "..", "content.js"), "utf8");
function functionSource(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, `Missing source: ${startMarker}`);
  return source.slice(start, end);
}

function extractWithCandidates(centerWords) {
  const root = {
    querySelector: selector => selector === "textarea[name='prodName']" ? { value: "" } : null,
    querySelectorAll: () => []
  };
  const extract = new Function(
    "findSectionRoot", "addControlField", "getCenterWordControls", "centerWordText", "cleanText",
    `${functionSource("  function extractBasicInformation(", "\n  function extractHighlights(")}
return extractBasicInformation;`
  )(
    () => root,
    (section, addField, name, control) => {
      if (control) addField(section, { fieldName: name, value: control.value || "" });
    },
    () => centerWords,
    control => control.word,
    value => String(value || "").trim()
  );
  const section = { name: "基本信息", fields: [] };
  extract(section, (target, field) => target.fields.push(field));
  return section.fields.find(field => field.fieldName === "中心词");
}

const empty = extractWithCandidates([]);
assert.ok(empty, "Center word must be exported even when no options are rendered");
assert.equal(empty.active, false);
assert.deepEqual(empty.value, []);
assert.deepEqual(empty.options, []);
assert.equal(empty.controlType, "checkbox-group");
assert.match(empty.fieldType, /动态字段/);
assert.match(empty.domLocator, /prodCenterWord/);

const ready = extractWithCandidates([{ word: "label", checked: true }, { word: "tag", checked: false }]);
assert.ok(ready);
assert.equal(ready.active, true);
assert.deepEqual(ready.options, ["label", "tag"]);
assert.deepEqual(ready.value, ["label"]);

const fillSource = functionSource(
  "  async function fillCenterWord(",
  "\n  function triggerTitleBlurForCenterWords("
);
function fillCenterWordWith(mockMatch) {
  let selected = 0;
  let blurred = 0;
  const fill = new Function(
    "splitValues", "findMatchingCenterWord", "createCenterWordSnapshot", "SIMPLE_FIELD_BINDINGS",
    "queryBinding", "triggerTitleBlurForCenterWords", "waitForFreshMatchingCenterWord",
    "selectSingleCenterWord", "centerWordText", "centerWordLocator",
    `let cancelPendingCenterWordFill = null;
${fillSource}
return fillCenterWord;`
  )(
    value => String(value || "").split(";").map(x => x.trim()).filter(Boolean),
    () => null,
    () => ({ controls: new Set(), signature: "" }),
    [{ key: "产品名称" }],
    () => ({ value: "Electronic Shelf Label" }),
    () => { blurred += 1; },
    (_values, _previous, opts) => {
      queueMicrotask(() => {
        if (mockMatch) opts.onMatch({ match: { word: "label" }, controls: [] });
        else opts.onTimeout();
      });
      return () => {};
    },
    () => { selected += 1; },
    control => control.word,
    () => "input[name='prodCenterWord']"
  );
  return { fill, getSelected: () => selected, getBlurred: () => blurred };
}

async function run() {
  const match = fillCenterWordWith(true);
  const filled = [];
  await match.fill(() => "label", true, filled);
  assert.equal(match.getBlurred(), 1);
  assert.equal(match.getSelected(), 1);
  assert.equal(filled.length, 1);
  assert.equal(filled[0].value, "label");

  const timeout = fillCenterWordWith(false);
  const notFilled = [];
  await timeout.fill(() => "label", true, notFilled);
  assert.equal(timeout.getBlurred(), 1);
  assert.equal(timeout.getSelected(), 0);
  assert.equal(notFilled.length, 0, "Missing live match must not be reported as successful fill");

  assert.match(source, /await fillCenterWord\(get, shouldApply, filled\)/);
  assert.match(source, /const onTimeout = options\.onTimeout/);
  assert.match(source, /cleanup\(\); onTimeout\(\)/);
  console.log("MIC_CENTER_WORD_DEFERRED_TEST=PASS");
}

run().catch(error => { console.error(error); process.exitCode = 1; });
