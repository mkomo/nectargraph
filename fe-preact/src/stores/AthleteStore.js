import { LuxLocalStore, Lux } from './LuxStore';

let AthleteActions = Lux.createActions([
	'deleteAthlete',
	'updateAthlete'
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
			avatar: null,

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
