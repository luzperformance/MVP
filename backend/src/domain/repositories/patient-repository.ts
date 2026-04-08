import { Patient } from '../entities/patient';

export interface IPatientRepository {
  findById(id: string): Promise<Patient | null>;
  findAll(): Promise<Patient[]>;
  save(patient: Patient): Promise<void>;
  update(patient: Patient): Promise<void>;
  delete(id: string): Promise<void>;
}
