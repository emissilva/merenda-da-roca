// Relatório de Governança, Ética e Segurança de Dados — Merenda da Roça (GS 2026.2)
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, HeadingLevel, LevelFormat, ImageRun, PageBreak, Footer, Header, PageNumber,
  BorderStyle, TableOfContents,
} = require("docx");

const C = { black: "000000", gray: "6E6E6E", light: "E0E0E0", olive: "829B4D", orange: "F67024", navy: "092D4C", soft: "F4F4F4" };
const HEAD = "Century Gothic", BODY = "Arial";
const PAGE_W = 11906, MARGIN = 1134, CONTENT = PAGE_W - 2 * MARGIN; // A4, margens 2 cm

// ---------- helpers ----------
const p = (text, o = {}) => new Paragraph({ spacing: { after: 120, line: 288 }, ...o.para,
  children: (Array.isArray(text) ? text : [text]).map((t) => typeof t === "string" ? new TextRun({ text: t, ...o.run }) : t) });
const b = (t) => new TextRun({ text: t, bold: true });
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const kicker = (t, color = C.olive, np = false) => new Paragraph({ pageBreakBefore: np, spacing: { before: 0, after: 40 },
  children: [new TextRun({ text: t.toUpperCase(), bold: true, size: 18, color, font: BODY, characterSpacing: 20 })] });
const bullet = (parts) => new Paragraph({ numbering: { reference: "bul", level: 0 }, spacing: { after: 60, line: 276 },
  children: (Array.isArray(parts) ? parts : [parts]).map((t) => typeof t === "string" ? new TextRun(t) : t) });
const kickerNP = (t) => kicker(t, C.olive, true);
const brk = () => new Paragraph({ children: [new PageBreak()] });

const border = { style: BorderStyle.SINGLE, size: 4, color: "D0D0D0" };
const borders = { top: border, bottom: border, left: border, right: border };
function table(headers, rows, widthsPct, o = {}) {
  const total = CONTENT;
  const widths = widthsPct.map((w) => Math.round((w / 100) * total));
  widths[widths.length - 1] = total - widths.slice(0, -1).reduce((a, c) => a + c, 0);
  const cell = (txt, i, head, shade) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA }, borders,
    shading: head ? { type: ShadingType.CLEAR, color: "auto", fill: o.headFill || C.black } : shade ? { type: ShadingType.CLEAR, color: "auto", fill: shade } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ spacing: { after: 0, line: 252 }, children: (Array.isArray(txt) ? txt : [txt]).map((t) =>
      typeof t === "string" ? new TextRun({ text: t, size: o.size || 17, bold: head || (i === 0 && o.boldFirst), color: head ? "FFFFFF" : C.black, font: BODY }) : t) })],
  });
  return new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: widths,
    rows: [new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, i, true)) }),
      ...rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, i, false, ri % 2 ? C.soft : undefined)) }))],
  });
}
const gap = () => new Paragraph({ spacing: { after: 120 }, children: [] });
const caption = (t) => new Paragraph({ spacing: { before: 60, after: 200 }, children: [new TextRun({ text: t, italics: true, size: 16, color: C.gray })] });

