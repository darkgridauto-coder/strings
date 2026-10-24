import { prisma } from '@/lib/db';

const DEFAULTS: Record<string, string> = {
  signups: '1', posting: '1', verif: '1', pro: '1', banner: '',
};

export async function getPlatformFlags(): Promise<Record<string, string>> {
  try {
    const rows = await prisma.platformSetting.findMany();
    const map = { ...DEFAULTS };
    rows.forEach(r => { map[r.key] = r.value; });
    return map;
  } catch { return DEFAULTS; }
}

export async function isEnabled(key: string): Promise<boolean> {
  const flags = await getPlatformFlags();
  return flags[key] === '1';
}
