import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../types';
import { auditLogger } from '../utils/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    auditLogger.logSecurityEvent(
      'MISSING_TOKEN',
      undefined,
      req.ip,
      { endpoint: req.path }
    );
    res.status(401).json({
      success: false,
      message: 'Token de acesso requerido'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    auditLogger.logSecurityEvent(
      'INVALID_TOKEN',
      undefined,
      req.ip,
      { 
        endpoint: req.path,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    );
    
    res.status(403).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

export const generateToken = (payload: { userId: string; email: string }): string => {
  if (!config.jwt.secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  
  const secret: string = config.jwt.secret;
  
  return jwt.sign(payload, secret, {
    expiresIn: config.jwt.expiresIn,
  } as any);
};
