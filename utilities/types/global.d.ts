export {};
import { ResponseWatcher } from './interfaces.ts';

declare global {
	interface OptimizelyUtils {
		waitForElement: (selector: string) => Promise<Element>;
	}

	interface OptimizelyClient {
		get(service: 'utils'): OptimizelyUtils;
		push(event: { type: string; eventName?: string; [key: string]: unknown }): void;
	}

	interface Window {
		optimizely: OptimizelyClient;
		__responseWatchers?: Map<string, ResponseWatcher>;
		__responseWatchPatched?: boolean;
	}
}
