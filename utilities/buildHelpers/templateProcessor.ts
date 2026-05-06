import { readFile } from './functions.ts';
import { TemplateData } from './types.ts';

export const processWrapperTemplate = (data: TemplateData): { banner: string; footer: string } => {
	const template = readFile('../templates/outputTemplate.ts');

	const processed = template
		.replace('TEST_NAME', data.testName.replace(/_/g, ' '))
		.replace('DEVELOPER_NAME', data.developerName);

	const parts = processed.split('\/\/USER_CODE');

	return {
		banner: parts[0],
		footer: parts[1]
	};
}