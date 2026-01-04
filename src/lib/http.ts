export type FetchJsonOptions = {
	timeoutMs?: number;
	retries?: number;
	signal?: AbortSignal;
	headers?: Record<string, string>;
};

function isRetryableStatus(status: number): boolean {
	return status === 408 || status === 429 || (status >= 500 && status <= 599);
}

async function readErrorBody(res: Response): Promise<string | undefined> {
	try {
		const text = await res.text();
		return text.length ? text : undefined;
	} catch {
		return undefined;
	}
}

export async function fetchJson<T>(
	url: string | URL,
	options: FetchJsonOptions = {}
): Promise<T> {
	const timeoutMs = options.timeoutMs ?? 8000;
	const retries = options.retries ?? 1;

	let lastErr: unknown;
	for (let attempt = 0; attempt <= retries; attempt++) {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeoutMs);

		try {
			const res = await fetch(url, {
				signal: options.signal ?? controller.signal,
				headers: options.headers,
			});

			if (!res.ok) {
				const body = await readErrorBody(res);
				const err = new Error(
					`HTTP ${res.status} ${res.statusText}${body ? `: ${body}` : ''}`
				);

				if (attempt < retries && isRetryableStatus(res.status)) {
					lastErr = err;
					continue;
				}

				throw err;
			}

			try {
				return (await res.json()) as T;
			} catch {
				throw new Error('Failed to parse JSON response.');
			}
		} catch (err) {
			lastErr = err;
			if (attempt < retries) continue;
			throw err;
		} finally {
			clearTimeout(timer);
		}
	}

	throw lastErr instanceof Error ? lastErr : new Error('Request failed.');
}
