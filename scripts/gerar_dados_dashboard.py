"""Gera docs/data.js para o dashboard interativo a partir da base do Data Viz (prefeituras com dados válidos)."""
import json, sys
import pandas as pd
csv, out = sys.argv[1], sys.argv[2]
b = pd.read_csv(csv, sep=";", decimal=",", encoding="utf-8-sig")
v = b[(b.flag_inconsistencia == "NAO") & (b.esfera == "MUNICIPAL")].copy()
PORTES = ["Pequeno I (ate 20 mil)", "Pequeno II (20-50 mil)", "Medio (50-100 mil)", "Grande (100-900 mil)", "Metropole (> 900 mil)"]
v["porte"] = v["porte_municipio"].map({p: i for i, p in enumerate(PORTES)}).fillna(-1).astype(int)
REG = {"Norte": "N", "Nordeste": "NE", "Centro-Oeste": "CO", "Sudeste": "SE", "Sul": "S"}
rows = []
for r in v.itertuples():
    rows.append([int(r.ano), r.uf, REG[r.regiao], (r.municipio if isinstance(r.municipio, str) else r.entidade_executora.title()),
                 int(r.porte), round(float(r.valor_transferido_fnde)), round(float(r.valor_aquisicao_af))])
js = "window.DADOS=" + json.dumps({"portes": ["Até 20 mil", "20 a 50 mil", "50 a 100 mil", "100 a 900 mil", "Mais de 900 mil"],
                                    "regioes": REG, "linhas": rows}, ensure_ascii=False, separators=(",", ":")) + ";"
open(out, "w", encoding="utf-8").write(js)
print(len(rows), "linhas,", round(len(js) / 1e6, 2), "MB")
