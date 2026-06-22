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

No servidor GTM, nao use a porta `3000`, pois ela pertence ao helpdesk. Use `3100` para este prototipo.

### Deploy com Docker

```bash
cd /var/www
git clone https://github.com/TIGTM/rondasmart.git
cd rondasmart
docker compose up -d --build
docker compose ps
curl -I http://127.0.0.1:3100/login
```

Link externo esperado:

```text
http://129.121.40.94:3100/login
```

Se a porta 3100 ainda nao estiver liberada:

```bash
csf -p 3100
csf -r
```

Para atualizar:

```bash
cd /var/www/rondasmart
git pull
docker compose up -d --build
```
