
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

describe('Architecture: Read-Only Enforcement', () => {
    it('Should not export any ledger write methods', () => {
        // Simple string search implementation
        const searchDir = path.resolve(__dirname, '../src');
        // grep -r "appendEvent" src
        // We use a basic node walk or just trusted grep logic if available, but for portability let's read key files.
        // Actually, let's use a grep command via execSync for Fail-Loudness
        try {
            execSync('grep -r "appendEvent" src', { cwd: path.resolve(__dirname, '..') });
            throw new Error("Found Forbidden 'appendEvent'!");
        } catch (e: any) {
            // grep returns 1 if not found, which throws in execSync. That is SUCCESS.
            // If it returns 0 (found), it does not throw, so we manually throw.
            if (!e.message.includes("Command failed")) {
                throw new Error("Found Forbidden 'appendEvent'! " + e.message);
            }
        }
    });

    it('Should not contain POST calls to ledger', () => {
        try {
            execSync('grep -r "POST .*ledger" src', { cwd: path.resolve(__dirname, '..') });
            throw new Error("Found Forbidden POST to Ledger!");
        } catch (e: any) {
            if (!e.message.includes("Command failed")) {
                throw new Error("Found Forbidden POST to Ledger! " + e.message);
            }
        }
    });
});
