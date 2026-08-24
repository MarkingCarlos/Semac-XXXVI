#!/usr/bin/env bash
# Diagnóstico de latência do backend semac.cc — mede o servidor de FORA,
# sem depender do front. Rode várias vezes seguidas: se a 1ª chamada for muito
# mais lenta que as seguintes, é cold start / falta de keep-alive no servidor.
#
# Uso:
#   bash scripts/diagnostico-latencia.sh                 # usa https://semac.cc
#   API=https://semac.cc REPETICOES=10 bash scripts/diagnostico-latencia.sh
#
# Colunas medidas (segundos):
#   dns   = resolução DNS
#   conn  = handshake TCP
#   tls   = handshake TLS (alto e repetido = sem reuso de conexão)
#   ttfb  = tempo até o 1º byte  ← ESTA é a chave: alto = servidor lento
#   total = tempo total
#
# Regra de leitura:
#   ttfb alto e consistente        -> problema no SERVIDOR (API/banco/cold start)
#   ttfb baixo mas app lento       -> problema no CÓDIGO/rede (ver DevTools)

set -u
API="${API:-https://semac.cc}"
REPETICOES="${REPETICOES:-8}"

FMT='dns=%{time_namelookup}  conn=%{time_connect}  tls=%{time_appconnect}  ttfb=%{time_starttransfer}  total=%{time_total}  http=%{http_code}\n'

medir() {
  local nome="$1"; shift
  echo "== $nome =="
  for i in $(seq 1 "$REPETICOES"); do
    printf '  [%02d] ' "$i"
    curl -s -o /dev/null -w "$FMT" "$@"
  done
  echo
}

# Endpoints públicos (não precisam de token)
medir "GET /api/cota (público)"                 "$API/api/cota"
medir "GET /api/tipo-inscricao?ano=2026"        "$API/api/tipo-inscricao?ano=2026"
medir "GET /api/doador/resumo-publico"          "$API/api/doador/resumo-publico"

# Login: mede o POST que trava o botão "Entrar". Usa credenciais falsas só para
# medir o tempo de RESPOSTA do servidor (deve responder 401/400 rápido).
medir "POST /api/auth/login (credencial falsa)" \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"teste-latencia@exemplo.com","senha":"x"}' \
  "$API/api/auth/login"

echo "Dica: para os endpoints protegidos (/api/pessoa/participantes etc.),"
echo "pegue um token real no DevTools (localStorage 'semacSessao') e rode:"
echo "  curl -s -o /dev/null -w \"$FMT\" -H \"Authorization: Bearer <TOKEN>\" \\"
echo "    \"$API/api/pessoa/participantes\""
