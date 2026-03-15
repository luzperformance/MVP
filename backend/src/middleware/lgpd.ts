import { Request, Response, NextFunction } from 'express';
import { getDb } from '../db/database';

// LGPD middleware: registra acesso a recursos sensíveis automaticamente
export function lgpdMiddleware(req: Request, res: Response, next: NextFunction) {
  const patientId = req.params?.patientId || req.params?.id;
  const method = req.method;

  // Mapeamento método HTTP → ação LGPD
  const actionMap: Record<string, string> = {
    GET: 'READ',
    POST: 'WRITE',
    PUT: 'UPDATE',
    PATCH: 'UPDATE',
    DELETE: 'DELETE',
  };

  const action = actionMap[method] || method;

  // Só loga requisições a dados de pacientes
  if (req.path.includes('/patients') && patientId) {
    try {
      const db = getDb();
      db.prepare(
        'INSERT INTO audit_log (action, entity, entity_id, patient_id, ip, user_agent, details) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(
        action,
        'patient_data',
        patientId,
        patientId,
        req.ip,
        req.get('user-agent') || '',
        `${method} ${req.originalUrl}`
      );
    } catch {
      // Não bloquear a requisição por erro de audit
    }
  }

  next();
}
