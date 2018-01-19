import { LuxLocalStore, Lux } from './LuxStore';

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
			name: (props.name ? props.name : null),//display name
			fullName: (props.fullName ? props.fullName : null),
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
			this.state.avatar = this.createAvatar(this.state.guid);
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
		this.setState({avatar: this.createAvatar(hashSeed)});
	}

	createAvatar(hashSeed) {
		return null;
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
