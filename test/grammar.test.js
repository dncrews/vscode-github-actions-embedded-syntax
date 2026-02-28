const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const grammar = JSON.parse(
  fs.readFileSync(
    path.join(root, 'syntaxes', 'github-actions-github-script.injection.tmLanguage.json'),
    'utf8'
  )
);

const outerRule = grammar.patterns[0];
const withRule = outerRule.patterns[0];
const scriptRule = withRule.patterns[0];

const outerBegin = new RegExp(outerRule.begin);
const outerEnd = new RegExp(outerRule.end);
const withBegin = new RegExp(withRule.begin);
const withEnd = new RegExp(withRule.end);
const scriptBegin = new RegExp(scriptRule.begin);
const githubScriptUsesLine = /uses\s*:\s*(?:"actions\/github-script(?:@[^"\s#]+)?"|'actions\/github-script(?:@[^'\s#]+)?'|actions\/github-script(?:@[^\s#]+)?)/;

function withEndRegex(indent) {
  return new RegExp(withRule.end.replace('\\1', indent.replace(/\\/g, '\\\\')));
}

function scriptEndRegex(indent) {
  return new RegExp(scriptRule.end.replace('\\1', indent.replace(/\\/g, '\\\\')));
}

function analyzeFixture(name) {
  const text = fs.readFileSync(path.join(root, 'test', 'fixtures', name), 'utf8');
  const lines = text.split(/\r?\n/);

  const scriptBodyLines = new Set();
  const scriptHeaderLines = new Set();
  const withHeaderLines = new Set();
  const githubScriptStepUsesLines = new Set();

  let inContext = false;
  let contextStartLine = null;
  let inWith = false;
  let currentWithEnd = null;
  let inScript = false;
  let currentScriptEnd = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const lineNo = i + 1;

    if (inContext && inScript && currentScriptEnd.test(line)) {
      inScript = false;
      currentScriptEnd = null;
    }

    if (inContext && inWith && !inScript && currentWithEnd.test(line)) {
      inWith = false;
      currentWithEnd = null;
    }

    if (inContext && lineNo !== contextStartLine && !inWith && !inScript && outerEnd.test(line)) {
      inContext = false;
      contextStartLine = null;
    }

    if (!inContext && outerBegin.test(line)) {
      inContext = true;
      contextStartLine = lineNo;
      if (githubScriptUsesLine.test(line)) {
        githubScriptStepUsesLines.add(lineNo);
      }
    }

    if (inContext && !inWith) {
      const match = withBegin.exec(line);
      if (match) {
        withHeaderLines.add(lineNo);
        inWith = true;
        currentWithEnd = withEndRegex(match[1]);
        continue;
      }
    }

    if (inContext && inWith && !inScript) {
      const match = scriptBegin.exec(line);
      if (match) {
        scriptHeaderLines.add(lineNo);
        inScript = true;
        currentScriptEnd = scriptEndRegex(match[1]);
        continue;
      }
    }

    if (inContext && inScript) {
      scriptBodyLines.add(lineNo);
      continue;
    }

  }

  return {
    lines,
    scriptBodyLines,
    scriptHeaderLines,
    withHeaderLines,
    githubScriptStepUsesLines
  };
}

test('matches github-script step and only embeds script block bodies', () => {
  const result = analyzeFixture('github-script-basic.yml');

  assert.deepEqual([...result.githubScriptStepUsesLines], [10, 29]);
  assert.deepEqual([...result.withHeaderLines], [11, 30]);
  assert.deepEqual([...result.scriptHeaderLines], [12, 31]);

  assert.ok(result.scriptBodyLines.has(13));
  assert.ok(result.scriptBodyLines.has(14));
  assert.ok(result.scriptBodyLines.has(20));
  assert.ok(result.scriptBodyLines.has(27));
  assert.ok(!result.scriptBodyLines.has(12), 'script header line should not be embedded');
  assert.ok(!result.scriptBodyLines.has(28), 'next mapping key should end the script block');

  assert.ok(result.scriptBodyLines.has(32));
  assert.ok(result.scriptBodyLines.has(35));
  assert.ok(!result.scriptBodyLines.has(36), 'next step should end folded script block');

  assert.ok(!result.scriptBodyLines.has(11), 'with line should not be embedded');
  assert.ok(!result.scriptBodyLines.has(10), 'uses line should not be embedded');
});

