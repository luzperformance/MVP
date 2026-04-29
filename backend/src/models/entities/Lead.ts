import { Lead, LeadActivity } from '../../../../shared/types';

export interface LeadEntity extends Lead {
  patient_id?: string;
  deleted_at?: string;
  score?: number;
  score_reasoning?: string;
  scored_at?: string;
  lost_reason?: string;
}

export interface ActivityEntity extends LeadActivity {
  lead_id: string;
}