// ---------- conteúdo ----------
const glossario = [
  ["PNAE", "Programa Nacional de Alimentação Escolar: repasse federal do FNDE para a merenda dos alunos da rede pública.", "Merenda escolar; alimentação escolar", "Lei 11.947/2009; FNDE"],
  ["Entidade Executora (EEx)", "Prefeitura ou secretaria estadual que recebe o repasse e compra os alimentos.", "Executor; prefeitura; secretaria", "FNDE / SigPC"],
  ["Valor transferido", "Valor repassado pelo FNDE à entidade executora para o PNAE no ano.", "Repasse; recurso FNDE", "FNDE / SigPC"],
  ["Agricultor familiar", "Produtor rural que atende aos critérios da Lei 11.326/2006 (área, mão de obra e renda familiar).", "Pequeno produtor; produtor familiar", "Lei 11.326/2006"],
  ["CAF", "Cadastro Nacional da Agricultura Familiar: identifica o agricultor familiar apto a vender ao PNAE (substituiu a DAP).", "DAP (antigo); cadastro AF", "MDA"],
  ["Percentual AF", "Valor comprado da agricultura familiar ÷ valor transferido. Mínimo de 30% até 2025 e de 45% a partir de 2026.", "% AF; meta da agricultura familiar", "Lei 15.226/2025; cálculo do sistema"],
  ["Chamada pública", "Edital simplificado pelo qual a entidade executora compra da agricultura familiar sem licitação.", "Edital; chamamento", "Resolução FNDE nº 06/2020"],
  ["Projeto de venda", "Proposta que o produtor (ou grupo) apresenta em resposta à chamada pública, com produtos, quantidades e preços.", "Proposta; oferta formal", "Resolução FNDE nº 06/2020"],
  ["Oferta", "Registro de quanto o produtor tem de um produto e em que mês, informado por voz, WhatsApp ou pelo técnico da ATER.", "Disponibilidade; colheita prevista", "Merenda da Roça (evt_oferta)"],
  ["Match", "Combinação automática de ofertas de vários produtores próximos para atender ao volume de uma chamada pública.", "Agrupamento; grupo de entrega", "Merenda da Roça (motor de match)"],
  ["Grupos prioritários", "Assentados da reforma agrária, comunidades indígenas e quilombolas, que a lei manda priorizar na seleção.", "Prioridade legal", "Lei 11.947/2009, art. 14"],
  ["CAE", "Conselho de Alimentação Escolar: órgão de controle social que fiscaliza a execução do PNAE no município.", "Conselho; controle social", "Lei 11.947/2009"],
];

const dic = {
  produtor: [
    ["id_produtor", "UUID", "Chave primária do produtor", "Sistema", "7f3c…a91e", "PK; única; não nula"],
    ["cpf_hash", "CHAR(64)", "CPF pseudonimizado (SHA-256 com salt)", "Cadastro (ATER/WhatsApp)", "9b1e…4c07", "Único; CPF em claro nunca é gravado"],
    ["nome_produtor", "VARCHAR(120)", "Nome completo", "Cadastro", "Antônio Pereira", "Não nulo; acesso restrito"],
    ["numero_caf", "VARCHAR(30)", "Número do CAF", "Cadastro / MDA", "PE0123456789", "Não nulo; validado na base do MDA"],
    ["codigo_ibge", "INTEGER", "Município do produtor", "IBGE", "2600500", "FK → ref_municipio; 7 dígitos"],
    ["grupo_prioritario", "VARCHAR(30)", "Grupo prioritário legal", "Cadastro / CAF", "quilombola", "Domínio: nenhum, assentado, indigena, quilombola"],
    ["canal_contato", "VARCHAR(10)", "Canal preferido", "Cadastro", "whatsapp", "Domínio: whatsapp, ura, ater"],
    ["telefone_cifrado", "BYTEA", "Telefone criptografado (AES-256)", "Cadastro", "(cifrado)", "Chave no Key Vault"],
    ["dt_consentimento", "DATE", "Data do consentimento por áudio", "WhatsApp / URA", "2026-03-02", "AAAA-MM-DD; obrigatório para contato"],
    ["fl_ativo", "BOOLEAN", "Produtor ativo", "Sistema", "true", "Default true"],
  ],
  oferta: [
    ["id_oferta", "UUID", "Chave primária da oferta", "Sistema", "a2d4…77b0", "PK"],
    ["id_produtor", "UUID", "Produtor que ofertou", "cad_produtor", "7f3c…a91e", "FK → cad_produtor; não nula"],
    ["dt_registro", "TIMESTAMP", "Momento do registro (UTC)", "Sistema", "2026-03-05 14:22:10", "UTC; não futura"],
    ["cd_produto", "VARCHAR(20)", "Produto ofertado", "ref_produto", "MACAXEIRA", "FK → ref_produto (domínio fechado)"],
    ["qtd_kg", "NUMERIC(10,2)", "Quantidade disponível", "Áudio transcrito / ATER", "120.00", "> 0 e ≤ 50.000"],
    ["mes_disponivel", "CHAR(7)", "Mês da colheita", "Áudio transcrito", "2026-03", "AAAA-MM; até 12 meses à frente"],
    ["canal_origem", "VARCHAR(10)", "Por onde a oferta chegou", "Sistema", "whatsapp", "Domínio: whatsapp, ura, ater"],
    ["vl_confianca_transcricao", "NUMERIC(3,2)", "Confiança do modelo de voz", "Whisper", "0.91", "0 a 1; < 0,85 vai para revisão humana"],
    ["st_oferta", "VARCHAR(12)", "Situação da oferta", "Sistema", "confirmada", "Domínio: pendente, confirmada, descartada"],
  ],
  contrato: [
    ["id_contrato", "UUID", "Chave primária do contrato", "Sistema", "c91a…0d3f", "PK"],
    ["id_chamada", "UUID", "Chamada pública atendida", "trn_chamada", "5e0b…19aa", "FK → trn_chamada; não nula"],
    ["id_oferta", "UUID", "Oferta contratada", "evt_oferta", "a2d4…77b0", "FK → evt_oferta; oferta confirmada"],
    ["codigo_ibge_eex", "INTEGER", "Município da entidade executora", "FNDE / IBGE", "2600500", "FK → ref_municipio"],
    ["qtd_contratada_kg", "NUMERIC(10,2)", "Quantidade contratada", "Motor de match", "100.00", "> 0 e ≤ qtd_kg da oferta"],
    ["vl_preco_kg", "NUMERIC(8,2)", "Preço por kg (R$)", "Chamada pública", "3.80", "> 0; alerta se ±30% do preço Conab"],
    ["vl_total", "NUMERIC(12,2)", "Valor total (R$)", "Derivado", "380.00", "= qtd_contratada_kg × vl_preco_kg"],
    ["dt_entrega_prevista", "DATE", "Data prevista da coleta", "Motor de rotas", "2026-03-12", "AAAA-MM-DD; ≥ data do contrato"],
    ["dt_entrega_real", "DATE", "Data em que a entrega ocorreu", "Escola / app do motorista", "2026-03-12", "Nula até a entrega"],
    ["st_entrega", "VARCHAR(12)", "Situação da entrega", "Sistema", "entregue", "Domínio: agendada, entregue, parcial, cancelada"],
    ["hash_registro", "CHAR(64)", "Hash SHA-256 da linha", "Sistema", "e3b0…b855", "Recalculado na auditoria para detectar alteração"],
  ],
};

