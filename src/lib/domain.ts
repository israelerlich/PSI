export type Modality = "online" | "presencial";

export type SessionStatus =
  | "AGENDADA"
  | "REMANEJADA"
  | "CANCELADA"
  | "CONCLUIDA"
  | "NAO_COMPARECEU";

export type PaymentStatus = "PENDENTE" | "PAGO";

export type RecordTemplate = "DAP" | "BIRP";

export type ConfirmationStatus =
  | "pending"
  | "confirmed"
  | "reschedule_requested"
  | "rescheduled"
  | "manual_review";

export type AttendanceStatus = "expected" | "present" | "missed" | "excused";

export type InvoiceStatus =
  | "not_required"
  | "ready"
  | "queued"
  | "issued"
  | "failed";

export type ChargeStatus =
  | "not_sent"
  | "pix_sent"
  | "paid"
  | "overdue";

export type ReceiptStatus = "not_ready" | "ready" | "sent";

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
  consentStatus?: "complete" | "pending" | "expired";
  attachmentCount?: number;
  lastClinicalUpdate?: string;
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
  confirmationStatus?: ConfirmationStatus;
  attendanceStatus?: AttendanceStatus;
  amountCents?: number;
  invoiceStatus?: InvoiceStatus;
  chargeStatus?: ChargeStatus;
  receiptStatus?: ReceiptStatus;
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
  contextSummary?: string;
  attachments?: string[];
  consentIds?: string[];
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

export type BillingEntry = {
  id: string;
  sessionId: string;
  patientId: string;
  patientName: string;
  serviceDate: string;
  serviceType: string;
  amountCents: number;
  paymentStatus: PaymentStatus;
  chargeStatus: ChargeStatus;
  invoiceStatus: InvoiceStatus;
  receiptStatus: ReceiptStatus;
  dueDate: string;
  paidAt?: string;
};

export type MessageTemplate = {
  id: string;
  title: string;
  category: "confirmacao" | "reagendamento" | "documentos" | "orientacao" | "cobranca";
  channel: "whatsapp" | "email";
  approved: boolean;
  tone: string;
  body: string;
};

export type AutomationRule = {
  id: string;
  title: string;
  trigger: string;
  action: string;
  status: "active" | "paused";
  humanTone: string;
  lastRunAt?: string;
};

export type ClinicalAttachment = {
  id: string;
  patientId: string;
  title: string;
  kind: "documento" | "anexo" | "termo" | "encaminhamento";
  createdAt: string;
  protected: boolean;
};

export type Consent = {
  id: string;
  patientId: string;
  title: string;
  status: "signed" | "pending" | "expired";
  signedAt?: string;
  expiresAt?: string;
};

export type PatientTimelineItem = {
  id: string;
  patientId: string;
  date: string;
  title: string;
  detail: string;
  kind: "sessao" | "evolucao" | "documento" | "financeiro" | "mensagem";
};
