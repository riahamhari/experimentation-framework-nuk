import clear from 'clear';
import chalk from 'chalk';
import { devConfig } from './config.js';
import { validateDeveloperConfig, generateWeekBasedFolder } from '@utils/buildHelpers/helpers';
import { showPrompts } from '@utils/buildHelpers/prompts';
import { createFolderStructure } from '@utils/buildHelpers/scaffold';
import { createAndCheckoutBranch } from '@utils/buildHelpers/git';

clear();
console.log('---- Opti Framework setup ----\n');

(function () {
	try {
		validateDeveloperConfig(devConfig);
		console.log(`Hi ${devConfig.name}\n`);
		
		const folderName = generateWeekBasedFolder();
		showPrompts(folderName, (data) => {
			createFolderStructure(data, devConfig, {
				skipGit: false,
				createBranch: createAndCheckoutBranch,
			});
		});
	} catch (err) {
		console.error(chalk.bgRed('Initialization failed:'), err.message);
		console.log('');
		process.exit(1);
	}
})();
