#!/bin/bash
# Soccer Team Multi-Agent System Startup Script

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLAYER_COUNT=3
SETUP_ONLY=false

# Parse arguments
while getopts "n:sh" opt; do
  case $opt in
    n) PLAYER_COUNT=$OPTARG ;;
    s) SETUP_ONLY=true ;;
    h)
      echo "Usage: $0 [-n player_count] [-s]"
      echo "  -n  Number of players (default: 3)"
      echo "  -s  Setup only (don't start Claude Code)"
      exit 0
      ;;
  esac
done

echo "Starting Soccer Team Multi-Agent System..."
echo "  Players: $PLAYER_COUNT"

# Kill existing sessions
tmux kill-session -t director 2>/dev/null || true
tmux kill-session -t captain 2>/dev/null || true
tmux kill-session -t players 2>/dev/null || true

# Create director session
echo "Creating director session..."
tmux new-session -d -s director -c "$SCRIPT_DIR/director"

# Create captain session
echo "Creating captain session..."
tmux new-session -d -s captain -c "$SCRIPT_DIR/captain"

# Create players session with panes
echo "Creating players session with $PLAYER_COUNT panes..."
tmux new-session -d -s players -c "$SCRIPT_DIR/player1"

for i in $(seq 2 $PLAYER_COUNT); do
  # Create player directory if needed
  PLAYER_DIR="$SCRIPT_DIR/player$i"
  if [ ! -d "$PLAYER_DIR" ]; then
    mkdir -p "$PLAYER_DIR/specs"
    ln -sf ../project "$PLAYER_DIR/project"

    # Create agents.md from template
    sed "s/Player 1/Player $i/g; s/player1/player$i/g; s/subtask_001/subtask_00$i/g; s/players | 0/players | $((i-1))/g" \
      "$SCRIPT_DIR/player1/agents.md" > "$PLAYER_DIR/agents.md"
  fi

  # Create task file if needed
  TASK_FILE="$SCRIPT_DIR/queue/captain_to_players/player$i.yaml"
  if [ ! -f "$TASK_FILE" ]; then
    sed "s/Player 1/Player $i/g; s/player1/player$i/g" \
      "$SCRIPT_DIR/queue/captain_to_players/player1.yaml" > "$TASK_FILE"
  fi

  tmux split-window -t players -c "$PLAYER_DIR"
  tmux select-layout -t players tiled
done

# Final layout adjustment
tmux select-layout -t players tiled

if [ "$SETUP_ONLY" = true ]; then
  echo "Setup complete. Start Claude Code manually in each pane."
  exit 0
fi

# Start Claude Code in each pane
echo "Starting Claude Code in all panes..."

# Director
tmux send-keys -t director:0.0 "claude --instructions-file agents.md"
tmux send-keys -t director:0.0 Enter

# Captain
tmux send-keys -t captain:0.0 "claude --instructions-file agents.md"
tmux send-keys -t captain:0.0 Enter

# Players
for i in $(seq 1 $PLAYER_COUNT); do
  tmux send-keys -t players:0.$((i-1)) "claude --instructions-file agents.md"
  tmux send-keys -t players:0.$((i-1)) Enter
done

echo ""
echo "=== Soccer Team System Started ==="
echo ""
echo "Attach to sessions:"
echo "  tmux attach-session -t director   # Director (strategic planner)"
echo "  tmux attach-session -t captain    # Captain (coordinator)"
echo "  tmux attach-session -t players    # Players (executors)"
echo ""
