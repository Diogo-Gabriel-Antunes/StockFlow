# Deploy Oracle Cloud Always Free por IP

Este guia prepara o StockFlow para rodar em uma VPS Ubuntu na Oracle Cloud Always Free, sem dominio e sem HTTPS nesta fase.

## Resultado esperado

```txt
Frontend:          http://IP_DA_VPS
API via Nginx:     http://IP_DA_VPS/api
Proposta publica: http://IP_DA_VPS/public/quotes/{token}
```

Somente estas portas devem ficar expostas publicamente:

```txt
80  HTTP
22  SSH
```

PostgreSQL, backend `8080` e frontend `3000` ficam acessiveis apenas dentro da rede Docker.

## 1. Criar VPS na Oracle

Use uma instancia Always Free com Ubuntu Server.

Recomendado para demo:

```txt
Shape: VM.Standard.A1.Flex ou VM.Standard.E2.1.Micro
Sistema: Ubuntu Server
Disco: 50 GB ou mais, se disponivel
```

Na VCN/Security List ou Network Security Group, libere apenas:

```txt
TCP 22 origem: seu IP ou 0.0.0.0/0 se necessario
TCP 80 origem: 0.0.0.0/0
```

Nao libere:

```txt
5432
8080
3000
```

## 2. Preparar Ubuntu

Conecte via SSH:

```bash
ssh ubuntu@IP_DA_VPS
```

Instale Docker e Git:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo tee /etc/apt/keyrings/docker.asc >/dev/null
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
```

Saia e entre novamente no SSH para aplicar o grupo `docker`.

Opcionalmente, configure UFW:

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw enable
sudo ufw status
```

## 3. Enviar o projeto

Clone ou envie o repositorio para a VPS:

```bash
git clone <URL_DO_REPOSITORIO> stockflow
cd stockflow
```

## 4. Configurar variaveis de producao

Copie o exemplo:

```bash
cp .env.production.example .env.production
```

Edite:

```bash
nano .env.production
```

Troque todos os valores `IP_DA_VPS` pelo IP publico real.

Exemplo:

```txt
APP_URL=http://129.10.20.30
API_URL=http://129.10.20.30/api
NEXT_PUBLIC_API_URL=http://129.10.20.30/api
NEXT_PUBLIC_PUBLIC_APP_URL=http://129.10.20.30
CORS_ORIGINS=http://129.10.20.30
PUBLIC_QUOTE_BASE_URL=http://129.10.20.30/public/quotes
```

Troque tambem:

```txt
JWT_SECRET
POSTGRES_PASSWORD
DB_PASSWORD
```

Use valores longos e aleatorios.

## 5. Deploy

Execute:

```bash
chmod +x infra/scripts/deploy.sh infra/scripts/backup-db.sh
./infra/scripts/deploy.sh
```

Ou manualmente:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Verifique:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
curl http://localhost/
curl http://localhost/api/q/health
```

No navegador:

```txt
http://IP_DA_VPS
```

## 6. Backup do banco

Execute backup manual:

```bash
./infra/scripts/backup-db.sh
```

Os arquivos ficam em:

```txt
./backups/stockflow-YYYYMMDDHHMMSS.sql.gz
```

Para agendar via cron:

```bash
crontab -e
```

Exemplo diario as 03:00:

```cron
0 3 * * * cd /home/ubuntu/stockflow && ./infra/scripts/backup-db.sh >> backups/backup.log 2>&1
```

## 7. Validacoes de seguranca

Na VPS, confirme que apenas Nginx expõe porta publica da aplicacao:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

O esperado:

```txt
nginx:   0.0.0.0:80->80/tcp
backend: sem porta publicada
frontend: sem porta publicada
postgres: sem porta publicada
```

Confirme portas do sistema:

```bash
sudo ss -tulpn
```

Nao deve haver `0.0.0.0:5432`, `0.0.0.0:8080` ou `0.0.0.0:3000`.

## 8. HTTPS e dominio

Nao configurar Let's Encrypt nesta fase.

Quando houver dominio, uma fase futura pode adicionar:

```txt
HTTPS
Certbot ou Traefik
redirect HTTP -> HTTPS
cookies Secure
headers de seguranca mais fortes
```

## 9. Troubleshooting

Logs:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f nginx
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f backend
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f frontend
```

Rebuild completo:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build --force-recreate
```

Parar:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml down
```

Nao use `down -v` em producao, pois remove volumes do banco.
