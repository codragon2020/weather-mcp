import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function main() {
	const client = new Client({
		name: 'weather-mcp-test-client',
		version: '0.1.0',
	});

	const transport = new StdioClientTransport({
		command: 'npx',
		args: ['tsx', 'src/server.ts'],
		cwd: process.cwd(),
	});

	await client.connect(transport);

	const tools = await client.listTools();
	console.log('\n== tools ==');
	console.log(JSON.stringify(tools, null, 2));

	console.log('\n== geocode_location("Boston") ==');
	const geo = await client.callTool({
		name: 'geocode_location',
		arguments: { query: 'Boston' },
	});
	console.log(JSON.stringify(geo, null, 2));

	const geoJson = geo.structuredContent as
		| { error: false; data: Array<{ lat: number; lon: number; name: string }> }
		| { error: true; code: string; message: string };

	if (geoJson && geoJson.error === false && geoJson.data.length > 0) {
		const { lat, lon, name } = geoJson.data[0];
		console.log(`\nUsing first geocode result: ${name} (${lat}, ${lon})`);

		console.log('\n== get_weather ==');
		const weather = await client.callTool({
			name: 'get_weather',
			arguments: { lat, lon, units: 'metric' },
		});
		console.log(JSON.stringify(weather, null, 2));

		console.log('\n== get_forecast ==');
		const forecast = await client.callTool({
			name: 'get_forecast',
			arguments: { lat, lon, days: 5, units: 'metric' },
		});
		console.log(JSON.stringify(forecast, null, 2));
	} else {
		console.log(
			'\nGeocoding did not return results; skipping weather/forecast.'
		);
	}

	await transport.close();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
