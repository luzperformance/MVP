// PatientDetailPage.tsx — TODO (implementar na Fase 2)
// Esta página mostrará: dados do paciente, linha do tempo de consultas, botões de ação.
// Será implementada na próxima sessão de desenvolvimento com as skills:
//   - /feature-dev PatientDetail
//   - skill: ui-builder
//   - skill: state-management

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, FlaskConical, Camera, FileText } from 'lucide-react';

export default function PatientDetailPage() {
  const { id } = useParams();
  return (
    <div>
      <div className="page-header">
        <Link to="/patients" className="btn btn-ghost btn-sm"><ArrowLeft size={14} /></Link>
        <span style={{ fontWeight: 700, color: '#fff', flex: 1 }}>Paciente</span>
        <Link to={`/patients/${id}/records/new`} className="btn btn-primary btn-sm">
          <Plus size={14} /> Nova Consulta
        </Link>
      </div>
      <div className="page-content">
        <div className="card card-gold" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link to={`/patients/${id}/records/new`} className="btn btn-secondary btn-sm">
            <FileText size={14} /> Nova Consulta
          </Link>
          <Link to={`/patients/${id}/exams`} className="btn btn-secondary btn-sm">
            <FlaskConical size={14} /> Exames
          </Link>
          <Link to={`/patients/${id}/photos`} className="btn btn-secondary btn-sm">
            <Camera size={14} /> Fotos
          </Link>
        </div>
        <div className="card animate-fade-in-up" style={{ marginTop: 16, textAlign: 'center', padding: 48 }}>
          <p style={{ color: '#a0a0a0', fontSize: 14 }}>
            Detalhes do paciente — <strong style={{color:'#c9a44a'}}>próxima fase de desenvolvimento</strong>
          </p>
          <p style={{ color: '#c9a44a', fontSize: 12, marginTop: 8 }}>
            Use os botões acima para navegar pelas sessões disponíveis.
          </p>
        </div>
      </div>
    </div>
  );
}
