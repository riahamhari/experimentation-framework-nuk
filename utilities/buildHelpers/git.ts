import { execSync } from 'child_process';

/**
 * Creates and checks out a new branch using the supplied branchname and appending "test/"
 * Validates working tree is clean and branch doesn't already exist
 * @param branchName - The branch name to create (will be prefixed with "test/")
 * @param baseBranch - Base branch to branch from (defaults to 'main')
 * @throws {Error} If branch name is invalid, working tree is dirty, or branch already exists
 * @example
 * createAndCheckoutBranch('UK1234_Test_Name'); // Creates branch: test/UK1234_Test_Name
 */
export function createAndCheckoutBranch(branchName: string, baseBranch: string = 'main'): void {
	if (!branchName) {
		throw new Error('Branch name is required');
	}

	if (!/^[\w.\-\/]+$/.test(branchName)) {
		throw new Error(`Invalid branch name: ${branchName}`);
	}

	try {
		// Check for uncommitted changes
		execSync('git diff-index --quiet HEAD --');

		// Check for untracked files
		const untrackedFiles = execSync('git status --porcelain').toString();
		if (untrackedFiles) {
			throw new Error('Working tree has untracked files');
		}

		execSync('git diff --quiet', { stdio: 'ignore' });
	} catch {
		throw new Error('Working tree is not clean. Please commit or stash any changes.');
	}

	const fullBranchName = `test/${branchName}`;

	try {
		execSync(`git show-ref --verify --quiet refs/heads/${fullBranchName}`);
		throw new Error(`Branch "${fullBranchName}" already exists`);
	} catch (error: any) {
		// `git show-ref` exits with 1 if the ref does not exist.
		if (error.status !== 1) {
			throw error;
		}
	}

	execSync(`git checkout ${baseBranch}`, { stdio: 'inherit' });
	execSync(`git pull origin ${baseBranch}`, { stdio: 'inherit' });
	execSync(`git checkout -b ${fullBranchName}`, { stdio: 'inherit' });

	console.log(`✅ Switched to new branch: ${fullBranchName}`);
}
