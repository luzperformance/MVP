import { LeadRepository } from '../repositories/LeadRepository';
import { v4 as uuidv4 } from 'uuid';
import { scoreLeadWithAI, scoreLeadRuleBased } from '../../services/leadScoring';
import { getDb } from '../repositories/Database';

export class LeadService {
  constructor(private leadRepo: LeadRepository) {}

  async getLeads(filters: any) {
    return this.leadRepo.find(filters);
  }

  async getSummary() {
    return this.leadRepo.getSummary();
  }

  async createLead(data: any) {
    return this.leadRepo.create(data);
  }

  async captureLead(data: any) {
    const { email, phone, name } = data;
    let existing = null;
    
    if (email) existing = await this.leadRepo.findByEmail(email);
    if (!existing && phone) existing = await this.leadRepo.findByPhone(phone);
    
    if (existing) {
      await this.leadRepo.update(existing.id, { 
        last_activity_at: new Date().toISOString() 
      }, existing.status);
      
      await this.leadRepo.createActivity({
        lead_id: existing.id,
        type: 'outro',
        description: 'Lead capturado novamente via landing page.'
      });
      
      return { id: existing.id, created: false };
    } else {
      const lead = await this.leadRepo.create({
        ...data,
        status: 'novo',
        temperature: 'morno'
      });
      
      await this.leadRepo.createActivity({
        lead_id: lead.id,
        type: 'outro',
        description: 'Lead capturado via landing page.'
      });
      
      return { id: lead.id, created: true };
    }
  }

  async updateLead(id: string, data: any) {
    const existing = await this.leadRepo.findById(id);
    if (!existing) throw new Error('Lead não encontrado.');
    return this.leadRepo.update(id, data, existing.status);
  }

  async deleteLead(id: string) {
    return this.leadRepo.softDelete(id);
  }

  async convertLead(id: string, birthDate: string, lgpdIp: string) {
    const existing = await this.leadRepo.findById(id);
    if (!existing) throw new Error('Lead não encontrado.');
    if (existing.status === 'convertido') throw new Error('Lead já foi convertido.');

    const patientId = uuidv4();
    await this.leadRepo.convertToPatient(id, patientId, birthDate, lgpdIp);
    
    const lead = await this.leadRepo.findById(id);
    const db = getDb();
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);

    return { lead, patient };
  }

  async scoreLead(id: string, useAi = true) {
    const lead = await this.leadRepo.findById(id);
    if (!lead) throw new Error('Lead não encontrado.');

    const db = getDb();
    const activitiesCount = (db.prepare('SELECT COUNT(*) as c FROM lead_activities WHERE lead_id = ?').get(id) as any).c;
    const daysSinceCreation = Math.floor((Date.now() - new Date(lead.created_at!).getTime()) / 86400000);

    let score: number;
    let reasoning: string;
    let suggestedTemp: string | undefined;
    let nextAction: string | undefined;

    if (useAi && process.env.GEMINI_API_KEY) {
      const result = await scoreLeadWithAI({
        name: lead.name, email: lead.email, phone: lead.phone,
        company: lead.company, source: lead.source, temperature: lead.temperature,
        expected_value: lead.expected_value, tags: lead.tags as string[], notes: lead.notes,
        activities_count: activitiesCount, days_since_creation: daysSinceCreation,
      });
      score = result.score;
      reasoning = result.reasoning;
      suggestedTemp = result.suggested_temperature;
      nextAction = result.next_action;
    } else {
      const result = scoreLeadRuleBased({
        name: lead.name, email: lead.email, phone: lead.phone,
        company: lead.company, source: lead.source, temperature: lead.temperature,
        expected_value: lead.expected_value, tags: lead.tags as string[], activities_count: activitiesCount,
      });
      score = result.score;
      reasoning = result.reasoning;
    }

    db.prepare('UPDATE leads SET score = ?, score_reasoning = ?, scored_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(score, reasoning, id);

    return { score, reasoning, suggested_temperature: suggestedTemp, next_action: nextAction };
  }

  async getActivities(leadId: string) {
    return this.leadRepo.findActivities(leadId);
  }

  async createActivity(leadId: string, data: any) {
    const id = uuidv4();
    return this.leadRepo.createActivity({ ...data, id, lead_id: leadId });
  }
}
