import { z } from 'zod/v4';

export const UnitsSchema = z.enum(['metric', 'imperial']);

export const LatSchema = z
	.number()
	.min(-90)
	.max(90)
	.describe('Latitude in degrees (-90 to 90)');

export const LonSchema = z
	.number()
	.min(-180)
	.max(180)
	.describe('Longitude in degrees (-180 to 180)');

export const LatLonSchema = z.object({
	lat: LatSchema,
	lon: LonSchema,
});

export const DaysSchema = z
	.number()
	.int()
	.min(1)
	.max(16)
	.describe('Number of days (1-16)');
