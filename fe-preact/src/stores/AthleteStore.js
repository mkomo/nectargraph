import { LuxMemStore, Lux } from './LuxStore';

let AthleteActions = Lux.createActions([
	'deleteAthlete',
	'updateAthlete',
	'addAthleteToEvent',
	'recordAthleteSplit',
	'deleteAthleteSplit'
]);

var keys = [
	a => (a.organization && a.name) ? "/" + a.organization + "/" + a.name : undefined,
	a => a.guid ? "/" + a.guid : undefined
]
class AthleteStore extends LuxMemStore {
	constructor(props = {}) {
		super(props);
		this._fields = ['state'];

		this.state = {
			guid: Lux.guid(),
			name: null,
			avatar: null,

			organization: null,
			affiliations: [],

			athletePerformances: [],

			//TODO -- these are not exactly state. save them elsewhere and make them accessible via functions
			isLoaded: false,
			isErrored: null,
			isSaved: false,

			//TODO make sense of how we represent things stored in another object and things stored with this
			//TODO ascertain fields from the state object once this is reorganized
			_fields: ['guid','name','avatar','organization','affiliations','athletePerformances']
		};

		this.setActions(AthleteActions());
	}

	onDeleteAthlete() {
		console.log('onDeleteAthlete',arguments);
	}
	onUpdateAthlete(attrs) {
		console.log('onUpdateAthlete',arguments);
		this.setState(attrs);
	}
	onAddAthleteToEvent(ap) {
		console.log('onUpdateAthlete',arguments);

	}
	onRecordAthleteSplit(ap, split) {
		console.log('onRecordAthleteSplit',arguments);

	}
	onDeleteAthleteSplit(ap, split) {
		console.log('onDeleteAthleteSplit',arguments);

	}
}

AthleteStore.keys = keys;

export {
	AthleteActions,
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
