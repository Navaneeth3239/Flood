// Node script to detect missing, orphaned, or unbalanced i18n keys across en, ta, hi, and ml (ES module)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');
const languages = ['en', 'ta', 'hi', 'ml'];

function flattenKeys(obj, prefix = '') {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys = keys.concat(flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

console.log('🔍 Checking i18n key consistency across languages...\n');

const data = {};
const keySets = {};

for (const lang of languages) {
  const filePath = path.join(localesDir, `${lang}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing file: ${filePath}`);
    process.exit(1);
  }
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  data[lang] = content;
  keySets[lang] = new Set(flattenKeys(content));
  console.log(`✓ Loaded ${lang}.json: ${keySets[lang].size} keys`);
}

const baseKeys = Array.from(keySets['en']);
let hasError = false;

for (const lang of ['ta', 'hi', 'ml']) {
  const missing = baseKeys.filter((k) => !keySets[lang].has(k));
  const extra = Array.from(keySets[lang]).filter((k) => !keySets['en'].has(k));

  if (missing.length > 0) {
    console.error(`\n❌ [${lang}] Missing ${missing.length} keys found in 'en':`);
    missing.forEach((k) => console.error(`   - ${k}`));
    hasError = true;
  }

  if (extra.length > 0) {
    console.warn(`\n⚠️  [${lang}] Found ${extra.length} extra keys not in 'en':`);
    extra.forEach((k) => console.warn(`   + ${k}`));
  }

  if (missing.length === 0 && extra.length === 0) {
    console.log(`✅ [${lang}] 100% key parity with English (${keySets[lang].size}/${baseKeys.length} keys match)`);
  }
}

if (hasError) {
  console.error('\n❌ i18n check FAILED: resolve missing keys.');
  process.exit(1);
} else {
  console.log('\n🎉 All languages have complete, matching translations!');
  process.exit(0);
}
