import { AuthenticateDoctorUseCase } from '../../../application/use_cases/authenticate-doctor';
import { IDoctorRepository } from '../../../domain/repositories/doctor-repository';
import { IHashService } from '../../../application/ports/hash-service';
import { Doctor } from '../../../domain/entities/doctor';
import { UnauthorizedError } from '../../../shared/errors/app-error';

describe('AuthenticateDoctorUseCase', () => {
  let doctorRepository: jest.Mocked<IDoctorRepository>;
  let hashService: jest.Mocked<IHashService>;
  let authenticateDoctorUseCase: AuthenticateDoctorUseCase;

  beforeEach(() => {
    doctorRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    hashService = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    authenticateDoctorUseCase = new AuthenticateDoctorUseCase(doctorRepository, hashService);
  });

  it('should authenticate a doctor with valid credentials', async () => {
    const doctor = new Doctor({
      id: 1,
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      name: 'Dr. Test',
      crm: '12345',
    });

    doctorRepository.findByEmail.mockResolvedValue(doctor);
    hashService.compare.mockResolvedValue(true);

    const result = await authenticateDoctorUseCase.execute({
      email: 'test@example.com',
      passwordHash: 'plain_password',
    });

    expect(result.doctor.email).toBe('test@example.com');
    expect(doctorRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(hashService.compare).toHaveBeenCalledWith('plain_password', 'hashed_password');
  });

  it('should throw UnauthorizedError if doctor is not found', async () => {
    doctorRepository.findByEmail.mockResolvedValue(null);

    await expect(
      authenticateDoctorUseCase.execute({
        email: 'wrong@example.com',
        passwordHash: 'any',
      })
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should throw UnauthorizedError if password is invalid', async () => {
    const doctor = new Doctor({
      id: 1,
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      name: 'Dr. Test',
      crm: '12345',
    });

    doctorRepository.findByEmail.mockResolvedValue(doctor);
    hashService.compare.mockResolvedValue(false);

    await expect(
      authenticateDoctorUseCase.execute({
        email: 'test@example.com',
        passwordHash: 'wrong_password',
      })
    ).rejects.toThrow(UnauthorizedError);
  });
});
