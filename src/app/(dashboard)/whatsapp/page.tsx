import { Bot, CalendarDays, LockKeyhole, MessageCircle } from "lucide-react";
import { agentSettings } from "@/lib/mock-data";
import { Panel } from "../_components/panel";
import { WorkflowStep } from "../_components/workflow-step";

export default function WhatsAppPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 space-y-6">
      <Panel eyebrow="WhatsApp IA" icon={Bot} title="Recepção inteligente">
        <div className="grid gap-4">
          <WorkflowStep
            icon={MessageCircle}
            title="Triagem SDR"
            detail="Cobre modalidade, idade e alinhamento financeiro antes de sugerir slots."
          />
          <WorkflowStep
            icon={CalendarDays}
            title="Remarcar ou cancelar"
            detail="Recepcionista consulta agenda, libera horários e aciona fila de espera."
          />
          <WorkflowStep
            icon={LockKeyhole}
            title="Handoff protegido"
            detail="Perguntas clínicas viram notificação, sem resposta diagnóstica por IA."
          />
        </div>

        <div className="mt-5 rounded-md border border-teal-200 bg-teal-50 p-3">
          <p className="text-sm font-semibold text-teal-900">
            Status do agente
          </p>
          <p className="mt-1 text-sm text-teal-800">Conectado e ativo</p>
        </div>

        <div className="mt-5 rounded-md border border-teal-200 bg-teal-50 p-3">
          <p className="text-sm font-semibold text-teal-900">
            Próxima resposta aprovada
          </p>
          <p className="mt-2 text-sm leading-6 text-teal-800">
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
            <dd className="font-medium text-stone-800">{agentSettings.persona}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 mb-1">
              Abordagem
            </dt>
            <dd className="font-medium text-stone-800">{agentSettings.approach}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 mb-1">
              Preço
            </dt>
            <dd className="font-medium text-stone-800">{agentSettings.pricingStrategy}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 mb-1">
              Fila de espera
            </dt>
            <dd className="font-medium text-stone-800">
              {agentSettings.waitlistAcceptanceHours} horas para aceitar
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
    </div>
  );
}
