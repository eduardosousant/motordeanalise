import pandas as pd
import json

# Lê a planilha a partir da linha de cabeçalho
df = pd.read_excel('Relacao_Completa_NCM_Anexo_X_MT_e_Retencoes_RFB_2026.xlsx', header=3)

ncm_map = {}
for _, row in df.iterrows():
    ncm_raw = str(row['NCM']).strip().replace('.', '')
    if len(ncm_raw) != 8:
        continue

    status_raw = str(row['Status ST (Mato Grosso)'])
    if 'Sujeito à ST' in status_raw:
        status_st = 'ST'
    elif 'Revogado' in status_raw:
        status_st = 'REVOGADO'
    else:
        status_st = 'NAO_ST'

    ncm_map[ncm_raw] = {
        'statusSt': status_st,
        'tabela': str(row['Tabela(s) Anexo X']) if pd.notna(row['Tabela(s) Anexo X']) else '-',
        'segmento': str(row['Segmento(s)']) if pd.notna(row['Segmento(s)']) else '-',
        'cest': str(row['Exemplos de CEST']) if pd.notna(row['Exemplos de CEST']) else '-',
        'descricao': str(row['Descrição Oficial da Mercadoria']).strip() if pd.notna(row['Descrição Oficial da Mercadoria']) else '',
        'irrf': float(row['IR (%)']) if pd.notna(row['IR (%)']) else 1.20,
        'darf': str(row['Código DARF']) if pd.notna(row['Código DARF']) else '6147'
    }

# Salva o arquivo JSON consolidado
with open('src/data/ncm_full_map.json', 'w', encoding='utf-8') as f:
    json.dump(ncm_map, f, ensure_ascii=False, indent=2)

print(f"Sucesso! {len(ncm_map)} NCMs exportados para src/data/ncm_full_map.json")