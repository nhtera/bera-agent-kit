/**
 * Model Context Protocol (MCP) integration for Bera Agent Kit
 * Exposes tools for use with MCP-compatible servers
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { PublicClient, WalletClient } from 'viem';
import { createTools } from '../tools';
import { ConfigChain } from '../constants/chain';
import { ToolEnvConfigs } from '../constants/types';

// Define types for MCP integration based on @modelcontextprotocol/sdk
export interface ToolContent {
  type: string;
  text: string;
}

export interface CallToolResult {
  content: ToolContent[];
}

export interface Tool {
  name: string;
  description: string;
  inputSchema: object;
}

/**
 * The Bera Agent Kit MCP tools and tool handler
 */
export interface BeraAgentKitMcpTools {
  tools: Tool[];
  toolHandler: (name: string, args: unknown) => Promise<CallToolResult>;
}

/**
 * Get Model Context Protocol (MCP) tools from Bera Agent Kit
 * 
 * @param configChain - The chain configuration for the tools
 * @param walletClient - The viem wallet client
 * @param publicClient - The viem public client
 * @param toolEnvConfigs - Optional environment configurations for tools
 * @returns An object containing the tools array and a tool handler function
 */
export async function getMcpTools(
  configChain: ConfigChain,
  walletClient: WalletClient,
  publicClient: PublicClient,
  toolEnvConfigs?: ToolEnvConfigs
): Promise<BeraAgentKitMcpTools> {
  const beraTools = createTools();

  return {
    tools: Object.entries(beraTools).map(([name, tool]) => {
      return {
        name,
        description: tool.definition.function.description,
        inputSchema: zodToJsonSchema(
          // Create a zod schema from the tool's parameters
          z.object(
            Object.fromEntries(
              Object.entries(tool.definition.function.parameters.properties).map(
                ([key, prop]: [string, any]) => {
                  let schema: any = z.string();
                  if (prop.type === 'number') schema = z.number();
                  if (prop.type === 'boolean') schema = z.boolean();
                  
                  // Make optional fields optional
                  if (!tool.definition.function.parameters.required.includes(key)) {
                    schema = schema.optional();
                  }
                  
                  return [key, schema];
                }
              )
            )
          )
        ),
      } as Tool;
    }),
    toolHandler: async (name: string, args: unknown) => {
      const tool = beraTools[name];
      if (!tool) {
        throw new Error(`Tool ${name} not found`);
      }

      // Execute the tool handler
      const result = await tool.handler(
        args,
        configChain,
        walletClient,
        publicClient,
        toolEnvConfigs
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result),
          },
        ],
      };
    },
  };
} 