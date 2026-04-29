import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRepository } from '../repositories/AuthRepository';
import { DoctorEntity } from '../entities/Doctor';

export class AuthService {
  constructor(private authRepo: AuthRepository) {}

  async authenticate(email: string, password: string): Promise<{ token: string; doctor: any } | null> {
    const doctor = await this.authRepo.findByEmail(email);
    if (!doctor) return null;

    const valid = await bcrypt.compare(password, doctor.password_hash || '');
    if (!valid) return null;

    const token = jwt.sign(
      { doctorId: doctor.id, email: doctor.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '8h' }
    );

    const usePg = process.env.USE_PG === 'true';

    return {
      token,
      doctor: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        crm: doctor.crm,
        can_access_records: usePg ? !!doctor.can_access_records : (doctor as any).can_access_records === 1,
        can_edit_agenda: usePg ? !!doctor.can_edit_agenda : (doctor as any).can_edit_agenda === 1
      }
    };
  }

  async register(data: { email: string; password_hash: string; name: string; crm: string }): Promise<void> {
    const hash = await bcrypt.hash(data.password_hash, 12);
    await this.authRepo.create({ ...data, password_hash: hash });
  }
}
