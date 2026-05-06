// @ts-nocheck
import { createLogger, createTracker } from '@utils/ts/helpers/Optimizely';
import { SELECTORS } from '../../utils/constants.ts';
import { testID } from './testConfig.ts';

const { waitForElement } = window.optimizely.get('utils');

const log = createLogger(testID);
const track = createTracker(log);

waitForElement('body').then(() => {

});
