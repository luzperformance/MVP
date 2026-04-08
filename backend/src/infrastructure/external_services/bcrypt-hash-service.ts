import bcrypt from 'bcryptjs';
import { IHashService } from '../../application/ports/hash-service';

export class BcryptHashService implements IHashService {
  async hash(payload: string): Promise<string> {
    return await bcrypt.hash(payload, 12);
  }

  async compare(payload: string, hashed: string): Promise<boolean> {
    return await bcrypt.compare(payload, hashed);
  }
}
