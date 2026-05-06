import { ElementOptions } from '@utils/types/interfaces';

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
