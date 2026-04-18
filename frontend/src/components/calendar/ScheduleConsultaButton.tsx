import React, { useState, useCallback } from 'react';
import { CalendarPlus, Loader2 } from 'lucide-react';
import EventFormModal from './EventFormModal';
import type { CreateCalendarEventDTO } from '@shared/types';

interface ScheduleConsultaButtonProps {
  patientName: string;
  patientId?: string;
  /** Custom label for the button */
  label?: string;
  /** Pre-filled summary (defaults to "Consulta — {patientName}") */
  summaryPrefix?: string;
  /** Optional pre-filled date */
  startDateTime?: string;
  /** Compact style for use inside cards */
  compact?: boolean;
  onSuccess?: (htmlLink?: string) => void;
}

export default function ScheduleConsultaButton({
  patientName,
  patientId,
  label,
  summaryPrefix = 'Consulta',
  startDateTime,
  compact = false,
  onSuccess,
}: ScheduleConsultaButtonProps) {
  const [open, setOpen] = useState(false);

  const prefill: Partial<CreateCalendarEventDTO> = {
    summary: `${summaryPrefix} — ${patientName}`,
    patientName,
    ...(patientId ? { description: `ID Paciente: ${patientId}` } : {}),
    ...(startDateTime ? { startDateTime } : {}),
  };

  const handleSuccess = useCallback((htmlLink?: string) => {
    onSuccess?.(htmlLink);
    setOpen(false);
  }, [onSuccess]);

  return (
    <>
      <button
        type="button"
        className={`btn btn-outline${compact ? ' btn-sm' : ''} schedule-consulta-btn`}
        onClick={() => setOpen(true)}
        title={`Agendar consulta para ${patientName} no Google Calendar`}
      >
        <CalendarPlus size={compact ? 14 : 16} />
        {label ?? (compact ? 'Agendar' : 'Agendar no Google Calendar')}
      </button>

      <EventFormModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSuccess={handleSuccess}
        prefill={prefill}
      />
    </>
  );
}
