export type Modality = "online" | "presencial";

export type SessionStatus =
  | "AGENDADA"
  | "REMANEJADA"
  | "CANCELADA"
  | "CONCLUIDA"
  | "NAO_COMPARECEU";

export type PaymentStatus = "PENDENTE" | "PAGO";

export type RecordTemplate = "DAP" | "BIRP";

export type Patient = {
  id: string;
  name: string;
  whatsapp: string;
  email?: string;
  birthDate?: string;
  modality: Modality;
  archived: boolean;
  generalNotes?: string;
  financialStatus: PaymentStatus;
  nextSession?: string;
  waitlistPosition?: number;
  alerts?: string[];
  lastContactAt?: string;
  documentsPending?: number;
};

export type TherapySession = {
  id: string;
  patientId: string;
  patientName: string;
  startsAt: string;
  endsAt: string;
  modality: Modality;
  status: SessionStatus;
  paymentStatus: PaymentStatus;
  origin: "dashboard" | "whatsapp_sdr" | "whatsapp_recepcionista";
  location?: string;
  serviceType?: string;
  reminderStatus?: "scheduled" | "sent" | "not_configured";
  documentationStatus?: "not_started" | "draft" | "complete";
};

export type ClinicalRecord = {
  id: string;
  patientId: string;
  patientName: string;
  template: RecordTemplate;
  sessionDate: string;
  createdAt: string;
  archived: boolean;
  retentionUntil: string;
  fields: Array<{
    label: string;
    value: string;
  }>;
};

export type Note = {
  id: string;
  patientId: string;
  patientName: string;
  sessionId?: string;
  createdAt: string;
  body: string;
};

export type Notification = {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
  type:
    | "lead"
    | "session"
    | "reschedule"
    | "cancel"
    | "handoff"
    | "conflict";
};

export type AvailableSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  modality: Modality;
};
