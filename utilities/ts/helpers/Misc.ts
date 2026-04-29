import { HttpRequestOptions, DateInput, ComparisonType } from '@utils/types/types';

//Debounce function, default debounce 300ms
export const debounce = <T extends (...args: any[]) => any>(
	callback: T,
	wait = 300,
	immediate?: boolean
): ((...args: Parameters<T>) => void) => {
	let timeout: ReturnType<typeof setTimeout> | null;

	return function (...args: Parameters<T>) {
		const context = this;
		const later = () => {
			timeout = null;
			if (!immediate) callback.apply(context, args);
		};

		const callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);

		if (callNow) callback.apply(context, args);
	};
};

//Timeout function to automatically timeout after [X]ms
export const timeoutFn = (data) => {
	let r = false;
	const t = setTimeout(() => {
		console.warn(`Promise timed out after ${data.timeout}ms`);
		r = true;
		data.reject(new Error('Timeout'));
	}, data.timeout);
	return { fn: t, r };
};

/**
 * Parse dates in supported formats:
 * - yyyy-mm-dd or yyyy/mm/dd (optionally with HH:mm:ss)
 * - dd-mm-yyyy or dd/mm/yyyy (optionally with HH:mm:ss)
 * - ISO 8601: yyyy-mm-ddTHH:mm:ss
 * - Date instance
 * - Timestamp (number)
 */
const validateDate = (year: number, month: number, day: number): Date | null => {
	const date = new Date(year, month - 1, day);
	return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
};

const toDate = (input: DateInput): Date | null => {
	if (input instanceof Date) return isNaN(input.getTime()) ? null : input;

	if (typeof input === 'number') {
		const d = new Date(input);
		return isNaN(d.getTime()) ? null : d;
	}

	if (typeof input !== 'string') return null;

	// Try ISO 8601 format first
	if (input.includes('T')) {
		const d = new Date(input);
		return isNaN(d.getTime()) ? null : d;
	}

	// Match date with optional time: yyyy-mm-dd HH:mm:ss or dd-mm-yyyy HH:mm:ss
	const m = input.match(/^(\d{2,4})[-\/](\d{2})[-\/](\d{2,4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
	if (!m) return null;

	const [, first, month, third, hours = '0', minutes = '0', seconds = '0'] = m;
	const [year, day] = +first > 31 ? [+first, +third] : [+third, +first];

	const date = validateDate(year, +month, day);
	if (!date) return null;

	date.setHours(+hours, +minutes, +seconds, 0);
	return date;
};

/**
 * Compare two dates: date1 is [before/after] date2
 */
export const compareDate = (
	date1: DateInput,
	type: ComparisonType,
	date2: DateInput,
	includeComparisonDate = true
): boolean => {
	const d1 = toDate(date1);
	const d2 = toDate(date2);

	if (!d1 || !d2) throw new Error(`Invalid date(s): "${date1}" or "${date2}"`);

	const time1 = d1.getTime();
	const time2 = d2.getTime();

	if (type === 'before') return includeComparisonDate ? time1 <= time2 : time1 < time2;

	return includeComparisonDate ? time1 >= time2 : time1 > time2;
};

export const requestJson = async ({
	url,
	method = 'POST',
	payload,
	headers,
}: HttpRequestOptions): Promise<unknown | null> => {
	try {
		const init: RequestInit = {
			method,
			headers: {
				'content-type': 'application/json',
				...(headers ?? {}),
			},
		};

		if (method !== 'GET' && payload !== undefined) {
			init.body = JSON.stringify(payload);
		}

		const res = await fetch(url, init);

		// HTTP errors (404/500 etc.)
		if (!res.ok) {
			throw new Error(`fetch http error: ${res.status} ${res.statusText}`);
		}

		const text = await res.text();
		try {
			return JSON.parse(text);
		} catch {
			return text;
		}
	} catch (e) {
		throw new Error(`fetch error: ${e}`);
	}
};

/**
 * Creates a reusable async cache for a Promise factory (runs once, caches the Promise and resolved value).
 *
 * @param factory - Function that returns a Promise. It will be executed only once; subsequent calls reuse the same Promise/result.
 * @returns Cache controller with start/isStarted/isDone/getValue helpers.
 *
 * Note: If the Promise rejects, the rejection is cached as well and `isDone()` stays false.
 *
 * @example
 * const cache = createAsyncCache(() => fetch('/api/health').then((r) => r.text()));
 *
 * console.log('started:', cache.isStarted()); // false
 * const value = await cache.start();
 * console.log('value:', value);
 * console.log('started:', cache.isStarted()); // true
 * console.log('done:', cache.isDone());       // true
 * console.log('cached:', cache.getValue());   // cached value
 */
export const createAsyncCache = <T>(factory: () => Promise<T>) => {
	let started = false;
	let done = false;
	let value: T | undefined;
	let promise: Promise<T> | undefined;

	const start = (): Promise<T> => {
		if (!promise) {
			started = true;
			promise = factory().then((v) => {
				value = v;
				done = true;
				return v;
			});
		}
		return promise;
	};

	return {
		start,
		isStarted: () => started,
		isDone: () => done,
		getValue: () => (done ? value : undefined),
	};
};

/**
 * Creates a response watcher, able to watch for specific URLs and based on the URL, intercepts the response and logs it into the console.
 * Usage:
 * let myWatcher = responseWatch('mwa.tui.com', (data, url) => { 
      console.log('example response:', url, data); 
   });

   Destroy the watcher after use:
   myWatcher.destroy();
 * 
 */
const watchers = (window.__responseWatchers ??= new Map());
const seen = new WeakSet();

const matches = (url: string, pattern: string | RegExp) =>
	pattern instanceof RegExp ? pattern.test(url) : url.includes(pattern);

const getKey = (pattern: string | RegExp) => (pattern instanceof RegExp ? pattern.source : pattern);

const handle = async (res: Response, promise: Promise<any>) => {
	const matchingWatchers = [...watchers.values()].filter((w) => matches(res.url, w.pattern));
	if (!matchingWatchers.length || seen.has(res)) return promise;
	seen.add(res);

	const data = await promise;

	matchingWatchers.forEach((watcher) => {
		watcher.callbacks.forEach((cb) => cb(data, res.url));
	});

	return data;
};

export const responseWatch = (pattern: string | RegExp, callback?: (data: any, url: string) => void) => {
	const key = getKey(pattern);
	let watcher = watchers.get(key);

	if (watcher) {
		callback && watcher.callbacks.add(callback);
		return watcher;
	}

	if (!window.__responseWatchPatched) {
		const origText = Response.prototype.text;
		const origJson = Response.prototype.json;
		Response.prototype.text = function (...args) {
			return handle(this, origText.apply(this, args));
		};
		Response.prototype.json = function (...args) {
			return handle(this, origJson.apply(this, args));
		};
		window.__responseWatchPatched = true;
	}

	watcher = {
		pattern,
		callbacks: new Set(callback ? [callback] : []),
		destroy: () => watchers.delete(key),
	};

	watchers.set(key, watcher);
	return watcher;
};
