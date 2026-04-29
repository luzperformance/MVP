import { AlertRepository } from '../repositories/AlertRepository';

export interface Alert {
  id: string;
  type: 'patient_inactive' | 'contract_expiring' | 'exam_overdue' | 'lead_hot_no_followup' | 'payment_overdue' | 'consultation_today';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  entity_type: 'patient' | 'lead';
  entity_id: string;
  entity_name: string;
  action_url: string;
  created_at: string;
  data?: Record<string, unknown>;
}

export class AlertService {
  constructor(private alertRepository: AlertRepository) {}

  async getActiveAlerts(): Promise<Alert[]> {
    const alerts: Alert[] = [];
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    // 1. Inactive Patients
    const inactives = await this.alertRepository.getInactivePatients();
    inactives.forEach(p => {
      const days = Math.floor((now.getTime() - new Date(p.last_consultation).getTime()) / 86400000);
      alerts.push({
        id: `inactive-${p.id}`,
        type: 'patient_inactive',
        severity: days > 90 ? 'high' : 'medium',
        title: 'Paciente inativo',
        description: `${p.name} não tem consulta há ${days} dias`,
        entity_type: 'patient',
        entity_id: p.id,
        entity_name: p.name,
        action_url: `/patients/${p.id}`,
        created_at: now.toISOString(),
        data: { days_inactive: days, package_type: p.package_type },
      });
    });

    // 2. Expiring Contracts
    const expiring = await this.alertRepository.getExpiringContracts();
    expiring.forEach(p => {
      const daysLeft = Math.ceil((new Date(p.contract_end).getTime() - now.getTime()) / 86400000);
      alerts.push({
        id: `contract-${p.id}`,
        type: 'contract_expiring',
        severity: daysLeft <= 3 ? 'critical' : daysLeft <= 7 ? 'high' : 'medium',
        title: 'Contrato vencendo',
        description: `Contrato de ${p.name} vence em ${daysLeft} dias`,
        entity_type: 'patient',
        entity_id: p.id,
        entity_name: p.name,
        action_url: `/gestao`,
        created_at: now.toISOString(),
        data: { days_left: daysLeft, contract_end: p.contract_end, monthly_value: p.monthly_value },
      });
    });

    // 3. Overdue Exams
    const overdueExams = await this.alertRepository.getOverdueExams();
    overdueExams.forEach(p => {
      const days = Math.floor((now.getTime() - new Date(p.last_exam).getTime()) / 86400000);
      alerts.push({
        id: `exam-${p.id}`,
        type: 'exam_overdue',
        severity: days > 180 ? 'high' : 'medium',
        title: 'Exame desatualizado',
        description: `${p.name} não faz exames há ${days} dias`,
        entity_type: 'patient',
        entity_id: p.id,
        entity_name: p.name,
        action_url: `/patients/${p.id}/exams`,
        created_at: now.toISOString(),
        data: { days_since_exam: days, last_exam: p.last_exam },
      });
    });

    // 4. Hot Leads No Followup
    const hotLeads = await this.alertRepository.getHotLeadsNoFollowup();
    hotLeads.forEach(l => {
      const days = l.last_activity_at
        ? Math.floor((now.getTime() - new Date(l.last_activity_at).getTime()) / 86400000)
        : null;
      alerts.push({
        id: `lead-${l.id}`,
        type: 'lead_hot_no_followup',
        severity: l.temperature === 'quente' ? 'high' : 'medium',
        title: `Lead ${l.temperature} sem contato`,
        description: days ? `${l.name} sem atividade há ${days} dias` : `${l.name} nunca foi contatado`,
        entity_type: 'lead',
        entity_id: l.id,
        entity_name: l.name,
        action_url: `/crm/leads/${l.id}`,
        created_at: now.toISOString(),
        data: { temperature: l.temperature, days_inactive: days, expected_value: l.expected_value },
      });
    });

    // 5. Overdue Payments
    const overduePayments = await this.alertRepository.getOverduePayments();
    overduePayments.forEach(p => {
      const days = Math.floor((now.getTime() - new Date(p.payment_date).getTime()) / 86400000);
      alerts.push({
        id: `payment-${p.id}`,
        type: 'payment_overdue',
        severity: days > 7 ? 'high' : 'medium',
        title: 'Pagamento atrasado',
        description: `${p.name} com pagamento atrasado há ${days} dias`,
        entity_type: 'patient',
        entity_id: p.id,
        entity_name: p.name,
        action_url: `/gestao`,
        created_at: now.toISOString(),
        data: { days_overdue: days, monthly_value: p.monthly_value },
      });
    });

    // 6. Consultations Today
    const consultations = await this.alertRepository.getConsultationsToday(today);
    consultations.forEach(p => {
      alerts.push({
        id: `today-${p.id}`,
        type: 'consultation_today',
        severity: 'low',
        title: 'Consulta hoje',
        description: `${p.name} tem consulta agendada para hoje`,
        entity_type: 'patient',
        entity_id: p.id,
        entity_name: p.name,
        action_url: `/patients/${p.id}`,
        created_at: now.toISOString(),
      });
    });

    // Sort by severity
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return alerts;
  }

  async getAlertSummary() {
    const alerts = await this.getActiveAlerts();
    const byType: Record<string, number> = {
      patient_inactive: 0,
      contract_expiring: 0,
      exam_overdue: 0,
      lead_hot_no_followup: 0,
      payment_overdue: 0,
      consultation_today: 0,
    };

    let critical = 0;
    let high = 0;

    alerts.forEach(a => {
      byType[a.type]++;
      if (a.severity === 'critical') critical++;
      if (a.severity === 'high') high++;
    });

    return {
      total: alerts.length,
      critical,
      high,
      by_type: byType
    };
  }
}
