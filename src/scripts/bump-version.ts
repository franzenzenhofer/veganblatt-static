#!/usr/bin/env tsx
import { VersionManager } from '../utils/version';

async function bumpVersion() {
  const versionManager = new VersionManager();
  const newVersion = await versionManager.incrementVersion();
  console.log(`✅ Version updated to ${newVersion}`);
}

bumpVersion();