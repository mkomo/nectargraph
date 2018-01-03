
export default class Util {
//https://gist.github.com/jed/982883
	uuidv4() {
		return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
			(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
		);
	}
	formatDuration = (function() {
		var HOUR_FORMAT_MIN = 1 * 60 * 60 * 1000;
		var MILLIS_IN_DAY = 24 * 60 * 60 * 1000;
		//time format setup
		var fracFormat = new Intl.NumberFormat('en-US', {
			maximumFractionDigits: 0,
			minimumIntegerDigits: 2
		});
		var timeFormatHour = new Intl.DateTimeFormat('en-US', {
			hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false,
			timeZone: 'UTC'
		});
		var timeFormatMin = new Intl.DateTimeFormat('en-US', {
			minute: 'numeric', second: 'numeric', hour12: false,
			timeZone: 'UTC'
		});
		return function(millis, alwaysIncludeFrac = false) {
			let d = new Date(millis);
			var hundredths = Math.floor(millis / 10) % 100;
			if (millis > MILLIS_IN_DAY) {
				var days = Math.floor(millis / MILLIS_IN_DAY);
				return days + 'd ' + timeFormatHour.format(d) +
						(alwaysIncludeFrac ? ('.' + fracFormat.format(hundredths)) : '');
			} else if (millis > HOUR_FORMAT_MIN) {
				return timeFormatHour.format(d) +
						(alwaysIncludeFrac ? ('.' + fracFormat.format(hundredths)) : '');
			} else {
				return timeFormatMin.format(d) + '.' + fracFormat.format(hundredths);
			}
		};
	})();
}
