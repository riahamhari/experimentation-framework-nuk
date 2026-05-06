// @ts-nocheck
import { createLogger, createTracker } from '@utils/ts/helpers/Optimizely';
import { SELECTORS } from '../../utils/constants.ts';
import { testID } from './testConfig.ts';

const { waitForElement } = window.optimizely.get('utils');

if (location.href.includes('cfQA=true')) {
	document.cookie = 'cfQA=true;path=/';
}

const log = createLogger(testID);
const track = createTracker(log);

waitForElement('body').then(() => {
	log('experiment running');

});
