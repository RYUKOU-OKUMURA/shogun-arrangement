# Setup Guide

Complete setup instructions for tmux-parallel-core multi-agent system.

## Prerequisites

Before installing tmux-parallel-core, ensure you have:

### Required

- **tmux** 3.0 or higher
  ```bash
  # macOS
  brew install tmux

  # Ubuntu/Debian
  sudo apt-get install tmux

  # Check version
  tmux -V
  ```

- **Claude Code CLI**
  ```bash
  # Install via npm
  npm install -g @anthropic-ai/claude-code

  # Or via homebrew (macOS)
  brew install anthropic-ai/tap/claude-code

  # Verify installation
  claude --version
  ```

- **Git** (for version control)
  ```bash
  git --version
  ```

### Optional but Recommended

- **Node.js** 18+ (for running example projects)
- **TypeScript** (for type checking)
- **ESLint** (for linting)
- **Jest** or **Vitest** (for testing)

## Installation

### Step 1: Clone or Download

```bash
# If you have the repository
cd /path/to/shogun-arrangement/tmux-parallel-core

# Or create from scratch
mkdir -p ~/projects/tmux-parallel-core
cd ~/projects/tmux-parallel-core
```

### Step 2: Make Scripts Executable

```bash
chmod +x init.sh start.sh
```

### Step 3: Initialize Directory Structure

```bash
./init.sh
```

This creates:
```
tmux-parallel-core/
├── queue/
│   ├── director_to_captain.yaml
│   └── captain_to_players/
│       ├── player1.yaml
│       ├── player2.yaml
│       └── player3.yaml
├── director/specs/
├── captain/specs/
├── player1/
│   ├── project -> ../project
│   └── specs/
├── player2/
│   ├── project -> ../project
│   └── specs/
├── player3/
│   ├── project -> ../project
│   └── specs/
└── project/
```

### Step 4: Configure Claude Code

Ensure Claude Code is authenticated:

```bash
# Login to Claude
claude login

# Verify authentication
claude auth status
```

## Starting the System

### Basic Start

```bash
./start.sh
```

This creates 3 tmux sessions:
- **director** - Strategic planning
- **captain** - Coordination and monitoring
- **players** - Execution (3 panes: player1, player2, player3)

### Start with Custom Player Count

```bash
./start.sh -n 5  # Use 5 players instead of 3
```

### Setup-Only Mode (Manual Claude Start)

```bash
./start.sh -s  # Create sessions without starting Claude
```

Then manually start Claude in each pane:
```bash
# In each tmux pane
claude
```

## Attaching to Sessions

### View All Sessions

```bash
tmux list-sessions
```

Expected output:
```
director: 1 windows (created Fri Jan 31 10:00:00 2026)
captain: 1 windows (created Fri Jan 31 10:00:00 2026)
players: 1 windows (created Fri Jan 31 10:00:00 2026)
```

### Attach to Specific Session

```bash
# Attach to Director (strategic planning)
tmux attach-session -t director

# Attach to Captain (coordination)
tmux attach-session -t captain

# Attach to Players (execution)
tmux attach-session -t players
```

### Detach from Session

While inside a tmux session, press:
```
Ctrl+b, then d
```

## Configuration

### Customize Player Count

Edit `start.sh`:
```bash
# Find this line
NUM_PLAYERS=${1:-3}

# Change default from 3 to desired number
NUM_PLAYERS=${1:-5}
```

### Customize Agent Instructions

Edit the `agents.md` files:

- **Director**: `director/agents.md`
- **Captain**: `captain/agents.md`
- **Players**: `player1/agents.md`, `player2/agents.md`, `player3/agents.md`

### Add Project Files

Place your actual project in the `project/` directory:

```bash
cd project/

# Example: Initialize a Node.js project
npm init -y
npm install --save-dev typescript jest @types/jest

# Create source directory
mkdir -p src/__tests__
```

All players access this shared project via symlinks:
- `player1/project` → `../project`
- `player2/project` → `../project`
- `player3/project` → `../project`

## First Task Example

### 1. Attach to Director

```bash
tmux attach-session -t director
```

### 2. Give a Task to Director

Type in the Director session:
```
Implement a simple calculator function in TypeScript

Requirements:
- Function: add(a: number, b: number): number
- Write tests first (TDD)
- 80% test coverage
- Use Jest for testing
```

### 3. Director Decomposes and Assigns

Director creates tasks and writes to `queue/director_to_captain.yaml`:
```yaml
command:
  id: cmd_001
  description: "Implement calculator function"
  type: feature
  tdd_required: true

  subtasks:
    - id: subtask_001
      description: "Write tests for add function"
      assigned_to: player1
      type: test

    - id: subtask_002
      description: "Implement add function"
      assigned_to: player2
      type: feature
      depends_on: subtask_001
```

