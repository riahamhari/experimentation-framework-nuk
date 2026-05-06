export interface ElementOptions {
	className?: string | string[];
	text?: string;
	html?: string;
	attributes?: { [key: string]: string | boolean | number | null | undefined };
	style?: { [key: string]: Partial<CSSStyleDeclaration> | string };
	events?: { [key: string]: (event: Event) => void };
}
