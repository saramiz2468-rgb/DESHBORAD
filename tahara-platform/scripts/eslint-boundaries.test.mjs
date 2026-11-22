import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const cwd = path.resolve(import.meta.dirname, '..');
const eslint = new ESLint({ cwd });

async function ruleIds(code, filePath) {
  const [res] = await eslint.lintText(code, { filePath: path.join(cwd, filePath) });
  return res.messages.map((m) => m.ruleId);
}

describe('architecture boundaries (ESLint)', () => {
  it('admin app cannot import medical or halachic engines', async () => {
    expect(
      await ruleIds(
        "import x from '@tahara/core/halacha-engine';\nexport default x;\n",
        'apps/admin/src/x.ts',
      ),
    ).toContain('no-restricted-imports');
    expect(
      await ruleIds(
        "import x from '../../packages/core/medical-engine/index';\nexport default x;\n",
        'apps/admin/src/y.ts',
      ),
    ).toContain('no-restricted-imports');
  });

  it('medical and halachic engines cannot import each other', async () => {
    expect(
      await ruleIds(
        "import x from '../halacha-engine/rules';\nexport default x;\n",
        'packages/core/src/medical-engine/a.ts',
      ),
    ).toContain('no-restricted-imports');
    expect(
      await ruleIds(
        "import x from '../medical-engine/predict';\nexport default x;\n",
        'packages/core/src/halacha-engine/a.ts',
      ),
    ).toContain('no-restricted-imports');
  });

  it('forbids browser storage of personal data and GPS', async () => {
    const ids = await ruleIds(
      "export const a = () => { localStorage.setItem('k', 'v'); navigator.geolocation.getCurrentPosition(() => {}); };\n",
      'apps/web/src/z.ts',
    );
    expect(ids.filter((i) => i === 'no-restricted-syntax')).toHaveLength(2);
  });
});
