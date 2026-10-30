/**
 * Generates the typed API surface from the live OpenAPI document.
 *
 *   node scripts/gen-api.mjs                 # uses .tmp/openapi.json
 *   node scripts/gen-api.mjs <spec.json>     # uses an explicit spec
 *
 * Outputs:
 *   src/types/api.ts        - interfaces & unions for every component schema
 *   src/api/endpoints.ts    - one typed function per operation, grouped by tag
 *
 * The spec paths are rooted at /api/v1; the client is configured with the same
 * prefix as its baseURL, so paths are emitted relative to that prefix.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const specPath = process.argv[2] ? resolve(process.argv[2]) : resolve(root, '.tmp/openapi.json');
const spec = JSON.parse(readFileSync(specPath, 'utf8'));

const schemas = spec.components?.schemas ?? {};
const BASE_PREFIX = '/api/v1';

/* ------------------------------------------------------------------ naming */

function tsName(schemaName) {
  const last = schemaName.split('.').pop();
  if (last.endsWith('-Request')) return last.slice(0, -'-Request'.length) + 'Request';
  if (last.includes('-')) return last.split('-').pop();
  return last;
}

const names = new Map(); // schemaName -> tsName
for (const s of Object.keys(schemas)) names.set(s, tsName(s));

const seen = new Map();
for (const [s, n] of names) {
  if (seen.has(n) && seen.get(n) !== s) {
    throw new Error(`Type name collision: "${n}" from ${seen.get(n)} and ${s}`);
  }
  seen.set(n, s);
}

/* --------------------------------------------------------------- type emit */

const PRIMITIVES = { string: 'string', number: 'number', integer: 'number', boolean: 'boolean' };

function refName(ref) {
  const raw = ref.split('/').pop();
  const mapped = names.get(raw);
  if (!mapped) throw new Error(`Unknown $ref target: ${ref}`);
  return mapped;
}

/** Emits the TS type for a schema node. */
function emitType(node) {
  if (!node) return 'unknown';
  if (node.$ref) return refName(node.$ref);
  if (node.allOf) {
    const parts = node.allOf.map(emitType);
    return parts.length === 1 ? parts[0] : parts.join(' & ');
  }
  if (node.oneOf || node.anyOf) {
    const parts = (node.oneOf ?? node.anyOf).map(emitType);
    return parts.join(' | ');
  }
  if (Array.isArray(node.enum)) {
    return node.enum.map((v) => (typeof v === 'string' ? `'${v}'` : String(v))).join(' | ');
  }
  if (node.type === 'array') {
    const inner = emitType(node.items);
    return /[|&\s]/.test(inner) ? `(${inner})[]` : `${inner}[]`;
  }
  if (node.type === 'object' || (!node.type && node.properties)) {
    const props = node.properties ?? {};
    const required = new Set(node.required ?? []);
    const lines = Object.entries(props).map(
      ([k, v]) => `  ${safeKey(k)}${required.has(k) ? '' : '?'}: ${emitType(v)};`,
    );
    if (!lines.length) return 'Record<string, unknown>';
    return `{\n${lines.join('\n')}\n}`;
  }
  const base = PRIMITIVES[node.type];
  if (!base) return 'unknown';
  return node.nullable ? `${base} | null` : base;
}

function safeKey(k) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
}

/** Nullable marker for a property schema (enums and refs are never nullable here). */
function propType(prop) {
  const t = emitType(prop);
  return prop && prop.nullable && !t.includes('null') ? `${t} | null` : t;
}

const typeLines = [
  '/**',
  ' * AUTO-GENERATED from the live OpenAPI document - do not edit by hand.',
  ' *',
  ` * Source: ${spec.info?.title ?? 'EMR API'} ${spec.info?.version ?? ''}`,
  ' * Regenerate: node scripts/gen-api.mjs',
  ' */',
  '',
];

const enumBlocks = [];
for (const [schemaName, def] of Object.entries(schemas)) {
  const name = names.get(schemaName);
  if (Array.isArray(def.enum)) {
    const union = def.enum.map((v) => (typeof v === 'string' ? `'${v}'` : String(v))).join(' | ');
    enumBlocks.push(`export type ${name} = ${union};`);
    continue;
  }
  const props = def.properties ?? {};
  const required = new Set(def.required ?? []);
  const lines = Object.entries(props).map(
    ([k, v]) => `  ${safeKey(k)}${required.has(k) ? '' : '?'}: ${propType(v)};`,
  );
  const body = lines.length ? `{\n${lines.join('\n')}\n}` : 'Record<string, never>';
  typeLines.push(`export interface ${name} ${body}`);
  typeLines.push('');
}
typeLines.push(...enumBlocks, '');

writeFileSync(resolve(root, 'src/types/api.ts'), typeLines.join('\n'));

/* -------------------------------------------------------- endpoint emit */

const HTTP = { get: 'get', post: 'post', put: 'put', patch: 'patch', delete: 'delete' };

/** Split on word boundaries and re-join in lower-camel ("HMO" -> "hmo", "BookAppointment" -> "bookAppointment"). */
function camelCase(s) {
  if (!s) return s;
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[\s_\-]+/)
    .filter(Boolean)
    .map((w, i) =>
      i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join('');
}

