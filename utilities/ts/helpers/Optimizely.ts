/**
 * Returns a log function that only logs when the cfQA cookie is present.
 * @example
 * const log = createLogger(expNo);
 * log('something happened');
 */
export const createLogger = (expNo: string) =>
	(msg: unknown): void => {
		if (document.cookie.includes('cfQA')) {
			console.log(`[${expNo}] -->`, msg);
		}
	};

/**
 * Returns a track function bound to the provided log helper.
 * @example
 * const track = createTracker(log);
 * track('my_event_name');
 */
export const createTracker = (log: (msg: unknown) => void) =>
	(eventName: string): void => {
		window.optimizely.push({ type: 'event', eventName });
		log(`Event: ${eventName}`);
	};
