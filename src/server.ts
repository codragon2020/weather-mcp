import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import {
	getWeather,
	GetWeatherInput,
	GetWeatherInputSchema,
	GetWeatherOutputSchema,
} from './tools/getWeather.js';

const server = new McpServer({
	name: 'weather-mcp',
	version: '0.1.0',
});

server.registerTool(
	'get_weather',
	{
		title: 'Get Weather',
		description:
			'Returns the current weather for a given city or latitude/longitude.',
		inputSchema: GetWeatherInputSchema,
		outputSchema: GetWeatherOutputSchema,
	},
	async (input: GetWeatherInput) => {
		console.error(
			`[weather-mcp] tool call: get_weather args=${JSON.stringify(input)}`
		);

		const output = await getWeather(input);
		return {
			content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
			structuredContent: output,
		};
	}
);

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
