/**
 * Returns a log function that only fires when the cfQA cookie is present.
 * @example
 * const log = createLogger(testID);
 * log('something happened');
 */
export const createLogger =
	(testID: string) =>
	(msg: unknown): void => {
		if (document.cookie.includes('cfQA')) {
			console.log(`[${testID}] -->`, msg);
		}
	};

/**
 * Returns a track function that prefixes the event name with the experiment ID,
 * pushes to Optimizely, and logs when the cfQA cookie is present.
 * @example
 * const track = sendTracking(testID);
 * track('btn_click'); // sends "RA_123_btn_click", logs "[RA_123] --> Event: RA_123_btn_click"
 */
export const sendTracking = (testID: string) => {
	const log = createLogger(testID);
	return (eventName: string): void => {
		const prefixedEvent = `${testID}_${eventName}`;
		window.optimizely.push({ type: 'event', eventName: prefixedEvent });
		log(`Event: ${prefixedEvent}`);
	};
};
