                    onChange({
                      finalidade_compra: val,
                      tipo_adquirente: val === 'ORGAO_PUBLICO_CONSUMO' || val === 'SUPRIMENTO_FUNDOS' ? 'ORGAO_PUBLICO_ESTADUAL' : operacao.tipo_adquirente
                    });
