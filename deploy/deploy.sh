#!/bin/bash
# =============================================================
# Deploy Script - PéSaúde + Supabase Self-Hosted
# =============================================================
# Uso:
#   chmod +x deploy.sh
#   ./deploy.sh                # Deploy completo
#   ./deploy.sh build          # Só buildar a imagem
#   ./deploy.sh up             # Só subir containers
#   ./deploy.sh down           # Derrubar tudo
#   ./deploy.sh logs           # Ver logs
#   ./deploy.sh restart        # Reiniciar
#   ./deploy.sh migrate        # Restaurar dump do banco
# =============================================================

set -e

COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

cd "$(dirname "$0")"

case "${1:-all}" in
  build)
    echo "=== Buildando imagem do frontend ==="
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build frontend
    ;;
  up)
    echo "=== Subindo containers ==="
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    echo "=== Pronto! ==="
    echo "Frontend: https://$(grep APP_DOMAIN "$ENV_FILE" | cut -d= -f2)"
    echo "API:      https://$(grep API_DOMAIN "$ENV_FILE" | cut -d= -f2)"
    echo "Studio:   https://$(grep STUDIO_DOMAIN "$ENV_FILE" | cut -d= -f2)"
    ;;
  down)
    echo "=== Derrubando containers ==="
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    ;;
  restart)
    echo "=== Reiniciando ==="
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    ;;
  logs)
    echo "=== Logs ==="
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f
    ;;
  migrate)
    echo "=== Restaurando dump do banco ==="
    echo "Coloque o arquivo dump.sql em deploy/ e execute:"
    echo "cat dump.sql | docker exec -i \$(docker compose ps -q db) psql -U postgres -d supabase"
    ;;
  all|*)
    echo "=== Build + Deploy completo ==="
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build frontend
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    echo "=== Deploy concluído! ==="
    echo "Frontend: https://$(grep APP_DOMAIN "$ENV_FILE" | cut -d= -f2)"
    echo "API:      https://$(grep API_DOMAIN "$ENV_FILE" | cut -d= -f2)"
    echo "Studio:   https://$(grep STUDIO_DOMAIN "$ENV_FILE" | cut -d= -f2)"
    ;;
esac
