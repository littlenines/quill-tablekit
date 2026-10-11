import { readFileSync, writeFileSync } from 'node:fs'

// The CommonJS build does module.exports = TableKit, so its types need `export =`,
// with the other exported types on a namespace of the same name.
// They point at the ES module types, so there's only one copy of every type.

const esModuleTypes = readFileSync('dist/index.d.ts', 'utf8')
const typeNames = [...esModuleTypes.matchAll(/^export declare (?:type|interface) (\w+)/gm)].map(([, name]) => name)
const esModule = `import('./index.js', { with: { 'resolution-mode': 'import' } })`

const commonJsTypes = [
  `type EsModule = typeof ${esModule}`,
  '',
  "declare const TableKitClass: EsModule['default']",
  '',
  'declare class TableKit extends TableKitClass {}',
  '',
  'declare namespace TableKit {',
  ...typeNames.map((name) => `  export type ${name} = ${esModule}.${name}`),
  '}',
  '',
  'export = TableKit',
  '',
].join('\n')

writeFileSync('dist/index.d.cts', commonJsTypes)
