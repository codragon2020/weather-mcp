import { z } from 'zod/v4';

const PromptArgsShape = {
	locationName: z
		.string()
		.optional()
		.describe('Optional human-readable location name (e.g. Boston, MA)'),
	weatherJson: z
		.string()
		.describe('JSON string containing the structured current weather object'),
};

const PromptArgsSchema = z.object(PromptArgsShape);

const WeatherSchema = z.object({
	lat: z.number(),
	lon: z.number(),
	units: z.enum(['metric', 'imperial']).optional(),
	temperature: z.object({ value: z.number(), unit: z.string() }),
	condition: z.object({ code: z.number(), description: z.string() }),
	windSpeed: z.object({ value: z.number(), unit: z.string() }).optional(),
	humidity: z.object({ value: z.number(), unit: z.string() }).optional(),
});

export const summarizeCurrentWeatherPrompt = {
	name: 'summarize_current_weather',
	title: 'Summarize Current Weather',
	description:
		'Turns structured current weather JSON into a short, user-friendly summary.',
	argsSchema: PromptArgsShape,
	handler: (args: unknown) => {
		const a = PromptArgsSchema.parse(args);
		const weather = WeatherSchema.parse(JSON.parse(a.weatherJson));

		const parts: string[] = [];
		const loc = a.locationName ? ` for ${a.locationName}` : '';
		parts.push(
			`Write a concise weather summary${loc}. Use the provided structured data exactly.`
		);
		parts.push(
			`Temperature: ${weather.temperature.value}${weather.temperature.unit}. Condition: ${weather.condition.description} (code ${weather.condition.code}).`
		);
		if (weather.windSpeed) {
			parts.push(`Wind: ${weather.windSpeed.value} ${weather.windSpeed.unit}.`);
		}
		if (weather.humidity) {
			parts.push(
				`Humidity: ${weather.humidity.value}${weather.humidity.unit}.`
			);
		}
		parts.push('Keep it to 1-2 sentences.');

		return {
			messages: [
				{
					role: 'user',
					content: { type: 'text', text: parts.join('\n') },
				},
			],
		};
	},
};
