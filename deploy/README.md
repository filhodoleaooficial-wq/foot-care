# Deploy PéSaúde com Supabase Self-Hosted

## Requisitos

- VPS com Docker e Docker Compose
- Traefik já configurado (proxy reverso com SSL)
- Domínios apontando para o IP da VPS
- Git

## Estrutura

```
meu-p/
├── deploy/
│   ├── docker-compose.yml    # Stack completa
│   ├── kong.yml              # Config do Kong (API Gateway)
│   ├── .env.example          # Template de variáveis
│   ├── generate-keys.js      # Gera chaves JWT
│   └── deploy.sh             # Script de deploy
├── supabase/
│   └── functions/            # Edge Functions (client-login, etc.)
├── Dockerfile                # Frontend
├── nginx.conf                # Nginx SPA config
└── src/                      # Código fonte
```

## Passo a Passo

### 1. Clone o repositório na VPS

```bash
git clone https://github.com/carlosrs120860-lab/meu-p.git /opt/meu-p
cd /opt/meu-p
```

### 2. Configure as variáveis de ambiente

```bash
cd deploy
cp .env.example .env
node generate-keys.js   # Gera JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY
nano .env               # Preencha os domínios e configure SMTP
```

### 3. Configure os domínios no Traefik

Edite `docker-compose.yml` e ajuste os domínios nos labels:
- `APP_DOMAIN` → app.seudominio.com (frontend)
- `API_DOMAIN` → api.seudominio.com (Supabase API via Kong)
- `STUDIO_DOMAIN` → studio.seudominio.com (Admin Studio)

Certifique-se que os registros DNS apontam para o IP da VPS.

### 4. Verifique a rede do Traefik

```bash
docker network create traefik   # Só se não existir
```

### 5. Execute o deploy

```bash
./deploy.sh
```

### 6. Configure o frontend

Edite `src/.env` local (ou na VPS antes do build) com as URLs corretas:

```env
VITE_SUPABASE_URL=https://api.seudominio.com
VITE_SUPABASE_PUBLISHABLE_KEY=<ANON_KEY gerada>
VITE_SUPABASE_PROJECT_ID=meu-projeto
```

**IMPORTANTE**: O frontend é buildado durante o Docker build. O `.env` usado será o do contexto do build.

### 7. Migre os dados do Supabase Cloud

```bash
# No Supabase Cloud: Settings > Database > Database backup > Download dump
# Envie o dump.sql para a VPS e restaure:
docker compose exec -T db psql -U postgres -d supabase < dump.sql
```

Ou use o script:
```bash
./deploy.sh migrate
```

### 8. Acesse

| Serviço    | URL                                    |
|------------|----------------------------------------|
| App        | https://app.seudominio.com             |
| API        | https://api.seudominio.com             |
| Studio     | https://studio.seudominio.com          |

## Comandos Úteis

```bash
./deploy.sh up        # Subir containers
./deploy.sh down      # Derrubar
./deploy.sh logs      # Ver logs
./deploy.sh restart   # Reiniciar
./deploy.sh build     # Rebuildar frontend
```

## Backup do Banco

```bash
docker compose exec db pg_dump -U postgres -d supabase > backup_$(date +%Y%m%d).sql
```

## Portainer

Adicione a stack pelo Portainer:
1. Acesse Portainer → Stacks → Add stack
2. Nome: `pesaude`
3. Upload `docker-compose.yml` e `kong.yml`
4. Preencha as variáveis de ambiente
5. Deploy the stack
