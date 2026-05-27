import { requireUser } from "@/lib/auth-helpers";
import { Panel } from "../_components/panel";
import { ProfileForm } from "./_components/ProfileForm";
import { PasswordForm } from "./_components/PasswordForm";
import { LogoutButton } from "./_components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <p className="label">Conta</p>
        <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-[var(--ink)]">
          Configurações
        </h2>
        <p className="mt-1 text-[13px] text-[var(--ink-4)]">{user.email}</p>
      </div>
      <div className="space-y-5">
        <Panel eyebrow="Perfil" title="Dados profissionais">
          <ProfileForm user={user} />
        </Panel>
        <Panel eyebrow="Segurança" title="Trocar senha">
          <PasswordForm />
        </Panel>
        <Panel eyebrow="Sessão" title="Sair do sistema">
          <p className="text-[13px] text-[var(--ink-3)] mb-3">
            Você será redirecionada para a tela de login.
          </p>
          <LogoutButton />
        </Panel>
      </div>
    </div>
  );
}
