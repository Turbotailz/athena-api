import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import semver from 'semver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const PACKAGE_PATH = path.join(ROOT_DIR, 'package.json');
const PATCHES_PATH = path.join(DATA_DIR, 'patches.json');

interface Patch {
    version: string;
    release_date: string;
}

interface PackageJson {
    version: string;
    [key: string]: any;
}

// Helper to clean version strings from stadium data
// Examples: "Patch: 2.20.0.0\n", "2.19.1.0", "2.17.1"
function cleanVersion(raw: string): string | null {
    // Remove "Patch: " prefix and whitespace
    let v = raw.replace(/^Patch:\s*/i, '').trim();
    
    // Remove build numbers (4th component) if present
    // e.g. 2.16.1.0.555555 -> 2.16.1
    // e.g. 2.20.0.0 -> 2.20.0
    const parts = v.split('.');
    if (parts.length > 3) {
        v = parts.slice(0, 3).join('.');
    }
    
    // Validate with semver
    return semver.valid(v);
}

async function main() {
    console.log('Syncing version...');

    // 1. Read Package Version
    const pkg = JSON.parse(await fs.readFile(PACKAGE_PATH, 'utf-8')) as PackageJson;
    const currentVersion = pkg.version;
    console.log(`Current Package Version: ${currentVersion}`);

    // 2. Read Game Version (latest patch)
    // We assume patches.json is already sorted desc by date/id from the fetch script
    const patches = JSON.parse(await fs.readFile(PATCHES_PATH, 'utf-8')) as Patch[];
    if (!patches.length) {
        console.error('No patches found!');
        process.exit(1);
    }

    // Find the latest valid semver patch
    let gameVersion: string | null = null;
    for (const p of patches) {
        const cleaned = cleanVersion(p.version);
        if (cleaned) {
            gameVersion = cleaned;
            break;
        }
    }

    if (!gameVersion) {
        console.error('Could not determine latest game version from patches.json');
        process.exit(1);
    }
    console.log(`Latest Game Version:     ${gameVersion}`);

    // 3. Determine New Version
    // Strategy: 
    // - If Game > Package: Jump to Game Version (New Season/Patch)
    // - If Game <= Package: Increment Patch (Hotfix)
    
    let newVersion: string;

    if (semver.gt(gameVersion, currentVersion)) {
        console.log('Game version is ahead. Updating to match game version.');
        newVersion = gameVersion;
    } else {
        console.log('Package is equal or ahead (hotfix mode). Incrementing patch version.');
        newVersion = semver.inc(currentVersion, 'patch')!;
    }

    console.log(`New Target Version:      ${newVersion}`);

    // 4. Update package.json if changed
    if (newVersion !== currentVersion) {
        pkg.version = newVersion;
        await fs.writeFile(PACKAGE_PATH, JSON.stringify(pkg, null, 2) + '\n'); // Maintain trailing newline
        console.log(`Updated package.json to ${newVersion}`);
    } else {
        console.log('No version change needed.');
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});

