const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const grammar = JSON.parse(
  fs.readFileSync(
    path.join(root, 'syntaxes', 'github-actions-github-script.injection.tmLanguage.json'),
    'utf8'
  )
);

const outerRule = grammar.patterns[0];
const scriptRule = outerRule.patterns[0];

const outerBegin = new RegExp(outerRule.begin);
const outerEnd = new RegExp(outerRule.end);
const scriptBegin = new RegExp(scriptRule.begin);

function scriptEndRegex(indent) {
  return new RegExp(scriptRule.end.replace('\\1', indent.replace(/\\/g, '\\\\')));
}

function analyzeFixture(name) {
  const text = fs.readFileSync(path.join(root, 'test', 'fixtures', name), 'utf8');
  const lines = text.split(/\r?\n/);

  const scriptBodyLines = new Set();
  const scriptHeaderLines = new Set();
  const githubScriptStepUsesLines = new Set();

  let inContext = false;
  let inScript = false;
  let currentScriptEnd = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const lineNo = i + 1;

    if (inContext && !inScript && outerEnd.test(line)) {
      inContext = false;
    }

    if (!inContext && outerBegin.test(line)) {
      inContext = true;
      if (/uses\s*:\s*actions\/github-script\b/.test(line)) {
        githubScriptStepUsesLines.add(lineNo);
      }
    }

    if (inContext && inScript && currentScriptEnd.test(line)) {
      inScript = false;
      currentScriptEnd = null;
    }

    if (inContext && !inScript) {
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
    githubScriptStepUsesLines
  };
}

test('matches github-script step and only embeds script block bodies', () => {
  const result = analyzeFixture('github-script-basic.yml');

  assert.deepEqual([...result.githubScriptStepUsesLines], [10, 29]);
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

test('does not embed script blocks for non-github-script actions', () => {
  const result = analyzeFixture('non-github-script.yml');

  assert.deepEqual([...result.githubScriptStepUsesLines], []);
  assert.deepEqual([...result.scriptHeaderLines], []);
  assert.deepEqual([...result.scriptBodyLines], []);
});

test('script header regex preserves YAML-like capture groups', () => {
  const match = scriptBegin.exec('          script: |');

  assert.ok(match);
  assert.equal(match[2], 'script');
  assert.equal(match[3], ': ');
  assert.equal(match[4], '|');
});
