import { z } from 'zod';

export const APP_DNA = {
  brand: { name: 'PROVENIQ', version: 'v1.0-SOVEREIGN' },
  theme: { active: 'slate-950', accent: 'emerald-500', danger: 'red-500' },
  routes: [
    { id: 'nexus', label: 'COMMAND', path: '/nexus' },
    { id: 'sentinels', label: 'SENTINELS', path: '/sentinels' },
    { id: 'intelligence', label: 'ENTITY_GRAPH', path: '/intelligence' }
  ],
  security: {
    maxOutflowLimit: 1000000,
    yubiKeyRequired: true
  }
};

export const DNASchema = z.object({
  security: z.object({ maxOutflowLimit: z.number() })
});
