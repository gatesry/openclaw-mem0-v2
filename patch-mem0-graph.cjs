#!/usr/bin/env node
/**
 * Postinstall patch for mem0ai graph memory JSON format bug.
 * 
 * The mem0ai JS SDK sends response_format: { type: "json_object" } to OpenAI
 * for graph operations but forgets to include "json" in the prompt messages,
 * which OpenAI requires. This silently breaks graph extraction.
 * 
 * Bug exists in mem0ai <=2.2.2. Remove this script once upstream fixes it.
 * See: /Users/ryangates/.openclaw/workspace/neo4j-graph-fix.md
 */

const fs = require('fs');
const path = require('path');

const TARGET = path.join(__dirname, 'node_modules', 'mem0ai', 'dist', 'oss', 'index.mjs');

if (!fs.existsSync(TARGET)) {
  console.log('[patch-mem0-graph] mem0ai not found, skipping');
  process.exit(0);
}

let src = fs.readFileSync(TARGET, 'utf8');
let patches = 0;

// Patch 1: _retrieveNodesFromData — entity extraction prompt missing "json"
const old1 = 'Extract all the entities from the text. ***DO NOT*** answer the question itself if the given text is a question.`';
const new1 = 'Extract all the entities from the text. ***DO NOT*** answer the question itself if the given text is a question.\\nRespond in JSON format.`';

if (src.includes(new1)) {
  console.log('[patch-mem0-graph] Patch 1 (entity extraction): already applied');
} else if (src.includes(old1)) {
  src = src.replace(old1, new1);
  patches++;
  console.log('[patch-mem0-graph] Patch 1 (entity extraction): applied');
} else {
  console.warn('[patch-mem0-graph] Patch 1 (entity extraction): target text not found — SDK may have changed');
}

// Patch 2: DELETE_RELATIONS_SYSTEM_PROMPT — deletion prompt missing "json"
const old2 = 'Provide a list of deletion instructions, each specifying the relationship to be deleted.';
const new2 = 'Provide a list of deletion instructions in JSON format, each specifying the relationship to be deleted.';

if (src.includes(new2)) {
  console.log('[patch-mem0-graph] Patch 2 (delete relations): already applied');
} else if (src.includes(old2)) {
  src = src.replace(old2, new2);
  patches++;
  console.log('[patch-mem0-graph] Patch 2 (delete relations): applied');
} else {
  console.warn('[patch-mem0-graph] Patch 2 (delete relations): target text not found — SDK may have changed');
}

// Patch 3: Disable Mem0 telemetry
const old3 = 'var MEM0_TELEMETRY = true;';
const new3 = 'var MEM0_TELEMETRY = false;';

if (src.includes(new3)) {
  console.log('[patch-mem0-graph] Patch 3 (disable telemetry): already applied');
} else if (src.includes(old3)) {
  src = src.replace(old3, new3);
  patches++;
  console.log('[patch-mem0-graph] Patch 3 (disable telemetry): applied');
} else {
  console.warn('[patch-mem0-graph] Patch 3 (disable telemetry): target text not found — SDK may have changed');
}

if (patches > 0) {
  fs.writeFileSync(TARGET, src, 'utf8');
  console.log(`[patch-mem0-graph] ${patches} patch(es) written to ${TARGET}`);
} else {
  console.log('[patch-mem0-graph] No patches needed');
}