### 4. Director Notifies Captain

Director runs:
```bash
tmux send-keys -t captain:0.0 'New instructions in queue/director_to_captain.yaml. Execute.'
tmux send-keys -t captain:0.0 Enter
```

### 5. Monitor Progress

Detach from Director and attach to Captain:
```bash
# Detach: Ctrl+b, then d
tmux attach-session -t captain
```

Watch Captain relay tasks to Players and update `dashboard.md`.

### 6. View Results

Check `dashboard.md` for progress:
```bash
cat dashboard.md
```

## Troubleshooting

### Sessions Not Created

**Problem**: `./start.sh` runs but sessions don't appear

**Solution**:
```bash
# Kill any existing sessions
tmux kill-session -t director
tmux kill-session -t captain
tmux kill-session -t players

# Try again
./start.sh
```

### Claude Not Authenticated

**Problem**: "Not logged in" error

**Solution**:
```bash
claude login
# Follow authentication prompts
```

### Permission Denied on Scripts

**Problem**: `./start.sh: Permission denied`

**Solution**:
```bash
chmod +x init.sh start.sh
```

### Symlinks Not Working

**Problem**: `player1/project` symlink broken

**Solution**:
```bash
# Remove broken symlink
rm player1/project

# Recreate
ln -s ../project player1/project

# Verify
ls -la player1/project
```

### tmux send-keys Not Working

**Problem**: Messages not received by Captain/Players

**Solution**: Always use 2 separate calls:
```bash
# WRONG
tmux send-keys -t captain:0.0 'message' Enter

# CORRECT
tmux send-keys -t captain:0.0 'message'
tmux send-keys -t captain:0.0 Enter
```

### Queue Files Not Found

**Problem**: "File not found: queue/director_to_captain.yaml"

**Solution**:
```bash
# Re-run initialization
./init.sh

# Or manually create
mkdir -p queue/captain_to_players
touch queue/director_to_captain.yaml
touch queue/captain_to_players/player{1,2,3}.yaml
```

## Advanced Usage

### Background Execution

Keep tmux sessions running in background:
```bash
# Start system
./start.sh

# Detach from all sessions
# Press Ctrl+b, then d in each session

# Sessions continue running in background
# Reattach anytime with:
tmux attach-session -t director
```

### Multiple Projects

Run separate instances for different projects:
```bash
# Project A
cd ~/projects/project-a/tmux-parallel-core
./start.sh

# Project B (use different session names)
cd ~/projects/project-b/tmux-parallel-core
# Edit start.sh to use different session names
./start.sh
```

### Monitor All Sessions

View all activity at once:
```bash
# Split terminal into 3 panes
tmux new-session \; \
  split-window -h \; \
  split-window -v \; \
  select-pane -t 0 \; \
  send-keys 'tmux attach-session -t director' C-m \; \
  select-pane -t 1 \; \
  send-keys 'tmux attach-session -t captain' C-m \; \
  select-pane -t 2 \; \
  send-keys 'tmux attach-session -t players' C-m
```

### Logging

Capture session output to files:
```bash
# Enable logging for a session
tmux pipe-pane -o -t director 'cat >> director.log'
tmux pipe-pane -o -t captain 'cat >> captain.log'
tmux pipe-pane -o -t players 'cat >> players.log'

# Disable logging
tmux pipe-pane -t director
```

## Stopping the System

### Graceful Shutdown

```bash
# Kill all sessions
tmux kill-session -t director
tmux kill-session -t captain
tmux kill-session -t players
```

### Force Kill

```bash
# Kill all tmux sessions
tmux kill-server
```

## Next Steps

After setup, refer to:

1. **[README.md](README.md)** - Architecture overview and quick reference
2. **[docs/AI_WORKFLOW.md](docs/AI_WORKFLOW.md)** - Complete development workflow
3. **[docs/PROMPTING_GUIDE.md](docs/PROMPTING_GUIDE.md)** - How to write effective prompts
4. **[docs/QUALITY_GATES.md](docs/QUALITY_GATES.md)** - Code quality standards

## Getting Help

- **Issues**: Report bugs or request features on GitHub
- **Documentation**: Read the docs/ directory for detailed guides
- **Examples**: Check `project/` for example implementations

## Summary

**Minimum steps to get started:**

1. Install prerequisites (tmux, Claude Code)
2. Run `./init.sh`
3. Run `./start.sh`
4. Attach to director: `tmux attach-session -t director`
5. Give a task to Director
6. Monitor progress in Captain and Players sessions

**That's it! You're ready to use AI-driven parallel development.**
