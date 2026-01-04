import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { prompts } from './prompts/index.js';
import { tools } from './tools/index.js';

const server = new McpServer({
	name: 'weather-mcp',
	version: '0.1.0',
});

for (const tool of tools) {
	server.registerTool(
		tool.name,
		{
			title: tool.title,
			description: tool.description,
			inputSchema: tool.inputSchema,
		},
		async (input: any, _extra: any) => {
			console.error(
				`[weather-mcp] tool call: ${tool.name} args=${JSON.stringify(input)}`
			);

			const output = await tool.handler(input);
			return {
				content: [
					{
						type: 'text' as const,
						text: JSON.stringify(output, null, 2),
					},
				],
				structuredContent: output,
			};
		}
	);
}

for (const prompt of prompts) {
	server.registerPrompt(
		prompt.name,
		{
			title: prompt.title,
			description: prompt.description,
			argsSchema: prompt.argsSchema,
		},
		(args: any, _extra: any) => prompt.handler(args)
	);
}

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error('[weather-mcp] server started (stdio)');
}

main().catch((err) => {
	const message = err instanceof Error ? err.message : String(err);
	console.error(`[weather-mcp] fatal: ${message}`);
	process.exit(1);
});
