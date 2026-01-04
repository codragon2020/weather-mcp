import { z } from 'zod';

export const GetWeatherInputSchema = z.object({
	location: z
		.string()
		.min(1)
		.describe(
			"City name (e.g. 'Boston') or coordinates (e.g. '42.3601,-71.0589')"
		),
	units: z
		.enum(['metric', 'imperial'])
		.optional()
		.describe("Optional: 'metric' (C) or 'imperial' (F)"),
});

export const GetWeatherOutputSchema = z.object({
	location: z.string(),
	units: z.enum(['metric', 'imperial']),
	temperature: z.object({
		value: z.number(),
		unit: z.enum(['C', 'F']),
	}),
	condition: z.string(),
	source: z.literal('open-meteo'),
});

export type GetWeatherInput = z.infer<typeof GetWeatherInputSchema>;
export type GetWeatherOutput = z.infer<typeof GetWeatherOutputSchema>;

type Units = 'metric' | 'imperial';

function parseCoordinates(
	location: string
): { latitude: number; longitude: number } | null {
	const match = location
		.trim()
		.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
	if (!match) return null;

	const latitude = Number(match[1]);
	const longitude = Number(match[2]);
	if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

	if (latitude < -90 || latitude > 90) return null;
	if (longitude < -180 || longitude > 180) return null;

	return { latitude, longitude };
}

async function geocodeCity(city: string): Promise<{
	latitude: number;
	longitude: number;
	name: string;
	country?: string;
	admin1?: string;
}> {
	const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
	url.searchParams.set('name', city);
	url.searchParams.set('count', '1');
	url.searchParams.set('language', 'en');
	url.searchParams.set('format', 'json');

	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(
			`Geocoding request failed: ${res.status} ${res.statusText}`
		);
	}

	const data = (await res.json()) as {
		results?: Array<{
			latitude: number;
			longitude: number;
			name: string;
			country?: string;
			admin1?: string;
		}>;
	};

	const hit = data.results?.[0];
	if (!hit) {
		throw new Error(
			`Could not resolve location '${city}'. Try a more specific city name.`
		);
	}

	return hit;
}

function weatherCodeToCondition(code: number): string {
	if (code === 0) return 'clear';
	if (code === 1 || code === 2) return 'partly_cloudy';
	if (code === 3) return 'overcast';

	if (code === 45 || code === 48) return 'fog';

	if (code >= 51 && code <= 57) return 'drizzle';
	if (code >= 61 && code <= 67) return 'rain';
	if (code >= 71 && code <= 77) return 'snow';
	if (code >= 80 && code <= 82) return 'rain_showers';
	if (code >= 85 && code <= 86) return 'snow_showers';
	if (code === 95) return 'thunderstorm';
	if (code === 96 || code === 99) return 'thunderstorm_hail';

	return 'unknown';
}

export async function getWeather(
	input: GetWeatherInput
): Promise<GetWeatherOutput> {
	const units: Units = input.units ?? 'metric';

	const coord = parseCoordinates(input.location);

	let latitude: number;
	let longitude: number;
	let locationName: string;

	if (coord) {
		latitude = coord.latitude;
		longitude = coord.longitude;
		locationName = `${latitude},${longitude}`;
	} else {
		const geo = await geocodeCity(input.location);
		latitude = geo.latitude;
		longitude = geo.longitude;
		locationName = [geo.name, geo.admin1, geo.country]
			.filter(Boolean)
			.join(', ');
	}

	const url = new URL('https://api.open-meteo.com/v1/forecast');
	url.searchParams.set('latitude', String(latitude));
	url.searchParams.set('longitude', String(longitude));
	url.searchParams.set('current', 'temperature_2m,weather_code');
	url.searchParams.set('timezone', 'auto');

	if (units === 'imperial') {
		url.searchParams.set('temperature_unit', 'fahrenheit');
	} else {
		url.searchParams.set('temperature_unit', 'celsius');
	}

	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`Weather request failed: ${res.status} ${res.statusText}`);
	}

	const data = (await res.json()) as {
		current?: {
			temperature_2m?: number;
			weather_code?: number;
		};
	};

	const temp = data.current?.temperature_2m;
	const code = data.current?.weather_code;

	if (typeof temp !== 'number' || typeof code !== 'number') {
		throw new Error('Weather API response was missing expected fields.');
	}

	return {
		location: locationName,
		units,
		temperature: {
			value: temp,
			unit: units === 'imperial' ? 'F' : 'C',
		},
		condition: weatherCodeToCondition(code),
		source: 'open-meteo',
	};
}
