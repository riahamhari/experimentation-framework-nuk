import fs from 'fs';
import * as sass from 'sass';
import path from 'path';

/**
 * Creates a directory on the supplied path
 * @param path - the path to create the directory
 * @param checkExists - whether to check if directory already exists (default: true)
 * @throws {Error} When directory already exists (if checkExists=true) or creation fails
 */
export function makeDirectory(path: string, checkExists = true) {
	const isExists = fs.existsSync(path);
	if (checkExists && isExists) throw new Error(`Folder (${path}) already exists, please choose another name`);

	try {
		if (!isExists) fs.mkdirSync(path, { recursive: true });
	} catch (err) {
		throw new Error(`Error creating directory, issue with path ${path}`);
	}
}

/**
 * Reads a template file from the utilities/templates directory
 * @param templateName - The name of the template file to read
 * @returns The template file content as string
 * @throws {Error} When template file is not found or cannot be read
 */
export function readFile(templateName: string): string {
	try {
		return fs.readFileSync(`./utilities/templates/${templateName}`, 'utf8');
	} catch (err) {
		if (err.code === 'ENOENT') {
			throw new Error(`Template ${templateName} not found`);
		} else {
			throw new Error(`Error reading template ${templateName}`);
		}
	}
}

/**
 * Create a file in a defined location with content
 * @param location - location to create the file
 * @param content - content to insert in the newly created file
 * @throws {Error} When file creation fails
 */
export function createFile(location: string, content: string) {
	try {
		fs.writeFileSync(location, content);
	} catch (err) {
		throw new Error(`Error creating file ${location}`);
	}
}

/**
 * Reads the contents of a directory and returns an array of file/folder names
 * @param location - absolute path to the directory to read
 * @returns Array of file and directory names in the specified location
 * @throws {Error} When directory cannot be read or doesn't exist
 */
export function readDirectory(location: string): string[] {
	try {
		return fs.readdirSync(location);
	} catch (err) {
		throw new Error(`Error reading folder ${location}`);
	}
}

/**
 * Returns a list of absolute paths to `.scss` files located directly in the given directory.
 *
 * Note: This does not search recursively.
 */
export function getScssFiles(dir: string): string[] {
	return readDirectory(dir)
		.filter((f) => f.endsWith('.scss'))
		.map((f) => path.join(dir, f));
}

/**
 * Compiles a single SCSS file using Dart Sass, with load paths pointing to:
 * - `<rootDir>/utilities/sass`
 * - `<rootDir>/node_modules`
 */
export function compileSass(file: string, rootDir: string): sass.CompileResult {
	return sass.compile(file, {
		loadPaths: [path.join(rootDir, 'utilities', 'sass'), path.join(rootDir, 'node_modules')],
		silenceDeprecations: ['import', 'global-builtin'],
	});
}
