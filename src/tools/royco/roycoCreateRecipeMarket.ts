import { ToolConfig } from "../allTools";
import { createViemPublicClient } from "../../utils/createViemPublicClient";
import { createViemWalletClient } from "../../utils/createViemWalletClient";
import { CONTRACT } from "../../constants";

enum REWARD_STYLE {
  UPFRONT = 0,
  ARREAR = 1,
  FORFEITABLE = 2,
}

interface CreateRecipeMarketArgs {
  name: string;
  description: string;
  inputToken: string; // Address of the input token
  lockupTime: number; // in seconds
  frontendFee: string; // in basis points (1e18 = 100%)
  enterScript: string; // Weiroll script for entering the market (hex format)
  exitScript: string; // Weiroll script for exiting the market (hex format)
  incentiveType: "upfront" | "arrear" | "forfeitable";
}

export const roycoCreateRecipeMarketTool: ToolConfig<CreateRecipeMarketArgs> = {
  definition: {
    type: "function",
    function: {
      name: "royco_create_recipe_market",
      description:
        "Creates a new Recipe Market on Royco to incentivize on-chain actions",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name of the IAM market",
          },
          description: {
            type: "string",
            description: "Detailed description of what the market incentivizes",
          },
          inputToken: {
            type: "string",
            pattern: "^0x[a-fA-F0-9]{40}$",
            description: "Address of the input token users will provide",
          },
          lockupTime: {
            type: "number",
            description: "Duration of lockup in seconds",
          },
          frontendFee: {
            type: "string",
            description: "Frontend fee in basis points (1e18 = 100%)",
          },
          enterScript: {
            type: "string",
            description: "Weiroll script for entering the market (hex format)",
          },
          exitScript: {
            type: "string",
            description: "Weiroll script for exiting the market (hex format)",
          },
          incentiveType: {
            type: "string",
            enum: ["upfront", "arrear", "forfeitable"],
            description: "Type of incentive distribution",
          },
        },
        required: [
          "name",
          "description",
          "inputToken",
          "lockupTime",
          "frontendFee",
          "enterScript",
          "exitScript",
          "incentiveType",
        ],
      },
    },
  },
  handler: async (args) => {
    try {
      const walletClient = createViemWalletClient();
      const publicClient = createViemPublicClient();

      console.log(`[INFO] Creating Royco Recipe Market: ${args.name}`);

      // Map incentive type to REWARD_STYLE enum
      const rewardStyle = {
        upfront: REWARD_STYLE.UPFRONT,
        arrear: REWARD_STYLE.ARREAR,
        forfeitable: REWARD_STYLE.FORFEITABLE,
      }[args.incentiveType];

      // Parse Weiroll scripts
      const enterMarketData = {
        commands: args.enterScript,
        state: "0x", // Empty state as it will be set during execution
      };

      const exitMarketData = {
        commands: args.exitScript,
        state: "0x", // Empty state as it will be set during execution
      };

      // Create the market
      const tx = await walletClient.writeContract({
        address: CONTRACT.RoycoRecipeMarketHub,
        abi: [
          "function createMarket(address inputToken, uint256 lockupTime, uint256 frontendFee, tuple(bytes32[] weirollCommands, bytes weirollState) enterMarket, tuple(bytes32[] weirollCommands, bytes weirollState) exitMarket, uint8 rewardStyle) external returns (address)",
        ],
        functionName: "createMarket",
        args: [
          args.inputToken,
          BigInt(args.lockupTime),
          BigInt(args.frontendFee),
          enterMarketData,
          exitMarketData,
          rewardStyle,
        ],
      });

      const receipt = await walletClient.waitForTransactionReceipt({
        hash: tx,
      });

      if (receipt.status !== "success") {
        throw new Error(
          `Market creation failed with status: ${receipt.status}`,
        );
      }

      console.log(
        `[INFO] Royco Recipe Market created successfully: Transaction hash: ${tx}`,
      );
      return tx;
    } catch (error: any) {
      console.error(
        `[ERROR] Failed to create Royco Recipe Market: ${error.message}`,
      );
      throw new Error(`Market creation failed: ${error.message}`);
    }
  },
};
