# MCP and tooling setup

**Nothing was installed.** All commands below are for review and need approval before anyone runs them.

## 1. What this session already has (VERIFIED, November 2026)

| Tool | Status here | Notes |
|---|---|---|
| **Playwright (library)** | ✅ Pre-installed in the cloud container, with Chromium at `/opt/pw-browsers` | Used by `scripts/qa.mjs`, `render-stills.mjs` and screenshots. This is the library, *not* the Playwright MCP server |
| **GitHub MCP** | ✅ Available (`mcp__github__*` tools), scoped to the session's repositories | Used for PRs and issues. Search goes through `gh api` |
| **Lighthouse** | ✅ Ran via `npx lighthouse@12.6.1` against local preview | Not an MCP |
| **Hugging Face MCP** | ✅ Connected (anonymous, rate-limited) | Model and dataset lookup only; no inference used |
| **Higgsfield MCP** | ✅ Connected; **0 credits** | No paid generation approved |
| **Figma MCP** (plugin) | ❌ Configured but failed to connect (proxy refused the tunnel: 403) | Needs a network allowance and a Figma account with Dev or Full seat access |
| **Chrome DevTools MCP** | ❌ Not configured | — |
| **Blender MCP** | ❌ Not configured | — |

## 2. Evaluation

| Server | Usefulness for this project | Trust and source | Risk |
|---|---|---|---|
| **Playwright MCP** (Microsoft) | Medium. We already script Playwright directly, so it mainly helps interactive agent-driven browsing and debugging | Official repo: https://github.com/microsoft/playwright-mcp | Low. It runs a local browser |
| **Chrome DevTools MCP** (Chrome DevTools team) | **High** for this work: performance traces (frame time, LCP and CLS breakdowns), console and network inspection on real Chrome. That covers the gap in `PERFORMANCE-BUDGET.md` | Official repo: https://github.com/ChromeDevTools/chrome-devtools-mcp | Low–medium. It can read whatever pages are open in that browser profile, so use a dedicated profile |
| **Figma MCP** (official) | Medium, only if design work moves into Figma (tokens, component specs) | Official remote server `https://mcp.figma.com/mcp`. Docs: https://help.figma.com (search "Figma MCP server") | Low. OAuth, read access to files you can open. Needs a paid seat |
| **Blender MCP** (`ahujasid/blender-mcp`) | Medium for authoring glTF sculptures and offline renders | **Community project, not official**: https://github.com/ahujasid/blender-mcp | **High:** the add-on lets the model run arbitrary Python inside Blender. Use only on a local machine with no sensitive files, review `addon.py` first, and pin a commit |

## 3. Installation commands (from the official READMEs; verify there before running)

```bash
# Playwright MCP (Microsoft) — local stdio server
claude mcp add playwright -- npx @playwright/mcp@latest

# Chrome DevTools MCP (Google Chrome DevTools team) — needs Node 20.19+
claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest

# Figma MCP (official remote server, OAuth sign-in on first use)
claude mcp add --transport http figma https://mcp.figma.com/mcp

# Blender MCP (community) — needs Blender 3.0+, Python 3.10+, uv; plus the addon.py installed in Blender
# .mcp.json entry: { "mcpServers": { "blender": { "command": "uvx", "args": ["blender-mcp"] } } }
```

Install notes:
- **Pin versions** (replace `@latest`) once a working version is chosen, so updates can't change behaviour silently.
- In this cloud container, `npx` fetches from the npm registry, which the current network policy allows. Figma's remote host and any OAuth redirect may need adding to the environment's allowed hosts.
- **Recommendation:** add **Chrome DevTools MCP** first, for real-GPU performance traces on a developer machine. Skip Playwright MCP, since our scripts already cover it. Add Blender MCP only on an isolated local machine, and only if 3D authoring starts.
