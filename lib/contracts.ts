export const DEFAULT_CONTRACT_TITLE = "Contrato de Licenca de Uso e Prestacao de Servicos Ronda Smart";

export function buildDefaultContract(input: {
  companyName: string;
  companyDocument?: string | null;
  plan?: string | null;
  monthlyAmount?: string | null;
  startDate?: string | null;
  notes?: string | null;
}) {
  const amount = input.monthlyAmount?.trim() || "a definir";
  const startDate = input.startDate?.trim() || "na data da assinatura";
  const document = input.companyDocument?.trim() || "documento nao informado";
  const notes = input.notes?.trim();

  return `CONTRATO DE LICENCA DE USO E PRESTACAO DE SERVICOS RONDA SMART

CONTRATADA: Ronda Smart Plataforma, responsavel pela disponibilizacao do sistema Ronda Smart.

CONTRATANTE: ${input.companyName}, inscrita sob o documento ${document}.

1. OBJETO
1.1. Este contrato tem por objeto a licenca de uso do software Ronda Smart e a prestacao dos servicos digitais relacionados ao controle de rondas, pontos de verificacao, ocorrencias e monitoramento operacional.

2. PLANO E VIGENCIA
2.1. O plano contratado e ${input.plan || "Profissional"}.
2.2. A vigencia inicia ${startDate} e permanece por prazo indeterminado, podendo ser encerrada conforme as condicoes acordadas entre as partes.

3. VALOR E PAGAMENTO
3.1. O valor mensal contratado e R$ ${amount}.
3.2. Tributos, servicos adicionais e eventuais customizacoes poderao ser cobrados separadamente mediante aceite.

4. RESPONSABILIDADES DA CONTRATADA
4.1. Disponibilizar acesso ao sistema e aplicar medidas razoaveis de seguranca, manutencao e disponibilidade.
4.2. Tratar dados pessoais de acordo com a legislacao aplicavel e com as instrucoes legitimas da CONTRATANTE.

5. RESPONSABILIDADES DA CONTRATANTE
5.1. Manter seus dados cadastrais atualizados, proteger as credenciais de acesso e utilizar o sistema de forma licita.
5.2. Cadastrar apenas usuarios autorizados e orientar sua equipe sobre o uso correto do aplicativo.

6. DADOS E PRIVACIDADE
6.1. Cada parte devera cumprir suas obrigacoes relativas a privacidade e protecao de dados, inclusive quanto a bases legais, transparencia e seguranca.

7. LIMITACOES
7.1. O sistema auxilia o controle operacional, mas nao substitui procedimentos de seguranca, emergencia ou supervisao humana da CONTRATANTE.

8. RESCISAO
8.1. O contrato podera ser rescindido mediante comunicacao entre as partes, observadas obrigacoes financeiras vencidas e eventual periodo acordado.

9. ASSINATURA ELETRONICA
9.1. As partes reconhecem como valida a manifestacao de vontade realizada eletronicamente nesta plataforma, acompanhada das evidencias de identificacao, data, hora, endereco IP, navegador e integridade do documento.

10. FORO
10.1. As partes elegem o foro definido de comum acordo ou, na ausencia de definicao especifica, o foro competente conforme a legislacao aplicavel.
${notes ? `\n11. CONDICOES ADICIONAIS\n${notes}\n` : ""}
Ao assinar, o representante declara possuir poderes para vincular a CONTRATANTE e confirma que leu e concorda integralmente com este documento.`;
}
