import {
  Bot,
  CalendarDays,
  CheckCircle2,
  FileText,
  LockKeyhole,
  MessageCircle,
  RefreshCcw,
} from "lucide-react";
import {
  agentSettings,
  automationRules,
  messageTemplates,
} from "@/lib/mock-data";
import { Panel } from "../_components/panel";
import { WorkflowStep } from "../_components/workflow-step";
import { Badge } from "../_components/badge";

export default function WhatsAppPage() {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <p className="label">Integrações</p>
        <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-[var(--ink)]">
          WhatsApp IA
        </h2>
        <p className="mt-1 text-[13px] text-[var(--ink-4)]">
          Recepção administrativa com templates aprovados. Conteúdo clínico
          não trafega pelo canal.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <Panel
            eyebrow="Fluxo"
            icon={Bot}
            title="Recepção inteligente"
          >
            <div className="space-y-0">
              <WorkflowStep
                step={1}
                icon={MessageCircle}
                title="Confirmação automática"
                detail="Envia lembrete aprovado, registra resposta e marca presença prevista sem troca manual."
              />
              <WorkflowStep
                step={2}
                icon={CalendarDays}
                title="Reagendamento guiado"
                detail="Consulta slots livres, oferece opções e atualiza agenda quando o paciente aceita."
              />
              <WorkflowStep
                step={3}
                icon={LockKeyhole}
                title="Handoff protegido"
                detail="Perguntas clínicas viram notificação para a psicóloga; o agente fica no administrativo."
              />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-md border border-[#bfe3cf] bg-[var(--success-soft)] p-3">
                <p className="text-[12px] font-semibold text-[var(--success-text)]">
                  Status do agente
                </p>
                <p className="mt-0.5 text-[13px] text-[var(--success-text)]">
                  Conectado · tom {agentSettings.persona.toLowerCase()}.
                </p>
              </div>
              <div className="rounded-md border border-[#cddfff] bg-[var(--blue-soft)] p-3">
                <p className="text-[12px] font-semibold text-[var(--blue-text)]">
                  Última resposta aprovada
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-[var(--blue-text)]">
                  &ldquo;Tenho esses horários disponíveis. Você prefere online ou
                  presencial?&rdquo;
                </p>
              </div>
            </div>
          </Panel>

          <Panel eyebrow="Configurações" icon={Bot} title="Agente">
            <dl className="space-y-0 divide-y divide-[var(--border)]">
              <ConfigLine label="Persona" value={agentSettings.persona} />
              <ConfigLine label="Abordagem" value={agentSettings.approach} />
              <ConfigLine label="Preço" value={agentSettings.pricingStrategy} />
              <ConfigLine
                label="Fila de espera"
                value={`${agentSettings.waitlistAcceptanceHours}h para aceitar`}
              />
              <ConfigLine
                label="Horários"
                value={agentSettings.officeHours.join(" · ")}
              />
            </dl>
          </Panel>

          <Panel
            eyebrow="Automações"
            icon={RefreshCcw}
            title="Fluxos sem troca manual"
            padded={false}
          >
            <div className="divide-y divide-[var(--border)]">
              {automationRules.map((rule) => (
                <div key={rule.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="h-card text-[14px]">{rule.title}</p>
                    <Badge variant={rule.status === "active" ? "success" : "neutral"}>
                      {rule.status === "active" ? "Ativo" : "Pausado"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[13px] leading-snug text-[var(--ink-3)]">
                    <span className="text-[var(--ink-5)]">{rule.trigger}</span>
                    {" → "}
                    {rule.action}
                  </p>
                  <p className="mt-1.5 text-[11.5px] text-[var(--ink-5)]">
                    Tom: {rule.humanTone}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel
          eyebrow="Mensagens aprovadas"
          icon={CheckCircle2}
          title="Confirmação, orientação e cobrança"
          padded={false}
        >
          <div className="divide-y divide-[var(--border)]">
            {messageTemplates.map((template) => (
              <article key={template.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText
                      aria-hidden="true"
                      size={14}
                      strokeWidth={1.8}
                      className="text-[var(--ink-4)]"
                    />
                    <p className="h-card text-[14px]">{template.title}</p>
                  </div>
                  <Badge variant={template.approved ? "success" : "warning"}>
                    {template.approved ? "Aprovada" : "Revisar"}
                  </Badge>
                </div>
                <p className="mt-1 text-[11.5px] text-[var(--ink-5)]">
                  {template.category} · {template.channel} · {template.tone}
                </p>
                <p className="mt-2.5 rounded-md bg-[var(--surface-2)] p-3 text-[13px] leading-relaxed text-[var(--ink-2)]">
                  &ldquo;{template.body}&rdquo;
                </p>
              </article>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ConfigLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-baseline gap-4 py-2.5">
      <dt className="label">{label}</dt>
      <dd className="text-[13.5px] font-medium text-[var(--ink-2)]">{value}</dd>
    </div>
  );
}
