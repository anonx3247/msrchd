# Agent Development Guidelines

This document contains guidelines and best practices for AI agents working on this codebase.

## Git Workflow

### Before Pushing

**ALWAYS** run these checks before pushing:

```bash
npm run typecheck && npm run lint
```

Only push if both commands succeed with no errors.

### Force Pushing

When force-pushing is necessary (e.g., after amending commits), **ALWAYS** use `--force-with-lease` instead of `-f`:

```bash
# ✅ Correct
git push --force-with-lease

# ❌ Wrong
git push -f
```

`--force-with-lease` is safer because it will fail if someone else has pushed changes to the remote branch since your last fetch, preventing accidental overwrites.

## Development Workflow

1. Create a new branch for each feature/fix
2. Make incremental commits that compile and pass linting
3. Run `npm run typecheck && npm run lint` before each push
4. Push with `git push` (first time) or `git push --force-with-lease` (when rewriting history)
5. Create PR when ready for review

## Key References

- For Docker implementation: See commit `878e0e9` (pre-Kubernetes migration)
- For simplified architecture: See `minified.md`
