import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import ts from "typescript";

// Regression guard for #10553: the "List Models" EndpointCard on the
// Endpoints dashboard tab (path "/v1/models") was hardcoded with
// `models={null}`, so it could never show the total model count, unlike
// every other EndpointCard fed a real models array or the full `allModels`
// catalog state.

const cwd = process.cwd();
const filePath = resolve(
  join(cwd, "src/app/(dashboard)/dashboard/endpoint/EndpointPageClient.tsx")
);
const source = readFileSync(filePath, "utf-8");

test("endpoint dashboard source parses as TSX", () => {
  const { diagnostics } = ts.transpileModule(source, {
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: filePath,
  });
  const problems = (diagnostics ?? []).map((diagnostic) =>
    ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")
  );

  assert.deepEqual(problems, [], `EndpointPageClient.tsx syntax errors:\n${problems.join("\n")}`);
});

test("issue #10553: List Models card must not hardcode models={null}", () => {
  const cardMatch = source.match(/title=\{t\("listModels"\)\}[\s\S]{0,200}?models=\{([^}]*)\}/);
  assert.ok(cardMatch, "List Models EndpointCard not found");
  assert.notStrictEqual(
    cardMatch[1].trim(),
    "null",
    "List Models card must not hardcode models={null}"
  );
});

test("issue #10553: List Models card passes modelsLoading", () => {
  const cardMatch = source.match(
    /title=\{t\("listModels"\)\}[\s\S]{0,250}?(modelsLoading=\{[^}]*\})/
  );
  assert.ok(cardMatch, "List Models card missing modelsLoading prop");
});
