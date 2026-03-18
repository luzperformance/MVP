// Types compartilhados — Prontuário LuzPerformance

export interface Doctor {
  id: number;
  name: string;
  email: string;
  crm: string;
}

export interface Patient {
  id: string;
  name: string;
  birth_date: string;
  phone?: string;
  email?: string;
  gender?: 'M' | 'F' | 'outro';
  occupation?: string;
  main_complaint?: string;
  notes?: string;
  lgpd_consent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Record {
  id: string;
  patient_id: string;
  type: 'consulta' | 'retorno' | 'exame' | 'procedimento' | 'teleconsulta';
  source: 'manual' | 'transcricao' | 'resumo';
  raw_input?: string;
  soap_subjective?: string;
  soap_objective?: string;
  soap_assessment?: string;
  soap_plan?: string;
  notes?: string;
  consultation_date: string;
  duration_minutes?: number;
  created_at: string;
}

/** Item da lista de consultas (record + patient_name) */
export interface ConsultaListItem {
  id: string;
  patient_id: string;
  patient_name: string;
  type: Record['type'];
  source: Record['source'];
  consultation_date: string;
  duration_minutes?: number;
  created_at: string;
}

export interface Photo {
  id: string;
  patient_id: string;
  record_id?: string;
  filename: string;
  original_name?: string;
  category?: 'antes' | 'durante' | 'depois' | 'evolucao' | 'exame' | 'outro';
  description?: string;
  taken_at?: string;
  url: string;
  created_at: string;
}

export interface LabMarker {
  id: string;
  exam_id: string;
  marker_name: string;
  marker_category?: string;
  value: number;
  unit: string;
  ref_min?: number;
  ref_max?: number;
  optimal_min?: number;
  optimal_max?: number;
  status: 'normal' | 'baixo' | 'alto' | 'subotimo' | 'acima_otimo';
}

export interface LabExam {
  id: string;
  patient_id: string;
  exam_date: string;
  lab_name?: string;
  pdf_filename?: string;
  notes?: string;
  markers: LabMarker[];
  created_at: string;
}

// Timeline grouped format for Recharts
export interface MarkerTimeline {
  name: string;
  category?: string;
  unit: string;
  ref_min?: number;
  ref_max?: number;
  optimal_min?: number;
  optimal_max?: number;
  data: { date: string; value: number; status: string }[];
}

export interface TimelineResponse {
  timeline: MarkerTimeline[];
  dates: string[];
  availableMarkers: { marker_name: string; marker_category: string; unit: string }[];
}

export interface SOAPNote {
  soap_subjective: string;
  soap_objective: string;
  soap_assessment: string;
  soap_plan: string;
}

export interface ApiError {
  error: string;
}

// Finance dashboard
export interface FinanceSummaryResponse {
  kpis: {
    revenueMonth: number;
    expenseMonth: number;
    resultMonth: number;
    revenueTotal: number;
    expenseTotal: number;
    resultTotal: number;
  };
  monthly: { month: string; revenue: number; expense: number; result: number }[];
  periodMonths: number;
}

export interface FinanceEntry {
  id: string;
  type: 'revenue' | 'expense';
  category: string;
  amount: number;
  entry_date: string;
  description?: string;
  created_at: string;
}

// Calendar / Agenda (Google Calendar API)
export interface CalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  htmlLink?: string;
  isAllDay: boolean;
}

export interface CalendarEventsResponse {
  configured: boolean;
  events: CalendarEventItem[];
  message?: string;
  error?: string;
  timeZone?: string;
}
