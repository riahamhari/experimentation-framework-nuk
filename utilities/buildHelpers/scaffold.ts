import { readFile, createFile, makeDirectory } from '@utils/buildHelpers/functions';
import type { DevConfig, ScaffoldData, ScaffoldOptions, FileData } from '@utils/buildHelpers/interfaces';

/**
 * Creates all required directories for the test structure
 * Creates src subdirectory within the target folder
 * @param targetFolder - The base target folder path
 */
function createDirectories(targetFolder: string): void {
	makeDirectory(targetFolder);
	makeDirectory(`${targetFolder}/src`);
}

/**
 * Creates multiple files from an array of file data objects
 * Iterates through array and creates each file at specified location
 * @param filesData - Array of objects containing file location and content
 */
function createFilesFromList(filesData: FileData[]): void {
	filesData.forEach((fileData) => {
		createFile(fileData.location, fileData.content);
	});
}

/**
 * Generates test config file content by replacing placeholders with actual values
 * Reads template and replaces TEST_ID, TEST_NAME, DEVELOPER_ID, DEVELOPER_NAME, and VARIANT
 * @param data - Data object with test information (testId, testName, variant)
 * @param devConfig - Developer configuration
 * @returns The processed config file content with replaced variables
 */
function getDefaultConfigFileContent(
	data: { testId: string; testName: string; variant: string },
	devConfig: DevConfig
): string {
	const defaultSourceContent = readFile('defaultTestConfig.ts');

	const replaceObject: Record<string, string> = {
		TEST_ID: data.testId.trim(),
		TEST_NAME: data.testName,
		DEVELOPER_ID: devConfig.id,
		DEVELOPER_NAME: devConfig.name,
		VARIANT: data.variant,
	};

	const keys = Object.keys(replaceObject).join('|');
	return defaultSourceContent.replace(new RegExp(`(${keys})`, 'g'), (match) => replaceObject[match]);
}

/**
 * Creates variant-specific files from templates in the target folder
 * Creates source.ts, source.scss, and testConfig.js for each variant
 * @param targetFolder - The target folder path where files will be created
 * @param testId - The test ID for template replacement
 * @param testName - The test name for template replacement
 * @param variant - The variant name for template replacement (e.g., 'V1', 'V2', 'control')
 * @param devConfig - Developer configuration
 */
function createVariantFiles(
	targetFolder: string,
	testId: string,
	testName: string,
	variant: string,
	devConfig: DevConfig
): void {
	const projectFolder = `${targetFolder}/src`;
	const templates = {
		sass: readFile('defaultSass.scss'),
		source: readFile('defaultSource.ts'),
		config: getDefaultConfigFileContent({ testId, testName, variant }, devConfig),
	};

	const filesData: FileData[] = [
		{ location: `${projectFolder}/source.ts`, content: templates.source },
		{ location: `${projectFolder}/source.scss`, content: templates.sass },
		{ location: `${projectFolder}/testConfig.ts`, content: templates.config },
	];

	createFilesFromList(filesData);
}

/**
 * Creates utility files for the project in the utils folder
 * Creates constants.ts and functions.ts at test level
 * @param targetFolder - The base target folder path
 */
function createProjectFiles(targetFolder: string): void {
	const utilsFolder = `${targetFolder}/utils`;
	const filesData: FileData[] = [
		{ location: `${utilsFolder}/constants.ts`, content: `export const SELECTORS = {\n\tel: '.some-class',\n};\n` },
		{ location: `${utilsFolder}/functions.ts`, content: '' },
	];

	createFilesFromList(filesData);
}

/**
 * Creates folder structure based from an object
 * Main orchestration function that creates entire test structure with variants
 * Optionally creates git branch before scaffolding
 * @param data - Object to define folder structure with test details
 * @param devConfig - Developer configuration
 * @param options - Additional options (skipGit, createBranch function)
 * @example
 * createFolderStructure(
 *   { testId: 'UK1234', numVariants: 2, control: true, ... },
 *   { id: 'john', name: 'John Doe' },
 *   { skipGit: false, createBranch: createAndCheckoutBranch }
 * );
 */
export function createFolderStructure(data: ScaffoldData, devConfig: DevConfig, options: ScaffoldOptions = {}): void {
	const { folderToUse, testId } = data;
	const { skipGit = false, createBranch } = options;
	const currentYear = new Date().getUTCFullYear();
	const developer = devConfig.id;
	const testName = data.sanitizedTestName;

	if (!skipGit && createBranch) {
		try {
			createBranch(testName);
		} catch (err: any) {
			console.error('\n❌ Branch creation failed:', err.message, '\n');
			process.exit(1);
		}
	}

	const targetFolder = `${currentYear}/${folderToUse}/${developer}/${testName}`;

	//Add utils folder to main folder
	makeDirectory(`${targetFolder}/utils`);
	createProjectFiles(targetFolder);

	//Create variant folders
	const variants = Number(data.numVariants);
	if (!variants || isNaN(variants)) throw new Error('No variants defined');

	const variantsArr = [...Array.from({ length: variants }, (_, i) => `V${i + 1}`)];
	if (data.control) variantsArr.push('control');

	variantsArr.forEach((variant) => {
		const variantFolder = `${targetFolder}/${variant}`;
		createDirectories(variantFolder);
		createVariantFiles(variantFolder, testId, testName, variant, devConfig);
	});

	// Create shared code folder
	const sharedFolder = `${targetFolder}/shared-code`;
	createDirectories(sharedFolder);
	createVariantFiles(sharedFolder, testId, testName, 'shared-code', devConfig);

	console.log(`New folder structure ${targetFolder} created\n`);
	console.log('To start watcher without going through this process use "npm start"\n');
}
