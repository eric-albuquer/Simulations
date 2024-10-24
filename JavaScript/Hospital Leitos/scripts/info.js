class Condicao {
    static livre = 0
    static ocupado = 1
    static reservado = 2
    static limpeza = 3
    static manutencao = 4
    static desativado = 6
    static transferencia = 7
}

class TipoLeito {
    static enfermaria = 0
    static UTI = 1
    static semi_intensiva = 2
    static isolamento = 3
    static quarto_privado = 4
}

class Equipamentos {
    static monitores_sinais = 0
    static suporte_respiratorio = 1
    static dispositivo_infusao = 2
    static cama_ajustavel = 3
    static suporte_renal = 4
    static suporte_neurologico = 5
    static suporte_cardiovascular = 6
    static suporte_temperatura = 7
    static aspiracao = 8
    static imobilizacao = 9
    static nebulizacao = 10
    static videomonitoramento = 11
}

class TipoInternacao {
    static eletiva = 0
    static emergencia = 1
    static urgencia = 2
    static clinica = 3
    static cirurgica = 4
    static obstetrica = 5
    static pisiquiatrica = 6
}

class Sexo {
    static masculino = 0
    static feminino = 1
}

function keyName(obj, value) {
    for (const key in obj) {
        if (obj[key] === value) {
            return key
        }
    }
    return null
}

function timeHours(start, end){
    return (end - start) / 3600
}

function timeMinutes(start, end){
    return (end - start) / 3600000
}