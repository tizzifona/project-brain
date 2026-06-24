# Deploying Project Brain to Web Daemon

This guide walks through deploying Project Brain on the Web Daemon platform.

## Understanding Web Daemon Architecture

Web Daemon has three layers for your app:

1. **Frontend** (HTML/CSS/JS) - Hosted anywhere publicly accessible
2. **Agent-side** (TypeScript/Deno) - Runs in user's daemon
3. **Static backend** (Optional) - Traditional server (not used in this project)

For Project Brain, we only use layers 1 and 2.

## Deployment Steps

### Step 1: Host Frontend Files

You need to host these files on a public URL:
- `frontend/index.html`
- `frontend/styles.css`
- `frontend/app.js`
- `webdaemon.yml` (in root)

**Options:**

**A. GitHub Pages (Recommended for demo)**
```bash
# Create gh-pages branch
git checkout -b gh-pages

# Commit and push
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages

# Enable GitHub Pages in repo settings
# Your URL: https://yourusername.github.io/project-brain/
```

**B. Vercel**
```bash
npm i -g vercel
vercel deploy
```

**C. Netlify**
```bash
npm i -g netlify-cli
netlify deploy
```

**D. Any static host**
- AWS S3
- Cloudflare Pages
- DigitalOcean Spaces
- Your own server

### Step 2: Update Configuration

Once hosted, update `webdaemon.yml` if paths need adjustment:

```yaml
name: Project Brain
description: AI-powered project intelligence hub
version: 0.1.0

tab:
  intelligence:
    src: agent/main.ts        # Relative to webdaemon.yml
    importmap: importmap.json  # Relative to webdaemon.yml
    ttl: 300
    config:
      dataPath: data/synthetic-dataset.json
```

### Step 3: Add Web Daemon Link to HTML

Your `index.html` should have this line in `<head>`:
```html
<link rel='webdaemon' href='../webdaemon.yml'>
```

This tells Web Daemon where your agent configuration is.

### Step 4: Install in Web Daemon Shell

1. Open your Web Daemon shell
2. Run the install command:
```bash
install https://yourdomain.com/project-brain/frontend/
```

3. Web Daemon will:
   - Fetch your `webdaemon.yml`
   - Download agent-side TypeScript files
   - Start a Deno process with `agent/main.ts`
   - Each user gets their own isolated instance

### Step 5: Access Your App

The app is now running in your Web Daemon at:
```
https://{your-party}/app/project-brain
```

## How It Works

### Frontend → Agent Communication

The frontend makes API calls to the agent-side code:

```javascript
// In frontend/app.js
const API_BASE = window.location.origin + '/tab/intelligence';

// This resolves to:
// https://{party}/tab/intelligence/api/events
```

Web Daemon routes `/tab/intelligence/*` to your agent's Deno process.

### Agent-Side Processing

Your `agent/main.ts` receives HTTP requests:

```typescript
router.get("/api/events", async (ctx) => {
  const events = await intelligenceAgent.getInterpretedEvents();
  ctx.response.body = { success: true, data: events };
});
```

It runs in a Deno sandbox with:
- Read access to your data files
- Network access for HTTP responses
- Isolated per-user storage
- Access to Web Daemon AI features (semantic memory, etc.)

### Data Access

The agent reads your synthetic dataset:

```typescript
const dataService = new DataService("data/synthetic-dataset.json");
```

This file must be accessible relative to your `webdaemon.yml`.

## Testing Locally Before Deploy

Test the full stack locally:

1. **Start agent:**
```bash
deno task dev
```

2. **Start frontend:**
```bash
cd frontend
python3 -m http.server 8080
```

3. **Update frontend API base for local testing:**

In `app.js`, temporarily change:
```javascript
// For local development
const API_BASE = 'http://localhost:8000';

// For production (Web Daemon)
// const API_BASE = window.location.origin + '/tab/intelligence';
```

4. Test all three views and scenario engine

5. **Before deploying**, revert to production API base

## Troubleshooting

### "Tab failed to start"

Check:
- All paths in `webdaemon.yml` are correct
- `agent/main.ts` has no syntax errors
- `importmap.json` has valid URLs
- Data file exists at specified path

Run locally first to verify:
```bash
deno run --allow-net --allow-read agent/main.ts
```

### "Cannot read file"

- Verify file paths are relative to `webdaemon.yml`
- Check file permissions
- Ensure files are committed to your repo

### "CORS errors"

The agent includes CORS headers:
```typescript
ctx.response.headers.set("Access-Control-Allow-Origin", "*");
```

If still getting CORS errors:
- Check browser console for specific error
- Verify API_BASE URL is correct
- Test with browser dev tools network tab

### "API returns 404"

- Check route definitions in `agent/main.ts`
- Verify URL path matches frontend calls
- Look at agent console output

## Advanced: Using Web Daemon AI Features

Web Daemon provides built-in AI capabilities:

### Semantic Memory

Store and query project knowledge:

```typescript
// In your agent code
import { memory } from "webdaemon";

// Store signal
await memory.store({
  content: event.content,
  metadata: {
    channel: event.channel,
    timestamp: event.timestamp
  }
});

// Query similar signals
const similar = await memory.query("scope change", { limit: 5 });
```

### Generative Chat

Add chat interface:

```typescript
import { chat } from "webdaemon";

const response = await chat.complete({
  messages: [
    { role: "system", content: "You are a project management assistant" },
    { role: "user", content: "Summarize the budget impact" }
  ]
});
```

See [Web Daemon AI docs](https://webdaemon.online/latest/static/docs/ai-overview.html) for details.

## Production Considerations

For real project use (post-demo):

1. **Authentication**
   - Add user auth to frontend
   - Verify user identity in agent
   - Use Web Daemon token API

2. **Data Storage**
   - Use Web Daemon storage API instead of JSON files
   - Implement data persistence
   - Add backup/export

3. **Performance**
   - Cache frequently accessed data
   - Implement pagination for large event lists
   - Add loading states

4. **Security**
   - Validate all inputs
   - Sanitize data before display
   - Rate limit API calls

5. **Monitoring**
   - Add logging
   - Track errors
   - Monitor performance

## Resources

- [Web Daemon Docs](https://webdaemon.online/latest/static/docs/)
- [Deno Deploy](https://deno.com/deploy)
- [Oak Framework](https://deno.land/x/oak)

---

**Ready to deploy!** 🚀

Once deployed, each user who installs your app gets their own Project Brain agent running in their Web Daemon, with their own isolated data and AI.