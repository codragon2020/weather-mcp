import { z } from 'zod/v4';

import { normalizeError, ok, type ToolResult } from '../lib/errors.js';
import { LatLonSchema, UnitsSchema } from '../lib/schemas.js';
import { getCurrentWeather } from '../services/weather.js';

const GetWeatherInputShape = {
	lat: LatLonSchema.shape.lat,
	lon: LatLonSchema.shape.lon,
	units: UnitsSchema.optional().describe('metric (default) or imperial'),
};

const GetWeatherInputSchema = z.object(GetWeatherInputShape);

const GetWeatherDataSchema = z.object({
	lat: z.number(),
	lon: z.number(),
	units: UnitsSchema,
	temperature: z.object({ value: z.number(), unit: z.enum(['C', 'F']) }),
	condition: z.object({ code: z.number(), description: z.string() }),
	windSpeed: z
		.object({ value: z.number(), unit: z.enum(['km/h', 'mph']) })
		.optional(),
	humidity: z.object({ value: z.number(), unit: z.literal('%') }).optional(),
});

export const getWeatherTool = {
	name: 'get_weather',
	title: 'Get Weather',
	description: 'Returns current weather for the provided coordinates.',
	inputSchema: GetWeatherInputShape,
	handler: async (
		input: unknown
	): Promise<ToolResult<z.infer<typeof GetWeatherDataSchema>>> => {
		try {
			const parsed = GetWeatherInputSchema.parse(input);
			const units = parsed.units ?? 'metric';
			const weather = await getCurrentWeather({
				lat: parsed.lat,
				lon: parsed.lon,
				units,
			});
			return ok(weather);
		} catch (err) {
			return normalizeError(err);
		}
	},
};
