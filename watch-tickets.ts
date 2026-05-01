import chokidar from 'chokidar';
import chalk from 'chalk';
import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import clear from 'clear';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
import { devConfig } from './config.js';
import { createFile, makeDirectory, readDirectory } from './utilities/buildHelpers/functions.ts';
import { TestConfig } from './utilities/buildHelpers/types.ts';
import { processWrapperTemplate } from './utilities/buildHelpers/templateProcessor.ts';
import { getScssFiles, compileSass } from './utilities/buildHelpers/functions.ts';

/*
ESM __dirname / __filename helpers
*/
const rootDir = process.cwd();
const utilitiesDir = path.join(rootDir, 'utilities');

/**
 * Traverses up the directory tree to find the nearest ticket folder containing a 'src' directory
 *
 * @param filePath - Path to start searching from
 * @returns Absolute path to ticket folder or null if not found
 */
function findTicketFolder(filePath: string): string | null {
	let current = path.dirname(filePath);
	while (current !== rootDir && current !== path.parse(current).root) {
		if (fs.existsSync(path.join(current, 'src'))) return current;
		current = path.dirname(current);
	}
	return null;
}

/**
 * Creates a debounced version of a function that delays execution until after delay milliseconds
 *
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
function debounce<F extends (...args: any[]) => void>(fn: F, delay: number) {
	let timeout: NodeJS.Timeout;
	return (...args: Parameters<F>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => fn(...args), delay);
	};
}

/**
 * Compiles a single ticket folder by processing TypeScript and SCSS files
 *
 * This function performs the complete build pipeline for a ticket:
 * 1. Loads test configuration from testConfig.js or falls back to devConfig
 * 2. Compiles TypeScript using esbuild with browser-compatible settings
 * 3. Compiles all SCSS files in the src directory
 * 4. Generates two output files:
 *    - output.js: Compiled JavaScript for Optimizely
 *    - output.css: Compiled CSS for Optimizely
 *
 * @param ticketFolder - Absolute path to the ticket folder containing src directory
 * @throws {Error} When compilation fails or developer details are missing
 */
