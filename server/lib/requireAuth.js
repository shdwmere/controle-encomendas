import { sessions } from './sessions.js';

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const session = token && sessions.get(token);

  if (!session) {
    return res.status(401).json({ erro: 'não autenticado' });
  }

  req.usuario = session;
  next();
}