import type { DevConfig } from '@utils/buildHelpers/interfaces';

/**
 * Sanitizes test name by replacing invalid characters with underscores
 * Removes special characters and normalizes whitespace for folder naming
 * @param testName - The test name to sanitize
 * @returns Sanitized test name safe for use in folder paths
 * @example
 * sanitizeTestName('UK1234 - Test Name'); // Returns: 'UK1234_Test_Name'
 */
export function sanitizeTestName(testName: string): string {
	return testName
		.replace(/\s-\s/gi, '_')
		.replace(/-/g, '_')
		.replace(/[^a-zA-Z\s\d_:]/gi, '')
		.replace(/\s+/gi, '_')
		.trim();
}

/**
 * Generates a folder name based on current week number, month and year
 * Uses ISO week date system for consistent week numbering
 * @returns Formatted folder name in format "WW_MM_YYYY"
 * @example
 * generateWeekBasedFolder(); // Returns: '42_10_2024' for week 42 of October 2024
 */
export function generateWeekBasedFolder(): string {
	const d = new Date();
	const utcDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
	utcDate.setUTCDate(utcDate.getUTCDate() + 4 - (utcDate.getUTCDay() || 7));

	const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
	const weekNo = Math.ceil(((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
	const weekDayFormatted = weekNo.toString().padStart(2, '0');
	const monthFormatted = (utcDate.getUTCMonth() + 1).toString().padStart(2, '0');

	return `${weekDayFormatted}_${monthFormatted}_${utcDate.getUTCFullYear()}`;
}

/**
 * Validates developer configuration
 * Checks that ID contains only lowercase letters and name contains only letters, spaces, and hyphens
 * @param devConfig - Developer configuration object
 * @throws {Error} If config is invalid or missing
 * @example
 * validateDeveloperConfig({ id: 'john', name: 'John Doe' }); // Valid
 * validateDeveloperConfig({ id: 'John', name: 'John Doe' }); // Throws error - ID must be lowercase
 */
export function validateDeveloperConfig(devConfig: DevConfig): void {
	const devId = devConfig.id;
	const devName = devConfig.name;
	if (!devId || !devName) throw new Error('Developer ID or name is missing');

	const hasValidIdFormat = /^[a-z]+$/.test(devId);
	const hasValidNameFormat = /^[a-zA-Z\s-]+$/.test(devName);

	if (!hasValidIdFormat) throw new Error(`Developer ID can contain lowercase letters only`);
	if (!hasValidNameFormat) throw new Error(`Developer name can contain letters and spaces`);
}
