# Installing the `bachs-payments` skill

## Option A — install as a Claude Code skill (recommended)

Claude Code loads skills from `~/.claude/skills/<name>/`. Copy this skill
there:

```bash
mkdir -p ~/.claude/skills
cp -r skills/bachs-payments ~/.claude/skills/bachs-payments
```

Restart/reload Claude Code (or start a new session) and it will pick up the
skill automatically — it activates whenever you ask about Bachs payments,
checkout, or subscriptions. No further configuration needed; `SKILL.md`'s
frontmatter is all Claude Code reads to decide when to use it.

To update later after pulling changes to this repo:

```bash
rsync -a --delete skills/bachs-payments/ ~/.claude/skills/bachs-payments/
```

To remove:

```bash
rm -rf ~/.claude/skills/bachs-payments
```

## Option B — project-scoped skill

If you only want this available inside one project (not globally), put it
under that project's `.claude/skills/` instead:

```bash
mkdir -p /path/to/your-project/.claude/skills
cp -r skills/bachs-payments /path/to/your-project/.claude/skills/bachs-payments
```

## Option C — just use the code, skip the skill entirely

The skill packaging is only relevant if you want Claude Code to auto-surface
this integration. If you just want the Bachs client code in your app:

```bash
cp -r skills/bachs-payments/src /path/to/your-project/src/lib/bachs
```

Then `import { Bachs } from "./lib/bachs"` (or wherever you placed it). It
has zero npm dependencies — only needs a global `fetch` and Node's built-in
`node:crypto` (for webhook signature verification).

## After installing, wherever you use it

1. Set `BACHS_SECRET_KEY` (from the Bachs dashboard — `sk_sandbox_...` to
   start, `sk_live_...` once your business is verified).
2. If using webhooks, set `BACHS_WEBHOOK_SECRET` — get it from
   `bachs.webhookEndpoints.create(...)` (see `skills/bachs-payments/references/webhooks.md`);
   it's shown only once.
3. **If you need recurring subscriptions**, read
   `skills/bachs-payments/references/gating-and-limitations.md` first —
   subscriptions require Bachs support to enable them on your account
   (email support@bachs.xyz), and recurring billing is USD-only today.

## Verifying the install

Ask Claude something like *"add a Bachs checkout button for the Pro plan"*
or *"how do I verify a Bachs webhook signature?"* in a session where the
skill is installed — Claude Code will surface and use it automatically. You
can also just point Claude at `skills/bachs-payments/SKILL.md` directly.
