#!/usr/bin/env node
// design-audit CLI. Today: the `drift` command (code CSS vs DTCG tokens).
//
//   design-audit drift --css <file> --tokens <theme>=<file> [--tokens ...] \
//       [--primitives <file>] [--id-prefix color] [--authority code|tokens] \
//       [--json] [--strict]
//
// Exit code: 1 if any value-mismatch (genuine disagreement); with --strict,
// also fails on missing/extra (coverage/naming). Use in CI to gate on drift.

import { runDrift } from './drift.js'

var HELP = [
  'Usage: design-audit drift --css <file> --tokens <theme>=<file> [options]',
  '',
  'Options:',
  '  --css <file>            Code source: the CSS file declaring token custom properties (required)',
  '  --tokens <theme>=<file> DTCG token file for a theme, e.g. dark=tokens/dark.json (repeatable, required)',
  '  --primitives <file>     DTCG primitives file, for resolving {aliases}',
  '  --id-prefix <prefix>    Prefix DTCG ids to match the code namespace (default: color)',
  '  --authority <which>     Treat code|tokens as the source of truth (default: code)',
  '  --alias <from>=<to>     Map a candidate id to its authority equivalent, e.g.',
  '                          accent.default=color.accent (repeatable; suppresses naming noise)',
  '  --normalize-separators  Match hyphen vs dot (bg.card-hover ≡ bg.card.hover)',
  '  --json                  Emit findings as JSON',
  '  --strict                Also fail (exit 1) on missing/extra, not just value-mismatch',
  '  -h, --help              Show this help',
].join('\n')

function parseArgs(argv) {
  var o = { tokens: [] }
  for (var i = 0; i < argv.length; i++) {
    var a = argv[i]
    function next() { return argv[++i] }
    if (a === '--css') o.cssPath = next()
    else if (a === '--tokens') {
      var pair = next() || ''
      var eq = pair.indexOf('=')
      if (eq === -1) throw new Error('--tokens expects <theme>=<file>, got: ' + pair)
      o.tokens.push({ theme: pair.slice(0, eq), path: pair.slice(eq + 1) })
    } else if (a === '--primitives') o.primitivesPath = next()
    else if (a === '--id-prefix') o.idPrefix = next()
    else if (a === '--authority') o.authority = next()
    else if (a === '--alias') {
      var ap = next() || ''
      var aeq = ap.indexOf('=')
      if (aeq === -1) throw new Error('--alias expects <from>=<to>, got: ' + ap)
      o.aliases = o.aliases || {}
      o.aliases[ap.slice(0, aeq)] = ap.slice(aeq + 1)
    }
    else if (a === '--normalize-separators') o.normalizeSeparators = true
    else if (a === '--json') o.json = true
    else if (a === '--strict') o.strict = true
    else throw new Error('Unknown option: ' + a)
  }
  return o
}

var useColor = process.stdout.isTTY && !process.env.NO_COLOR
function paint(code, s) { return useColor ? '\x1b[' + code + 'm' + s + '\x1b[0m' : s }
var bold = function (s) { return paint('1', s) }
var dim = function (s) { return paint('2', s) }
var red = function (s) { return paint('31', s) }
var yellow = function (s) { return paint('33', s) }

function printHuman(result) {
  result.themes.forEach(function (t) {
    var k = {}
    t.findings.forEach(function (f) { (k[f.kind] = k[f.kind] || []).push(f) })
    console.log('')
    console.log(bold('● ' + t.theme) + dim('  code(' + t.codeCount + ') vs tokens(' + t.tokenCount + ')'))
    var mismatch = k['value-mismatch'] || []
    var missing = k['missing'] || []
    var extra = k['extra'] || []
    console.log('  ' + red(mismatch.length + ' value-mismatch') + ' · ' +
      yellow(missing.length + ' missing') + ' · ' + dim(extra.length + ' extra'))
    mismatch.forEach(function (f) { console.log('    ' + red('✗ ') + f.detail) })
    if (missing.length) console.log('    ' + dim('missing in tokens: ' + missing.map(function (f) { return f.refId }).join(', ')))
    if (extra.length) console.log('    ' + dim('only in tokens: ' + extra.map(function (f) { return f.refId }).join(', ')))
  })
  console.log('')
  console.log(bold('Totals: ') + JSON.stringify(result.totals))
}

function main() {
  var argv = process.argv.slice(2)
  if (!argv.length || argv[0] === '-h' || argv[0] === '--help' || argv[0] !== 'drift') {
    console.log(HELP)
    process.exit(argv[0] === 'drift' || argv.length ? 0 : 1)
  }
  var rest = argv.slice(1)
  if (rest.indexOf('-h') !== -1 || rest.indexOf('--help') !== -1) { console.log(HELP); process.exit(0) }

  var opts
  try { opts = parseArgs(rest) } catch (e) { console.error(red('Error: ') + e.message + '\n'); console.log(HELP); process.exit(2) }
  if (!opts.cssPath || !opts.tokens.length) {
    console.error(red('Error: ') + '--css and at least one --tokens are required\n'); console.log(HELP); process.exit(2)
  }

  var result
  try { result = runDrift(opts) } catch (e) { console.error(red('Error: ') + e.message); process.exit(2) }

  if (opts.json) console.log(JSON.stringify(result, null, 2))
  else printHuman(result)

  var failKinds = opts.strict ? ['value-mismatch', 'missing', 'extra'] : ['value-mismatch']
  var failed = result.themes.some(function (t) {
    return t.findings.some(function (f) { return failKinds.indexOf(f.kind) !== -1 })
  })
  process.exit(failed ? 1 : 0)
}

main()
