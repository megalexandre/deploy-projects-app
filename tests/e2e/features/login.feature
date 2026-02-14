# language: pt

Funcionalidade: Login

  Como usuario autenticado
  Quero acessar o sistema
  Para visualizar o dashboard

  Cenario: Login com credenciais validas

    Dado que estou na pagina de login
    Quando eu preencho o email "admin@opjengenharia.com.br"
    E eu preencho a senha "admin123"
    E eu clico em "Entrar"
    Entao devo ver a pagina de Dashboard


    
