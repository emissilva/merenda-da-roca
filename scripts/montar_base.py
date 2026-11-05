"""Monta a base do Data Viz da Merenda da Roça a partir das planilhas oficiais do FNDE
(Aquisições da agricultura familiar no PNAE, 2011-2022) + população do Censo 2022 (IBGE/SIDRA, tabela 4709).

Uso: python -I montar_base.py <pasta_fnde_raw> <arquivo_pop2022.json>
"""
import json, sys, unicodedata, warnings
warnings.filterwarnings("ignore")
import pandas as pd

RAW, POP = sys.argv[1], sys.argv[2]

REGIAO = {**dict.fromkeys(["AC","AP","AM","PA","RO","RR","TO"], "Norte"),
          **dict.fromkeys(["AL","BA","CE","MA","PB","PE","PI","RN","SE"], "Nordeste"),
          **dict.fromkeys(["DF","GO","MT","MS"], "Centro-Oeste"),
          **dict.fromkeys(["ES","MG","RJ","SP"], "Sudeste"),
          **dict.fromkeys(["PR","RS","SC"], "Sul")}

def norm(s):
    s = unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode().upper()
    return " ".join(s.split())

def find_col(cols, *keys, exclude=()):
    for c in cols:
        n = norm(c)
        if all(k in n for k in keys) and not any(e in n for e in exclude):
            return c
    return None

def ler_ano(ano):
    f = f"{RAW}/af_{ano}." + ("xls" if ano == 2017 else "xlsx")
    bruto = pd.read_excel(f, sheet_name=0, header=None, nrows=30)
    hdr = next(i for i, r in bruto.iterrows()
               if any(norm(v) == "UF" for v in r if pd.notna(v)))
    df = pd.read_excel(f, sheet_name=0, header=hdr)
    cols = list(df.columns)
    c_uf = find_col(cols, "UF")
    c_ent = find_col(cols, "ENTIDADE")
    c_tr = find_col(cols, "TRAN", "FERIDO") or find_col(cols, "TRANFERIDO")
    c_af = find_col(cols, "AQU", "FAMILIAR", exclude=("PERCENTUAL",))
    c_pc = find_col(cols, "PERCENTUAL")
    c_ib = find_col(cols, "IBGE")
    out = pd.DataFrame({
        "ano": ano,
        "uf": df[c_uf].astype(str).str.strip().str.upper(),
        "codigo_ibge": pd.to_numeric(df[c_ib], errors="coerce") if c_ib else pd.NA,
        "entidade_executora": df[c_ent].astype(str).str.strip(),
        "valor_transferido_fnde": pd.to_numeric(df[c_tr], errors="coerce"),
        "valor_aquisicao_af": pd.to_numeric(df[c_af], errors="coerce"),
        "perc_af_original_fnde": pd.to_numeric(df[c_pc], errors="coerce"),
    })
    if ano in (2018, 2019):  # nesses anos o FNDE publica o percentual em escala 0-100
        out["perc_af_original_fnde"] = out["perc_af_original_fnde"] / 100
    out = out[out["uf"].isin(REGIAO.keys())]          # remove linhas de total/rodapé
    out = out[out["entidade_executora"].ne("nan")]
    return out

base = pd.concat([ler_ano(a) for a in range(2011, 2023)], ignore_index=True)

# esfera da entidade executora
ent = base["entidade_executora"].map(norm)
base["esfera"] = "OUTRA"
base.loc[ent.str.contains("PREF"), "esfera"] = "MUNICIPAL"
base.loc[ent.str.contains("SEC") & ent.str.contains("EST|EDUC"), "esfera"] = "ESTADUAL"
base.loc[ent.str.contains("GOVERNO DO DISTRITO|SECRETARIA DE ESTADO DE EDUCACAO DO DF|DISTRITO FEDERAL"), "esfera"] = "ESTADUAL"
base["regiao"] = base["uf"].map(REGIAO)
base["codigo_ibge"] = base["codigo_ibge"].astype("Int64")

# 2011-2012 não trazem código IBGE: recupera pelo nome do município (PREF MUN DE <nome>) + UF
pop = json.load(open(POP, encoding="utf-8"))[1:]
pop = pd.DataFrame({"codigo_ibge": [int(r["D1C"]) for r in pop],
                    "municipio_uf": [r["D1N"] for r in pop],
                    "populacao_2022": [pd.to_numeric(r["V"], errors="coerce") for r in pop]})
