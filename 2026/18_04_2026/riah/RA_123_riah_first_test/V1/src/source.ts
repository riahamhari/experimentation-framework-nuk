import { createLogger, createTracker } from '@utils/ts/helpers/Optimizely';
import { SELECTORS } from '../../utils/constants.ts';

const { waitForElement } = window['optimizely'].get('utils');
const expNo = 'ELK-160';

if (location.href.includes('cfQA=true')) {
	document.cookie = 'cfQA=true;path=/';
}

const log = createLogger(expNo);
const track = createTracker(log);

waitForElement('body').then(() => {
	log('experiment running');

	document.addEventListener('click', (e) => {
		const target = e.target as Element;

		if (target.closest(SELECTORS.digitalButton)) {
			track('elk_160_user_clicks_view_offers_digital');
		}

		if (target.closest(SELECTORS.premiumButton)) {
			track('elk_160_user_clicks_view_offers_premium');
		}
	});
});
