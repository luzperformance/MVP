import { IDoctorRepository } from '../../domain/repositories/doctor-repository';
import { UnauthorizedError } from '../../shared/errors/app-error';
import { IHashService } from '../ports/hash-service';

export interface AuthenticateDoctorRequest {
  email: string;
  passwordHash: string; // Plain text from request
}

export interface AuthenticateDoctorResponse {
  doctor: {
    id: number;
    email: string;
    name: string;
    isAdmin: boolean;
  };
}

export class AuthenticateDoctorUseCase {
  constructor(
    private doctorRepository: IDoctorRepository,
    private hashService: IHashService
  ) {}

  async execute(request: AuthenticateDoctorRequest): Promise<AuthenticateDoctorResponse> {
    const doctor = await this.doctorRepository.findByEmail(request.email);

    if (!doctor) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await this.hashService.compare(request.passwordHash, doctor.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    return {
      doctor: {
        id: doctor.id!,
        email: doctor.email,
        name: doctor.name,
        isAdmin: doctor.isAdmin,
      },
    };
  }
}
