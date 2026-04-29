export interface Doctor {
    id: number;
    name: string;
    email: string;
    crm: string;
    can_access_records?: boolean;
    can_edit_agenda?: boolean;
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
    content: string;
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
export interface MarkerTimeline {
    name: string;
    category?: string;
    unit: string;
    ref_min?: number;
    ref_max?: number;
    optimal_min?: number;
    optimal_max?: number;
    data: {
        date: string;
        value: number;
        status: string;
    }[];
}
export interface TimelineResponse {
    timeline: MarkerTimeline[];
    dates: string[];
    availableMarkers: {
        marker_name: string;
        marker_category: string;
        unit: string;
    }[];
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
export interface FinanceSummaryResponse {
    kpis: {
        revenueMonth: number;
        expenseMonth: number;
        resultMonth: number;
        revenueTotal: number;
        expenseTotal: number;
        resultTotal: number;
    };
    monthly: {
        month: string;
        revenue: number;
        expense: number;
        result: number;
    }[];
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
export type LeadSource = 'indicacao' | 'instagram' | 'google' | 'site' | 'evento' | 'outro';
export type LeadStatus = 'novo' | 'contato' | 'qualificado' | 'proposta' | 'convertido' | 'perdido';
export type LeadTemperature = 'frio' | 'morno' | 'quente';
export interface Lead {
    id: string;
    patient_id?: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    source?: LeadSource;
    status: LeadStatus;
    temperature?: LeadTemperature;
    expected_value?: number;
    tags?: string[];
    notes?: string;
    next_followup_at?: string;
    converted_at?: string;
    lost_reason?: string;
    score?: number;
    score_reasoning?: string;
    scored_at?: string;
    last_activity_at?: string;
    created_at: string;
    updated_at: string;
}
export type LeadActivityType = 'nota' | 'ligacao' | 'email' | 'whatsapp' | 'reuniao' | 'proposta' | 'outro';
export interface LeadActivity {
    id: string;
    lead_id: string;
    type: LeadActivityType;
    description: string;
    scheduled_at?: string;
    completed_at?: string;
    created_at: string;
}
export type AssetType = 'equipamento' | 'protocolo' | 'suplemento' | 'contrato' | 'documento' | 'outro';
export type AssetStatus = 'ativo' | 'inativo' | 'vendido' | 'expirado';
export interface Asset {
    id: string;
    lead_id?: string;
    patient_id?: string;
    name: string;
    type: AssetType;
    status: AssetStatus;
    value?: number;
    acquisition_date?: string;
    expiration_date?: string;
    description?: string;
    metadata?: {
        [key: string]: unknown;
    };
    created_at: string;
    updated_at: string;
}
export interface CrmSummary {
    totalLeads: number;
    byStatus: {
        status: LeadStatus;
        count: number;
    }[];
    bySource: {
        source: LeadSource;
        count: number;
    }[];
    pipelineValue: number;
    convertedThisMonth: number;
    pendingFollowups: number;
}
export type PackageType = 'mensal' | 'trimestral' | 'semestral' | 'anual';
export type MgmtStatus = 'ativo' | 'inativo';
export interface PatientManagement {
    id: string;
    name: string;
    cpf_encrypted?: string;
    birth_date?: string;
    gender?: string;
    email?: string;
    phone?: string;
    phone2?: string;
    address?: string;
    cep?: string;
    city?: string;
    state?: string;
    insurance_name?: string;
    insurance_plan?: string;
    first_consultation?: string;
    last_consultation?: string;
    next_consultation?: string;
    last_prescription?: string;
    last_exam?: string;
    mgmt_status?: MgmtStatus;
    uses_ea?: boolean;
    wants_children?: boolean;
    mother_name?: string;
    children_info?: string;
    weight_height?: string;
    future_children?: string;
    cpf?: string;
    cep_address?: string;
    civil_status?: string;
    health_plan?: string;
    other_professionals?: string;
    hometown_current?: string;
    profession?: string;
    medical_history?: string;
    hormone_use?: string;
    male_specific?: {
        libido_erection?: string;
        children_details?: string;
    };
    observations?: string;
    notes?: string;
    origin?: string;
    package_type?: PackageType;
    monthly_value?: number;
    payment_date?: string;
    needs_nf?: boolean;
    contract_done?: boolean;
    contract_start?: string;
    contract_end?: string;
    contract_notes?: string;
    created_at: string;
    updated_at: string;
}
export interface GestaoSummary {
    total: number;
    ativos: number;
    inativos: number;
    mrrTotal: number;
    withContract: number;
    pendingNF: number;
    upcomingConsultations: number;
    byPackage: {
        type: string;
        count: number;
    }[];
    byState: {
        state: string;
        count: number;
    }[];
}
export type AlertType = 'patient_inactive' | 'contract_expiring' | 'exam_overdue' | 'lead_hot_no_followup' | 'payment_overdue' | 'consultation_today';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export interface Alert {
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    description: string;
    entity_type: 'patient' | 'lead';
    entity_id: string;
    entity_name: string;
    action_url: string;
    created_at: string;
    data?: {
        [key: string]: unknown;
    };
}
export interface AlertsSummary {
    total: number;
    critical: number;
    high: number;
    by_type: {
        patient_inactive: number;
        contract_expiring: number;
        exam_overdue: number;
        lead_hot_no_followup: number;
        payment_overdue: number;
        consultation_today: number;
    };
}
//# sourceMappingURL=types.d.ts.map