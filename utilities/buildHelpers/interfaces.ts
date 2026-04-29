export interface DevConfig {
	id: string;
	name: string;
}

export interface PromptResult {
	testId: string;
	testName: string;
	numVariants: string;
	control: boolean;
}

export interface ScaffoldData {
	folderToUse: string;
	testFullName: string;
	testId: string;
	numVariants: number;
	control: boolean;
	sanitizedTestName: string;
}

export interface ScaffoldOptions {
	skipGit?: boolean;
	createBranch?: (testName: string) => void;
}

export interface FileData {
	location: string;
	content: string;
}
