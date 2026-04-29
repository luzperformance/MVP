import { Patient } from '../../../../shared/types';

export interface PatientEntity extends Patient {
  // Add backend-only fields if any
  cpf_encrypted?: string;
  deleted_at?: string;
  mgmt_data?: any;
  lgpd_consent_ip?: string;
}
