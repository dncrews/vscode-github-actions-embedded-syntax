const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const grammar = JSON.parse(
  fs.readFileSync(
    path.join(root, 'syntaxes', 'github-actions-run-shell.injection.tmLanguage.json'),
    'utf8'
  )
);

function compileTopLevelContexts() {
  return grammar.patterns.map((pattern) => {
    const repoKey = pattern.include.replace(/^#/, '');
    const rule = grammar.repository[repoKey];
    const runRule = rule.patterns[0];

    return {
      repoKey,
      outerBegin: new RegExp(rule.begin),
      outerEnd: new RegExp(rule.end),
      runBegin: new RegExp(runRule.begin),
      runEndTemplate: runRule.end,
      embeddedScope: runRule.contentName
    };
  });
}

function runEndRegex(template, indent) {
  return new RegExp(template.replace('\\1', indent.replace(/\\/g, '\\\\')));
}

function analyzeFixture(name) {
  const text = fs.readFileSync(path.join(root, 'test', 'fixtures', name), 'utf8');
  const lines = text.split(/\r?\n/);

  const contexts = compileTopLevelContexts();
  const runHeaders = [];
  const runBodies = new Map();

  let active = null;
  let inRun = false;
  let currentRunEnd = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const lineNo = i + 1;

    if (active && inRun && currentRunEnd.test(line)) {
      inRun = false;
      currentRunEnd = null;
    }

    if (active && !inRun && active.outerEnd.test(line)) {
      active = null;
    }

    if (!active) {
      active = contexts.find((ctx) => ctx.outerBegin.test(line)) || null;
    }

    if (active && !inRun) {
      const match = active.runBegin.exec(line);
      if (match) {
        runHeaders.push({
          lineNo,
          repoKey: active.repoKey,
          embeddedScope: active.embeddedScope
        });
        inRun = true;
        currentRunEnd = runEndRegex(active.runEndTemplate, match[1]);
        continue;
      }
    }

    if (active && inRun) {
      const key = `${runHeaders[runHeaders.length - 1].lineNo}:${active.repoKey}`;
      if (!runBodies.has(key)) {
        runBodies.set(key, []);
      }
      runBodies.get(key).push(lineNo);
    }
  }

  return { runHeaders, runBodies };
}

test('embeds run blocks based on prior shell in the same step', () => {
  const result = analyzeFixture('run-shell-mixed.yml');

  assert.deepEqual(
    result.runHeaders.map((h) => [h.lineNo, h.repoKey, h.embeddedScope]),
    [
      [13, 'shell-powershell', 'meta.embedded.block.powershell'],
      [25, 'shell-bash', 'meta.embedded.block.shellscript'],
      [38, 'shell-node', 'meta.embedded.block.javascript']
    ]
  );

  assert.deepEqual(result.runBodies.get('13:shell-powershell'), [14, 15, 16, 17, 18, 19, 20, 21]);
  assert.deepEqual(result.runBodies.get('25:shell-bash'), [26, 27, 28, 29, 30]);
  assert.deepEqual(result.runBodies.get('38:shell-node'), [39, 40, 41, 42]);
});

test('does not match when shell appears after run or shell is unknown', () => {
  const result = analyzeFixture('run-shell-mixed.yml');
  const runHeaderLines = result.runHeaders.map((h) => h.lineNo);

  assert.ok(!runHeaderLines.includes(32), 'run before shell should not be dynamically embedded');
  assert.ok(!runHeaderLines.includes(45), 'unknown shell should not be embedded');
});

test('supports quoted shell values with comments and ignores non-block run values', () => {
  const result = analyzeFixture('run-shell-edge-cases.yml');

  assert.deepEqual(
    result.runHeaders.map((h) => [h.repoKey, h.embeddedScope]),
    [['shell-powershell', 'meta.embedded.block.powershell']]
  );
});

test('run header regex captures YAML-like pieces for each shell context', () => {
  for (const ctx of compileTopLevelContexts()) {
    const rule = grammar.repository[ctx.repoKey].patterns[0];
    const match = new RegExp(rule.begin).exec('        run: |');

    assert.ok(match, `${ctx.repoKey} should match run header`);
    assert.equal(match[2], 'run');
    assert.equal(match[3], ': ');
    assert.equal(match[4], '|');
  }
});

test('shell header regex captures YAML-like pieces for each shell context', () => {
  const samples = {
    'shell-bash': '        shell: bash',
    'shell-powershell': '        shell: "pwsh" # explicit shell',
    'shell-cmd': '        shell: cmd',
    'shell-python': '        shell: python',
    'shell-node': "        shell: 'node'"
  };

  for (const ctx of compileTopLevelContexts()) {
    const rule = grammar.repository[ctx.repoKey];
    const match = new RegExp(rule.begin).exec(samples[ctx.repoKey]);

    assert.ok(match, `${ctx.repoKey} should match shell header`);
    assert.equal(match[2], 'shell');
    assert.equal(match[3], ': ');
  }
});

test('run header regex accepts valid block scalar modifiers and rejects invalid ones', () => {
  const ctx = compileTopLevelContexts()[0]; // shell-bash
  const runBegin = ctx.runBegin;

  for (const valid of ['|', '|-', '|+', '|2', '>-', '>+', '>2', '|-2', '|2-', '>+9', '>9+']) {
    assert.ok(runBegin.test(`        run: ${valid}`), `should match: run: ${valid}`);
  }
  for (const invalid of ['|0', '|+-', '|22', '|-+', '>0', '>-+', '>22']) {
    assert.ok(!runBegin.test(`        run: ${invalid}`), `should reject: run: ${invalid}`);
  }
});

test('run-shell grammar scope name matches the packaged contribution and schema pattern', () => {
  const scopeNamePattern = /^(text|source)(\.[\w0-9-]+)+$/;
  const contribution = packageJson.contributes.grammars.find(
    (entry) => entry.path === './syntaxes/github-actions-run-shell.injection.tmLanguage.json'
  );

  assert.ok(contribution, 'run-shell grammar should be contributed from package.json');
  assert.equal(grammar.scopeName, contribution.scopeName);
  assert.match(grammar.scopeName, scopeNamePattern);
});
