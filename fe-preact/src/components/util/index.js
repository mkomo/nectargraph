
export default class Util {

	serializeToJson(obj, indent = null) {
		return JSON.stringify(obj, function(key, value) {
			return (!this.hasOwnProperty('_fields') || this['_fields'].includes(key))
					? value
					: undefined;
		}, indent);
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
