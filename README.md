# Bera Agent Kit 🐻🚀

Open-source agent kit for interacting with Berachain protocols using AI and blockchain technologies.

## 🌟 Features

- 🤖 AI-powered blockchain interaction
- 🔗 Seamless integration with Berachain
- 💻 TypeScript support
- 🛠️ Multiple blockchain tools and utilities
- 🔌 Model Context Protocol (MCP) support for integration with Claude and other LLMs

## 📦 Installation

```bash
yarn install bera-agent-kit
```

## 🚀 Quick Start
See [here](./guides/usage-guide.md)

### Using with Model Context Protocol

```typescript
import { createViemWalletClient, createViemPublicClient, getMcpTools } from "bera-agent-kit";

// Initialize clients
const walletClient = createViemWalletClient();
const publicClient = createViemPublicClient(false); // false for mainnet

// Get MCP tools
const { tools, toolHandler } = await getMcpTools(
  configChain,
  walletClient,
  publicClient
);

// Use with your MCP server
// See examples/mcp-server.ts for a complete example
```

## 🔧 Prerequisites

- Node.js 18+
- OpenAI API Key
- Berachain Wallet

## 📚 Documentation

Full documentation available in the [docs](./docs) directory.

## 🤝 Contributing

See [CONTRIBUTING.md](./guides/contribute-guide.md)

## 📄 License

MIT License

## 🐞 Issues

Report issues on our [GitHub Issues](https://github.com/Webera-Finance/bera-agent-kit/issues)