import * as jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}

export class JwtHelpers {
  private static readonly ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret-key';
  private static readonly REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
  
  static generateAccessToken(payload: JwtPayload): string {
    const tokenPayload = { ...payload };
    return jwt.sign(tokenPayload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: '15m',  
    });
  }

  
  static generateRefreshToken(payload: JwtPayload): string {
    const tokenPayload = { ...payload };
    return jwt.sign(tokenPayload, this.REFRESH_TOKEN_SECRET, {
      expiresIn: '7d', 
    });
  }

  
  static generateTokens(payload: JwtPayload): { accessToken: string; refreshToken: string } {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }
   
  static verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.ACCESS_TOKEN_SECRET) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

   
  static verifyRefreshToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.REFRESH_TOKEN_SECRET) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  
  static extractTokenFromHeader(authHeader: string | undefined): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Authorization header missing or invalid');
    }
    return authHeader.substring(7);
  }
  
  static getTokenExpiry(token: string): Date {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      throw new Error('Invalid token');
    }
    return new Date(decoded.exp * 1000);
  }

   
  static isTokenExpiringSoon(token: string): boolean {
    try {
      const expiry = this.getTokenExpiry(token);
      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
      return expiry < fiveMinutesFromNow;
    } catch {
      return true;
    }
  }

   
  static createPayload(userId: number, email: string, role: string): JwtPayload {
    return { userId, email, role };
  }

   
  static isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    
    try {
      const parts = token.split('.');
      return parts.length === 3;
    } catch {
      return false;
    }
  }
}

export default JwtHelpers;
