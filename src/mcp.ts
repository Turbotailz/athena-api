#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { DATA } from './data/db.js';

const server = new Server(
  {
    name: 'overwatch-hero-api',
    version: DATA.version,
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// --- Resources ---

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'overwatch://heroes',
        name: 'All Heroes',
        mimeType: 'application/json',
        description: 'List of all Overwatch heroes with base stats',
      },
      {
        uri: 'overwatch://items',
        name: 'All Items',
        mimeType: 'application/json',
        description: 'List of all Stadium items',
      },
      {
        uri: 'overwatch://powers',
        name: 'All Powers',
        mimeType: 'application/json',
        description: 'List of all Stadium powers',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  if (uri === 'overwatch://heroes') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(DATA.heroes, null, 2),
        },
      ],
    };
  }

  if (uri === 'overwatch://items') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(DATA.items, null, 2),
        },
      ],
    };
  }

  if (uri === 'overwatch://powers') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(DATA.powers, null, 2),
        },
      ],
    };
  }

  // Handle individual hero: overwatch://heroes/{id}
  if (uri.startsWith('overwatch://heroes/')) {
    const id = uri.split('/').pop();
    const hero = DATA.heroes.find((h) => h.id === id);
    if (hero) {
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(hero, null, 2),
          },
        ],
      };
    }
  }

  // Handle individual item: overwatch://items/{id}
  if (uri.startsWith('overwatch://items/')) {
    const id = uri.split('/').pop();
    const item = DATA.items.find((i) => i.id === id);
    if (item) {
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(item, null, 2),
          },
        ],
      };
    }
  }

  // Handle individual power: overwatch://powers/{id}
  if (uri.startsWith('overwatch://powers/')) {
    const id = uri.split('/').pop();
    const power = DATA.powers.find((p) => p.id === id);
    if (power) {
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(power, null, 2),
          },
        ],
      };
    }
  }

  throw new McpError(ErrorCode.InvalidRequest, `Resource not found: ${uri}`);
});

// --- Tools ---

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search',
        description: 'Search for heroes, items, or powers by name or role',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (name, role, or description)',
            },
            type: {
              type: 'string',
              enum: ['hero', 'item', 'power', 'all'],
              description: 'Filter by type (default: all)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_hero_stats',
        description: 'Get base stats for a specific hero',
        inputSchema: {
          type: 'object',
          properties: {
            heroId: {
              type: 'string',
              description: 'The slug ID of the hero (e.g., "ana", "soldier-76")',
            },
          },
          required: ['heroId'],
        },
      },
      {
        name: 'get_item_details',
        description: 'Get full details for a specific item',
        inputSchema: {
          type: 'object',
          properties: {
            itemId: {
              type: 'string',
              description: 'The slug ID of the item',
            },
          },
          required: ['itemId'],
        },
      },
      {
        name: 'get_power_details',
        description: 'Get full details for a specific power',
        inputSchema: {
          type: 'object',
          properties: {
            powerId: {
              type: 'string',
              description: 'The slug ID of the power',
            },
          },
          required: ['powerId'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'search') {
    const query = (args?.query as string).toLowerCase();
    const type = (args?.type as string) || 'all';
    
    const results: any[] = [];

    if (type === 'hero' || type === 'all') {
      const heroes = DATA.heroes.filter(
        (h) =>
          h.name.toLowerCase().includes(query) ||
          h.role.toLowerCase().includes(query) ||
          h.id.includes(query)
      );
      results.push(...heroes.map(h => ({ type: 'hero', ...h })));
    }

    if (type === 'item' || type === 'all') {
      const items = DATA.items.filter(
        (i) =>
          i.name.toLowerCase().includes(query) ||
          i.description.toLowerCase().includes(query) ||
          i.id.includes(query)
      );
      results.push(...items.map(i => ({ type: 'item', ...i })));
    }

    if (type === 'power' || type === 'all') {
      const powers = DATA.powers.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.id.includes(query)
      );
      results.push(...powers.map(p => ({ type: 'power', ...p })));
    }

    // Limit results
    const limitedResults = results.slice(0, 10);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(limitedResults, null, 2),
        },
      ],
    };
  }

  if (name === 'get_hero_stats') {
    const heroId = args?.heroId as string;
    const hero = DATA.heroes.find((h) => h.id === heroId);
    if (!hero) {
      return {
        content: [{ type: 'text', text: `Hero not found: ${heroId}` }],
        isError: true,
      };
    }
    return {
      content: [{ type: 'text', text: JSON.stringify(hero.base_stats, null, 2) }],
    };
  }

  if (name === 'get_item_details') {
    const itemId = args?.itemId as string;
    const item = DATA.items.find((i) => i.id === itemId);
    if (!item) {
      return {
        content: [{ type: 'text', text: `Item not found: ${itemId}` }],
        isError: true,
      };
    }
    return {
      content: [{ type: 'text', text: JSON.stringify(item, null, 2) }],
    };
  }

  if (name === 'get_power_details') {
    const powerId = args?.powerId as string;
    const power = DATA.powers.find((p) => p.id === powerId);
    if (!power) {
      return {
        content: [{ type: 'text', text: `Power not found: ${powerId}` }],
        isError: true,
      };
    }
    return {
      content: [{ type: 'text', text: JSON.stringify(power, null, 2) }],
    };
  }

  throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Overwatch MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
