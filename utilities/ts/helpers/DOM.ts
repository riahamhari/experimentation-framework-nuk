import { ElementOptions } from '@utils/types/interfaces';
import { AttributeUpdate } from '@utils/types/types';

/**
 *   Creates an HTML element with the attributes and properties you want
 *   @param tag - the HTML tag name (ie. 'div', 'span', 'button')
 *   @param options - Config object
 *   @returns The HTML Element
 *
 *   @example
 *  const label = createHTMLElement('div', {
 *       className: 'test',
 *       text: 'Label created',
 *       style: {height: '24px',borderRadius: '8px'},
 *       events: { click: () => { console.log('test');}, },
 *       attributes: {'aria-label': 'test', 'data-id':'opti123' },
 *   });
 */

export const createHTMLElement = (tag: string, options: ElementOptions = {}): HTMLElement => {
	const element = document.createElement(tag);
	const { className, text, attributes, style, events, html } = options;

	if (className) {
		if (Array.isArray(className)) {
			element.classList.add(...className.filter(Boolean));
		} else {
			element.className = className;
		}
	}

	if (text) {
		element.textContent = text;
	}

	if (html) {
		element.innerHTML = html;
	}

	if (attributes) {
		Object.entries(attributes).forEach(([key, value]) => {
			if (value != null) {
				element.setAttribute(key, String(value));
			}
		});
	}

	if (style) {
		if (typeof style === 'string') {
			element.style.cssText = style;
		} else {
			Object.assign(element.style, style);
		}
	}

	if (events) {
		Object.entries(events).forEach(([event, handler]) => {
			element.addEventListener(event, handler as EventListener);
		});
	}
	return element;
};

/**
 * Gets nested object value using dot-notation path string
 * @param obj - Object to traverse
 * @param path - Dot-notation path (e.g., 'user.profile.name' or 'items[0].id')
 * @returns Value at the specified path or undefined
 * @example
 * getPath({ user: { name: 'John' } }, 'user.name') // 'John'
 */

export const getPath = (obj, path: string) =>
	path
		.replace(/\[(\d+)\]/g, '.$1')
		.split('.')
		.reduce((o, k) => o?.[k], obj);

/**
 *   Retrieves a value from an object using dot-notation paths with fallback alternatives
 *   @param obj - The object to query
 *   @param paths - Array of dot-notation paths to try in order
 *   @returns The value from the first successful path, or undefined if none found
 *
 *   @example
 *   const userId = getPathWithAlternative(data, ['user.id', 'userId', 'user_id']);
 */

export const getPathWithAlternative = (obj: any, paths: string[]): any => {
	for (const path of paths) {
		const value = getPath(obj, path);
		if (value !== undefined) return value;
	}
	return undefined;
};

/**
 * Handles querying elements within shadow DOM using :: separator
 * @param root - Document or ShadowRoot to query from
 * @param sel - CSS selector with :: separator (e.g., 'my-component::.inner-element')
 * @returns Array of matching elements or shadow roots
 */
const queryShadowDom = (root: ParentNode, sel: string): (Element | ShadowRoot)[] => {
	const [h, ...rest] = sel.split('::');
	const hosts = root.querySelectorAll(h.trim());
	if (hosts.length === 0) return [];

	// If selector ends with ::, return shadow roots themselves
	const remainingSelector = rest.join('::');
	if (remainingSelector === '') {
		return Array.from(hosts)
			.map((host) => host.shadowRoot)
			.filter((shadowRoot): shadowRoot is ShadowRoot => shadowRoot !== null);
	}

	// Query each host's shadow root and collect all results
	const results: (Element | ShadowRoot)[] = [];
	for (const host of hosts) {
		if (host.shadowRoot) {
			results.push(...queryAll(host.shadowRoot, remainingSelector));
		}
	}
	return results;
};

/**
 * Queries elements including those inside shadow DOM using :: separator
 * @param root - Document or ShadowRoot to query from
 * @param sel - CSS selector, use :: to traverse into shadow DOM (e.g., 'my-component::.inner-element')
 * @returns Array of matching elements or shadow roots
 * @example
 * queryAll(document, 'tui-button::.button-text') // Finds .button-text inside tui-button's shadow DOM
 * queryAll(document, 'tui-button::') // Returns shadow root itself
 */
export const queryAll = (root: ParentNode, sel: string): (Element | ShadowRoot)[] =>
	sel.includes('::') ? queryShadowDom(root, sel) : [...root.querySelectorAll(sel)];

/**
 *   Queries elements with fallback to alternative selectors
 *   @param root - The root element to query from (Document or ShadowRoot)
 *   @param selectors - Array of CSS selectors to try in order
 *   @returns Array of matching elements from the first successful selector, or empty array if none found
 *
 *   @example
 *   const buttons = queryWithAlternative(document, ['.primary-btn', '.btn-primary', '[data-btn="primary"]']);
 */

export const queryWithAlternative = (root: ParentNode, selectors: string[]): (Element | ShadowRoot)[] => {
	for (const selector of selectors) {
		const result = queryAll(root, selector);
		if (result.length > 0) return result;
	}
	return [];
};

/**
 * Updates a single attribute on a DOM element, either extending existing values or replacing them
 * @param element - The DOM Element to update
 * @param attr - The attribute configuration containing attribute name, value, and extend flag
 * @example
 * const element = document.querySelector('tui-component');
 * updateElementAttribute(element, { attribute: 'features', value: 'new-feature', extend: true });
 */

export const updateElementAttribute = (element: Element, attr: AttributeUpdate): void => {
	const { attribute, value, extend } = attr;
	const currentValue = extend ? (element.getAttribute(attribute) ?? '') : '';

	const combinedValue = currentValue ? `${currentValue},${value}` : value;
	element.setAttribute(attribute, combinedValue);
};