pop["municipio"] = pop["municipio_uf"].str.rsplit(" - ", n=1).str[0]
pop["uf"] = pop["municipio_uf"].str.rsplit(" - ", n=1).str[1]
pop["chave"] = pop["municipio"].map(norm) + "|" + pop["uf"]
mapa_nome = pop.drop_duplicates("chave").set_index("chave")["codigo_ibge"]
sem_cod = base["codigo_ibge"].isna() & base["esfera"].eq("MUNICIPAL")
nome_mun = ent.str.replace(r"^PREF(EITURA)?\.? ?(MUN(ICIPAL)?\.?)? ?(DE|DO|DA|DOS|DAS)? ", "", regex=True)
base.loc[sem_cod, "codigo_ibge"] = (nome_mun[sem_cod] + "|" + base.loc[sem_cod, "uf"]).map(mapa_nome).astype("Int64")

base = base.merge(pop[["codigo_ibge", "municipio", "populacao_2022"]], on="codigo_ibge", how="left")
base.loc[base["esfera"].ne("MUNICIPAL"), ["municipio", "populacao_2022"]] = [pd.NA, pd.NA]

def porte(p):
    if pd.isna(p): return pd.NA
    if p <= 20000: return "Pequeno I (ate 20 mil)"
    if p <= 50000: return "Pequeno II (20-50 mil)"
    if p <= 100000: return "Medio (50-100 mil)"
    if p <= 900000: return "Grande (100-900 mil)"
    return "Metropole (> 900 mil)"
base["porte_municipio"] = base["populacao_2022"].map(porte)

# percentual recalculado e faixas da meta
tr, af = base["valor_transferido_fnde"], base["valor_aquisicao_af"]
base["perc_af"] = (af / tr).where(tr > 0).round(4)
base["flag_inconsistencia"] = ((tr <= 0) | tr.isna() | af.isna() | (base["perc_af"] > 1)).map({True: "SIM", False: "NAO"})
def faixa(p):
    if pd.isna(p): return "Sem repasse valido"
    if p == 0: return "0% (nao comprou)"
    if p < 0.30: return "Abaixo de 30%"
    if p < 0.45: return "30% a 45%"
    return "45% ou mais"
base["faixa_meta"] = base["perc_af"].map(faixa)
base["cumpre_30"] = (base["perc_af"] >= 0.30).where(base["perc_af"].notna()).map({True: "SIM", False: "NAO"})
base["cumpre_45"] = (base["perc_af"] >= 0.45).where(base["perc_af"].notna()).map({True: "SIM", False: "NAO"})

cols = ["ano", "regiao", "uf", "codigo_ibge", "municipio", "entidade_executora", "esfera",
        "populacao_2022", "porte_municipio", "valor_transferido_fnde", "valor_aquisicao_af",
        "perc_af", "perc_af_original_fnde", "faixa_meta", "cumpre_30", "cumpre_45", "flag_inconsistencia"]
base = base[cols].sort_values(["ano", "uf", "entidade_executora"]).reset_index(drop=True)

# ---------- resumos ----------
val = base[base["flag_inconsistencia"].eq("NAO")]
mun = val[val["esfera"].eq("MUNICIPAL")]
def resumo(g):
    return pd.Series({
        "entidades": len(g),
        "valor_transferido": g["valor_transferido_fnde"].sum(),
        "valor_aquisicao_af": g["valor_aquisicao_af"].sum(),
        "perc_af_agregado": g["valor_aquisicao_af"].sum() / g["valor_transferido_fnde"].sum(),
        "perc_entidades_abaixo_30": (g["perc_af"] < 0.30).mean(),
        "perc_entidades_abaixo_45": (g["perc_af"] < 0.45).mean(),
    })
r_ano = val.groupby(["ano", "regiao"]).apply(resumo, include_groups=False).reset_index()
r_br = val.groupby("ano").apply(resumo, include_groups=False).reset_index().assign(regiao="Brasil")
r_ano = pd.concat([r_br, r_ano], ignore_index=True)
r_uf = mun[mun["ano"].eq(2022)].groupby(["regiao", "uf"]).apply(resumo, include_groups=False).reset_index()
r_porte = mun[mun["ano"].eq(2022)].groupby(["regiao", "porte_municipio"]).apply(resumo, include_groups=False).reset_index()

