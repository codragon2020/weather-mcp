import { fetchJson } from '../lib/http.js';

export type GeocodeResult = {
	name: string;
	lat: number;
	lon: number;
	country?: string;
	region?: string;
};

type OpenMeteoGeocodeResponse = {
	results?: Array<{
		name: string;
		latitude: number;
		longitude: number;
		country?: string;
		admin1?: string;
	}>;
};

export async function geocodeLocation(query: string): Promise<GeocodeResult[]> {
	const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
	url.searchParams.set('name', query);
	url.searchParams.set('count', '10');
	url.searchParams.set('language', 'en');
	url.searchParams.set('format', 'json');

	const data = await fetchJson<OpenMeteoGeocodeResponse>(url, {
		timeoutMs: 8000,
		retries: 1,
	});

	return (
		data.results?.map((r) => ({
			name: r.name,
			lat: r.latitude,
			lon: r.longitude,
			country: r.country,
			region: r.admin1,
		})) ?? []
	);
}
