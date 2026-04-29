import { PatientRepository } from '../repositories/PatientRepository';
import { PatientEntity } from '../entities/Patient';
import { v4 as uuidv4 } from 'uuid';

export class PatientService {
  constructor(private patientRepo: PatientRepository) {}

  async getAllPatients(query?: string): Promise<PatientEntity[]> {
    return this.patientRepo.findAll(query);
  }

  async getPatientById(id: string): Promise<PatientEntity | null> {
    return this.patientRepo.findById(id);
  }

  async createPatient(data: Partial<PatientEntity>, ip: string): Promise<PatientEntity> {
    const id = uuidv4();
    const finalMgmtData = {
      status: 'ativo',
      origin: null,
      first_consultation: null,
      last_consultation: null,
      uses_ea: false,
      wants_children: false,
      ...(data.mgmt_data || {})
    };

    const patientData = {
      ...data,
      id,
      lgpd_consent_ip: ip,
      mgmt_data: finalMgmtData
    };

    return this.patientRepo.create(patientData);
  }

  async updatePatient(id: string, data: Partial<PatientEntity>): Promise<PatientEntity | null> {
    return this.patientRepo.update(id, data);
  }

  async deletePatient(id: string): Promise<void> {
    return this.patientRepo.delete(id);
  }
}