test('matches quoted github-script uses lines and allows header comments', () => {
  const result = analyzeFixture('github-script-comments.yml');

  assert.deepEqual([...result.githubScriptStepUsesLines], [9]);
  assert.deepEqual([...result.withHeaderLines], [10]);
  assert.deepEqual([...result.scriptHeaderLines], [11]);
  assert.ok(result.scriptBodyLines.has(12));
  assert.ok(!result.scriptBodyLines.has(9), 'quoted uses line should not be embedded');
  assert.ok(!result.scriptBodyLines.has(10), 'with line should not be embedded');
  assert.ok(!result.scriptBodyLines.has(11), 'script header line should not be embedded');
});

test('does not embed script blocks for non-github-script actions', () => {
  const result = analyzeFixture('non-github-script.yml');

  assert.deepEqual([...result.githubScriptStepUsesLines], []);
  assert.deepEqual([...result.withHeaderLines], []);
  assert.deepEqual([...result.scriptHeaderLines], []);
  assert.deepEqual([...result.scriptBodyLines], []);
});

test('matches slash-containing github-script refs and ignores non-with script keys', () => {
  const result = analyzeFixture('github-script-ref-and-nested-script.yml');

  assert.deepEqual([...result.githubScriptStepUsesLines], [7]);
  assert.deepEqual([...result.withHeaderLines], [14]);
  assert.deepEqual([...result.scriptHeaderLines], [15]);
  assert.deepEqual([...result.scriptBodyLines], [16]);
  assert.ok(!result.scriptHeaderLines.has(11), 'env.script should not be embedded');
  assert.ok(!result.scriptBodyLines.has(12), 'env.script body should remain plain YAML');
});

test('script header regex accepts valid block scalar modifiers and rejects invalid ones', () => {
  for (const valid of ['|', '|-', '|+', '|2', '>-', '>+', '>2', '|-2', '|2-']) {
    assert.ok(scriptBegin.test(`          script: ${valid}`), `should match: script: ${valid}`);
  }
  for (const invalid of ['|0', '|+-', '|22', '|-+', '>0', '>-+']) {
    assert.ok(!scriptBegin.test(`          script: ${invalid}`), `should reject: script: ${invalid}`);
  }
});

test('embeds script blocks with all valid block scalar modifiers', () => {
  const result = analyzeFixture('github-script-block-scalars.yml');

  // 6 steps with uses: actions/github-script
  assert.equal([...result.githubScriptStepUsesLines].length, 6);
  assert.equal([...result.scriptHeaderLines].length, 6);

  // All 6 script bodies should be detected
  assert.ok(result.scriptBodyLines.size > 0);

  // The blank-line-mid-body step should include the blank line
  // Line 32 is "const before = true;", 33 is blank, 34 is "const after = true;"
  assert.ok(result.scriptBodyLines.has(32));
  assert.ok(result.scriptBodyLines.has(33));
  assert.ok(result.scriptBodyLines.has(34));
});

test('script header regex preserves YAML-like capture groups', () => {
  const match = scriptBegin.exec('          script: |');

  assert.ok(match);
  assert.equal(match[2], 'script');
  assert.equal(match[3], ': ');
  assert.equal(match[4], '|');
});

test('uses header regex preserves YAML-like capture groups for github-script refs', () => {
  const match = outerBegin.exec('      - uses: actions/github-script@feature/foo');

  assert.ok(match);
  assert.equal(match[2], 'uses');
  assert.equal(match[3], ': ');
  assert.equal(match[4], 'actions/github-script@feature/foo');
});

test('matches versionless and single-quoted uses variants', () => {
  const result = analyzeFixture('github-script-uses-variants.yml');

  assert.equal([...result.githubScriptStepUsesLines].length, 3);
  assert.equal([...result.scriptHeaderLines].length, 3);
  assert.ok(result.scriptBodyLines.has(12), 'versionless uses body should be embedded');
  assert.ok(result.scriptBodyLines.has(16), 'single-quoted uses body should be embedded');
  assert.ok(result.scriptBodyLines.has(20), 'standard uses body should be embedded');
});

test('grammar scope names use a valid TextMate source prefix', () => {
  const scopeNamePattern = /^(text|source)(\.[\w0-9-]+)+$/;
  const contributedScopes = packageJson.contributes.grammars.map((entry) => entry.scopeName);

  assert.match(grammar.scopeName, scopeNamePattern);
  assert.ok(contributedScopes.includes(grammar.scopeName));
  for (const scopeName of contributedScopes) {
    assert.match(scopeName, scopeNamePattern);
  }
});
