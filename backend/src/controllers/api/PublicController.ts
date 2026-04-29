import { Request, Response } from 'express';
import { LeadService } from '../../models/services/LeadService';

export class PublicController {
  constructor(private leadService: LeadService) {}

  async captureLead(req: Request, res: Response) {
    try {
      const { name, email, phone, company, source, use_ai } = req.body;
      
      if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: 'Nome é obrigatório (mínimo 2 caracteres).' });
      }

      const result = await this.leadService.captureLead({
        name,
        email,
        phone,
        company,
        source: source || 'site'
      });

      // Optional: immediate scoring
      await this.leadService.scoreLead(result.id, use_ai !== false);
      
      const updatedLead = await this.leadService.getLeads({ id: result.id }); // Use id as filter if supported, or fetch by ID
      // Actually fetch by id
      const lead = (this.leadService as any).leadRepo.findById(result.id); // For simplicity here, but should be via service
      
      return res.status(201).json({
        created: result.created,
        lead: await lead
      });
    } catch (error) {
      console.error('Error in PublicController.captureLead:', error);
      return res.status(500).json({ error: 'Erro ao capturar lead.' });
    }
  }
}
