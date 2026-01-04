import { z } from 'zod/v4';

const DayShape = {
	date: z.string(),
	temperatureMax: z.object({ value: z.number(), unit: z.string() }),
	temperatureMin: z.object({ value: z.number(), unit: z.string() }),
	condition: z.object({ code: z.number(), description: z.string() }),
};

const PromptArgsShape = {
	locationName: z
		.string()
		.optional()
		.describe('Optional human-readable location name (e.g. Boston, MA)'),
	forecastJson: z
		.string()
		.describe('JSON string containing the structured forecast object'),
};

const PromptArgsSchema = z.object(PromptArgsShape);

const ForecastSchema = z.object({
	units: z.enum(['metric', 'imperial']).optional(),
	days: z.number().optional(),
	daily: z.array(z.object(DayShape)).min(1),
});

export const summarizeForecastPrompt = {
	name: 'summarize_forecast',
	title: 'Summarize Forecast',
	description:
		'Turns structured forecast JSON into a short forecast summary with highs/lows and conditions.',
	argsSchema: PromptArgsShape,
	handler: (args: unknown) => {
		const a = PromptArgsSchema.parse(args);
		const forecast = ForecastSchema.parse(JSON.parse(a.forecastJson));

		const loc = a.locationName ? ` for ${a.locationName}` : '';
		const header = `Summarize the ${forecast.daily.length}-day forecast${loc} using the data provided. Use short bullet points.`;

		const lines = forecast.daily.map((d) => {
			return `${d.date}: High ${d.temperatureMax.value}${d.temperatureMax.unit}, low ${d.temperatureMin.value}${d.temperatureMin.unit}, ${d.condition.description}`;
		});

		return {
			messages: [
				{
					role: 'user',
					content: { type: 'text', text: [header, ...lines].join('\n') },
				},
			],
		};
	},
};
