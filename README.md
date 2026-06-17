# Ronda Smart

Prototipo navegavel de um SaaS para controle de rondas, vigilancia e seguranca em condominios.

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000/login`.

## Fluxos de demo

- Administrador: use o seletor na tela de login e entre no painel em `/admin/dashboard`.
- Vigilante: use o seletor na tela de login e entre no app mobile em `/mobile/home`.
- PWA: em um navegador mobile, abra o endereco local/rede, use o botao "Instalar App" ou "Adicionar a Tela Inicial".

Nao ha backend, banco de dados ou autenticacao real. Todos os dados sao mockados.

## Deploy em servidor Linux

Requisitos:

- Node.js 20 LTS ou superior
- npm
- Git
- PM2 ou outro gerenciador de processo

Exemplo:

```bash
git clone https://github.com/TIGTM/rondasmart.git
cd rondasmart
npm ci
npm run build
npm install -g pm2
pm2 start npm --name ronda-smart -- start
pm2 save
```

Por padrao o Next roda na porta `3000`. Configure o proxy reverso do Apache/Nginx para apontar o dominio para `http://127.0.0.1:3000`.
