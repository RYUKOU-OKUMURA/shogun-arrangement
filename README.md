# tmux-parallel-core

Soccer Team style multi-agent orchestration for Claude Code.

## Architecture

```
User (Boss)
    │
    ▼ instructions
┌──────────────┐
│   Director   │  ← Strategic planner (task decomposition, role assignment)
└──────┬───────┘
       │ YAML + send-keys
       ▼
┌──────────────┐
│   Captain    │  ← Coordinator (relay instructions, monitor progress)
└──────┬───────┘
       │ YAML + send-keys
       ▼
┌───────┬───────┬───────┐
│Player1│Player2│Player3│  ← Executors (actual work)
└───┬───┴───┬───┴───┬───┘
    │       │       │
    ▼       ▼       ▼
  Task    Task    Task     ← Sub-agents (via Task tool, as needed)
  Tool    Tool    Tool
```

## Quick Start

```bash
# Initial setup
chmod +x init.sh start.sh
./init.sh

# Start all agents
./start.sh

# Attach to sessions
tmux attach-session -t director   # Strategic planning
tmux attach-session -t captain    # Coordination
tmux attach-session -t players    # Execution
```

**📖 For detailed setup instructions, see [SETUP.md](SETUP.md)**

## Communication Flow

1. **User → Director**: Direct input in director session
2. **Director → Captain**: Write to `queue/director_to_captain.yaml`, then send-keys
3. **Captain → Player**: Write to `queue/captain_to_players/player{N}.yaml`, then send-keys
4. **Player → Captain**: Notify via send-keys after task completion
5. **Captain → Director**: Update `dashboard.md`

### Critical: send-keys must be 2 separate calls!

```bash
# WRONG: Combined (Enter not parsed correctly)
tmux send-keys -t captain:0.0 'message' Enter

# CORRECT: Separate calls
tmux send-keys -t captain:0.0 'message'
tmux send-keys -t captain:0.0 Enter
```

## Directory Structure

```
tmux-parallel-core/
├── start.sh                           # Main startup script
├── init.sh                            # Initial setup
├── SETUP.md                           # Setup guide
├── dashboard.md                       # Progress dashboard
├── project/                           # Shared project files
│
├── docs/                              # Comprehensive documentation
│   ├── AI_WORKFLOW.md                 # TDD workflow guide
│   ├── PROMPTING_GUIDE.md             # Prompt design guide
│   ├── QUALITY_GATES.md               # Quality standards
│   └── IMPLEMENTATION_ROADMAP.md      # Development plan
│
├── director/
│   └── agents.md                      # Director instructions
│
├── captain/
│   └── agents.md                      # Captain instructions
│
├── player1/
│   ├── agents.md                      # Player 1 instructions
│   ├── project -> ../project          # Symlink to shared project
│   └── specs/                         # Design documents
│
├── player2/
│   └── ...
│
├── player3/
│   └── ...
│
└── queue/
    ├── director_to_captain.yaml       # Director → Captain commands
    └── captain_to_players/
        ├── player1.yaml               # Captain → Player 1 tasks
        ├── player2.yaml               # Captain → Player 2 tasks
        └── player3.yaml               # Captain → Player 3 tasks
```

## Customization

### Change player count

```bash
./start.sh -n 5   # Use 5 players instead of 3
```

### Setup only (no Claude Code)

```bash
./start.sh -s     # Create sessions, start Claude manually
```

### Modify instructions

Edit `agents.md` files in each role directory to customize agent behavior.

## Session Reference

| Role | Session | Pane |
|------|---------|------|
| Director | director | 0 |
| Captain | captain | 0 |
| Player 1 | players | 0 |
| Player 2 | players | 1 |
| Player 3 | players | 2 |

## Key Concepts

### Event-Driven (No Polling)

- Never use loops to wait for responses
- Always use YAML files + send-keys notifications
- This saves API credits

### Hierarchy

- **Director**: Receives user commands, decomposes tasks, assigns roles
- **Captain**: Relays instructions to players, monitors progress
- **Players**: Execute tasks, can spawn sub-agents via Task tool

### Sub-agents (Task Tool)

Players can use Claude Code's Task tool to spawn sub-agents for:
- Complex subtasks
- Parallel independent work
- Code review
- Test execution

### Race Condition Prevention

- Each Player has dedicated task files
- No two Players write to the same file

## Documentation

Comprehensive guides for AI-driven development:

- **[Setup Guide](SETUP.md)** - Complete installation and setup instructions
  - Prerequisites and installation
  - Starting and stopping the system
  - Configuration and customization
  - Troubleshooting
  - First task example

- **[AI Workflow](docs/AI_WORKFLOW.md)** - Complete AI-driven development workflow
  - TDD process (RED-GREEN-REFACTOR)
  - Small PR principle (<200 lines)
  - Quality verification steps
  - Communication protocols
  - Best practices and anti-patterns

- **[Prompting Guide](docs/PROMPTING_GUIDE.md)** - Effective prompt design
  - How to provide rich context
  - Success criteria specification
  - Example-driven prompting
  - Common pitfalls and fixes
  - Role-specific prompt templates

- **[Quality Gates](docs/QUALITY_GATES.md)** - Code quality standards
  - Mandatory quality checks (coverage, lint, types)
  - Code quality standards (immutability, error handling)
  - Test quality requirements (AAA pattern, no flaky tests)
  - Monitoring and metrics
  - Threshold definitions (Green/Yellow/Red)

- **[Implementation Roadmap](docs/IMPLEMENTATION_ROADMAP.md)** - Future development plan
  - Phase-by-phase implementation strategy
  - Core functionality automation
  - Testing infrastructure
  - CI/CD integration
  - Advanced features (learning, self-healing)
  - Success metrics and timelines
