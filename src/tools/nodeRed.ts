// @ts-ignore
const zod = require("zod");
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { NodeRedFlow, FormattedNodeRedFlow } from "../types/index.js";
import { callNodeRedApi, formatErrorMessage } from "../utils/api-utils.js";

export function registerNodeRedTools(server: McpServer) {
  server.tool("listNodeRedFlows",
    {},
    async () => {
      try {
        const flows = await callNodeRedApi<NodeRedFlow[]>('get', '/flows');
        
        // Filter only the actual flows (tabs) and not nodes
        const mainFlows = flows.filter(flow => flow.type === 'tab');
        
        const formattedFlows = mainFlows.map(flow => ({
          id: flow.id,
          name: flow.label || flow.id,
          disabled: flow.disabled || false,
          info: flow.info || '',
        }));
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify(formattedFlows, null, 2)
          }]
        };
      } catch (error: any) {
        console.error("Error fetching Node-RED flows:", error);
        return {
          content: [{ 
            type: "text", 
            text: formatErrorMessage(error, "fetching Node-RED flows")
          }]
        };
      }
    }
  );

  server.tool("getNodeRedFlow",
    { flow_id: zod.string() },
    async ({ flow_id }) => {
      try {
        // Get all flows
        const flows = await callNodeRedApi<NodeRedFlow[]>('get', '/flows');
        
        // Find the requested flow
        const flowTab = flows.find(flow => flow.id === flow_id && flow.type === 'tab');
        
        if (!flowTab) {
          return {
            content: [{ 
              type: "text", 
              text: `Flow with ID ${flow_id} not found.`
            }]
          };
        }
        
        // Get all nodes that belong to this flow
        const flowNodes = flows.filter(node => node.z === flow_id);
        
        const flowDetails: FormattedNodeRedFlow = {
          id: flowTab.id,
          name: flowTab.label || flowTab.id,
          disabled: flowTab.disabled || false,
          info: flowTab.info || '',
          nodes: flowNodes.map(node => ({
            id: node.id,
            type: node.type,
            name: node.name || node.type,
            wires: node.wires || []
          }))
        };
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify(flowDetails, null, 2)
          }]
        };
      } catch (error: any) {
        console.error(`Error fetching Node-RED flow ${flow_id}:`, error);
        return {
          content: [{ 
            type: "text", 
            text: formatErrorMessage(error, `fetching Node-RED flow ${flow_id}`)
          }]
        };
      }
    }
  );

  server.tool("updateNodeRedFlow",
    { 
      flow_id: zod.string(),
      config: zod.record(zod.any())
    },
    async ({ flow_id, config }) => {
      try {
        // First get all flows to ensure we're updating correctly
        const flows = await callNodeRedApi<NodeRedFlow[]>('get', '/flows');
        
        // Find the flow to update
        const flowIndex = flows.findIndex(flow => flow.id === flow_id && flow.type === 'tab');
        
        if (flowIndex === -1) {
          return {
            content: [{ 
              type: "text", 
              text: `Flow with ID ${flow_id} not found.`
            }]
          };
        }
        
        // Update the flow with new config
        flows[flowIndex] = { ...flows[flowIndex], ...config };
        
        // Send the updated flows back to Node-RED
        const updateResponse = await callNodeRedApi<any>('put', '/flows', flows);
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify({
              success: true,
              message: `Flow ${flow_id} updated successfully`,
              result: updateResponse
            }, null, 2)
          }]
        };
      } catch (error: any) {
        console.error(`Error updating Node-RED flow ${flow_id}:`, error);
        return {
          content: [{ 
            type: "text", 
            text: formatErrorMessage(error, `updating Node-RED flow ${flow_id}`)
          }]
        };
      }
    }
  );

  server.tool("deployNodeRedFlows",
    { type: zod.enum(["full", "nodes", "flows"]).optional() },
    async ({ type = "full" }) => {
      try {
        const response = await callNodeRedApi<any>(
          'post',
          '/flows',
          { deploymentType: type }
        );
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify({
              success: true,
              message: `Node-RED flows deployed with type: ${type}`,
              result: response
            }, null, 2)
          }]
        };
      } catch (error: any) {
        console.error(`Error deploying Node-RED flows:`, error);
        return {
          content: [{ 
            type: "text", 
            text: formatErrorMessage(error, `deploying Node-RED flows`)
          }]
        };
      }
    }
  );
} 