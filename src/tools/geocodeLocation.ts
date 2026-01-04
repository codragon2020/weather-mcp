import { z } from 'zod/v4';

import { geocodeLocation } from '../services/geocoding.js';
import { normalizeError, ok, type ToolResult } from '../lib/errors.js';

const GeocodeLocationInputShape = {
	query: z.string().min(1).describe('City, place name, or address query'),
};

const GeocodeLocationInputSchema = z.object(GeocodeLocationInputShape);

const GeocodeLocationDataSchema = z.array(
	z.object({
		name: z.string(),
		lat: z.number(),
		lon: z.number(),
		country: z.string().optional(),
		region: z.string().optional(),
	})
);

export const geocodeLocationTool = {
	name: 'geocode_location',
	title: 'Geocode Location',
	description:
		'Resolve a free-text location query into latitude/longitude candidates.',
	inputSchema: GeocodeLocationInputShape,
	handler: async (
		input: unknown
	): Promise<ToolResult<z.infer<typeof GeocodeLocationDataSchema>>> => {
		try {
			const parsed = GeocodeLocationInputSchema.parse(input);
			const results = await geocodeLocation(parsed.query);
			return ok(results);
		} catch (err) {
			return normalizeError(err);
		}
	},
};
