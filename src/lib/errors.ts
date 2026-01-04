import { z, ZodError } from 'zod/v4';

export type ToolErrorCode =
	| 'INVALID_INPUT'
	| 'UPSTREAM_ERROR'
	| 'TIMEOUT'
	| 'UNKNOWN';

export type ToolError = {
	error: true;
	code: ToolErrorCode;
	message: string;
	details?: unknown;
};

export type ToolOk<T> = {
	error: false;
	data: T;
};

export type ToolResult<T> = ToolOk<T> | ToolError;

export const ToolErrorSchema = z.object({
	error: z.literal(true),
	code: z.enum(['INVALID_INPUT', 'UPSTREAM_ERROR', 'TIMEOUT', 'UNKNOWN']),
	message: z.string(),
	details: z.unknown().optional(),
});

export function toolOkSchema(dataSchema: any) {
	return z.object({
		error: z.literal(false),
		data: dataSchema,
	});
}

export function toolResultSchema(dataSchema: any) {
	return z.union([toolOkSchema(dataSchema), ToolErrorSchema]);
}

export function ok<T>(data: T): ToolOk<T> {
	return { error: false, data };
}

export function toolError(
	code: ToolErrorCode,
	message: string,
	details?: unknown
): ToolError {
	return { error: true, code, message, details };
}

export function normalizeError(err: unknown): ToolError {
	if (err instanceof ZodError) {
		return toolError('INVALID_INPUT', 'Invalid input.', err.flatten());
	}

	if (err instanceof Error) {
		if (err.name === 'AbortError') {
			return toolError('TIMEOUT', 'Request timed out.');
		}

		if (
			err.message.startsWith('HTTP ') ||
			err.message === 'Failed to parse JSON response.'
		) {
			return toolError('UPSTREAM_ERROR', err.message);
		}

		return toolError('UNKNOWN', err.message);
	}

	return toolError('UNKNOWN', 'Unknown error.', { err });
}

export function toUpstreamError(message: string, details?: unknown): ToolError {
	return toolError('UPSTREAM_ERROR', message, details);
}
