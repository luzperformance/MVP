import { Doctor } from '../../../domain/entities/doctor';

describe('Doctor Entity', () => {
  it('should create a doctor with default values', () => {
    const doctor = new Doctor({
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      name: 'Dr. Test',
      crm: '12345',
    });

    expect(doctor.isAdmin).toBe(false);
    expect(doctor.canAccessRecords).toBe(true);
    expect(doctor.role).toBe('doctor');
  });

  it('should allow updating password', () => {
    const doctor = new Doctor({
      email: 'test@example.com',
      passwordHash: 'old_hash',
      name: 'Dr. Test',
      crm: '12345',
    });

    doctor.updatePassword('new_hash');
    expect(doctor.passwordHash).toBe('new_hash');
  });
});
