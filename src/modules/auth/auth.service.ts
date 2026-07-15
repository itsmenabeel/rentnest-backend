import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Role, User } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { RegisterBody, LoginBody } from './auth.validation';

function signToken(payload: { id: string; role: Role }) {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

function sanitizeUser(user: User) {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export const authService = {
  async register(input: RegisterBody) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw ApiError.conflict('An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: hashedPassword,
        phone: input.phone,
        role: input.role as Role,
      },
    });

    const token = signToken({ id: user.id, role: user.role });

    return { user: sanitizeUser(user), token };
  },

  async login(input: LoginBody) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.status === 'BANNED') {
      throw ApiError.forbidden('This account has been banned');
    }

    const isMatch = await bcrypt.compare(input.password, user.password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const token = signToken({ id: user.id, role: user.role });

    return { user: sanitizeUser(user), token };
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return sanitizeUser(user);
  },
};
