import { Record as SharedRecord } from '../../../../shared/types';

export interface RecordEntity extends SharedRecord {
  // Add backend-only fields if any
  raw_input?: string;
  soap_subjective?: string;
  soap_objective?: string;
  soap_assessment?: string;
  soap_plan?: string;
}
