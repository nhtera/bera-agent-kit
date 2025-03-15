# Model Context Protocol Integration for Bera Agent Kit

This module provides Model Context Protocol (MCP) integration for Bera Agent Kit, allowing you to expose all Bera Agent Kit tools to MCP-compatible clients like Claude and other LLM systems.

## Usage

```typescript
import { 
  createViemWalletClient, 
  createViemPublicClient, 
  getMcpTools, 
  ConfigChainId 
} from "bera-agent-kit";
import { 
  Server, 
  StdioServerTransport, 
  CallToolRequestSchema, 
  ListToolsRequestSchema 
} from "@modelcontextprotocol/sdk";

// Create wallet and clients
const walletClient = createViemWalletClient();
const publicClient = createViemPublicClient(false); // false for mainnet, true for testnet

// Get chain config
const chainID = walletClient.chain?.id;
const configChain = ConfigChainId[chainID as keyof typeof ConfigChainId];

// Get MCP tools from Bera Agent Kit
const { tools, toolHandler } = await getMcpTools(
  configChain,
  walletClient,
  publicClient
);

// Create MCP server
const server = new Server(
  { name: "bera-agent-kit", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Configure the server
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    return await toolHandler(request.params.name, request.params.arguments);
  } catch (error) {
    throw new Error(`Tool ${request.params.name} failed: ${error}`);
  }
});

// Connect to a transport
const transport = new StdioServerTransport();
await server.connect(transport);
```

## Integration with mcp-server-berachain

To use this with your `mcp-server-berachain` project:

1. Install bera-agent-kit: `npm install bera-agent-kit`
2. Import and use the `getMcpTools` function as shown above
3. Configure your MCP server to use the tools and tool handler

The integration provides access to all Bera Agent Kit tools including token transfers, swaps, staking operations, and more. 