async function compileTicket(ticketFolder: string) {
	const startTime = Date.now();

	try {
		const srcDir = path.join(ticketFolder, 'src');
		const tsFile = path.join(srcDir, 'source.ts');

		// Import testConfig dynamically with fallback
		let testConfig: TestConfig;
		try {
			const testConfigPath = path.join(srcDir, 'testConfig.ts');
			const normalisedPath = path.relative(process.cwd(), testConfigPath).replaceAll('\\', '/');
			const { testID, testName, developerID, developerName, variant } = await import('./' + normalisedPath);

			testConfig = { testID, testName, developerID, developerName, variant };
		} catch {
			// File doesn't exist or import failed, use devConfig as fallback
			const generatedName = ticketFolder?.split(/\/|\\/g).pop();
			const variantName = ticketFolder?.split('/')[ticketFolder?.split('/').length - 1];

			testConfig = {
				testID: generatedName,
				testName: generatedName,
				developerName: devConfig.name,
				developerID: devConfig.id,
				variant: variantName,
			};
		}

		if (!testConfig?.developerName) {
			throw new Error("Developer details couldn't be found in devConfig.js or testConfig.js");
		}

		if (!testConfig?.testName.includes(testConfig.testID)) {
			testConfig.testName = `${testConfig.testID} ${testConfig.testName}`;
		}

		const { banner, footer } = processWrapperTemplate({
			testID: testConfig.testID,
			testName: `${testConfig.testName} - ${testConfig.variant}`.replace(/_/g, ' '),
			developerName: testConfig.developerName,
		});

		// Validate TypeScript first
		await validateTypeScript();

		// Compile TypeScript with esbuild

		let jsResult: esbuild.BuildResult;
		try {
			jsResult = await esbuild.build({
				entryPoints: [tsFile],
				bundle: true,
				write: false,
				format: 'esm',
				target: ['es2022'],
				minify: false,
				treeShaking: true,
				jsx: 'automatic',
				legalComments: 'inline',
				platform: 'browser',
				sourcemap: false,
				banner: { js: banner },
				footer: { js: footer },
				alias: { '@utils': utilitiesDir },
			});
		} catch (err) {
			throw new Error(`${chalk.bgRed('❌ ESBuild error:')} ${err}`);
		}

		// Compile all SCSS in the src folder
		const scssFiles = getScssFiles(srcDir);

		let compiledCSS = '';
		for (const file of scssFiles) {
			try {
				const result = compileSass(file, rootDir);
				compiledCSS += result.css.trim();
			} catch (err) {
				throw new Error(`${chalk.bgRed('❌ SCSS build error:')} ${err}`);
			}
		}

		// Build folder
		const buildDir = path.join(ticketFolder, 'build');
		makeDirectory(buildDir, false);

		const jsOutputFile = path.join(buildDir, 'output.js');
		const cssOutputFile = path.join(buildDir, 'output.css');
		const snippetOutputFile = path.join(buildDir, 'snippet.js');

		const compiledJS = jsResult.outputFiles[0].text.replace(/^\s*\/\/.*(?:\.ts|\.js|utilities|src).*$/gm, '').trim();

		const snippet = compiledCSS
			? `${compiledJS}\ndocument.body.insertAdjacentHTML('afterbegin', '<style>${compiledCSS.replace(/\n/g, ' ')}</style>');`
			: compiledJS;

		createFile(jsOutputFile, compiledJS);
		createFile(cssOutputFile, compiledCSS);
		createFile(snippetOutputFile, snippet);

		console.log(
			`✅ ${chalk.bgGreen('Successful build')} ${path.relative(rootDir, ticketFolder)} in ${Date.now() - startTime}ms\n`
		);
	} catch (err) {
		console.error(`${chalk.bgRed('❌ Build failed:')} ${err.message || err}`);
		return; // Stop build on any error
	}
}

/**
 * Rebuilds tickets based on scope - either all tickets or tickets in a specific folder
 *
 * When fullPath is null, traverses the entire project structure (YYYY/WW_MM_YYYY) and rebuilds all tickets.
 * When fullPath is provided, rebuilds only tickets in the same parent folder as the utils file.
 *
 * @param fullPath - null for entire project rebuild, or path to utils file for folder-specific rebuild
 */
async function rebuildTickets(fullPath: string | null = null) {
	if (!fullPath) {
		const yearFolders = readDirectory(rootDir).filter((f) => /^\d{4}$/.test(f));
		for (const year of yearFolders) {
			const yearPath = path.join(rootDir, year);
			const weekFolders = readDirectory(yearPath).filter((f) => /^\d{2}_\d{2}_\d{4}$/.test(f));

			for (const week of weekFolders) {
				const weekPath = path.join(yearPath, week);
				await rebuildTicketsInDirectory(weekPath);
			}
		}
	} else {
		const parentFolder = path.dirname(path.dirname(fullPath));
		await rebuildTicketsInDirectory(parentFolder);
	}
}

/**
 * Recursively finds and rebuilds all tickets in a specific directory
 *
 * Searches for all folders containing 'src' directories and compiles each ticket.
 * Individual ticket failures are logged but don't stop the overall rebuild process.
 *
 * @param directory - Absolute path to directory to search for tickets
 */
async function rebuildTicketsInDirectory(directory: string) {
	const ticketFolders = findAllSrcFolders(directory);

	for (const ticketFolder of ticketFolders) {
		try {
			await compileTicket(ticketFolder);
		} catch (err) {
			console.error(chalk.bgRed('❌ Error rebuilding ticket:'), err);
		}
	}
}

