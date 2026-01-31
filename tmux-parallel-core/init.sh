#!/bin/bash
# Soccer Team Multi-Agent System - Initial Setup

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Soccer Team Multi-Agent System Setup ==="
echo ""

# Check dependencies
echo "Checking dependencies..."

if ! command -v tmux &> /dev/null; then
  echo "ERROR: tmux is not installed"
  echo "  brew install tmux"
  exit 1
fi
echo "  [OK] tmux"

if ! command -v claude &> /dev/null; then
  echo "WARNING: claude CLI not found"
  echo "  Install Claude Code to use this system"
else
  echo "  [OK] claude"
fi

# Set permissions
echo ""
echo "Setting permissions..."
chmod +x "$SCRIPT_DIR/start.sh"
chmod +x "$SCRIPT_DIR/init.sh"
echo "  [OK] Scripts are executable"

# Verify structure
echo ""
echo "Verifying directory structure..."

DIRS=(
  "director"
  "captain"
  "player1" "player2" "player3"
  "player1/specs" "player2/specs" "player3/specs"
  "project"
  "queue"
  "queue/captain_to_players"
)

for dir in "${DIRS[@]}"; do
  if [ ! -d "$SCRIPT_DIR/$dir" ]; then
    mkdir -p "$SCRIPT_DIR/$dir"
    echo "  Created: $dir"
  fi
done
echo "  [OK] All directories exist"

# Verify symlinks
echo ""
echo "Verifying symlinks..."
for i in 1 2 3; do
  LINK="$SCRIPT_DIR/player$i/project"
  if [ ! -L "$LINK" ]; then
    ln -sf ../project "$LINK"
    echo "  Created: player$i/project -> ../project"
  fi
done
echo "  [OK] Symlinks configured"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Add your project files to: $SCRIPT_DIR/project/"
echo "  2. Run: ./start.sh"
echo "  3. Attach to director: tmux attach-session -t director"
echo ""
