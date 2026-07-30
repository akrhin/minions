import type { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Auth disabled if env vars not set
  const user = process.env.MINIONS_USER;
  const pass = process.env.MINIONS_PASSWORD;
  if (!user || !pass) return next();

  const header = req.headers.authorization;
  if (!header || !header.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Minions"');
    res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
    return;
  }

  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf-8');
  const colon = decoded.indexOf(':');
  if (colon === -1 || decoded.slice(0, colon) !== user || decoded.slice(colon + 1) !== pass) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Minions"');
    res.status(401).json({ error: 'Invalid credentials', code: 'AUTH_INVALID' });
    return;
  }

  next();
}
