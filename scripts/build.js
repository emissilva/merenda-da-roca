// Merenda da Roça — Pitch GS 2026.2 (visual inspirado no site Experience FIAP CitizenTech)
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const path = require("path");
const SKILL = process.env.PPTX_SKILL;
const { applyTheme } = require(path.join(SKILL, "scripts", "apply_theme.js"));

const HEX = {
  black: "000000", white: "FFFFFF", gray: "6E6E6E", light: "E0E0E0",
  olive: "829B4D", orange: "F67024", navy: "092D4C", mid: "9A9A9A",
};
const THEME = {
  name: "CitizenTech Merenda da Roca",
  headFontFace: "Century Gothic",
  bodyFontFace: "Arial",
  colors: {
    dk1: HEX.black, lt1: HEX.white, dk2: HEX.gray, lt2: HEX.light,
    accent1: HEX.olive, accent2: HEX.orange, accent3: HEX.navy,
    accent4: HEX.mid, accent5: "DDA63A", accent6: "C5192D",
    hlink: HEX.orange, folHlink: HEX.olive,
  },
};

async function icon(Comp, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(Comp, { color: "#" + color, size: String(size) })
  );
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9"; // 10 x 5.625 (mesmo tamanho do template FIAP)
  pres.author = "Equipe Merenda da Roça";
  pres.title = "Merenda da Roça — Global Solution 2026.2 CitizenTech";
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;
  const W = C.background1, K = C.text1, G = C.text2, L = C.background2;
  const OL = C.accent1, OR = C.accent2;

  const footer = (dark) => [
    { text: { text: "MERENDA DA ROÇA  |  GLOBAL SOLUTION 2026.2  |  CITIZENTECH",
      options: { x: 0.5, y: 5.2, w: 6.5, h: 0.25, fontSize: 7, color: dark ? C.accent4 : G, charSpacing: 1, margin: 0 } } },
  ];
  pres.defineSlideMaster({
    title: "DARK", background: { color: K },
    objects: [
      ...footer(true),
      { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.55, w: 9, h: 0.75,
        fontFace: "Century Gothic", fontSize: 26, color: W, align: "left", valign: "top", margin: 0 }, text: "" } },
    ],
    slideNumber: { x: 9.0, y: 5.17, w: 0.5, h: 0.3, fontSize: 8, color: C.accent4, align: "right" },
  });
  pres.defineSlideMaster({
    title: "LIGHT", background: { color: L },
    objects: [
      ...footer(false),
      { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.55, w: 9, h: 0.75,
        fontFace: "Century Gothic", fontSize: 26, color: K, align: "left", valign: "top", margin: 0 }, text: "" } },
    ],
    slideNumber: { x: 9.0, y: 5.17, w: 0.5, h: 0.3, fontSize: 8, color: G, align: "right" },
  });
  pres.defineSlideMaster({ title: "COVER", background: { color: K }, objects: [] });

  // ---------- helpers ----------
  const T = (s, text, o) => s.addText(text, { isTextBox: true, margin: 0, ...o });
  const kicker = (s, text, color) =>
    T(s, text, { x: 0.5, y: 0.28, w: 6, h: 0.25, fontSize: 10, bold: true, color, objectName: "kicker" });
  const pill = (s, text, x, y, w, dark, fill) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h: 0.32, rectRadius: 0.16,
      fill: fill ? { color: fill } : { color: dark ? K : L },
      line: { color: dark ? W : K, width: 0.75 }, objectName: "pill " + text,
    });
    T(s, text, { x, y, w, h: 0.32, fontSize: 9, bold: true, align: "center", valign: "middle",
      color: fill ? W : dark ? W : K });
  };
  // mosaico de "pixels" (motivo visual do site)
  const mosaic = (s, x0, y0, cols, rows, size, pattern, colors) => {
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const v = pattern[(r * cols + c) % pattern.length];
        if (v === 0) continue;
        s.addShape(pres.shapes.RECTANGLE, {
          x: x0 + c * size, y: y0 + r * size, w: size, h: size,
          fill: { color: colors[v - 1], transparency: [0, 35, 70][(r + c) % 3] },
          line: { type: "none" }, objectName: "pixel",
        });
      }
  };
  const card = (s, x, y, w, h, dark) =>
    s.addShape(pres.shapes.RECTANGLE, { x, y, w, h,
      fill: { color: dark ? "1A1A1A" : HEX.white }, line: { type: "none" }, objectName: "card" });
  const circleIcon = async (s, Comp, x, y, d, bg, fg) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: bg }, line: { type: "none" } });
    const p = d * 0.22;
    s.addImage({ data: await icon(Comp, fg), x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p });
  };
  const source = (s, text, dark) =>
    T(s, text, { x: 0.5, y: 4.9, w: 9, h: 0.25, fontSize: 7, italic: true, color: dark ? C.accent4 : G });

  // ======================= 1. CAPA =======================
  pres.addSection({ title: "Abertura" });
  let s = pres.addSlide({ masterName: "COVER", sectionTitle: "Abertura" });
  mosaic(s, 6.1, 0, 8, 12, 0.4875,
    [0,1,0,2,1,0,2,0, 1,0,2,1,0,1,0,2, 0,2,1,0,2,0,1,1, 2,1,0,1,0,2,1,0, 0,1,2,0,1,1,0,2, 1,0,1,2,0,2,1,0],
    [HEX.olive, "4A4A4A"]);
  T(s, "GLOBAL SOLUTION 2026.2  ·  CITIZENTECH", { x: 0.5, y: 0.45, w: 5.4, h: 0.3, fontSize: 10, bold: true, color: OR, charSpacing: 2 });
  T(s, "MERENDA", { x: 0.5, y: 1.35, w: 5.6, h: 0.9, fontFace: "Century Gothic", fontSize: 54, color: W, charSpacing: 4 });
  T(s, "DA ROÇA", { x: 1.6, y: 2.15, w: 4.6, h: 0.9, fontFace: "Century Gothic", fontSize: 54, color: W, charSpacing: 4 });
  T(s, "DO PEQUENO PRODUTOR DIRETO PARA O PRATO DA ESCOLA.", { x: 0.5, y: 3.2, w: 5.4, h: 0.3, fontSize: 10, bold: true, color: W, charSpacing: 1 });
  pill(s, "Campo", 0.5, 3.8, 1.0, true);
  pill(s, "Escola", 1.6, 3.8, 1.0, true);
  pill(s, "Cidade", 2.7, 3.8, 1.0, true);
  T(s, "Data Science, AI, Analytics, Cloud & Data Platforms  ·  Turma 2TSCPW", { x: 0.5, y: 4.95, w: 5.5, h: 0.25, fontSize: 9, color: C.accent4 });
  s.addNotes("Abertura: 'E se o dinheiro da merenda escolar virasse renda para quem planta perto da escola?'");

  // ======================= 2. EQUIPE =======================
  s = pres.addSlide({ masterName: "LIGHT", sectionTitle: "Abertura" });
  kicker(s, "Identificação da equipe", OL);
  s.addText("NOME DO PROJETO E INTEGRANTES", { placeholder: "title" });
  // logotipo (pixel-broto)
  card(s, 0.5, 1.45, 3.4, 3.3, false);
  mosaic(s, 1.6, 1.75, 4, 4, 0.3, [0,2,2,0, 2,2,0,0, 0,1,0,0, 0,1,0,0], [HEX.orange, HEX.olive]);
  // corrigir a transparência para o logo ficar sólido
  T(s, "MERENDA DA ROÇA", { x: 0.6, y: 3.15, w: 3.2, h: 0.4, fontFace: "Century Gothic", fontSize: 18, align: "center", color: K });
  T(s, "do campo para a escola", { x: 0.6, y: 3.55, w: 3.2, h: 0.3, fontSize: 10, align: "center", color: G });
  pill(s, "Turma 2TSCPW", 1.5, 4.1, 1.4, false);
  T(s, "INTEGRANTES (ORDEM ALFABÉTICA)", { x: 4.3, y: 1.45, w: 5.2, h: 0.3, fontSize: 10, bold: true, color: OL });
  const membros = [
    ["Elton Vinicios Almeida de Oliveira", "RM 562187", "Aluno responsável"],
    ["Emerson dos Santos Silva", "RM 562033", ""],
    ["Kelvin Douglas Ribeiro Rabelo", "RM 561538", ""],
  ];
  membros.forEach((m, i) => {
    const y = 1.85 + i * 0.95;
    card(s, 4.3, y, 5.2, 0.8, false);
    T(s, m[0], { x: 4.5, y: y + 0.12, w: 3.2, h: 0.3, fontSize: 13, bold: true, color: K });
    T(s, m[1], { x: 4.5, y: y + 0.44, w: 3.4, h: 0.25, fontSize: 11, color: G });
    if (m[2]) pill(s, m[2], 7.75, y + 0.24, 1.55, false, HEX.orange);
  });
  s.addNotes("Integrantes em ordem alfabética; aluno responsável: Elton Vinicios Almeida de Oliveira.");

  // ======================= 3. PROBLEMA =======================
  pres.addSection({ title: "Problema" });
  s = pres.addSlide({ masterName: "LIGHT", sectionTitle: "Problema" });
  kicker(s, "Contextualização e recorte do problema", OL);
  s.addText("A VERBA EXISTE. O PRODUTOR FICA DE FORA", { placeholder: "title" });
  const stats = [
    ["R$ 5,5 bi", "por ano no PNAE para a alimentação de ~40 milhões de estudantes", K],
    ["45%", "mínimo obrigatório de compra da agricultura familiar a partir de 2026 (era 30%)", OR],
    ["3,9 mi", "estabelecimentos da agricultura familiar: 77% do total do país", OL],
  ];
  stats.forEach((st, i) => {
    const x = 0.5 + i * 2.05;
    card(s, x, 1.5, 1.9, 2.0, false);
    T(s, st[0], { x: x + 0.15, y: 1.65, w: 1.7, h: 0.6, fontFace: "Century Gothic", fontSize: 28, bold: true, color: st[2] });
    T(s, st[1], { x: x + 0.15, y: 2.3, w: 1.65, h: 1.1, fontSize: 10, color: G, valign: "top" });
  });
  T(s, [
    { text: "Recorte: ", options: { bold: true, color: K } },
    { text: "municípios do Nordeste, região onde o descumprimento da meta é maior. Muitos produtores não sabem das chamadas públicas, não conseguem lidar com a documentação nem entregar o volume pedido sozinhos.", options: { color: G } },
  ], { x: 0.5, y: 3.7, w: 6.0, h: 1.0, fontSize: 11, valign: "top" });
  // gráfico: Nordeste 2022
  s.addChart(pres.charts.DOUGHNUT, [{
    name: "Prefeituras do Nordeste (2022)",
    labels: ["45% ou mais", "30% a 45%", "Abaixo de 30%", "Não comprou (0%)"],
    values: [510, 498, 505, 157],
  }], {
    x: 6.75, y: 1.4, w: 2.75, h: 3.3, holeSize: 55,
    chartColors: [HEX.olive, HEX.mid, HEX.orange, "C5192D"],
    showTitle: true, title: "Nordeste 2022: 1.160 de 1.670 prefeituras abaixo da nova meta de 45%",
    titleFontSize: 9, titleColor: HEX.black, titleFontFace: "+mn-lt",
    showLegend: true, legendPos: "b", legendFontSize: 8, legendFontFace: "+mn-lt", legendColor: HEX.gray,
    showValue: true, showPercent: false, dataLabelColor: HEX.white, dataLabelFontSize: 8, dataLabelFontFace: "+mn-lt",
  });
  source(s, "Fontes: FNDE (PNAE, 2025); Lei 11.947/2009 e Lei 15.226/2025; IBGE, Censo Agropecuário 2017; gráfico: cálculo do grupo sobre FNDE/SigPC 2022 (dados preliminares), prefeituras com dados válidos.", false);
  s.addNotes("Em 2022, 40% das prefeituras do Nordeste não chegaram nem aos 30%. Com a nova meta de 45% em 2026, 70% ficariam abaixo.");

  // ======================= 4. PERSONAS =======================
  s = pres.addSlide({ masterName: "DARK", sectionTitle: "Problema" });
  kicker(s, "Persona afetada", OR);
  s.addText("QUEM VIVE O PROBLEMA", { placeholder: "title" });
  const personas = [
    [fa.FaSeedling, HEX.olive, "SEU ANTÔNIO, 58", "Agricultor familiar no Sertão de Pernambuco",
      ["Planta feijão, macaxeira e hortaliças em 4 hectares", "Usa WhatsApp só por áudio; leitura limitada", "Nunca soube de uma chamada pública da prefeitura", "Sozinho, não tem volume nem frete para entregar"]],
    [fa.FaSchool, HEX.orange, "CARLA, 34", "Nutricionista de uma prefeitura do interior",
      ["Precisa cumprir 45% de compra da agricultura familiar", "Não sabe o que é colhido na região e quando", "Chamadas públicas ficam vazias ou desertas", "Risco de o município ter as contas questionadas"]],
  ];
  for (let i = 0; i < 2; i++) {
    const p = personas[i]; const x = 0.5 + i * 4.6;
    card(s, x, 1.45, 4.4, 3.3, true);
    await circleIcon(s, p[0], x + 0.25, 1.65, 0.65, p[1], HEX.white);
    T(s, p[2], { x: x + 1.05, y: 1.67, w: 3.2, h: 0.32, fontFace: "Century Gothic", fontSize: 16, color: W });
    T(s, p[3], { x: x + 1.05, y: 2.0, w: 3.2, h: 0.3, fontSize: 10, color: p[1] });
    T(s, p[4].map((b, j) => ({ text: b, options: { bullet: true, breakLine: j < p[4].length - 1 } })),
      { x: x + 0.3, y: 2.55, w: 3.9, h: 2.0, fontSize: 11, color: W, paraSpaceAfter: 6, valign: "top" });
  }
  source(s, "Personas construídas a partir de estudos sobre a execução do PNAE no Nordeste; validar com entrevistas reais (produtor e nutricionista).", true);

  // ======================= 5. PÚBLICO E ECOSSISTEMA =======================
  s = pres.addSlide({ masterName: "LIGHT", sectionTitle: "Problema" });
  kicker(s, "Público beneficiado e ecossistema", OL);
  s.addText("UMA CONEXÃO, TRÊS GANHADORES", { placeholder: "title" });
  T(s, "PÚBLICO BENEFICIADO", { x: 0.5, y: 1.45, w: 4, h: 0.3, fontSize: 10, bold: true, color: OL });
  const pub = [
    [fa.FaSeedling, "Agricultores familiares", "renda estável e venda garantida perto de casa"],
    [fa.FaChild, "Estudantes da rede pública", "comida fresca, regional e da época no prato"],
    [fa.FaLandmark, "Prefeituras e nutricionistas", "cumprir a meta de 45% com segurança"],
  ];
  for (let i = 0; i < pub.length; i++) {
    const y = 1.85 + i * 0.95;
    await circleIcon(s, pub[i][0], 0.5, y, 0.55, HEX.olive, HEX.white);
    T(s, pub[i][1], { x: 1.2, y: y, w: 3.3, h: 0.28, fontSize: 12, bold: true, color: K });
    T(s, pub[i][2], { x: 1.2, y: y + 0.28, w: 3.3, h: 0.3, fontSize: 10, color: G });
  }
  // ecossistema: hub
  T(s, "ECOSSISTEMA", { x: 5.0, y: 1.45, w: 4, h: 0.3, fontSize: 10, bold: true, color: OR });
  const cx = 7.2, cy = 3.2;
  const nodes = [
    ["FNDE", "repasse e dados", 5.05, 1.85], ["Cooperativas", "agregam oferta", 7.85, 1.85],
    ["ATER / Emater", "cadastro no campo", 5.05, 4.15], ["Conselho (CAE)", "fiscaliza", 7.85, 4.15],
    ["Conab", "preços", 5.05, 3.0], ["Escolas", "recebem", 8.1, 3.0],
  ];
  nodes.forEach((n) => {
    s.addShape(pres.shapes.LINE, { x: Math.min(cx, n[2] + 0.7), y: Math.min(cy, n[3] + 0.25),
      w: Math.abs(cx - (n[2] + 0.7)), h: Math.abs(cy - (n[3] + 0.25)),
      flipH: (n[2] + 0.7 > cx) !== (n[3] + 0.25 > cy) ? true : false,
      line: { color: HEX.mid, width: 0.75, dashType: "dash" } });
  });
  s.addShape(pres.shapes.OVAL, { x: cx - 0.65, y: cy - 0.45, w: 1.3, h: 0.9, fill: { color: HEX.black }, line: { type: "none" } });
  T(s, "MERENDA\nDA ROÇA", { x: cx - 0.65, y: cy - 0.45, w: 1.3, h: 0.9, fontFace: "Century Gothic", fontSize: 9, align: "center", valign: "middle", color: W });
  nodes.forEach((n) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: n[2], y: n[3], w: 1.4, h: 0.5, rectRadius: 0.25, fill: { color: HEX.white }, line: { color: HEX.black, width: 0.75 } });
    T(s, [{ text: n[0], options: { bold: true, breakLine: true, color: K } }, { text: n[1], options: { color: G } }],
      { x: n[2], y: n[3], w: 1.4, h: 0.5, fontSize: 8, align: "center", valign: "middle" });
  });

  // ======================= 6. SOLUÇÃO =======================
  pres.addSection({ title: "Solução" });
  s = pres.addSlide({ masterName: "DARK", sectionTitle: "Solução" });
  kicker(s, "Proposta de solução", OR);
  s.addText("UMA PONTE ENTRE A ROÇA E A ESCOLA", { placeholder: "title" });
  const mods = [
    [fa.FaWhatsapp, HEX.olive, "ROÇA POR VOZ", "Assistente por áudio no WhatsApp e ligação (URA) para quem não lê bem: avisa chamadas públicas próximas, ajuda com a CAF e registra a oferta da colheita falando."],
    [fa.FaChartBar, HEX.orange, "PAINEL DA PREFEITURA", "Mostra quanto falta para a meta de 45%, o calendário de safra da região e sugere um cardápio com o que vai ser colhido."],
    [fa.FaTruck, HEX.mid, "ROTA COLETIVA", "Agrupa pequenos produtores para somar volume e calcula uma rota de coleta compartilhada, barateando o frete."],
  ];
  for (let i = 0; i < 3; i++) {
    const m = mods[i]; const x = 0.5 + i * 3.05;
    card(s, x, 1.45, 2.9, 2.75, true);
    await circleIcon(s, m[0], x + 0.25, 1.65, 0.6, m[1], HEX.white);
    T(s, m[2], { x: x + 0.25, y: 2.38, w: 2.5, h: 0.3, fontFace: "Century Gothic", fontSize: 13, color: W });
    T(s, m[3], { x: x + 0.25, y: 2.72, w: 2.45, h: 1.4, fontSize: 10, color: C.accent4, valign: "top" });
  }
  T(s, [
    { text: "Acessibilidade: ", options: { bold: true, color: OR } },
    { text: "funciona por voz, em celular simples, sem app e sem internet boa; dados guardados offline e enviados quando há sinal; técnicos da ATER cadastram quem não tem celular.", options: { color: W } },
  ], { x: 0.5, y: 4.35, w: 9, h: 0.5, fontSize: 10, valign: "top" });

  // ======================= 7. COMO FUNCIONA =======================
  s = pres.addSlide({ masterName: "LIGHT", sectionTitle: "Solução" });
  kicker(s, "Funcionalidades e dados entregues", OL);
  s.addText("COMO FUNCIONA, PASSO A PASSO", { placeholder: "title" });
  const steps = [
    ["01", "Prefeitura publica a chamada", "o sistema lê o edital e lista os alimentos pedidos"],
    ["02", "Produtor recebe um áudio", "\"Seu Antônio, a escola quer 300 kg de macaxeira\""],
    ["03", "Responde falando", "voz vira texto (IA) e entra como oferta"],
    ["04", "Oferta é somada", "o sistema junta vizinhos para fechar o volume"],
    ["05", "Painel e rota", "prefeitura acompanha a meta; coleta é agendada"],
  ];
  steps.forEach((st, i) => {
    const x = 0.5 + i * 1.84;
    T(s, st[0], { x, y: 1.55, w: 1.6, h: 0.55, fontFace: "Century Gothic", fontSize: 30, color: i % 2 ? OR : OL });
    if (i < steps.length - 1)
      s.addShape(pres.shapes.LINE, { x: x + 0.85, y: 1.83, w: 0.85, h: 0, line: { color: HEX.mid, width: 1, endArrowType: "triangle" } });
    T(s, st[1], { x, y: 2.2, w: 1.65, h: 0.5, fontSize: 11, bold: true, color: K, valign: "top" });
    T(s, st[2], { x, y: 2.75, w: 1.65, h: 0.9, fontSize: 9, color: G, valign: "top" });
  });
  card(s, 0.5, 3.8, 9, 0.95, false);
  T(s, [
    { text: "Dados usados: ", options: { bold: true, color: K } },
    { text: "FNDE (compras da agricultura familiar e repasses), IBGE Censo Agro, INEP Censo Escolar, preços Conab, CAF/MDA e as ofertas registradas por voz.\n", options: { color: G } },
    { text: "Entregue ao usuário: ", options: { bold: true, color: K } },
    { text: "produtor ouve oportunidades e preço de referência; prefeitura vê % da meta, oferta disponível e sugestão de cardápio.", options: { color: G } },
  ], { x: 0.7, y: 3.88, w: 8.6, h: 0.8, fontSize: 10, valign: "middle" });

  // ======================= 8. BENEFÍCIOS E INDICADORES =======================
  s = pres.addSlide({ masterName: "LIGHT", sectionTitle: "Solução" });
  kicker(s, "Benefícios, impactos e indicadores", OL);
  s.addText("O QUE MUDA, E COMO VAMOS MEDIR", { placeholder: "title" });
  const bens = [
    ["Renda no campo", "dinheiro público vira renda para famílias perto da escola"],
    ["Comida de verdade", "mais alimentos frescos e regionais no prato do aluno"],
    ["Prefeitura em dia", "meta legal cumprida, com prestação de contas rastreável"],
    ["Menos perda e frete", "rotas coletivas reduzem custo e desperdício"],
  ];
  T(s, "BENEFÍCIOS ESPERADOS", { x: 0.5, y: 1.45, w: 4, h: 0.3, fontSize: 10, bold: true, color: OL });
  bens.forEach((b, i) => {
    const y = 1.85 + i * 0.72;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: y + 0.05, w: 0.18, h: 0.18, fill: { color: i % 2 ? HEX.orange : HEX.olive }, line: { type: "none" } });
    T(s, b[0], { x: 0.85, y, w: 3.4, h: 0.28, fontSize: 12, bold: true, color: K });
    T(s, b[1], { x: 0.85, y: y + 0.28, w: 3.8, h: 0.3, fontSize: 10, color: G });
  });
  T(s, "INDICADORES DE IMPACTO", { x: 4.8, y: 1.45, w: 4, h: 0.3, fontSize: 10, bold: true, color: OR });
  const hdr = (t) => ({ text: t, options: { bold: true, color: HEX.white, fill: { color: HEX.black } } });
  s.addTable([
    [hdr("Indicador"), hdr("Meta piloto (1 ano)")],
    ["% da verba do PNAE comprada da agric. familiar", "≥ 45% nos municípios do piloto"],
    ["Produtores com 1ª venda ao PNAE", "+300 famílias"],
    ["Tempo do edital ao contrato", "−30%"],
    ["Chamadas públicas desertas", "−50%"],
    ["Custo de frete por kg entregue", "−20%"],
  ], { x: 4.8, y: 1.85, w: 4.7, colW: [2.75, 1.95], fontSize: 9, fontFace: "Arial", color: HEX.black,
    fill: { color: HEX.white }, border: { type: "solid", pt: 0.5, color: HEX.light }, rowH: 0.42, valign: "middle" });
  source(s, "Metas do piloto são hipóteses do grupo a validar; escala prevista: 10 municípios do Nordeste no piloto, depois expansão por consórcios intermunicipais.", false);

  // ======================= 9. ODS =======================
  s = pres.addSlide({ masterName: "DARK", sectionTitle: "Solução" });
  kicker(s, "ODS atendidos pela solução", OR);
  s.addText("UMA IDEIA LOCAL, UM IMPACTO GLOBAL", { placeholder: "title" });
  const ods = [
    ["2", "FOME ZERO E AGRICULTURA SUSTENTÁVEL", "DDA63A", "Meta 2.3: aumenta a renda e o acesso a mercados dos pequenos produtores; leva alimento fresco a quem mais precisa."],
    ["4", "EDUCAÇÃO DE QUALIDADE", "C5192D", "Alimentação adequada melhora a permanência e o aprendizado; a merenda é muitas vezes a principal refeição do aluno."],
    ["10", "REDUÇÃO DAS DESIGUALDADES", "DD1367", "Meta 10.2: inclui produtores rurais com pouca leitura e pouca internet em um mercado público de R$ bilhões."],
  ];
  ods.forEach((o, i) => {
    const x = 0.5 + i * 3.05;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.45, w: 2.9, h: 1.45, fill: { color: o[2] }, line: { type: "none" } });
    T(s, o[0], { x: x + 0.2, y: 1.52, w: 1.2, h: 0.75, fontFace: "Century Gothic", fontSize: 40, bold: true, color: W });
    T(s, o[1], { x: x + 0.2, y: 2.28, w: 2.5, h: 0.55, fontSize: 10, bold: true, color: W, valign: "top" });
    T(s, o[3], { x, y: 3.05, w: 2.9, h: 1.5, fontSize: 10, color: W, valign: "top" });
  });

  // ======================= 10. ARQUITETURA =======================
  pres.addSection({ title: "Tecnologia" });
  s = pres.addSlide({ masterName: "LIGHT", sectionTitle: "Tecnologia" });
  kicker(s, "Arquitetura e tecnologias", OL);
  s.addText("DO DADO PÚBLICO AO ÁUDIO NO CELULAR", { placeholder: "title" });
  // diagrama feito no draw.io (arquitetura_merenda_da_roca.drawio)
  const AR = 2945 / 1650; const ih = 3.7, iw = ih * AR;
  s.addImage({ path: "arquitetura_slide.png", x: 0.5, y: 1.3, w: iw, h: ih, altText: "Diagrama de arquitetura em 5 camadas: origem, ingestão, armazenamento, processamento e IA, consumo; mais faixa de governança e segurança" });
  const lx0 = 0.5 + iw + 0.25, lw = 9.5 - lx0;
  [["FLUXO 1 · DADOS PÚBLICOS", HEX.olive, "Todo mês, FNDE, IBGE, Conab e INMET entram no Data Lake e viram o painel da prefeitura."],
   ["FLUXO 2 · VOZ DO PRODUTOR", HEX.orange, "O áudio vira texto, o motor junta vizinhos e a resposta volta em áudio ou SMS."],
   ["FLUXO 3 · CHAMADA PÚBLICA", HEX.navy, "O edital da prefeitura vira a lista de itens pedidos no PostgreSQL."],
   ["GOVERNANÇA", HEX.black, "Entra ID, Key Vault, Purview e Monitor cobrem acesso, criptografia, linhagem e auditoria."]].forEach((f, i) => {
    const y = 1.35 + i * 0.9;
    T(s, f[0], { x: lx0, y, w: lw, h: 0.22, fontSize: 8, bold: true, color: f[1] });
    T(s, f[2], { x: lx0, y: y + 0.24, w: lw, h: 0.6, fontSize: 8, color: G, valign: "top" });
  });

  // ======================= 10b. FUNÇÃO DE CADA TECNOLOGIA =======================
  s = pres.addSlide({ masterName: "LIGHT", sectionTitle: "Tecnologia" });
  kicker(s, "Arquitetura e tecnologias", OL);
  s.addText("O PAPEL DE CADA TECNOLOGIA", { placeholder: "title" });
  const TH = (t) => ({ text: t, options: { bold: true, color: HEX.white, fill: { color: HEX.black } } });
  const cam = (t, c) => ({ text: t, options: { bold: true, color: c } });
  s.addTable([
    [TH("Tecnologia"), TH("Camada"), TH("O que faz na Merenda da Roça")],
    ["Azure Data Factory", cam("Ingestão", HEX.olive), "Baixa todo mês as bases do FNDE, IBGE, Conab e INMET e registra cada carga"],
    ["WhatsApp Business API + URA", cam("Ingestão", HEX.olive), "Recebe áudios e ligações do produtor e devolve as respostas"],
    ["Azure Data Lake", cam("Armazenamento", HEX.navy), "Guarda o dado bruto (bronze), o tratado (prata) e o pronto para análise (ouro)"],
    ["PostgreSQL", cam("Armazenamento", HEX.navy), "Cadastro de produtores, ofertas e contratos, com chaves e regras de integridade"],
    ["Azure Databricks (Python/Spark)", cam("Processamento", HEX.orange), "Limpa e cruza as bases e calcula o % da meta de cada prefeitura"],
    ["Whisper (IA de voz)", cam("IA", HEX.orange), "Transforma o áudio do produtor em texto: \"tenho 120 kg de macaxeira\""],
    ["Modelo de previsão de safra", cam("IA", HEX.orange), "Estima o que cada região vai colher em cada mês (histórico + clima)"],
    ["Motor de match e rotas (OR-Tools)", cam("IA", HEX.orange), "Junta ofertas de vizinhos para fechar o volume e calcula a rota de coleta"],
    ["Power BI", cam("Consumo", HEX.black), "Painel da prefeitura: % da meta, oferta da região e cardápio pela safra"],
    ["Voz sintetizada + SMS", cam("Consumo", HEX.black), "Responde ao produtor em áudio simples; o SMS confirma quando falta internet"],
  ], { x: 0.5, y: 1.35, w: 9, colW: [2.45, 1.3, 5.25], fontSize: 8.5, fontFace: "Arial", color: HEX.black,
    fill: { color: HEX.white }, border: { type: "solid", pt: 0.5, color: HEX.light }, rowH: 0.31, valign: "middle" });

  // ======================= 11. PROTÓTIPO =======================
  s = pres.addSlide({ masterName: "LIGHT", sectionTitle: "Tecnologia" });
  kicker(s, "Protótipo da solução", OL);
  s.addText("O QUE CADA UM VÊ (E OUVE)", { placeholder: "title" });
  // celular
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.8, y: 1.4, w: 2.1, h: 3.45, rectRadius: 0.2, fill: { color: HEX.black }, line: { type: "none" } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.9, y: 1.6, w: 1.9, h: 3.05, fill: { color: "ECE5DD" }, line: { type: "none" } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.9, y: 1.6, w: 1.9, h: 0.35, fill: { color: "075E54" }, line: { type: "none" } });
  T(s, "Merenda da Roça", { x: 1.0, y: 1.6, w: 1.7, h: 0.35, fontSize: 8, bold: true, color: W, valign: "middle" });
  const bubbles = [
    [false, "▶ ━━━━━ 0:18  \"Bom dia, seu Antônio! A escola municipal quer 300 kg de macaxeira em março.\""],
    [true, "▶ ━━━ 0:07  \"Tenho 120 kg.\""],
    [false, "Juntamos você com 2 vizinhos e fechamos 300 kg. Coleta: 12/03. Aperte 1 para confirmar."],
  ];
  let by = 2.05;
  bubbles.forEach((b) => {
    const h = b[1].length > 60 ? 0.78 : 0.42;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: b[0] ? 1.35 : 0.97, y: by, w: 1.38, h, rectRadius: 0.06, fill: { color: b[0] ? "DCF8C6" : HEX.white }, line: { type: "none" } });
    T(s, b[1], { x: (b[0] ? 1.35 : 0.97) + 0.05, y: by + 0.03, w: 1.28, h: h - 0.06, fontSize: 6.5, color: K, valign: "top" });
    by += h + 0.1;
  });
  T(s, [{ text: "Produtor: ", options: { bold: true, color: K } }, { text: "conversa só por áudio.", options: { color: G } }],
    { x: 0.8, y: 4.88, w: 2.6, h: 0.25, fontSize: 8 });
  // painel prefeitura
  const px = 3.6, py = 1.4;
  s.addShape(pres.shapes.RECTANGLE, { x: px, y: py, w: 5.9, h: 3.45, fill: { color: HEX.white }, line: { color: HEX.mid, width: 0.75 } });
  s.addShape(pres.shapes.RECTANGLE, { x: px, y: py, w: 5.9, h: 0.35, fill: { color: HEX.black }, line: { type: "none" } });
  T(s, "PAINEL DA PREFEITURA  ·  Município exemplo (PE)  ·  dados ilustrativos", { x: px + 0.15, y: py, w: 5.6, h: 0.35, fontSize: 8, color: W, valign: "middle" });
  // KPI cards
  [["Meta 2026", "45%", HEX.black], ["Comprado até agora", "31%", HEX.orange], ["Produtores ativos", "84", HEX.olive]].forEach((k, i) => {
    const x = px + 0.15 + i * 1.9;
    s.addShape(pres.shapes.RECTANGLE, { x, y: py + 0.5, w: 1.75, h: 0.85, fill: { color: "F2F2F2" }, line: { type: "none" } });
    T(s, k[0], { x: x + 0.1, y: py + 0.55, w: 1.6, h: 0.25, fontSize: 8, color: G });
    T(s, k[1], { x: x + 0.1, y: py + 0.8, w: 1.6, h: 0.45, fontFace: "Century Gothic", fontSize: 22, bold: true, color: k[2] });
  });
  // barra de progresso da meta
  s.addShape(pres.shapes.RECTANGLE, { x: px + 0.15, y: py + 1.5, w: 5.6, h: 0.18, fill: { color: HEX.light }, line: { type: "none" } });
  s.addShape(pres.shapes.RECTANGLE, { x: px + 0.15, y: py + 1.5, w: 5.6 * 0.31 / 0.45, h: 0.18, fill: { color: HEX.orange }, line: { type: "none" } });
  T(s, "Progresso até a meta de 45%", { x: px + 0.15, y: py + 1.7, w: 3, h: 0.22, fontSize: 7.5, color: G });
  // calendário de safra
  T(s, "Calendário de safra x cardápio sugerido", { x: px + 0.15, y: py + 1.98, w: 4, h: 0.25, fontSize: 8.5, bold: true, color: K });
  const meses = ["JAN","FEV","MAR","ABR","MAI","JUN"];
  const itens = [["Macaxeira", [0,1,1,1,1,0]], ["Feijão verde", [0,0,1,1,1,1]], ["Acerola", [1,1,1,0,0,0]]];
  meses.forEach((m, j) => T(s, m, { x: px + 1.35 + j * 0.72, y: py + 2.25, w: 0.68, h: 0.2, fontSize: 7, align: "center", color: G }));
  itens.forEach((it, r) => {
    T(s, it[0], { x: px + 0.15, y: py + 2.48 + r * 0.29, w: 1.15, h: 0.24, fontSize: 7.5, color: K, valign: "middle" });
    it[1].forEach((v, j) => s.addShape(pres.shapes.RECTANGLE, { x: px + 1.37 + j * 0.72, y: py + 2.5 + r * 0.29, w: 0.64, h: 0.2,
      fill: { color: v ? (r % 2 ? HEX.orange : HEX.olive) : "F2F2F2" }, line: { type: "none" } }));
  });
  T(s, [{ text: "Prefeitura: ", options: { bold: true, color: K } }, { text: "meta, oferta da região e cardápio pela safra. Números do protótipo são ilustrativos.", options: { color: G } }],
    { x: px, y: 4.88, w: 5.9, h: 0.3, fontSize: 8 });

  // ======================= 12. USO RESPONSÁVEL =======================
  s = pres.addSlide({ masterName: "DARK", sectionTitle: "Tecnologia" });
  kicker(s, "Uso responsável dos dados", OR);
  s.addText("CONFIANÇA ANTES DE TECNOLOGIA", { placeholder: "title" });
  const resp = [
    [fa.FaUserShield, "Privacidade (LGPD)", "Base legal de execução de política pública (art. 7º, III); consentimento claro, por áudio, para o WhatsApp. Coletamos só o necessário: nome, CAF, município, produtos."],
    [fa.FaLock, "Segurança", "CPF pseudonimizado no Data Lake, acesso por perfil (RBAC), criptografia em trânsito e em repouso, trilha de auditoria de cada compra."],
    [fa.FaBalanceScale, "Vieses e inclusão", "Quem não tem celular entra pelo técnico da ATER. A divisão de pedidos prioriza assentados, indígenas e quilombolas, como manda a lei, e não só quem produz mais."],
  ];
  for (let i = 0; i < 3; i++) {
    const r = resp[i]; const x = 0.5 + i * 3.05;
    card(s, x, 1.45, 2.9, 3.3, true);
    await circleIcon(s, r[0], x + 0.25, 1.65, 0.6, i === 1 ? HEX.orange : HEX.olive, HEX.white);
    T(s, r[1], { x: x + 0.25, y: 2.4, w: 2.5, h: 0.3, fontFace: "Century Gothic", fontSize: 13, color: W });
    T(s, r[2], { x: x + 0.25, y: 2.78, w: 2.45, h: 1.9, fontSize: 9.5, color: C.accent4, valign: "top" });
  }

  // ======================= 13. DATAVIZ — DADOS =======================
  pres.addSection({ title: "Data Visualization" });
  s = pres.addSlide({ masterName: "LIGHT", sectionTitle: "Data Visualization" });
  kicker(s, "Data Visualization  ·  Fontes e tratamento", OR);
  s.addText("DADOS REAIS E PÚBLICOS", { placeholder: "title" });
  const H = (t) => ({ text: t, options: { bold: true, color: HEX.white, fill: { color: HEX.black } } });
  s.addTable([
    [H("Fonte"), H("Período"), H("Principais variáveis"), H("Por que usar")],
    ["FNDE: Aquisições da agricultura familiar no PNAE (SigPC)", "2011–2022", "UF, código IBGE, entidade executora, valor transferido, valor comprado da AF, %", "Única base oficial que mede a meta de 30%/45% por município"],
    ["IBGE: Censo 2022, população residente (SIDRA 4709)", "2022", "Código IBGE, município, população", "Classificar o porte e mostrar quem é mais afetado"],
    ["IBGE: Censo Agropecuário 2017", "2017", "Estabelecimentos da agricultura familiar", "Contexto: mostra que a oferta existe"],
  ], { x: 0.5, y: 1.4, w: 9, colW: [2.6, 0.9, 3.0, 2.5], fontSize: 8.5, fontFace: "Arial", color: HEX.black,
    fill: { color: HEX.white }, border: { type: "solid", pt: 0.5, color: HEX.light }, rowH: 0.42, valign: "middle" });
  T(s, [
    { text: "Tratamento realizado: ", options: { bold: true, color: K } },
    { text: "12 planilhas anuais do FNDE em formatos diferentes unidas em uma base (65.071 linhas); cabeçalhos padronizados em snake_case; % de 2018–2019 convertido de 0–100 para 0–1; código IBGE de 2011–2012 recuperado pelo nome do município; % AF recalculado (comprado ÷ transferido); registros sem repasse ou com compra maior que o repasse marcados como inconsistentes e excluídos; porte do município pela população 2022; faixas da meta (0%, <30%, 30–45%, ≥45%).", options: { color: G } },
  ], { x: 0.5, y: 3.25, w: 9, h: 1.45, fontSize: 9.5, valign: "top" });
  source(s, "Links: gov.br/fnde (PNAE · Consultas · Dados da Agricultura Familiar) · apisidra.ibge.gov.br/values/t/4709 · Arquivo anexo: GS_2TSCPW_DataViz_MerendaDaRoca.csv (+ .xlsx com resumos e dicionário).", false);

  // ======================= 14. DATAVIZ — DASHBOARD =======================
  s = pres.addSlide({ masterName: "LIGHT", sectionTitle: "Data Visualization" });
  kicker(s, "Data Visualization  ·  Protótipo do dashboard com dados reais", OR);
  s.addText("ONDE A MERENDA NÃO CHEGA AO CAMPO", { placeholder: "title" });
  const bx = 0.5, byy = 1.35;
  s.addShape(pres.shapes.RECTANGLE, { x: bx, y: byy, w: 9, h: 3.5, fill: { color: HEX.white }, line: { color: HEX.mid, width: 0.75 } });
  ["Ano: 2022 ▾", "Região: Nordeste ▾", "UF ▾", "Porte ▾"].forEach((f, i) => pill(s, f, bx + 0.15 + i * 1.45, byy + 0.1, 1.35, false));
  // 1 · TAMANHO — cartões
  [["36,1%", "da verba das prefeituras foi para a AF", HEX.olive],
   ["69,5%", "das prefeituras abaixo de 45%", HEX.orange],
   ["R$ 109 mi", "faltariam para todas chegarem a 45%", HEX.black]].forEach((k, i) => {
    const y = byy + 0.55 + i * 0.95;
    s.addShape(pres.shapes.RECTANGLE, { x: bx + 0.15, y, w: 1.85, h: 0.85, fill: { color: "F4F4F4" }, line: { type: "none" } });
    T(s, k[0], { x: bx + 0.25, y: y + 0.06, w: 1.7, h: 0.4, fontFace: "Century Gothic", fontSize: 17, bold: true, color: k[2] });
    T(s, k[1], { x: bx + 0.25, y: y + 0.46, w: 1.7, h: 0.35, fontSize: 7, color: G, valign: "top" });
  });
  const axis = { catAxisLabelColor: HEX.gray, valAxisLabelColor: HEX.gray, catAxisLabelFontSize: 7, valAxisLabelFontSize: 7,
    catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", titleFontSize: 8, titleColor: HEX.black, titleFontFace: "+mn-lt",
    dataLabelFontSize: 7, dataLabelFontFace: "+mn-lt", dataLabelColor: HEX.black };
  // 2 · EVOLUÇÃO — linha Brasil x Nordeste
  const anos = ["11","12","13","14","15","16","17","18","19","20","21","22"];
  s.addChart(pres.charts.LINE, [
    { name: "Brasil", labels: anos, values: [7.8,11.2,16.7,21.3,22.5,22.1,21.1,34.4,35.7,16.6,18.9,40.3] },
    { name: "Nordeste", labels: anos, values: [7.4,9.9,15.3,18.0,19.8,22.1,21.4,32.9,34.8,12.5,14.6,36.5] },
    { name: "Meta 30%", labels: anos, values: Array(12).fill(30) },
  ], { ...axis, x: bx + 2.1, y: byy + 0.5, w: 3.4, h: 2.95, chartColors: [HEX.gray, HEX.orange, HEX.olive],
    lineSize: 2, lineDataSymbol: "none", showTitle: true, title: "EVOLUÇÃO · % da verba comprada da AF (2011–2022)",
    valAxisMinVal: 0, valAxisMaxVal: 50, valGridLine: { color: "E6E6E6", size: 0.5 }, catGridLine: { style: "none" },
    showLegend: true, legendPos: "b", legendFontSize: 7, legendFontFace: "+mn-lt", legendColor: HEX.gray });
  // 3 · ONDE — ranking UFs
  s.addChart(pres.charts.BAR, [{ name: "% prefeituras abaixo de 45%",
    labels: ["PI","MA","RN","PE","CE","PB","BA","SE","AL"], values: [87.0,76.1,73.7,70.2,69.9,68.2,62.6,53.7,46.0] }],
    { ...axis, x: bx + 5.55, y: byy + 0.5, w: 1.75, h: 2.95, barDir: "bar", chartColors: [HEX.orange],
      showTitle: true, title: "ONDE · % abaixo de 45%", showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0",
      valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" }, catAxisOrientation: "maxMin",
      valAxisMaxVal: 110, showLegend: false });
  // 4 · QUEM — porte
  s.addChart(pres.charts.BAR, [{ name: "% abaixo de 30%",
    labels: ["Até 20 mil", "20–50 mil", "50–100 mil", "100–900 mil"], values: [43.2, 35.0, 27.4, 20.0] }],
    { ...axis, x: bx + 7.35, y: byy + 0.5, w: 1.55, h: 2.95, barDir: "col", chartColors: [HEX.olive],
      showTitle: true, title: "QUEM · % abaixo de 30% por porte", showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0",
      valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" }, valAxisMaxVal: 55, showLegend: false });
  s.addNotes("Dados: FNDE/SigPC (preliminares) + IBGE Censo 2022. Cartões, ranking e porte: prefeituras do Nordeste em 2022 com dados válidos (1.670). Linha: todas as entidades executoras com dados válidos. Metrópoles (4 municípios) omitidas do gráfico de porte por amostra pequena. Um mapa coroplético por município entra na versão em Power BI.");

  // ======================= 15. DATAVIZ — INSIGHTS =======================
  s = pres.addSlide({ masterName: "DARK", sectionTitle: "Data Visualization" });
  kicker(s, "Data Visualization  ·  Insights", OR);
  s.addText("O QUE OS DADOS JÁ MOSTRAM", { placeholder: "title" });
  const ins = [
    ["70%", "das prefeituras do Nordeste (1.160 de 1.670) ficariam abaixo da nova meta de 45% com o desempenho de 2022, e 40% não chegaram nem aos 30%. Faltariam R$ 109 milhões por ano indo para o campo.", HEX.orange],
    ["43% × 20%", "Cidades de até 20 mil habitantes descumprem os 30% duas vezes mais que as de 100 a 900 mil: têm menos equipe para montar chamadas públicas. O Painel da Prefeitura automatiza essa parte.", HEX.olive],
    ["PI 87%", "No Piauí, 87% das prefeituras estão abaixo de 45% e só 21,5% da verba vai para a agricultura familiar: o pior do Nordeste e o ponto de partida do piloto.", HEX.white],
  ];
  ins.forEach((it, i) => {
    const y = 1.45 + i * 1.12;
    T(s, it[0], { x: 0.5, y, w: 2.2, h: 0.9, fontFace: "Century Gothic", fontSize: 24, bold: true, color: it[2], valign: "middle" });
    T(s, it[1], { x: 2.8, y, w: 6.7, h: 0.9, fontSize: 11, color: W, valign: "middle" });
  });
  source(s, "Fonte: cálculo do grupo sobre FNDE/SigPC 2022 (dados preliminares) e IBGE Censo 2022; prefeituras do Nordeste com dados válidos. Base anexa: GS_2TSCPW_DataViz_MerendaDaRoca.csv.", true);

  // ======================= 16. ENCERRAMENTO =======================
  pres.addSection({ title: "Encerramento" });
  s = pres.addSlide({ masterName: "COVER", sectionTitle: "Encerramento" });
  mosaic(s, 0, 0, 6, 12, 0.4875, [2,0,1,0,2,1, 0,1,0,2,0,0, 1,0,2,0,1,0, 0,2,0,1,0,2], [HEX.olive, "4A4A4A"]);
  T(s, "OLHE AO REDOR.", { x: 3.4, y: 1.3, w: 6.2, h: 0.6, fontFace: "Century Gothic", fontSize: 30, color: OL });
  T(s, "A PRÓXIMA REFEIÇÃO DA ESCOLA PODE ESTAR PLANTADA DO LADO DELA.", { x: 3.4, y: 1.95, w: 6.2, h: 1.2, fontFace: "Century Gothic", fontSize: 20, color: W, valign: "top" });
  T(s, "LINK DO VÍDEO PITCH", { x: 3.4, y: 3.5, w: 6, h: 0.3, fontSize: 10, bold: true, color: OR, charSpacing: 2 });
  T(s, "https://youtu.be/  (inserir link público do YouTube)", { x: 3.4, y: 3.85, w: 6, h: 0.35, fontSize: 14, color: W });
  T(s, "Merenda da Roça  ·  Global Solution 2026.2  ·  CitizenTech", { x: 3.4, y: 4.95, w: 6, h: 0.25, fontSize: 9, color: C.accent4 });

  const out = "GS_2TSCPW_Pitch_MerendaDaRoca.pptx";
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log("ok", out);
})().catch((e) => { console.error(e); process.exit(1); });
