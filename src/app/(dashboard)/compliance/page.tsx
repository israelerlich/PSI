import { ShieldCheck } from "lucide-react";
import { Panel } from "../_components/panel";
import { ComplianceItem } from "../_components/compliance-item";
import { Badge } from "../_components/badge";

export default function CompliancePage() {
  const items = [
    "Dados clínicos ficam apenas no dashboard web.",
    "IA atua somente em fluxos administrativos.",
    "Mensagens automáticas usam templates aprovados.",
    "NFS-e, recibos e cobranças ficam vinculados ao atendimento.",
    "Prontuários são autorais e sem redação por IA.",
    "Arquivamento preserva registros por 5 anos.",
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <p className="label">Compliance</p>
        <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-[var(--ink)]">
          CFP e segurança
        </h2>
        <p className="mt-1 text-[13px] text-[var(--ink-4)]">
          Princípios regulatórios aplicados em todo o sistema.
        </p>
      </div>

      <Panel
        eyebrow="Regras vigentes"
        icon={ShieldCheck}
        title="Conformidade do sistema"
      >
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="success">Em conformidade</Badge>
          <span className="text-[12.5px] text-[var(--ink-4)]">
            Última revisão: 16/05/2026
          </span>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {items.map((text) => (
            <ComplianceItem key={text} text={text} />
          ))}
        </div>

        <div className="mt-6 rounded-md border border-[#cddfff] bg-[var(--blue-soft)] p-4">
          <p className="text-[13px] font-semibold text-[var(--blue-text)]">
            Política da Clínica IA
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--blue-text)]">
            Nenhum conteúdo clínico trafega pelo WhatsApp. A IA atua exclusivamente
            em fluxos administrativos. Prontuários são autorais e mantidos por no
            mínimo 5 anos.
          </p>
        </div>
      </Panel>
    </div>
  );
}
