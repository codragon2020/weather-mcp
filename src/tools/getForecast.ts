import { z } from 'zod/v4';

import { DaysSchema, LatLonSchema, UnitsSchema } from '../lib/schemas.js';
import { normalizeError, ok, type ToolResult } from '../lib/errors.js';
import { getForecast } from '../services/weather.js';

const GetForecastInputShape = {
	lat: LatLonSchema.shape.lat,
	lon: LatLonSchema.shape.lon,
	days: DaysSchema.optional().describe('Number of days (default 7)'),
	units: UnitsSchema.optional().describe('metric (default) or imperial'),
};

const GetForecastInputSchema = z.object(GetForecastInputShape);

const ForecastDaySchema = z.object({
	date: z.string(),
	temperatureMax: z.object({ value: z.number(), unit: z.enum(['C', 'F']) }),
	temperatureMin: z.object({ value: z.number(), unit: z.enum(['C', 'F']) }),
	condition: z.object({ code: z.number(), description: z.string() }),
});

const GetForecastDataSchema = z.object({
	lat: z.number(),
	lon: z.number(),
	units: UnitsSchema,
	days: z.number(),
	daily: z.array(ForecastDaySchema),
});

export const getForecastTool = {
	name: 'get_forecast',
	title: 'Get Forecast',
	description: 'Returns a daily weather forecast for the provided coordinates.',
	inputSchema: GetForecastInputShape,
	handler: async (
		input: unknown
	): Promise<ToolResult<z.infer<typeof GetForecastDataSchema>>> => {
		try {
			const parsed = GetForecastInputSchema.parse(input);
			const units = parsed.units ?? 'metric';
			const days = parsed.days ?? 7;
			const forecast = await getForecast({
				lat: parsed.lat,
				lon: parsed.lon,
				days,
				units,
			});

			return ok(forecast);
		} catch (err) {
			return normalizeError(err);
		}
	},
};