/**
 * Recursively finds all folders containing 'src' directories
 *
 * Traverses directory tree and returns parent folders of any 'src' directories found.
 * Skips 'build' directories to avoid compiled output and improve performance.
 *
 * @param directory - Root directory to start searching from
 * @returns Array of absolute paths to folders containing 'src' directories
 */
/**
 * Validates TypeScript files in the ticket folder for compilation errors
 *
 * @param ticketFolder - Absolute path to the ticket folder
 * @throws {Error} When TypeScript validation fails
 */
async function validateTypeScript() {
	try {
		await execAsync(`npx tsc --noEmit --skipLibCheck`);
	} catch (err) {
		if (err.stdout || err.stderr) {
			throw new Error(`TypeScript errors found:\n${err.stdout || err.stderr}`);
		}
		throw err;
	}
}

function findAllSrcFolders(directory: string): string[] {
	const srcFolders: string[] = [];

	function traverse(dir: string) {
		try {
			const items = readDirectory(dir);

			for (const item of items) {
				const itemPath = path.join(dir, item);

				if (fs.statSync(itemPath).isDirectory()) {
					if (item === 'src') {
						srcFolders.push(dir);
					} else if (item !== 'build') {
						traverse(itemPath);
					}
				}
			}
		} catch (err) {
			// Skip directories that can't be read
			console.warn(`Skipping directory due to read error: ${dir}`);
		}
	}

	traverse(directory);
	return srcFolders;
}

/**
 * Initializes the file watcher system for automatic compilation
 *
 * Sets up chokidar to watch for changes in:
 * - All .ts and .scss files in ticket src directories
 * - All .ts files in local utils directories
 * - All .ts and .js files in the global utilities directory
 *
 * Behavior:
 * - Global utilities changes (utilities/) trigger full project rebuild
 * - Local utils changes (/utils/) trigger folder-specific rebuild
 * - Individual ticket src changes trigger debounced single ticket compilation
 * - Build directory changes are ignored to prevent infinite loops
 *
 * Uses 150ms debounce for individual tickets and 200ms file stability threshold.
 */
function startWatcher() {
	const globs = [
		path.join(rootDir, '**', 'src', '**', '*.ts'),
		path.join(rootDir, '**', 'src', '**', '*.scss'),
		path.join(rootDir, '**', 'utils', '**', '*.ts'),
		path.join(utilitiesDir, '**', '*.ts'),
		path.join(utilitiesDir, '**', '*.js'),
	];

	const watcher = chokidar.watch(globs, {
		ignoreInitial: true,
		awaitWriteFinish: {
			stabilityThreshold: 200,
			pollInterval: 50,
		},
		ignored: (filePath) => filePath.includes(`${path.sep}build${path.sep}`),
	});

	// Debounced rebuild per ticket
	const rebuildTicketDebounced = debounce(async (ticketFolder: string) => {
		await compileTicket(ticketFolder);
	}, 150);

	watcher.on('all', async (event, filePath) => {
		try {
			console.log(`🔍 ${event}: ${path.relative(rootDir, filePath)}`);

			if (filePath.startsWith(utilitiesDir)) {
				console.log('🔁 Utilities changed → rebuilding all tickets');
				await rebuildTickets();
				console.log(`${chalk.bgYellow('Build process is done. See details above.')}`);
				return;
			}

			if (filePath.includes(`${path.sep}utils${path.sep}`)) {
				console.log('🔁 Local utils changed → rebuilding tickets in folder');
				await rebuildTickets(filePath);
				console.log(`${chalk.bgYellow('Build process is done. See details above.')}`);
				return;
			}

			const ticketFolder = findTicketFolder(filePath);
			if (ticketFolder) {
				rebuildTicketDebounced(ticketFolder);
			}
		} catch (err) {
			console.log(chalk.bgRed('❌ Error rebuilding tickets:'), err);
		}
	});

	clear();
	console.log('👀 Watching for changes in tickets and utilities...');
}

startWatcher();
