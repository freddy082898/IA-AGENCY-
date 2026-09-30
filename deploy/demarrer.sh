#!/usr/bin/env bash
# Lance (ou rattache) la session de l'agence dans tmux, avec le canal Telegram officiel.
# Utilisé par le service systemd ; utilisable à la main : ./deploy/demarrer.sh
set -euo pipefail
cd "$(dirname "$0")/.."

export PATH="$HOME/.local/bin:$HOME/.bun/bin:$PATH"
# Laisse le temps aux validations Telegram (60 min) sans couper l'outil MCP.
export MCP_TOOL_TIMEOUT=3900000

SESSION="agence"
if tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "Session déjà active. Pour la voir : tmux attach -t $SESSION (sortie : Ctrl+B puis D)"
  exit 0
fi

tmux new-session -d -s "$SESSION" \
  "claude --channels plugin:telegram@claude-plugins-official; echo 'Session terminée'; sleep 30"
echo "Agence démarrée. Pour la voir : tmux attach -t $SESSION"