function responseType(op) {
  const ok = op.responses?.['200'] ?? op.responses?.['201'] ?? op.responses?.['204'];
  const schema = ok?.content?.['application/json']?.schema;
  if (!schema) return 'void';
  return emitType(schema);
}

function requestType(op) {
  const schema = op.requestBody?.content?.['application/json']?.schema;
  if (!schema) return null;
  return emitType(schema);
}

function paramGroups(op) {
  const params = op.parameters ?? [];
  return {
    path: params.filter((p) => p.in === 'path'),
    query: params.filter((p) => p.in === 'query'),
  };
}

function queryType(p) {
  const t = emitType(p.schema);
  return t === 'string' || t === 'number' || t === 'boolean' ? t : 'string';
}

function opName(op, method, path) {
  if (op.operationId) return camelCase(op.operationId);
  return camelCase(method) + camelCase(path.replace(/[^a-zA-Z0-9]+/g, '_'));
}

const byTag = new Map();

for (const [path, ops] of Object.entries(spec.paths)) {
  for (const [method, op] of Object.entries(ops)) {
    const m = HTTP[method];
    if (!m) continue;
    const tag = (op.tags?.[0] ?? 'general').replace(/[^a-zA-Z0-9]/g, '');
    if (!byTag.has(tag)) byTag.set(tag, []);
    byTag.get(tag).push({ method: m, path, op });
  }
}

const typeImports = new Set();
const usedTypes = (t) => {
  if (!t) return;
  for (const m of t.matchAll(/[A-Za-z_][A-Za-z0-9_]*/g)) typeImports.add(m[0]);
};

const endpointLines = [];
for (const [tag, ops] of byTag) {
  const seenNames = new Set();
  const fns = [];
  for (const { method, path, op } of ops) {
    const { path: pathParams, query } = paramGroups(op);
    const bodyType = requestType(op);
    const resType = responseType(op);
    usedTypes(bodyType);
    usedTypes(resType);
    for (const q of query) usedTypes(queryType(q));

    let fnName = opName(op, method, path);
    let candidate = fnName;
    let n = 2;
    while (seenNames.has(candidate)) candidate = `${fnName}${n++}`;
    seenNames.add(candidate);

    // Relative path: strip the /api/v1 base prefix.
    let rel = path.startsWith(BASE_PREFIX) ? path.slice(BASE_PREFIX.length) : path;
    const args = [];
    for (const p of pathParams) {
      const pn = p.name;
      rel = rel.replace(`{${pn}}`, `\${encodeURIComponent(${pn})}`);
      args.push(`${pn}: string`);
    }
    if (bodyType) args.push(`body: ${bodyType}`);
    if (query.length) {
      const qt = query.map((q) => `${safeKey(q.name)}?: ${queryType(q)}`).join('; ');
      args.push(`params?: { ${qt} }`);
    }

    const verb = `api${method.charAt(0).toUpperCase()}${method.slice(1)}`;
    const call = `${verb}<${resType}>(\`${rel}\`${bodyType ? ', body' : ''}${
      query.length ? (bodyType ? ', params' : ', { params }') : ''
    })`;
    fns.push(
      `  /** ${op.summary ?? op.description ?? op.operationId ?? fnName} */\n  ${candidate}: (${args.join(', ')}) => ${call},`,
    );
  }
  endpointLines.push(`export const ${camelCase(tag)}Api = {`);
  endpointLines.push(...fns);
  endpointLines.push('};');
  endpointLines.push('');
}

// Keep the convenience export used by the patient auth page stable across API
// regeneration. The canonical typed function remains patientsApi.registerPatient.
const hasPatientRegistration = byTag
  .get('Patients')
  ?.some(({ op }) => op.operationId === 'RegisterPatient');
if (hasPatientRegistration) {
  endpointLines.push('export const registerPatient = patientsApi.registerPatient;');
  endpointLines.push('');
}

const reserved = new Set([
  'http', 'unknown', 'string', 'number', 'boolean', 'null', 'void', 'Record',
]);
const importList = [...typeImports].filter((t) => !reserved.has(t) && /^[A-Z]/.test(t)).sort();

const header = [
  '/**',
  ' * AUTO-GENERATED from the live OpenAPI document - do not edit by hand.',
  ' *',
  ' * Regenerate: node scripts/gen-api.mjs',
  ' */',
  '',
  "import { apiGet, apiPatch, apiPost, apiPut } from './client';",
  '',
  'import type {',
  ...importList.map((t) => `  ${t},`),
  "} from '../types/api';",
  '',
];

writeFileSync(resolve(root, 'src/api/endpoints.ts'), [...header, ...endpointLines].join('\n'));

console.log(`types     -> src/types/api.ts      (${Object.keys(schemas).length} schemas)`);
console.log(`endpoints -> src/api/endpoints.ts  (${[...byTag.values()].reduce((a, b) => a + b.length, 0)} operations in ${byTag.size} groups)`);
console.log('tags:', [...byTag.keys()].join(', '));
