# GitHub Actions Toolkit for Deno

> A set of modules to make creating actions with Deno easier.

## Motivation

Many parts of the tooling from [actions/toolkit](https://github.com/actions/toolkit) doesn't work properly or at all on Deno. This project exists to support people using Deno developing GitHub Actions. See also [deno-run-action](https://github.com/actionsland/deno-run-action).

For every function available on the official packages, we also include a pure function (we're using the [hkts]() modules). Documentation efforts will be focused on the official functions though.

Some functions might have slightly different names (i.e. `io.mkdirP` (official) vs `io.mkdir` (io module), whenever we see fit.

## Modules

### [`actions.land/toolkit/io`](/io)

*Work in progress...*

Core functions for CLI scenarios.

```typescript
import "https://actions.land/toolkit/io/mod.ts"
```
