import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../database/db.js';
import { config } from '../config/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    const validated = registerSchema.parse(req.body);
    const existing = await db.findUserByEmail(validated.email);
    if (existing) {
      res.status(409).json({ success: false, error: 'User with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);
    const user = await db.createUser({
      email: validated.email,
      passwordHash,
      name: validated.name,
      role: 'USER',
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  }

  static async login(req: Request, res: Response): Promise<void> {
    const validated = loginSchema.parse(req.body);
    const user = await db.findUserByEmail(validated.email);
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const validPassword = await bcrypt.compare(validated.password, user.passwordHash);
    if (!validPassword) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    await db.createAuditLog({
      userId: user.id,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  }

  static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId || 'user-default-admin-01';
    const user = await db.findUserById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  }
}
