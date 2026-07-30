# Minions

**Mission Control for Hermes Agent**

**Наш форк:** основан на [Adolanium/minions](https://github.com/Adolanium/minions) (35 дополнительных фич) с дополнительными доработками.

Hermes Agent is powerful, but running real work on it means juggling terminal sessions, losing track of which job finished, and manually checking on long-running tasks. The more you delegate, the harder it gets to manage.

Minions gives you one screen to create, supervise, and review autonomous Hermes Agent work.

## Quick Start

**Prerequisites:** Node.js 18+ and [Hermes Agent](https://hermes-agent.nousresearch.com)

```bash
git clone https://github.com/akrhin/minions.git
cd sintez-minions
cp .env.example .env   # настрой под себя
npm install
npm run build
npm start
```

Open [http://localhost:6969](http://localhost:6969).

State lives in `~/.minions/` (SQLite).

## Features

- **Kanban board**: see every task at a glance: in progress, in review, done
- **Autonomous execution**: describe what you want in chat, walk away; the agent decides how to get it done
- **Automatic review queue**: successful agent runs move cards to ready for review
- **Live streaming**: watch tool calls, reasoning, and responses in real time
- **Human-in-the-loop**: agents propose completion; you verify and close. Nothing moves to done without your sign-off
- **Per-task model control**: override model and reasoning effort on any task
- **Scheduled Tasks**: create and manage recurring Hermes jobs, history, and output
- **File browser**: see files agents have created in the workspace directory
- **Local-first option**: self-host with SQLite, no account, and no cloud dependency. Your local data stays on your machine
- **Basic auth** (опционально): защита дашборда логином/паролем — см. раздел «Security» ниже

## Additional features (from Adolanium fork)

- Per-task cost display
- Task tags, pinning, templates, export
- Full-text search across transcripts
- Tool call arguments, output, and diffs in chat
- Subagent sessions view
- Memory editor (Hermes memory files)
- Usage and cost analytics dashboard
- MCP server management page
- Models management page
- Math and Mermaid diagram rendering in chat
- Log viewer
- Git branch display in file browser
- Auto-restart worker on crash
- Agent run timeout
- Notifications for attention-needed tasks
- Scheduled task failure alerts with auto-retry
- Page load optimization (compression, caching, code splitting)

## Security

Опциональная Basic Auth для дашборда включается через `.env`:

```bash
# .env
MINIONS_USER=admin
MINIONS_PASSWORD=ваш_пароль
```

Если переменные не заданы — аутентификация отключена, дашборд открыт.  
Публичные endpoints (`/api/health`, `/api/version`, `/api/events`) работают без auth в любом случае.

## How It Works

Each task is a persistent Hermes root session. You talk to it, it works, and the board reflects where everything stands. Chat transcripts live in Hermes's session database; Minions stores task metadata, status, and per-task settings in a local SQLite database.

## Who It's For

- **Hermes power users** juggling multiple sessions across projects
- **Indie founders** delegating research, ops, writing, and coding to their agent
- **Anyone running long-lived Hermes work** who needs to know what finished, what's stuck, and what needs attention

## Roadmap

- **Scheduled task supervision**: automatically monitor, recover, and report on scheduled agent jobs
- **Notifications**: get alerted via Telegram, WhatsApp, or webhook when a task needs review

## FAQ

**Can I use this with other agents?**
No. Minions is built for Hermes.

## Contributing

Contributions are welcome. Please open an issue first with the feature or change you have in mind and why it should be added. Once the approach is approved, create a PR. See [CLAUDE.md](CLAUDE.md) for architecture and development details.