const rbac = [
  ["Engenheiro de Dados", "Pipelines (Data Factory, Databricks), camadas bronze e prata", "Ler/escrever dados técnicos; nunca vê CPF ou telefone em claro", "Equipe Merenda da Roça"],
  ["Analista de Dados", "Camada ouro e dados agregados por município", "Somente leitura; dados pessoais pseudonimizados", "Equipe Merenda da Roça"],
  ["Gestor Municipal", "Painel e contratos do próprio município", "Ler seu município; criar chamadas; ver nome do produtor só nos contratos", "Nutricionista / secretaria"],
  ["Auditor", "Logs, trilhas de auditoria e contratos", "Somente leitura de tudo, sem exportar dados pessoais", "CAE / controle interno"],
];

// ---------- documento ----------
const img = fs.readFileSync("arquitetura_merenda_da_roca.png");
const imgW = CONTENT / 1440 * 96; // largura em px (96 dpi)
const children = [
  // capa
  new Paragraph({ spacing: { before: 2400, after: 120 }, children: [new TextRun({ text: "GLOBAL SOLUTION 2026.2  ·  CITIZENTECH", bold: true, color: C.orange, size: 20, characterSpacing: 40 })] }),
  new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: "MERENDA DA ROÇA", font: HEAD, size: 72, color: C.black })] }),
  new Paragraph({ spacing: { after: 480 }, children: [new TextRun({ text: "do pequeno produtor direto para o prato da escola", size: 24, color: C.gray })] }),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RELATÓRIO DE GOVERNANÇA, ÉTICA E SEGURANÇA DE DADOS", font: HEAD, size: 32, color: C.olive })] }),
  p("Disciplina: Data Ethics Governance  ·  Tecnologia em Data Science, AI, Analytics, Cloud & Data Platforms  ·  Turma 2TSCPW", { run: { color: C.gray, size: 18 } }),
  p("Equipe Raiz Digital · Integrantes (ordem alfabética): Elton Vinicios Almeida de Oliveira (RM 562187, responsável) · Emerson dos Santos Silva (RM 562033) · Kelvin Douglas Ribeiro Rabelo (RM 561538)", { run: { color: C.gray, size: 18 } }),
  brk(),
  new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "SUMÁRIO", font: HEAD, size: 28 })] }),
  new TableOfContents("Sumário", { hyperlink: true, headingStyleRange: "1-2" }),
  brk(),

  // 1
  kicker("Item 1"), h1("1. Identificação"),
  p([b("Solução: "), "Merenda da Roça, plataforma CitizenTech que conecta agricultores familiares às compras da merenda escolar (PNAE). O produtor informa a colheita por áudio no WhatsApp ou por ligação; a plataforma agrupa ofertas de vizinhos para atender às chamadas públicas e mostra à prefeitura quanto falta para cumprir a meta legal de compra da agricultura familiar (45% a partir de 2026)."]),
  p([b("Recorte: "), "municípios do Nordeste, onde, em 2022, 70% das prefeituras com dados válidos ficariam abaixo da nova meta (cálculo do grupo sobre dados FNDE/SigPC)."]),
  table(["Integrante (ordem alfabética)", "RM", "Papel"], [
    ["Elton Vinicios Almeida de Oliveira", "562187", "Aluno responsável"],
    ["Emerson dos Santos Silva", "562033", ""],
    ["Kelvin Douglas Ribeiro Rabelo", "561538", ""],
  ], [55, 15, 30]),
  gap(),
  p([b("Objetivo do relatório: "), "estruturar a governança, a ética e a segurança dos dados da Merenda da Roça, garantindo dados rastreáveis, confiáveis, usados com ética e protegidos, em conformidade com a LGPD (Lei 13.709/2018) e com as regras do PNAE. O relatório trata dos dados da solução como um todo, e não apenas dos modelos de IA."]),

  // 2
  kickerNP("Item 2"), h1("2. Glossário de Dados de Negócio"),
  p("Linguagem única entre prefeitura (negócio), equipe de campo e ATER (operação) e equipe de dados. Os mesmos termos aparecem nas tabelas, no painel e no catálogo do Purview."),
  table(["Termo", "Definição conceitual", "Sinônimos", "Fonte"], glossario, [17, 47, 18, 18], { boldFirst: true, size: 16 }),

  // 3
  kickerNP("Item 3"), h1("3. Mapa de Processos e Fluxo de Dados (DFD)"),
  p("O mapa parte dos processos de negócio do PNAE e confirma, em cada etapa, qual dado é necessário:"),
  table(["Processo de negócio", "Dado necessário", "Quem produz"], [
    ["Prefeitura publica a chamada pública", "Itens, quantidades, preços, prazos", "Gestor municipal"],
    ["Produtor informa a colheita", "Produto, quantidade, mês, CAF", "Produtor (voz) ou ATER"],
    ["Plataforma forma grupos de entrega", "Ofertas confirmadas, distância, grupo prioritário", "Motor de match"],
    ["Contrato e entrega", "Quantidade contratada, preço, data, situação", "Prefeitura e motorista"],
    ["Prestação de contas e meta", "Valor transferido e valor comprado da AF", "FNDE (SigPC) + contratos"],
  ], [36, 40, 24], { boldFirst: true }),
  gap(),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: "png", data: img, transformation: { width: imgW, height: imgW * 1823 / 2945 }, altText: { title: "DFD", description: "Diagrama de fluxo de dados da Merenda da Roça", name: "dfd" } })] }),
  caption("Figura 1. Fluxo de dados ponta a ponta, feito no draw.io com ícones Azure (arquivo editável: arquitetura_merenda_da_roca.drawio)."),
  table(["Camada", "O que acontece", "Tecnologias"], [
    ["Origem", "Bases públicas (FNDE/SigPC, IBGE, Conab, INMET), áudios e ligações dos produtores, editais das prefeituras.", "Planilhas oficiais, APIs, WhatsApp, URA"],
    ["Processamento (ETL/ELT)", "Limpeza, padronização de cabeçalhos e datas (AAAA-MM-DD, UTC), tratamento de ausentes, conversão de escalas, enriquecimento com IBGE, variáveis derivadas (% AF, faixa da meta, porte).", "Data Factory, Functions, Databricks, Whisper"],
    ["Armazenamento", "Data Lake em camadas bronze (bruto, imutável), prata (tratado) e ouro (indicadores); banco relacional para cadastros, ofertas e contratos.", "Azure Data Lake, PostgreSQL"],
    ["Consumo", "Painel da prefeitura e do CAE; respostas em áudio e SMS ao produtor; relatórios para prestação de contas.", "Power BI, Notification Hubs"],
  ], [18, 56, 26], { boldFirst: true }),
  gap(),
  p([b("Unidirecional, auditável e com linhagem: "), "o dado só anda da origem para o consumo. Nenhuma camada altera a anterior: a bronze guarda o arquivo original, e cada carga registra data, fonte, versão e hash. O Purview liga cada indicador do painel até a planilha de origem."]),

  // 4
  kickerNP("Item 4"), h1("4. Dicionário de Dados Técnicos (Metadados)"),
  p("As três tabelas nucleares seguem o padrão sugerido: cadastro da entidade principal, eventos e transações. Todas ficam no PostgreSQL e são replicadas diariamente para o Data Lake."),
  h2("4.1 cad_produtor (cadastro)"),
  table(["Coluna", "Tipo", "Descrição", "Origem", "Exemplo", "Regra de negócio / qualidade"], dic.produtor, [17, 12, 20, 15, 13, 23], { boldFirst: true, size: 15 }),
  h2("4.2 evt_oferta (eventos)"),
  table(["Coluna", "Tipo", "Descrição", "Origem", "Exemplo", "Regra de negócio / qualidade"], dic.oferta, [17, 12, 20, 15, 13, 23], { boldFirst: true, size: 15 }),
  new Paragraph({ heading: HeadingLevel.HEADING_2, pageBreakBefore: true, children: [new TextRun("4.3 trn_contrato_entrega (transações)")] }),
  table(["Coluna", "Tipo", "Descrição", "Origem", "Exemplo", "Regra de negócio / qualidade"], dic.contrato, [17, 12, 20, 15, 13, 23], { boldFirst: true, size: 15 }),
  caption("Tabelas de referência (domínios fechados): ref_municipio (código IBGE, UF, população 2022, porte) e ref_produto (lista de produtos com unidade e sazonalidade)."),

  // 5
  kickerNP("Item 5"), h1("5. Políticas e Padrões de Governança"),
  h2("5.1 Padronização de nomenclatura"),
  bullet([b("Prefixos de tabela: "), "cad_ (cadastros), evt_ (eventos), trn_ (transações), ref_ (referência), stg_ (área de carga), agg_ (agregados da camada ouro)."]),
  bullet([b("Colunas em snake_case, "), "com prefixo pelo tipo: id_ (chaves), dt_ (datas), vl_ (valores), qtd_ (quantidades), st_ (situação), fl_ (sim/não)."]),
  bullet([b("Datas no formato AAAA-MM-DD "), "e horários em UTC; meses de referência como AAAA-MM."]),
  bullet([b("Arquivos brutos: "), "<fonte>_<conjunto>_<ano>_<AAAAMMDD da carga>.<ext>, por exemplo fnde_aquisicoes_af_2022_20261105.xlsx."]),
  h2("5.2 Qualidade e integridade"),
  p("A política foi aplicada de verdade na base do Data Viz (12 planilhas do FNDE, 65.071 linhas):"),
  bullet([b("Profiling: "), "cada planilha anual tinha cabeçalho, posição e nomes de colunas diferentes; 2011 e 2012 não traziam código IBGE; 2018 e 2019 publicavam o percentual em escala 0–100."]),
  bullet([b("Analysis: "), "regras de validade (repasse > 0, compra ≤ repasse, código IBGE com 7 dígitos, UF no domínio de 27 siglas). Em 2022, 602 registros falharam nas regras (por exemplo, repasse zerado com compra registrada)."]),
  bullet([b("Cleansing: "), "cabeçalhos padronizados; escala convertida para 0–1; código IBGE de 2011–2012 recuperado pelo nome do município (ficaram 86 e 87 prefeituras sem correspondência); registros inválidos marcados em flag_inconsistencia e excluídos das análises, nunca apagados."]),
  bullet([b("Na operação: "), "a ingestão rejeita cargas com chaves estrangeiras quebradas ou valores fora da faixa, que vão para uma área de quarentena com o motivo registrado."]),
  h2("5.3 Rastreabilidade e linhagem"),
  bullet([b("Catálogo versionado "), "no Microsoft Purview, com o glossário do item 2 e o dicionário do item 4."]),
  bullet([b("Logs de ETL "), "do Data Factory e do Databricks: data, fonte, linhas lidas, aceitas e rejeitadas, versão do código."]),
  bullet([b("Variáveis derivadas documentadas: "), "perc_af = valor_aquisicao_af ÷ valor_transferido_fnde; faixa_meta; cumpre_30; cumpre_45; porte_municipio (faixas de população do Censo 2022)."]),
  h2("5.4 Acesso e proteção de dados (LGPD)"),
  bullet([b("Mínimo privilégio: "), "cada papel do item 7 vê só o que precisa; o gestor municipal só enxerga o próprio município."]),
  bullet([b("Pseudonimização: "), "CPF guardado apenas como hash SHA-256 com salt; telefone criptografado; nas camadas prata e ouro só existem identificadores pseudônimos."]),
  bullet([b("Bases legais: "), "execução de políticas públicas (art. 7º, III, e art. 23 da LGPD) para os dados ligados ao PNAE; consentimento registrado por áudio para o contato por WhatsApp e ligação."]),
  bullet([b("Retenção: "), "áudios apagados 30 dias depois da transcrição confirmada; contratos guardados pelo prazo de prestação de contas do PNAE."]),
  bullet([b("Dados abertos: "), "as bases do FNDE e do IBGE usadas no painel são públicas e não contêm dados pessoais."]),

  // 6
  kickerNP("Item 6"), h1("6. Ética e Uso Responsável de Dados"),
  p([b("Finalidade legítima: "), "aumentar a renda do agricultor familiar e ajudar as prefeituras a cumprir a lei do PNAE com alimento fresco e regional nas escolas."]),
  p([b("Usos proibidos:")]),
  bullet("Vender ou repassar dados dos produtores a atravessadores, bancos ou empresas."),
  bullet("Usar as ofertas ou o histórico de entregas para negar crédito, benefício ou cadastro ao produtor."),
  bullet("Vigiar ou punir individualmente servidores e nutricionistas a partir do painel."),
  bullet("Excluir produtores por região, gênero, etnia ou volume, contrariando a prioridade legal."),
  h2("6.1 Análise de erros (a solução usa modelos)"),
  p("A plataforma tem dois modelos que funcionam como classificadores: a transcrição de voz (o que o produtor disse) e o motor de match (quem entra em cada grupo de entrega)."),
  table(["Erro", "O que acontece", "Impacto"], [
    ["Falso positivo", "O sistema registra uma oferta que não existe ou uma quantidade maior (\"120\" entendido como \"220\") e escala o produtor.", "Entrega incompleta, merenda sem o alimento, desgaste da confiança da prefeitura."],
    ["Falso negativo", "Uma oferta real não é reconhecida ou o produtor não é escolhido no match.", "O produtor perde renda e, se for de grupo prioritário, sofre exclusão. É o erro mais crítico."],
  ], [16, 46, 38], { boldFirst: true }),
  gap(),
  p([b("Medidas para reduzir o falso negativo (risco mais crítico):")]),
  bullet("Toda transcrição é lida de volta ao produtor em áudio (\"aperte 1 para confirmar\"); confiança abaixo de 0,85 vai para revisão humana da ATER."),
  bullet("O match reserva cota para grupos prioritários e faz rodízio entre produtores, em vez de premiar sempre quem produz mais."),
  bullet("Monitoramento mensal da taxa de seleção por município, grupo prioritário e gênero do titular do CAF, com alerta quando um grupo cai abaixo da média."),
  bullet("Teste do reconhecimento de voz com sotaques e falas de cada estado do Nordeste antes do piloto."),
  h2("6.2 Riscos dos dados e vieses"),
  bullet([b("Dados incorretos: "), "o FNDE avisa que os dados são preliminares. O painel mostra a data da carga e o aviso de dado preliminar, e não apresenta como definitiva nenhuma conclusão sobre uma prefeitura."]),
  bullet([b("Viés de conectividade: "), "quem não tem celular ou sinal ficaria de fora. Por isso existem a URA (ligação comum), o SMS e o cadastro presencial pela ATER."]),
  bullet([b("Viés de porte: "), "municípios pequenos têm menos equipe e podem aparecer como \"piores\". O painel compara municípios do mesmo porte."]),

  // 7
  kickerNP("Item 7"), h1("7. Segurança da Informação"),
  table(["Pilar", "Controles", "Justificativa"], [
    ["Confidencialidade", "Entra ID com RBAC e MFA; ambientes de desenvolvimento, homologação e produção isolados; private endpoints na rede; TLS 1.2+ em trânsito; AES-256 em repouso com chaves no Key Vault.", "CPF, telefone e áudio são dados pessoais; produtores de grupos prioritários são mais vulneráveis."],
    ["Integridade", "Hash SHA-256 de cada carga e de cada contrato; chaves primárias e estrangeiras; restrições CHECK (faixas e domínios); trilha de auditoria no Azure Monitor.", "Contratos envolvem dinheiro público e passam por prestação de contas e pelo CAE."],
    ["Disponibilidade", "Backup geo-redundante diário; Data Lake com versionamento; monitoramento e alertas de falha; URA e SMS como alternativa quando a internet cai.", "A coleta da merenda tem data marcada; o produtor no campo nem sempre tem sinal."],
  ], [17, 50, 33], { boldFirst: true }),
  gap(),
  p([b("Modelo de acesso RBAC (quatro papéis):")]),
  table(["Papel", "Acesso a", "Permissões", "Quem"], rbac, [20, 30, 32, 18], { boldFirst: true }),
  caption("Parâmetros como TLS 1.2+, AES-256 e retenção de logs por 180 dias são referências para justificar os controles; não há implementação nesta entrega."),

  // 8
  kicker("Item 8"), h1("8. Conclusão e Benefícios"),
  p("Os três pilares se reforçam. A governança cria uma linguagem única (glossário), padrões de nomes e uma linhagem confiável do painel até a planilha do FNDE. A ética define para que os dados servem, proíbe os desvios de finalidade e protege justamente os produtores que a solução quer incluir. A segurança protege dados pessoais e contratos públicos com controles de acesso, integridade e disponibilidade."),
  p("Juntos, eles reduzem riscos para a prefeitura (contas questionadas, contratos sem rastreio), para o produtor (exclusão, uso indevido dos seus dados) e para a própria plataforma. Isso sustenta a confiança de que a Merenda da Roça precisa para crescer de município em município, sem depender de ganhos de acurácia dos modelos."),
  h2("Referências"),
  bullet("Brasil. Lei 11.947/2009 (PNAE) e Lei 15.226/2025 (meta de 45%). Lei 13.709/2018 (LGPD). Lei 11.326/2006 (agricultura familiar)."),
  bullet("FNDE. Dados da Agricultura Familiar: aquisições 2011–2022 (SigPC). gov.br/fnde."),
  bullet("IBGE. Censo Demográfico 2022, tabela SIDRA 4709; Censo Agropecuário 2017."),
];

const doc = new Document({
  creator: "Equipe Merenda da Roça", title: "Relatório de Governança, Ética e Segurança de Dados — Merenda da Roça",
  styles: {
    default: { document: { run: { font: BODY, size: 20, color: C.black } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: HEAD, size: 34, color: C.black }, paragraph: { spacing: { before: 0, after: 200 }, keepNext: true, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: BODY, size: 22, bold: true, color: C.olive }, paragraph: { spacing: { before: 240, after: 100 }, keepNext: true, outlineLevel: 1 } },
    ],
  },
  numbering: { config: [{ reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "■", alignment: AlignmentType.LEFT,
    style: { run: { color: C.orange, size: 14 }, paragraph: { indent: { left: 360, hanging: 260 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: PAGE_W, height: 16838 }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } }, titlePage: true },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "MERENDA DA ROÇA  |  GOVERNANÇA, ÉTICA E SEGURANÇA DE DADOS", size: 14, color: C.gray, characterSpacing: 20 })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT], size: 16, color: C.gray })] })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => { fs.writeFileSync("GS_2TSCPW_Governanca_MerendaDaRoca_RaizDigital.docx", buf); console.log("ok"); });
