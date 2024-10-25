function gerarPaciente() {
    const nomesMasculinos = [
        "João", "Pedro", "Lucas", "Gabriel", "Rafael",
        "Thiago", "Felipe", "Gustavo", "Vinícius", "André",
        "Diego", "Fernando", "Leonardo", "Ricardo", "Murilo",
        "Bruno", "Samuel", "Matheus", "Eduardo", "José", "Eric",
        "Erick", "Lucas", "Miguel", "Bruno", "Vagner"
    ];

    const nomesFemininos = [
        "Maria", "Ana", "Juliana", "Fernanda", "Patrícia",
        "Camila", "Larissa", "Juliana", "Aline", "Beatriz",
        "Mariana", "Gabriela", "Danielle", "Letícia", "Priscila",
        "Tatiane", "Roberta", "Carla", "Renata", "Monique", "Regina",
        "Manuela", "Helena"
    ];

    const diagnosticos = ["Gripe",
        "Resfriado Comum",
        "Infecção Urinária",
        "Dor de Cabeça (Cefaleia)",
        "Dor nas Costas",
        "Gastrite",
        "Hipertensão Arterial",
        "Diabetes Tipo 2",
        "Asma",
        "Pneumonia",
        "Fratura",
        "Artrite",
        "Cálculo Renal",
        "Alto Colesterol",
        "Acidente Vascular Cerebral (AVC)",
        "Anemia",
        "Refluxo Gastroesofágico",
        "Tendinite",
        "Hiperplasia Benigna da Próstata (HBP)",
        "Dermatite",
        "Síndrome do Intestino Irritável (SII)"];

    const idade = Math.floor(Math.random() * 80 + 10)
    const peso = Math.floor(Math.random() * 150 + 30)
    const sexo = Math.random() < 0.5 ? Sexo.masculino : Sexo.feminino
    const registro = Math.floor(Math.random() * 100000)
    const tipoInt = Math.floor(Math.random() * Object.keys(TipoInternacao).length)
    const diagnostico = diagnosticos[Math.floor(Math.random() * diagnosticos.length)]
    const historico = []
    const necessidadeEquip = []

    for (const key in Equipamentos) {
        if (Math.random() < 0.4)
            necessidadeEquip.push(Equipamentos[key])
    }

    const necessidadeLeito = Math.floor(Math.random() * Object.keys(TipoLeito).length)

    const planoSaude = Math.random() < 0.5
    const statusPagamento = Math.random() < 0.5

    const nome = sexo ? nomesFemininos[Math.floor(Math.random() * nomesFemininos.length)] : nomesMasculinos[Math.floor(Math.random() * nomesMasculinos.length)]

    const gravidade = Math.floor(Math.random() * 10)

    return new Paciente(
        nome,
        idade,
        sexo,
        peso,
        registro,
        tipoInt,
        diagnostico,
        historico,
        necessidadeEquip,
        necessidadeLeito,
        planoSaude,
        statusPagamento,
        gravidade
    )
}
