export const DEFAULT_CONTRACT_TITLE = "Contrato de Licenca de Uso do Ronda Smart";

function money(value?: string | null, fallback = "250,00") {
  return value?.trim() || fallback;
}

export function buildDefaultContract(input: {
  companyName: string;
  companyDocument?: string | null;
  plan?: string | null;
  setupAmount?: string | null;
  monthlyAmount?: string | null;
  startDate?: string | null;
  notes?: string | null;
}) {
  const providerName = process.env.PROVIDER_LEGAL_NAME?.trim() || "Fluir Tecnologia";
  const providerDocument = process.env.PROVIDER_DOCUMENT?.trim();
  const providerAddress = process.env.PROVIDER_ADDRESS?.trim();
  const providerEmail = process.env.PROVIDER_EMAIL?.trim();
  const setupAmount = money(input.setupAmount);
  const monthlyAmount = money(input.monthlyAmount);
  const startDate = input.startDate?.trim() || "na data da assinatura";
  const customerDocument = input.companyDocument?.trim() || "documento informado no cadastro";
  const notes = input.notes?.trim();

  const providerIdentification = [
    providerName,
    providerDocument ? `CNPJ ${providerDocument}` : null,
    providerAddress || null,
    providerEmail ? `e-mail ${providerEmail}` : null
  ].filter(Boolean).join(", ");

  return `CONTRATO DE LICENCA DE USO DO RONDA SMART

CONTRATADA: ${providerIdentification}, doravante denominada FLUIR TECNOLOGIA.

CONTRATANTE: ${input.companyName}, inscrita sob o documento ${customerDocument}.

1. OBJETO
1.1. A CONTRATADA concede a CONTRATANTE licenca de uso do sistema Ronda Smart, no plano ${input.plan || "Profissional"}, para cadastro e acompanhamento de vigilantes, rondas, pontos de verificacao, ocorrencias e relatorios.
1.2. O sistema e uma ferramenta de apoio operacional e nao substitui procedimentos humanos de seguranca, emergencia ou fiscalizacao.

2. IMPLANTACAO E MENSALIDADE
2.1. Pela ativacao e implantacao inicial, a CONTRATANTE pagara R$ ${setupAmount}, em parcela unica, por boleto bancario.
2.2. Pela licenca e manutencao do acesso, a CONTRATANTE pagara R$ ${monthlyAmount} por mes, com vencimento todo dia 20.
2.3. A cobranca mensal inicia a partir da ativacao do sistema. Valores vencidos antes do cancelamento permanecem devidos.

3. VIGENCIA E CANCELAMENTO
3.1. O contrato inicia ${startDate} e possui prazo indeterminado, sem fidelidade.
3.2. A CONTRATANTE pode solicitar o cancelamento a qualquer momento pelos canais de atendimento da FLUIR TECNOLOGIA.
3.3. O cancelamento impede novas cobrancas mensais, sem afastar valores ja vencidos ou servicos adicionais previamente aprovados.

4. OBRIGACOES DA FLUIR TECNOLOGIA
4.1. Disponibilizar o sistema, realizar manutencoes e adotar medidas razoaveis de seguranca e continuidade.
4.2. Prestar suporte relacionado ao funcionamento do Ronda Smart durante a vigencia.
4.3. Tratar dados pessoais conforme a legislacao aplicavel e as finalidades do servico.

5. OBRIGACOES DA CONTRATANTE
5.1. Fornecer dados corretos, proteger credenciais e permitir acesso somente a usuarios autorizados.
5.2. Responder pelos cadastros, conteudos e atividades realizadas por seus usuarios.
5.3. Utilizar o sistema de forma licita e manter procedimentos proprios de seguranca e atendimento a emergencias.

6. DADOS E CONFIDENCIALIDADE
6.1. As partes devem preservar informacoes confidenciais e cumprir suas obrigacoes relativas a privacidade e protecao de dados.
6.2. Encerrado o contrato, os dados poderao ser mantidos pelo periodo necessario ao cumprimento de obrigacoes legais, seguranca e defesa de direitos.

7. DISPONIBILIDADE E RESPONSABILIDADE
7.1. Manutencoes, atualizacoes, falhas de internet, equipamentos do cliente ou servicos de terceiros podem causar indisponibilidades temporarias.
7.2. A CONTRATADA nao responde por uso indevido, credenciais compartilhadas, informacoes incorretas ou falhas operacionais alheias ao sistema.

8. ASSINATURA ELETRONICA
8.1. As partes reconhecem a validade da assinatura eletronica realizada nesta plataforma.
8.2. O aceite e acompanhado de identificacao do signatario, data, hora, endereco IP, navegador e hash de integridade do documento.

9. DISPOSICOES FINAIS
9.1. Alteracoes comerciais futuras serao previamente comunicadas e dependerao de aceite quando exigido.
9.2. Fica eleito o foro legalmente competente para resolver eventuais controversias.
${notes ? `\n10. CONDICOES ADICIONAIS\n${notes}\n` : ""}
Ao assinar, o representante declara possuir poderes para vincular a CONTRATANTE, ter lido e concordado integralmente com este contrato.`;
}
