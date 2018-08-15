import 'regenerator-runtime/runtime';
import chai from 'chai';
import assertJsx, { options } from 'preact-jsx-chai';

// when checking VDOM assertions, don't compare functions, just nodes and attributes:
options.functions = false;

// activate the JSX assertion extension:
chai.use(assertJsx);

global.sleep = ms => new Promise( resolve => setTimeout(resolve, ms) );

window.crypto = {
	getRandomValues: function() {
		return [Math.floor(Math.random() * 256)];
	}
}

console.log = function(){};
console.debug = console.log;
