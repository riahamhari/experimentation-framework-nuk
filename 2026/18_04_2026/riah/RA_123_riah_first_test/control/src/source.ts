const { waitForElement } = window['optimizely'].get('utils');
const expNo = 'TEST_ID';

function log(msg: unknown): void {
	if (document.cookie.includes('cfQA')) {
		console.log(`[${expNo}] -->`, msg);
	}
}

if (location.href.includes('cfQA=true')) {
	document.cookie = 'cfQA=true;path=/';
}

function track(eventName: string): void {
	window['optimizely'].push({
		type: 'event',
		eventName: eventName,
	});
	log(`Event: ${eventName}`);
}

const SELECTORS = {

};

waitForElement('body').then(() => {

});
