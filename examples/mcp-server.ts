/**
 * Example showing how to use the Bera Agent Kit Model Context Protocol (MCP) integration
 * with an MCP server for Berachain.
 */

import 'dotenv/config';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createViemPublicClient, getMcpTools } from "../src";
import { ConfigChainId } from "../src/constants/chain";
import { SupportedChainId } from "../src/utils/enum";
import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { berachain } from 'viem/chains';

async function main() {
  try {
    console.log("Starting Bera Agent Kit MCP Server...");

    // Check if PRIVATE_KEY is set and properly formatted
    if (!process.env.PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY environment variable is not set. Please add it to your .env file.');
    }

    // Ensure the private key has the 0x prefix
    const privateKey = process.env.PRIVATE_KEY.startsWith('0x') 
      ? process.env.PRIVATE_KEY 
      : `0x${process.env.PRIVATE_KEY}`;
    
    // Create wallet client with the formatted private key
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: berachain,
      transport: http(),
    }).extend(publicActions);
    
    // Check if we're connected to a valid chain
    const chainID = walletClient.chain?.id;
    if (!chainID) {
      throw new Error('Chain ID is not defined. Make sure your wallet is connected to Berachain.');
    }
    
    // Determine if we're on testnet or mainnet
    // Need to compare as numbers since TypeScript is strict about enum comparisons
    const isTestnet = chainID === Number(SupportedChainId.Testnet);
    console.log(`Connected to ${isTestnet ? 'testnet' : 'mainnet'}`);
    console.log(`Using wallet address: ${account.address}`);
    
    // Create public client for the appropriate network
    const publicClient = createViemPublicClient(isTestnet);
    
    // Get chain config for the current network
    const configChain = ConfigChainId[chainID as keyof typeof ConfigChainId];
    
    // Optional tool environment configs (can be expanded as needed)
    const toolEnvConfigs = {};
    
    // Get MCP tools from Bera Agent Kit
    console.log("Initializing MCP tools...");
    const { tools, toolHandler } = await getMcpTools(
      configChain,
      walletClient,
      publicClient,
      toolEnvConfigs
    );
    
    console.log(`Initialized ${tools.length} tools`);
    
    // Create an MCP server
    const server = new Server(
      {
        name: "bera-agent-kit",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    // Set up request handlers
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.log("Received ListTools request");
      return {
        tools,
      };
    });
    
    // When using with @modelcontextprotocol/sdk, we need to ensure the return type matches
    // what the SDK expects, which is why we're using type assertions here
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      console.log(`Received CallTool request for tool: ${request.params.name}`);
      try {
        const result = await toolHandler(request.params.name, request.params.arguments);
        console.log(`Tool ${request.params.name} executed successfully`);
        // The SDK expects a specific format, so we're returning the result as is
        return result as any;
      } catch (error) {
        console.error(`Tool ${request.params.name} failed:`, error);
        throw new Error(`Tool ${request.params.name} failed: ${error}`);
      }
    });
    
    // Connect server to transport (stdout/stdin)
    console.log("Connecting server to transport...");
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.log("MCP Server is running. Press Ctrl+C to stop.");
  } catch (error) {
    console.error("Error starting MCP server:", error);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error); 