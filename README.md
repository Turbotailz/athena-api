# Overwatch Hero API

An open-source API for fetching data about heroes in Overwatch, including data for the Stadium game mode. This project provides a public REST API, a typed NPM client, and the raw dataset.

## Features

- **REST API**: Hosted on Cloudflare Workers, providing fast access to Hero, Item, and Power data.
- **NPM Package**: TypeScript-ready client SDK and types.
- **Images**: Hosted portraits and item/power icons.
- **MCP Server**: Native support for AI models to query the data.
- **Serverless**: Built with Hono and Cloudflare Workers.

## Public API

Base URL: `https://overwatch-hero-api.pages.dev` (Example URL, replace with actual deployment)

### Endpoints

- `GET /api/heroes` - List all heroes.
  - Query: `role` (Damage, Tank, Support)
- `GET /api/heroes/:id` - Get a specific hero.
  - Query: `expand=items,powers` (Include full item/power details)
- `GET /api/items` - List all items (excluding powers).
  - Query: `type`, `rarity`
- `GET /api/items/:id` - Get a specific item.
- `GET /api/powers` - List all powers (items with rarity "power").
  - Query: `type`
- `GET /api/powers/:id` - Get a specific power.
- `GET /api/meta` - Get API version and stats.

## NPM Package Usage

Install the package:

```bash
npm install overwatch-hero-api
```

### Using the Client

```typescript
import { OverwatchHeroClient } from 'overwatch-hero-api';

const client = new OverwatchHeroClient();

// Get all heroes
const heroes = await client.getHeroes();

// Get specific hero with items and powers
const hero = await client.getHero('ana', { items: true, powers: true });

// Get items (regular upgrades)
const items = await client.getItems('survival');

// Get powers (hero-specific abilities)
const powers = await client.getPowers();
```

### MCP Server (for AI)

This package includes a Model Context Protocol (MCP) server.

Run directly:
```bash
npx overwatch-hero-api
```

Or configure in `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "overwatch": {
      "command": "npx",
      "args": ["-y", "overwatch-hero-api"]
    }
  }
}
```

### Accessing Raw Data

If you need the full dataset locally (warning: includes all text data):

```typescript
import { DATA } from 'overwatch-hero-api/data';

console.log(DATA.heroes);
console.log(DATA.powers);
```

## Development

### Prerequisites

- Node.js (v20+)
- NPM
- Wrangler (`npm install -g wrangler` or use local)

### Setup

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Place raw JSON files in `data/` (heroes.json, items-by-locale.json, etc.).
4. Build data:
   ```bash
   npm run build-data
   ```
   This script processes the JSON files, downloads images, and generates `src/data/db.ts`.

### Run Locally

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Deployment

This project is configured for Cloudflare Workers.

1. Login to Cloudflare:
   ```bash
   npx wrangler login
   ```
2. Deploy:
   ```bash
   npm run deploy
   ```

The deployment will upload the Worker code and the `public/` assets (images).

## Project Structure

- `data/`: Raw input JSON files.
- `scripts/`: Data processing scripts.
- `src/`: Source code.
  - `index.ts`: Worker entry point (API).
  - `client.ts`: NPM Client SDK.
  - `mcp.ts`: MCP Server implementation.
  - `data/`: Generated data files.
- `public/`: Static assets (images).

## License

ISC
