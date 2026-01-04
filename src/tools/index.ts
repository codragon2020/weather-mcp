export type ToolRegistration = {
	name: string;
	title: string;
	description: string;
	inputSchema: any;
	outputSchema?: any;
	handler: (input: any) => Promise<any>;
};

import { geocodeLocationTool } from './geocodeLocation.js';
import { getWeatherTool } from './getWeather.js';
import { getForecastTool } from './getForecast.js';

export { geocodeLocationTool, getWeatherTool, getForecastTool };

export const tools: ToolRegistration[] = [
	geocodeLocationTool,
	getWeatherTool,
	getForecastTool,
];
