import { fetchJson } from '../lib/http.js';

export type Units = 'metric' | 'imperial';

export type WeatherCondition = {
	code: number;
	description: string;
};

export type CurrentWeather = {
	lat: number;
	lon: number;
	units: Units;
	temperature: { value: number; unit: 'C' | 'F' };
	windSpeed?: { value: number; unit: 'km/h' | 'mph' };
	humidity?: { value: number; unit: '%' };
	condition: WeatherCondition;
};

export type DailyForecastDay = {
	date: string;
	temperatureMax: { value: number; unit: 'C' | 'F' };
	temperatureMin: { value: number; unit: 'C' | 'F' };
	condition: WeatherCondition;
};

export type Forecast = {
	lat: number;
	lon: number;
	units: Units;
	days: number;
	daily: DailyForecastDay[];
};

type OpenMeteoWeatherResponse = {
	current?: {
		time?: string;
		temperature_2m?: number;
		relative_humidity_2m?: number;
		weather_code?: number;
		wind_speed_10m?: number;
	};
	daily?: {
		time?: string[];
		temperature_2m_max?: number[];
		temperature_2m_min?: number[];
		weather_code?: number[];
	};
};

export function weatherCodeToDescription(code: number): string {
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

function tempUnit(units: Units): 'C' | 'F' {
	return units === 'imperial' ? 'F' : 'C';
}

function windUnit(units: Units): 'km/h' | 'mph' {
	return units === 'imperial' ? 'mph' : 'km/h';
}

function applyUnits(url: URL, units: Units) {
	url.searchParams.set(
		'temperature_unit',
		units === 'imperial' ? 'fahrenheit' : 'celsius'
	);
	url.searchParams.set('wind_speed_unit', units === 'imperial' ? 'mph' : 'kmh');
}

export async function getCurrentWeather(params: {
	lat: number;
	lon: number;
	units: Units;
}): Promise<CurrentWeather> {
	const url = new URL('https://api.open-meteo.com/v1/forecast');
	url.searchParams.set('latitude', String(params.lat));
	url.searchParams.set('longitude', String(params.lon));
	url.searchParams.set(
		'current',
		'temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m'
	);
	url.searchParams.set('timezone', 'auto');
	applyUnits(url, params.units);

	const data = await fetchJson<OpenMeteoWeatherResponse>(url, {
		timeoutMs: 8000,
		retries: 1,
	});

	const current = data.current;
	if (!current) throw new Error('Weather API response missing current data.');

	const temperature = current.temperature_2m;
	const code = current.weather_code;
	if (typeof temperature !== 'number' || typeof code !== 'number') {
		throw new Error('Weather API response missing expected current fields.');
	}

	const humidity = current.relative_humidity_2m;
	const windSpeed = current.wind_speed_10m;

	return {
		lat: params.lat,
		lon: params.lon,
		units: params.units,
		temperature: { value: temperature, unit: tempUnit(params.units) },
		windSpeed:
			typeof windSpeed === 'number'
				? { value: windSpeed, unit: windUnit(params.units) }
				: undefined,
		humidity:
			typeof humidity === 'number' ? { value: humidity, unit: '%' } : undefined,
		condition: { code, description: weatherCodeToDescription(code) },
	};
}

export async function getForecast(params: {
	lat: number;
	lon: number;
	days: number;
	units: Units;
}): Promise<Forecast> {
	const url = new URL('https://api.open-meteo.com/v1/forecast');
	url.searchParams.set('latitude', String(params.lat));
	url.searchParams.set('longitude', String(params.lon));
	url.searchParams.set(
		'daily',
		'temperature_2m_max,temperature_2m_min,weather_code'
	);
	url.searchParams.set('forecast_days', String(params.days));
	url.searchParams.set('timezone', 'auto');
	applyUnits(url, params.units);

	const data = await fetchJson<OpenMeteoWeatherResponse>(url, {
		timeoutMs: 8000,
		retries: 1,
	});

	const daily = data.daily;
	const dates = daily?.time;
	const maxes = daily?.temperature_2m_max;
	const mins = daily?.temperature_2m_min;
	const codes = daily?.weather_code;

	if (!dates || !maxes || !mins || !codes) {
		throw new Error('Weather API response missing daily forecast fields.');
	}

	const count = Math.min(dates.length, maxes.length, mins.length, codes.length);
	const out: DailyForecastDay[] = [];
	for (let i = 0; i < count; i++) {
		const code = codes[i];
		const max = maxes[i];
		const min = mins[i];
		const date = dates[i];

		if (
			typeof code !== 'number' ||
			typeof max !== 'number' ||
			typeof min !== 'number' ||
			typeof date !== 'string'
		) {
			continue;
		}

		out.push({
			date,
			temperatureMax: { value: max, unit: tempUnit(params.units) },
			temperatureMin: { value: min, unit: tempUnit(params.units) },
			condition: { code, description: weatherCodeToDescription(code) },
		});
	}

	return {
		lat: params.lat,
		lon: params.lon,
		units: params.units,
		days: params.days,
		daily: out,
	};
}
