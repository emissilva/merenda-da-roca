# Merenda da Roça

**Do pequeno produtor direto para o prato da escola.**

Projeto da equipe **Raiz Digital** para a **Global Solution 2026.2 – CitizenTech** (FIAP · Tecnologia em Data Science, AI, Analytics, Cloud & Data Platforms · turma **2TSCPW**).

**Dashboard interativo:** https://kelvindouglasr.github.io/merenda-da-roca/

## O problema

A lei do PNAE obriga as prefeituras a comprar parte da merenda escolar da agricultura familiar. A meta subiu de **30% para 45% a partir de 2026** (Lei 15.226/2025). Mesmo assim, com os dados de 2022 do FNDE, **70% das prefeituras do Nordeste** (1.160 de 1.670 com dados válidos) ficariam abaixo da nova meta, e 40% não chegaram nem aos 30%. Faltariam cerca de **R$ 109 milhões por ano** indo para o campo.

O pequeno produtor não fica sabendo das chamadas públicas, tem dificuldade com a papelada e, sozinho, não alcança o volume pedido.

## A solução

Uma plataforma que conecta o produtor rural à merenda escolar:

- **Roça por Voz**: o produtor informa a colheita por **áudio no WhatsApp ou por ligação**, sem app e sem precisar ler.
- **Painel da Prefeitura**: mostra quanto falta para a meta de 45%, a safra da região e sugere o cardápio.
- **Rota Coletiva**: junta ofertas de vizinhos para fechar o volume e calcula uma rota de coleta compartilhada.

## Estrutura do repositório

| Pasta | Conteúdo |
|---|---|
| `entregas/` | Pitch (PDF e PPTX), relatório de Governança, Ética e Segurança (PDF e DOCX) e `linkvideo.txt` |
| `dados/` | Base do Data Viz: compras da agricultura familiar no PNAE 2011–2022 (FNDE) + população do Censo 2022 (IBGE). CSV com `;` e vírgula decimal; o XLSX traz resumos e dicionário |
| `arquitetura/` | Diagrama de arquitetura em draw.io (editável) e PNG |
| `docs/` | Dashboard interativo (GitHub Pages), com filtros por ano, região, UF, porte e meta |
| `scripts/` | Código que gera a base, o diagrama, o pitch, o relatório e os dados do dashboard |

## Fontes de dados

- **FNDE – Dados da Agricultura Familiar (SigPC)**, 2011–2022. Dados preliminares, sujeitos a alteração.
  https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pnae/consultas/pnae-dados-da-agricultura-familiar
- **IBGE – Censo 2022, população residente (SIDRA, tabela 4709)**
  https://apisidra.ibge.gov.br/values/t/4709/n6/all/v/93/p/2022
- **IBGE – Censo Agropecuário 2017**: contexto sobre os estabelecimentos da agricultura familiar.

## Como reproduzir

```bash
# 1. Base de dados (baixe as planilhas do FNDE em fnde_raw/ e a população do IBGE em ibge_raw/pop2022.json)
python scripts/montar_base.py fnde_raw ibge_raw/pop2022.json dados

# 2. Diagrama de arquitetura (gera o .drawio; exporte o PNG pelo draw.io)
python scripts/gerar_arquitetura.py

# 3. Pitch e relatório (Node.js)
cd scripts && npm install
node build_governanca.js   # precisa de arquitetura_merenda_da_roca.png na mesma pasta
node build.js              # usa apply_theme.js, da skill de PPTX usada para gerar o deck (variável PPTX_SKILL)
```

## Equipe Raiz Digital

| Integrante | RM |
|---|---|
| Elton Vinicios Almeida de Oliveira (responsável) | 562187 |
| Emerson dos Santos Silva | 562033 |
| Kelvin Douglas Ribeiro Rabelo | 561538 |

**ODS:** 2 (Fome Zero e Agricultura Sustentável), 4 (Educação de Qualidade) e 10 (Redução das Desigualdades).
