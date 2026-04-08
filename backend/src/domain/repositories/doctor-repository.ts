import { Doctor } from '../entities/doctor';

export interface IDoctorRepository {
  findByEmail(email: string): Promise<Doctor | null>;
  findById(id: number): Promise<Doctor | null>;
  save(doctor: Doctor): Promise<void>;
  update(doctor: Doctor): Promise<void>;
  delete(id: number): Promise<void>;
}
