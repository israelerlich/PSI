# Análise das Regras de Negócio

## Módulos

- **Agente WhatsApp**: atua como SDR para telefones novos e recepcionista para pacientes cadastrados.
- **Agenda**: sessões criadas pelo dashboard ou pelo SDR, com remarcação, cancelamento, bloqueios pessoais e fila de espera.
- **Pacientes**: ficha com dados básicos, histórico de sessões, prontuários, anotações, financeiro visual e fila.
- **Prontuários**: templates DAP e BIRP, preenchidos manualmente pelo psicólogo, exportáveis e retidos por 5 anos.
- **Anotações**: texto livre, de paciente ou sessão; notas de sessão acompanham retenção clínica.
- **Notificações**: eventos operacionais em tempo real para leads, sessões, conflitos e handoff.

## Decisões de implementação inicial

- A primeira tela é o dashboard operacional, não uma landing page.
- Os dados estão mockados para validar fluxo, terminologia e layout antes de conectar Supabase.
- O schema já separa dados clínicos de mensagens WhatsApp e aplica RLS por psicólogo.
- O webhook WhatsApp retorna somente decisão administrativa e guardrails.
- A exportação de prontuário começa como página HTML imprimível para evoluir para PDF.

## Regras críticas preservadas

- Nenhum conteúdo clínico deve sair pelo WhatsApp.
- IA não redige prontuários nem diagnósticos.
- Prontuários não podem ser excluídos antes de 5 anos.
- Arquivar paciente ou prontuário apenas remove da lista ativa.
- Paciente não acessa dashboard.
