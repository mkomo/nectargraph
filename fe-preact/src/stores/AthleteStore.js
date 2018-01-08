import { LuxMemStore, Lux } from './LuxStore';

let AthleteActions = Lux.createActions([
	'deleteAthlete',
	'updateAthlete',
	'addAthleteToEvent',
	'recordAthleteSplit',
	'deleteAthleteSplit'
]);

class AthleteStore extends LuxMemStore {
	constructor(props = {}) {
		super();
		this.props = props;

		console.log('AthleteStore constructor', props);
		this.state = {
			guid: null,
			name: null,
			avatar: null,

			organization: null,
			affiliations: [],

			athletePerformances: [],

			isLoaded: false,
			isErrored: null,
			isSaved: false,

			_fields: ['guid','name','avatar','athletePerformances']
		};

		this.setListenables(AthleteActions());
	}

	get() {
		var props = this.props;
		console.log('get() on item with props', props);
		if ('name' in props && 'organization' in props) {
			this.setState({
				name: props.name,
				organization: props.organization
			});
			return this.fetchByNameAndOrg(props.name, props.organization);
		} else if ('guid' in props) {
			return this.fetchByGuid(props.guid);
		}
		return this;

		//TODO register this instance of AthleteStore with some sort of object mgr
	}

	fetchByGuid(guid){
		return this.fetch("/" + guid, athlete=>["/" + athlete.org + "/" + athlete.name]);
	}

	fetchByNameAndOrg(name, org) {
		return this.fetch("/" + org + "/" + name, athlete=>["/" + athlete.guid]);
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

export {
	AthleteActions,
	AthleteStore
}
