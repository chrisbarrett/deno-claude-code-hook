# CLAUDE.md

Type-safe Deno library for Claude Code hooks. Published as
`@chrisbarrett/claude-code-hook` on JSR.

## Development

```bash
# Format and type check
deno fmt
deno check
```

**Publishing:** Version in `deno.json` follows Claude Code major version.

## Architecture

**Pipeline:** stdin → JSON parse → Zod validate → user function → Zod validate →
JSON stdout

**Key files:**

- `mod.ts` - Hook builders with comprehensive JSDoc examples
- `define-hook.ts` - Generic I/O handler
- `schemas/hooks.ts` - Zod schemas for all hook types
- `schemas/tools.ts` - Discriminated unions for type refinement
- `env.ts` - Environment helpers (`stdinMaxBufLen`, `claudeEnvFile`)

## Documentation

All implementation examples are in JSDoc comments in `mod.ts`. See:

- Module-level docs for environment variables and permissions
- Function-level docs for hook-specific examples
- JSR will generate comprehensive API docs from these annotations

**For users:** Browse examples at https://jsr.io/@chrisbarrett/claude-code-hook
