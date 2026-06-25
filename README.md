# Ronda Smart

Sistema SaaS/PWA para controle de rondas, vigilancia e seguranca em condominios.

Esta base saiu do prototipo e agora possui:

- Next.js 15 + React + TypeScript
- PWA com `next-pwa`
- PostgreSQL
- Sessao por cookie HTTP-only
- Login real com usuarios seedados
- APIs reais para condominios, vigilantes, pontos, rondas e ocorrencias
- Estrutura multi-tenant com painel master da plataforma e painel do cliente
- Contratos com assinatura eletronica e trilha de evidencias
- Impressao individual ou em lote dos QR Codes
- Docker Compose com app + banco

## Credenciais iniciais

Master Ronda Smart:

```text
admin@rondasmart.com.br
rondasmart-demo
```

Os demais usuarios devem ser criados pelo painel master e pelo painel do cliente.

## Desenvolvimento local

Requisitos:

- Node.js 20
- Docker

Suba o banco:

```bash
docker compose up -d ronda-smart-db
```

Instale dependencias e prepare o banco:

```bash
npm ci
cp .env.example .env.local
npm run db:setup
npm run dev
```

Acesse:

```text
http://localhost:3000/login
```

## Deploy com Docker

No servidor GTM, nao use a porta `3000`, pois ela pertence ao helpdesk. O Ronda Smart usa `3100`.

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

## Observacoes importantes

- O master acessa `/master/clientes` para cadastrar clientes SaaS e usuarios administradores.
- O master acessa `/master/contratos` para gerar, acompanhar e cancelar contratos.
- Cada assinatura registra signatario, documento, e-mail, data/hora, IP, navegador, consentimento e hash SHA-256.
- Configure `PUBLIC_APP_URL` com o dominio HTTPS definitivo para gerar links de assinatura corretos.
- Para identificar a contratada no documento, configure `PROVIDER_LEGAL_NAME`, `PROVIDER_DOCUMENT`, `PROVIDER_ADDRESS` e `PROVIDER_EMAIL`. O nome padrao e `Fluir Tecnologia`.
- O texto contratual fornecido e um modelo operacional e deve ser revisado pelo juridico antes do uso comercial.
- O admin do cliente acessa `/admin/dashboard` e visualiza apenas dados da propria empresa.
- O admin do cliente acessa `/admin/contratos` para consultar e imprimir as copias assinadas da propria empresa.
- Fotos ainda sao armazenadas como URL/metadado; o proximo passo e adicionar MinIO/S3.
- Camera real no celular exige HTTPS em navegadores modernos.
- O schema inicial esta em `db/schema.sql`.
- O seed idempotente esta em `scripts/db-setup.mjs`.
