"""Gera arquitetura_merenda_da_roca.drawio (ícones oficiais Azure da biblioteca azure2 do draw.io)."""
from xml.sax.saxutils import escape

cells, bg, edges_, n = [], [], [], [1]
def nid():
    n[0] += 1
    return f"c{n[0]}"

def add(value, style, x, y, w, h, parent="1", vertex=True, cid=None):
    cid = cid or nid()
    cells.append(f'<mxCell id="{cid}" value="{escape(value, {chr(34): "&quot;"})}" style="{style}" vertex="1" parent="{parent}">'
                 f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>')
    return cid

def edge(src, tgt, label="", color="#333333", dashed=False, exit=None, entry=None):
    st = (f"edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor={color};strokeWidth=1.6;endArrow=block;endFill=1;"
          f"fontSize=10;fontColor=#444444;labelBackgroundColor=#FFFFFF;fontFamily=Arial;" + ("dashed=1;" if dashed else ""))
    if exit: st += f"exitX={exit[0]};exitY={exit[1]};exitDx=0;exitDy=0;"
    if entry: st += f"entryX={entry[0]};entryY={entry[1]};entryDx=0;entryDy=0;"
    cid = nid()
    edges_.append(f'<mxCell id="{cid}" value="{escape(label)}" style="{st}" edge="1" parent="1" source="{src}" target="{tgt}">'
                 f'<mxGeometry relative="1" as="geometry"/></mxCell>')

ICON = ("image;aspect=fixed;html=1;points=[];align=center;verticalLabelPosition=bottom;verticalAlign=top;"
        "fontSize=11;fontFamily=Arial;fontColor=#000000;whiteSpace=wrap;labelWidth=180;labelBackgroundColor={bgc};image=img/lib/azure2/{p}")
def icon(parent, rel_x, rel_y, path, label, size=54, bgc="#F4F4F4"):
    return add(label, ICON.format(p=path, bgc=bgc), rel_x, rel_y, size, size, parent)

# ---------- título ----------
add("MERENDA DA ROÇA · ARQUITETURA DE DADOS", "text;html=1;fontFamily=Century Gothic;fontSize=26;fontColor=#000000;align=left;verticalAlign=middle;", 40, 10, 900, 44)
add("Do dado público e da voz do produtor até o painel da prefeitura e a resposta no celular", "text;html=1;fontFamily=Arial;fontSize=13;fontColor=#6E6E6E;align=left;", 40, 50, 900, 24)

# ---------- camadas (swimlanes) ----------
COLW, GAP, X0, Y0, H = 270, 20, 40, 90, 630
lanes = [("1 · ORIGEM", "#6E6E6E"), ("2 · INGESTÃO", "#829B4D"), ("3 · ARMAZENAMENTO", "#092D4C"),
         ("4 · PROCESSAMENTO E IA", "#F67024"), ("5 · CONSUMO", "#000000")]
L = []
for i, (t, c) in enumerate(lanes):
    bg.append(f'<mxCell id="bg{i}" value="" style="rounded=0;fillColor=#F4F4F4;strokeColor=none;" vertex="1" parent="1"><mxGeometry x="{X0 + i * (COLW + GAP)}" y="{Y0}" width="{COLW}" height="{H}" as="geometry"/></mxCell>')
    L.append(add(t, f"swimlane;html=1;startSize=34;fillColor={c};fontColor=#FFFFFF;strokeColor=#D0D0D0;swimlaneFillColor=none;"
                    f"fontStyle=1;fontFamily=Arial;fontSize=13;rounded=0;", X0 + i * (COLW + GAP), Y0, COLW, H))
lx = lambda i: X0 + i * (COLW + GAP)

# faixas de fluxo (rótulos)
def faixa(y, text, color):
    add(text, f"text;html=1;fontFamily=Arial;fontSize=11;fontStyle=1;fontColor={color};align=left;", lx(0) + 8, y, 600, 20)
faixa(Y0 + 40, "FLUXO 1 · DADOS PÚBLICOS (carga mensal)", "#829B4D")
faixa(Y0 + 250, "FLUXO 2 · VOZ DO PRODUTOR (tempo real)", "#F67024")
faixa(Y0 + 460, "FLUXO 3 · CHAMADA PÚBLICA DA PREFEITURA", "#092D4C")

cx = (COLW - 54) // 2
R1, R2, R3 = 90, 300, 500   # y relativo dentro das camadas
# ORIGEM
o_pub = icon(L[0], cx, R1, "general/Files.svg", "<b>Bases públicas</b><br>FNDE (PNAE) · IBGE · Conab · INMET")
o_prod = icon(L[0], cx, R2, "general/Mobile.svg", "<b>Produtor rural</b><br>áudio no WhatsApp ou ligação")
o_pref = icon(L[0], cx, R3, "identity/Users.svg", "<b>Prefeitura</b><br>publica a chamada pública")
# INGESTÃO
i_adf = icon(L[1], cx, R1, "databases/Data_Factory.svg", "<b>Azure Data Factory</b><br>coleta agendada e log de cada carga")
i_api = icon(L[1], cx, R2, "integration/API_Management_Services.svg", "<b>API Management</b><br>WhatsApp Business API + URA")
i_fun = icon(L[1], cx, R3, "compute/Function_Apps.svg", "<b>Azure Functions</b><br>recebe áudios e editais")
# ARMAZENAMENTO
a_lake = icon(L[2], cx, R1, "storage/Data_Lake_Storage_Gen1.svg", "<b>Data Lake</b><br>bronze → prata → ouro")
a_pg = icon(L[2], cx, R2 + 100, "databases/Azure_Database_PostgreSQL_Server.svg", "<b>PostgreSQL</b><br>produtores · ofertas · contratos")
# PROCESSAMENTO E IA
p_dbx = icon(L[3], cx, R1, "analytics/Azure_Databricks.svg", "<b>Azure Databricks</b><br>limpeza, % da meta, previsão de safra")
p_sp = icon(L[3], 40, R2, "ai_machine_learning/Speech_Services.svg", "<b>Speech / Whisper</b><br>voz ↔ texto")
p_ml = icon(L[3], COLW - 94, R2 + 100, "ai_machine_learning/Azure_Machine_Learning.svg", "<b>Motor de match</b><br>junta ofertas e traça rotas")
# CONSUMO
c_pbi = icon(L[4], cx, R1, "analytics/Power_BI_Embedded.svg", "<b>Power BI</b><br>painel da prefeitura e do CAE")
c_nh = icon(L[4], cx, R2, "app_services/Notification_Hubs.svg", "<b>Resposta ao produtor</b><br>áudio sintetizado + SMS")
c_esc = icon(L[4], cx, R3, "general/Dashboard.svg", "<b>Escolas e nutricionista</b><br>cardápio pela safra e entregas")

# ---------- fluxos ----------
OL, OR, NV = "#829B4D", "#F67024", "#092D4C"
edge(o_pub, i_adf, "planilhas e APIs", OL); edge(i_adf, a_lake, "bruto (bronze)", OL)
edge(a_lake, p_dbx, "tratado (prata)", OL); edge(p_dbx, c_pbi, "indicadores (ouro)", OL)
edge(o_prod, i_api, "áudio", OR); edge(i_api, p_sp, "", OR)
edge(p_sp, p_ml, "texto da oferta", OR); edge(p_ml, a_pg, "oferta e contrato", OR)
edge(p_ml, c_nh, "pedido fechado", OR); edge(o_pref, i_fun, "edital", NV)
edge(i_fun, a_pg, "itens pedidos", NV); edge(a_pg, a_lake, "réplica diária", NV, dashed=True)
edge(p_dbx, p_ml, "previsão de safra", OR, dashed=True); edge(c_pbi, c_esc, "", "#000000", exit=(1, 0.5), entry=(1, 0.5))

# ---------- faixa de governança e segurança ----------
GY = Y0 + H + 20
gov = add("GOVERNANÇA, SEGURANÇA E LGPD (transversal a todas as camadas)",
          "swimlane;html=1;startSize=30;horizontal=1;fillColor=#E0E0E0;fontColor=#000000;strokeColor=#D0D0D0;swimlaneFillColor=#FFFFFF;fontStyle=1;fontFamily=Arial;fontSize=12;",
          X0, GY, 5 * COLW + 4 * GAP, 140)
govs = [("identity/Azure_Active_Directory.svg", "<b>Entra ID</b><br>acesso por perfil (RBAC)"),
        ("security/Key_Vaults.svg", "<b>Key Vault</b><br>chaves e segredos (AES-256)"),
        ("databases/Azure_Purview_Accounts.svg", "<b>Purview</b><br>catálogo, glossário e linhagem"),
        ("management_governance/Monitor.svg", "<b>Monitor</b><br>logs de auditoria (180 dias)"),
        ("storage/Recovery_Services_Vaults.svg", "<b>Backup</b><br>cópias redundantes")]
for k, (p, t) in enumerate(govs):
    icon(gov, 80 + k * 290, 40, p, t, size=46, bgc="#FFFFFF")

xml = ('<mxfile host="drawio" type="device"><diagram id="arq" name="Arquitetura Merenda da Roça">'
       '<mxGraphModel dx="1600" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" '
       'page="1" pageScale="1" pageWidth="1500" pageHeight="900" background="#FFFFFF" math="0" shadow="0"><root>'
       '<mxCell id="0"/><mxCell id="1" parent="0"/>' + "".join(bg + edges_ + cells) + '</root></mxGraphModel></diagram></mxfile>')
open("arquitetura_merenda_da_roca.drawio", "w", encoding="utf-8").write(xml)
print("ok", len(cells), "células")
