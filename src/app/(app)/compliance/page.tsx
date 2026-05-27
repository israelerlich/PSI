import { ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { Panel } from "../_components/panel";
import { ComplianceItem } from "../_components/compliance-item";
import { Badge } from "../_components/badge";
import { formatDate } from "@/lib/format/date";

export const dynamic = "force-dynamic";

const ITEMS = [
  "Dados clínicos ficam apenas no dashboard web.",
  "Mensagens de WhatsApp ficam fora do app — só o número como contato.",
  "Prontuários DAP e BIRP são autorais e sem redação por IA.",
  "Arquivamento preserva registros por 5 anos (retenção obrigatória).",
  "Cobranças e recibos ficam vinculados ao atendimento.",
  "Conta única por instância (single-tenant); senhas com bcrypt.",
];

export default async function CompliancePage() {
  const user = await requireUser();
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
        title="Conformidade do sistema"
        icon={ShieldCheck}
      >
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <Badge variant="success">Em conformidade</Badge>
          <span className="text-[12.5px] text-[var(--ink-4)]">
            Conta criada em {formatDate(user.createdAt)} · CRP {user.crp}
          </span>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {ITEMS.map((text) => (
            <ComplianceItem key={text} text={text} />
          ))}
        </div>
        <div className="mt-6 rounded-md border border-[#cddfff] bg-[var(--blue-soft)] p-4">
          <p className="text-[13px] font-semibold text-[var(--blue-text)]">
            Política da Clínica IA
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--blue-text)]">
            Sem agente IA, sem automações de mensageria. O sistema só guarda
            dados que você inseriu manualmente. Prontuários são autorais e
            mantidos por no mínimo cinco anos.
          </p>
        </div>
      </Panel>
    </div>
  );
}
