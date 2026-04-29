import { Doctor } from '../../../../shared/types';

export interface DoctorEntity extends Doctor {
  password_hash: string;
}
