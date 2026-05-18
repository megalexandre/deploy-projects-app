# language: pt

Funcionalidade: Concessionárias

  Contexto:
    Dado que estou autenticado como administrador
    E que estou na pagina de concessionarias

  Cenario: Cadastrar uma nova concessionaria
    Quando eu preencho o campo "Nome *" com "CEMIG Teste"
    E eu preencho o campo "Sigla" com "CMG"
    E eu preencho o campo "Código" com "MG01"
    E eu preencho o campo "Região" com "Sudeste"
    E eu clico em "Cadastrar Concessionária"
    Entao devo ver "CEMIG Teste" na tabela de concessionarias

  Cenario: Buscar concessionaria pelo nome
    Quando eu busco por "CEMIG"
    Entao devo ver apenas concessionarias que contem "CEMIG"

  Cenario: Editar uma concessionaria existente
    Dado que existe uma concessionaria chamada "CEMIG Teste" na tabela
    Quando eu clico em editar a concessionaria "CEMIG Teste"
    Entao devo ver o formulario com titulo "Editar Concessionária"
    E o campo "Nome *" deve conter "CEMIG Teste"