dic = pd.DataFrame([
    ["ano", "inteiro", "Ano de exercício do PNAE", "FNDE"],
    ["regiao", "texto", "Grande região, derivada da UF", "Derivada"],
    ["uf", "texto (2)", "Sigla da UF da entidade executora", "FNDE"],
    ["codigo_ibge", "inteiro (7)", "Código IBGE do município (2011-2012 recuperado pelo nome)", "FNDE / IBGE"],
    ["municipio", "texto", "Nome do município (só esfera municipal)", "IBGE"],
    ["entidade_executora", "texto", "Prefeitura ou secretaria estadual que executa o PNAE", "FNDE"],
    ["esfera", "texto", "MUNICIPAL, ESTADUAL ou OUTRA", "Derivada"],
    ["populacao_2022", "inteiro", "População residente, Censo 2022 (SIDRA tabela 4709)", "IBGE"],
    ["porte_municipio", "texto", "Faixa de porte pela população de 2022", "Derivada"],
    ["valor_transferido_fnde", "decimal (R$)", "Valor repassado pelo FNDE para o PNAE", "FNDE"],
    ["valor_aquisicao_af", "decimal (R$)", "Valor comprado da agricultura familiar", "FNDE"],
    ["perc_af", "decimal (0-1)", "valor_aquisicao_af / valor_transferido_fnde (recalculado)", "Derivada"],
    ["perc_af_original_fnde", "decimal (0-1)", "Percentual publicado pelo FNDE (2018-2019 convertido de 0-100)", "FNDE"],
    ["faixa_meta", "texto", "Sem repasse válido; 0%; abaixo de 30%; 30% a 45%; 45% ou mais", "Derivada"],
    ["cumpre_30", "SIM/NAO", "perc_af >= 30% (meta até 2025)", "Derivada"],
    ["cumpre_45", "SIM/NAO", "perc_af >= 45% (meta a partir de 2026, Lei 15.226/2025)", "Derivada"],
    ["flag_inconsistencia", "SIM/NAO", "SIM se repasse ou compra ausente, repasse <= 0, ou compra maior que o repasse; excluir das análises", "Derivada"],
], columns=["coluna", "tipo", "descricao", "origem"])

fontes = pd.DataFrame([
    ["FNDE - Dados da Agricultura Familiar (PNAE)", "https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pnae/consultas/pnae-dados-da-agricultura-familiar", "2011-2022", "Dados preliminares extraídos do SigPC; sujeitos a alteração"],
    ["IBGE - Censo 2022, população residente (SIDRA 4709)", "https://apisidra.ibge.gov.br/values/t/4709/n6/all/v/93/p/2022", "2022", "Usada para porte do município"],
], columns=["fonte", "link", "periodo", "observacao"])

out = sys.argv[3] if len(sys.argv) > 3 else "."
base.to_csv(f"{out}/GS_2TSCPW_DataViz_MerendaDaRoca.csv", sep=";", decimal=",", index=False, encoding="utf-8-sig")
with pd.ExcelWriter(f"{out}/GS_2TSCPW_DataViz_MerendaDaRoca.xlsx") as xw:
    base.to_excel(xw, "dados", index=False)
    r_ano.to_excel(xw, "resumo_ano_regiao", index=False)
    r_uf.to_excel(xw, "resumo_uf_2022", index=False)
    r_porte.to_excel(xw, "resumo_porte_2022", index=False)
    dic.to_excel(xw, "dicionario", index=False)
    fontes.to_excel(xw, "fontes", index=False)

# ---------- números para os slides ----------
pd.set_option("display.width", 200)
print("linhas:", len(base), "| por ano:", base.groupby("ano").size().to_dict())
print("municipais sem codigo IBGE:", base[(base.esfera == "MUNICIPAL") & base.codigo_ibge.isna()].groupby("ano").size().to_dict())
print("inconsistentes:", base[base.flag_inconsistencia == "SIM"].groupby("ano").size().to_dict())
ne22 = base[(base.ano == 2022) & (base.regiao == "Nordeste") & (base.esfera == "MUNICIPAL")]
print("\nNE 2022 municipais:", len(ne22)); print(ne22["faixa_meta"].value_counts())
print("\nResumo por ano (Brasil e Nordeste):")
print(r_ano[r_ano.regiao.isin(["Brasil", "Nordeste"])].round(3).to_string(index=False))
print("\nUFs Nordeste 2022:"); print(r_uf[r_uf.regiao == "Nordeste"].round(3).to_string(index=False))
print("\nPorte 2022 Nordeste:"); print(r_porte[r_porte.regiao == "Nordeste"].round(3).to_string(index=False))
