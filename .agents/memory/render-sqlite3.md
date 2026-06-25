---
name: Render better-sqlite3 and production serving
description: Fixes for Render free tier OOM crash and static file serving in production
---

## The rule
Add `.npmrc` at root with `better_sqlite3_build_from_source=false` to prevent native compilation OOM-crash on Render free tier.

**Why:** better-sqlite3 compiles from source via node-gyp by default. On Render free tier (512MB RAM), this OOM-kills the npm process mid-install, which prints "npm error Exit handler never called!" but exits with code 0, leaving node_modules incomplete so vite/other devDeps are never installed.

**How to apply:** Any time the Render build log shows "npm error Exit handler never called!" followed by a missing binary, add/check `.npmrc` for this flag.

## Production static serving
`server/src/app.js` already handles serving the built React app in production:
```js
if (env.nodeEnv === 'production' && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}
```
`clientDist` = `path.resolve(__dirname, '../../client/dist')` — correct for the server/src/ location.
`npm start` = `node server/src/server.js` (NOT start.js which is dev-only).
