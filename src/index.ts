export * from './genome/types';
export * from './genome/genome.engine';

export * from './provenance/types';
export * from './provenance/provenance.engine';

export * from './identity/types';
export * from './identity/identity.engine';

import { genomeEngine } from './genome/genome.engine';
import { provenanceEngine } from './provenance/provenance.engine';
import { identityEngine } from './identity/identity.engine';

/**
 * PROVENIQ CORE
 * The Single Source of Truth for Physical Asset Reality.
 */
export const ProveniqCore = {
  Genome: genomeEngine,
  Provenance: provenanceEngine,
  Identity: identityEngine
};
