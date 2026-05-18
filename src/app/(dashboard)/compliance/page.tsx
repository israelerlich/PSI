import { ShieldCheck } from "lucide-react";
import { Panel } from "../_components/panel";
import { ComplianceItem } from "../_components/compliance-item";

export default function CompliancePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8">
      <Panel
        eyebrow="Compliance"
        icon={ShieldCheck}
        title="CFP e segurança"
      >
        <div className="space-y-4">
          <ComplianceItem text="Dados clínicos ficam apenas no dashboard web." />
          <ComplianceItem text="IA atua somente em fluxos administrativos." />
          <ComplianceItem text="Prontuários são autorais e sem redação por IA." />
          <ComplianceItem text="Arquivamento preserva registros por 5 anos." />
        </div>

        <div className="mt-6 rounded-md bg-[var(--surface-muted)] p-4">
          <p className="text-sm font-semibold text-stone-700">
            Status de conformidade
          </p>
          <p className="mt-2 text-sm text-stone-600">
            Todas as regras do CFP estão em conformidade. Nenhum conteúdo
            clínico trafega pelo WhatsApp. A IA atua exclusivamente em fluxos
            administrativos. Prontuários são autorais e mantidos por no mínimo
            5 anos.
          </p>
        </div>
      </Panel>
    </div>
  );
}
