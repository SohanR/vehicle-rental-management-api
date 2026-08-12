import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError } from '../errors';
import type { StaffRepository } from '../repositories/staff.repository';
import type { AuthenticatedStaff, LoginResult } from '../types/staff';

export class AuthService {
  constructor(private readonly staffRepository: StaffRepository) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const staff = await this.staffRepository.findByEmail(normalizedEmail);

    if (!staff || !(await bcrypt.compare(password, staff.password_hash))) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const authenticatedStaff: AuthenticatedStaff = {
      id: staff.id,
      email: staff.email,
      name: staff.name,
    };
    const token = jwt.sign(authenticatedStaff, env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: '8h',
      subject: String(staff.id),
    });

    return { token, tokenType: 'Bearer', staff: authenticatedStaff };
  }
}
