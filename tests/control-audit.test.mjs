import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const pagePath = new URL("../app/page.tsx", import.meta.url);

function attributeNames(node) {
  return new Set(
    node.attributes.properties
      .filter(ts.isJsxAttribute)
      .map((attribute) => attribute.name.text),
  );
}

test("every native button has a real handler or an explicit disabled boundary", async () => {
  const source = await readFile(pagePath, "utf8");
  const file = ts.createSourceFile(
    "page.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const failures = [];

  const visit = (node) => {
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      node.tagName.getText(file) === "button"
    ) {
      const attributes = attributeNames(node);
      if (!attributes.has("onClick") && !attributes.has("disabled")) {
        failures.push(file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);

  assert.deepEqual(
    failures,
    [],
    `buttons without handler/disabled boundary at lines: ${failures.join(", ")}`,
  );
});

test("daily workspace and knowledge audit use shared real sources", async () => {
  const source = await readFile(pagePath, "utf8");

  assert.match(source, /function DailyArea/);
  assert.match(source, /useSharedRecords\("habits"\)/);
  assert.match(source, /HABITS · GEMEINSAMER SERVERZUSTAND/);
  assert.match(source, /fetch\("\/api\/state\/audit"/);
  assert.doesNotMatch(source, /Mock-Kalender gelesen|Wochenplan vorgeschlagen|5 Tage im Rhythmus/);
});
