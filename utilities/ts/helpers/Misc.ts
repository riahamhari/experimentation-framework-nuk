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

/**
 * Creates a shared variant store for an experiment.
 * Instantiate once in utils/functions.ts, export set/get, then import into source.ts.
 * @example
 * // utils/functions.ts
 * const variantStore = createVariantStore();
 * export const setVariant = variantStore.set;
 * export const getVariant = variantStore.get;
 *
 * // source.ts
 * import { setVariant } from '../utils/functions.ts';
 * setVariant(window.optimizely.get('state').getVariationMap()[testID]?.id ?? 'control');
 *
 * // anywhere in utils/functions.ts
 * const variant = getVariant();
 */
export const createVariantStore = () => {
	let _variant: string | undefined;
	return {
		set: (v: string) => { _variant = v; },
		get: () => _variant as string,
	};
};
