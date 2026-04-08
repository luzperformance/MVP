import { IPatientRepository } from '../../domain/repositories/patient-repository';

export interface PatientListItemDTO {
  id: string;
  name: string;
  mgmtStatus: string;
}

export class ListPatientsUseCase {
  constructor(private patientRepository: IPatientRepository) {}

  async execute(): Promise<PatientListItemDTO[]> {
    const patients = await this.patientRepository.findAll();
    return patients.map(p => ({
      id: p.id,
      name: p.name,
      mgmtStatus: p.mgmtStatus,
    }));
  }
}
