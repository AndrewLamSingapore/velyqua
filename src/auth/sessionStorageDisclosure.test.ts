import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('authentication session storage disclosure', () => {
  it('keeps the public policy aligned with native and web adapters', () => {
    const client = read('src/cloud/supabase.ts');
    const native = read('src/auth/secureSessionStorage.ts');
    const web = read('src/auth/secureSessionStorage.web.ts');
    const policy = read('PRIVACY.md');

    expect(client).toContain('storage: secureSessionStorage');
    expect(client).toContain('persistSession: true');
    expect(native).toContain("from 'expo-secure-store'");
    expect(native).toContain('SecureStore.setItemAsync');
    expect(web).toContain("from '@react-native-async-storage/async-storage'");
    expect(web).toContain('AsyncStorage.setItem');
    expect(policy).toContain('native iOS and Android clients use Expo SecureStore');
    expect(policy).toContain('web client persists authentication sessions through AsyncStorage in browser storage');
    expect(policy).toContain('does not encrypt those browser-held tokens');
  });
});
