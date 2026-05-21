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
    <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:px-8 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-6">
        <Panel eyebrow="WhatsApp IA" icon={Bot} title="Recepção inteligente">
          <div className="grid grid-cols-1 gap-4">
            <WorkflowStep
              icon={MessageCircle}
              title="Confirmação automática"
              detail="Envia lembrete aprovado, registra resposta e marca presença prevista sem troca manual."
            />
            <WorkflowStep
              icon={CalendarDays}
              title="Reagendamento guiado"
              detail="Consulta slots livres, oferece opções e atualiza agenda quando o paciente aceita."
            />
            <WorkflowStep
              icon={LockKeyhole}
              title="Handoff protegido"
              detail="Perguntas clínicas viram notificação para a psicóloga; o agente fica no administrativo."
            />
          </div>

          <div className="mt-5 rounded-md bg-teal-50 p-3 shadow-[0_0_0_1px_rgba(20,184,166,0.22)]">
            <p className="text-sm font-semibold text-teal-900">
              Status do agente
            </p>
            <p className="mt-1 text-sm text-teal-800">
              Conectado, com tom {agentSettings.persona.toLowerCase()}.
            </p>
          </div>

          <div className="mt-5 rounded-md bg-teal-50 p-3 shadow-[0_0_0_1px_rgba(20,184,166,0.22)]">
            <p className="text-sm font-semibold text-teal-900">
              Próxima resposta aprovada
            </p>
            <p className="mt-2 text-pretty text-sm leading-6 text-teal-800">
              &ldquo;Tenho esses horários disponíveis. Você prefere online ou
              presencial?&rdquo;
            </p>
          </div>
        </Panel>

        <Panel eyebrow="Configurações" icon={Bot} title="Agente">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 mb-1">
                Persona
              </dt>
              <dd className="text-pretty font-medium text-stone-800">
                {agentSettings.persona}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 mb-1">
                Abordagem
              </dt>
              <dd className="text-pretty font-medium text-stone-800">
                {agentSettings.approach}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 mb-1">
                Preço
              </dt>
              <dd className="text-pretty font-medium text-stone-800">
                {agentSettings.pricingStrategy}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 mb-1">
                Fila de espera
              </dt>
              <dd className="font-medium text-stone-800">
                <span className="metric-number">
                  {agentSettings.waitlistAcceptanceHours}
                </span>{" "}
                horas para aceitar
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 mb-1">
                Horários
              </dt>
              <dd className="font-medium text-stone-800">
                {agentSettings.officeHours.map((h) => (
                  <p key={h}>{h}</p>
                ))}
              </dd>
            </div>
          </dl>
        </Panel>

        <Panel eyebrow="Automações" icon={RefreshCcw} title="Fluxos sem troca manual">
          <div className="space-y-3">
            {automationRules.map((rule) => (
              <div
                className="rounded-md border border-[var(--line)] p-4"
                key={rule.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-stone-950">{rule.title}</p>
                  <Badge variant={rule.status === "active" ? "success" : "neutral"}>
                    {rule.status === "active" ? "Ativo" : "Pausado"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {rule.trigger} → {rule.action}
                </p>
                <p className="mt-2 text-xs font-medium text-stone-500">
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
      >
        <div className="grid grid-cols-1 gap-3">
          {messageTemplates.map((template) => (
            <article
              className="surface-card rounded-[10px] bg-white p-4"
              key={template.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText
                    aria-hidden="true"
                    className="text-[var(--brand)]"
                    size={17}
                  />
                  <p className="font-semibold text-stone-950">
                    {template.title}
                  </p>
                </div>
                <Badge variant={template.approved ? "success" : "warning"}>
                  {template.approved ? "Aprovada" : "Revisar"}
                </Badge>
              </div>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                {template.category} · {template.channel} · {template.tone}
              </p>
              <p className="mt-3 rounded-md bg-[var(--surface-muted)] p-3 text-sm leading-6 text-stone-700">
                &ldquo;{template.body}&rdquo;
              </p>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
