export type DateInput = string | Date | number;
export type ComparisonType = 'before' | 'after';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type HttpRequestOptions = {
	url: string;
	method?: HttpMethod;
	payload?: unknown;
	headers?: Record<string, string>;
};

export type AttributeUpdate = {
	attribute: string;
	value: string;
	extend?: boolean;
};
