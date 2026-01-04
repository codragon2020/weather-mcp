export type PromptRegistration = {
	name: string;
	title: string;
	description: string;
	argsSchema: any;
	handler: (args: any) => {
		messages: Array<{
			role: 'user' | 'assistant';
			content: { type: 'text'; text: string };
		}>;
	};
};

import { summarizeCurrentWeatherPrompt } from './summarizeCurrentWeather.js';
import { summarizeForecastPrompt } from './summarizeForecast.js';

export { summarizeCurrentWeatherPrompt, summarizeForecastPrompt };

export const prompts: PromptRegistration[] = [
	summarizeCurrentWeatherPrompt,
	summarizeForecastPrompt,
];
