import { sendTracking } from '@utils/ts/helpers/Optimizely';
import { SELECTORS } from '../../utils/constants.ts';
import { testID } from './testConfig.ts';

const { waitForElement } = window.optimizely.get('utils');

const track = sendTracking(testID);

waitForElement('body').then(() => {

});
