import inquirer from 'inquirer';
import chalk from 'chalk';
import type { PromptResult, ScaffoldData } from '@utils/buildHelpers/interfaces';
import { sanitizeTestName } from '@utils/buildHelpers/helpers';

/**
 * Prompts user for test ID, name, variants, and control
 * Validates all inputs, converts types, and returns properly typed ScaffoldData
 * @param currentFolder - The folder name to use for the test structure (typically week-based)
 * @param onComplete - Callback function to execute with prompt results
 * @example
 * showPrompts('42_10_2024', (data) => {
 *   console.log(data.testId); // 'UK1234'
 *   console.log(data.numVariants); // 2 (number, not string)
 *   console.log(data.sanitizedTestName); // 'UK1234_Test_Name'
 * });
 */
export function showPrompts(currentFolder: string, onComplete: (data: ScaffoldData) => void): void {
	inquirer
		.prompt([
			{
				type: 'input',
				name: 'testId',
				message: 'Enter the test ID: ',
				validate: (value: string) => {
					if (!value.trim()) return 'Test ID is required';
					if (!/^[A-Z0-9]+(-[A-Z0-9]+)?$/.test(value))
						return 'Test ID can only contains uppercase letters, numbers and 1 dash';
					return true;
				},
			},
			{
				type: 'input',
				name: 'testName',
				message: 'Test name: ',
				validate: (value: string) => {
					return value.length ? true : 'Please enter the name of test.';
				},
			},
			{
				type: 'input',
				name: 'numVariants',
				message: 'How many variants? (not including control)',
				validate: function (value: string) {
					const val = Number(value);
					if (value.length && /\d+/g.test(value) && val && 0 < val && val <= 50) {
						return true;
					} else {
						return 'Not a valid number of variants. Please enter between 1 and 50';
					}
				},
			},
			{
				type: 'list',
				name: 'control',
				message: 'Do you need control variant?',
				choices: [
					{ name: 'No', value: false },
					{ name: 'Yes', value: true },
				],
			},
		])
		.then(({ testName, testId, numVariants, control }: PromptResult) => {
			try {
				const testFullName = testName.includes(testId) ? testName : `${testId}_${testName}`;
				const scaffoldData: ScaffoldData = {
					folderToUse: currentFolder,
					testFullName,
					testId,
					numVariants: Number(numVariants),
					control,
					sanitizedTestName: sanitizeTestName(testFullName),
				};
				onComplete(scaffoldData);
			} catch (err: any) {
				console.error(chalk.bgRed('Error creating folder structure:\n'), err.message);
				console.log('');
				process.exit(1);
			}
		})
		.catch((err: any) => {
			console.error(chalk.bgRed('Error during setup:\n'), err.message);
			console.log('');
			process.exit(1);
		});
}
