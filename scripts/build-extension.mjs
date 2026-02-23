import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

async function readJsonIfExists(p) {
  try {
    const txt = await fs.readFile(p, 'utf8');
    return JSON.parse(txt);
  } catch (e) {
    if (e?.code === 'ENOENT') return null;
    throw e;
  }
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function copyFile(src, dst) {
  await ensureDir(path.dirname(dst));
  await fs.copyFile(src, dst);
}

function validateTrialTokens(local) {
  if (!local) return [];
  const tokens = local.trial_tokens;
  if (!tokens) return [];
  if (!Array.isArray(tokens) || tokens.some((t) => typeof t !== 'string')) {
    throw new Error('manifest.local.json: "trial_tokens" must be an array of strings');
  }
  return tokens;
}

async function main() {
  const baseManifestPath = path.join(rootDir, 'manifest.json');
  const localManifestPath = path.join(rootDir, 'manifest.local.json');

  const baseManifest = await readJsonIfExists(baseManifestPath);
  if (!baseManifest) {
    throw new Error('manifest.json not found in repo root');
  }

  const localManifest = await readJsonIfExists(localManifestPath);
  const trialTokens = validateTrialTokens(localManifest);

  const outManifest = {
    ...baseManifest,
    // Always override trial_tokens from local file.
    trial_tokens: trialTokens
  };

  await ensureDir(distDir);

  // Write manifest.json for dist
  await fs.writeFile(
    path.join(distDir, 'manifest.json'),
    JSON.stringify(outManifest, null, 2) + '\n',
    'utf8'
  );

  // Copy runtime files needed by manifest/sidepanel
  const filesToCopy = [
    'background.js',
    'sidepanel.html',
    'sidepanel.css',
    'sidepanel.js'
  ];

  for (const rel of filesToCopy) {
    await copyFile(path.join(rootDir, rel), path.join(distDir, rel));
  }

  console.log(`Built extension into ${distDir}`);
  console.log(
    `trial_tokens: ${
      trialTokens.length
        ? 'set (from manifest.local.json)'
        : 'EMPTY (no manifest.local.json or no trial_tokens)'
    }`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
