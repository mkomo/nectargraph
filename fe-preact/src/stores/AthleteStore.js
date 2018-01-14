import { LuxLocalStore, Lux } from './LuxStore';
import Identicon from 'identicon.js';

let AthleteActions = Lux.createActions([
	'deleteAthlete',
	'updateAthlete',
	'updateAvatar'
]);

var keys = [
	a => (a.organization && a.name) ? "/" + a.organization + "/" + a.name : undefined,
	a => a.guid ? "/" + a.guid : undefined
]

class AthleteStore extends LuxLocalStore {
	constructor(props = {}) {
		super(props);

		this.state = {
			guid: (props.guid ? props.guid : Lux.guid()),
			name: (props.name ? props.name : null),
			avatar: (props.avatar ? props.avatar : null),

			organization: (props.organization ? props.organization : null),
			affiliations: [],

			athletePerformances: [],

			//TODO -- these are not exactly state. save them elsewhere and make them accessible via functions
			isLoaded: false,
			isErrored: null,
			isSaved: false,
			isDeleted: false,

			//TODO make sense of how we represent things stored in another object and things stored with this
			//TODO ascertain fields from the state object once this is reorganized
		};

		if (!this.state.avatar) {
			this.onUpdateAvatar(this.state.guid);
		}
		this.setActions(AthleteActions());
	}

	onDeleteAthlete() {
		console.debug('onDeleteAthlete', this.state.guid);
		this.delete();
		this.setState({deleted: true});
	}
	onUpdateAthlete(attrs) {
		console.debug('onUpdateAthlete',arguments);
		this.setState(attrs);
	}

	onUpdateAvatar(hashSeed = Lux.guid()) {
		var hash = (function(seed){
			//Assume seed is a guid string.
			//TODO handle arbitrary string (or object?)
			return hashSeed.replace(/-/g,'');
		})(hashSeed);
		var options = {
			background: [0,0,0,0],                    // rgba transparent
			margin: 0.05,                             // 5% margin
			size: 420,                                // 420px square
			format: 'svg'                             // use SVG instead of PNG
		};
		// create a base64 encoded SVG
		var data = new Identicon(hash, options).toString();
		var imgSrc = "data:image/svg+xml;base64," + data;
		this.setState({avatar: imgSrc});
	}
}

AthleteStore.keys = keys;

export {
	AthleteStore
}

/**
TODO
implement delete
separate out the lux loaded, errored, saved states
implement localstorage (with successful rehydration)
handle multiple action sources
Store-ify AthletePerformance
 */
