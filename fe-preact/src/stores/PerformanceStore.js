import { LuxLocalStore, Lux } from './LuxStore';

let PerformanceActions = Lux.createActions([
	'deletePerformance',
	'setAthlete',
	'setBibNumber',
	'recordSplit',
	'deleteSplit',
	'deletePerformance'
]);

var keys = [
	a => a.guid ? "/" + a.guid : undefined
]
class PerformanceStore extends LuxLocalStore {
	constructor(props = {}) {
		super(props);
		console.debug('new PerformanceStore', props);

		this.state = {
			guid: (props.guid ? props.guid : Lux.guid()),

			event: (props.event ? props.event : null),
			athlete: (props.athlete ? props.athlete : null),
			bibNumber: (props.bibNumber ? props.bibNumber : null),

			splits: [],

			//TODO -- these are not exactly state. save them elsewhere and make them accessible via functions
			isLoaded: false,
			isErrored: null,
			isSaved: false,
			deleted: false,

			//TODO make sense of how we represent things stored in another object and things stored with this
			//TODO ascertain fields from the state object once this is reorganized
		};

		this.setActions(PerformanceActions());
	}

	onSetAthlete(athlete) {
		console.debug('onSetAthlete',arguments);
		this.setState({athlete: athlete});
	}

	onSetBibNumber(bib) {
		console.debug('onSetBibNumber',arguments);
		this.setState({bibNumber: bib});
	}

	onRecordSplit(split) {
		console.debug('onRecordAthleteSplit',arguments);
		this.state.splits.push(split);
		this.setState({
			splits: this.state.splits
		})
	}

	onDeleteSplit(index) {
		console.debug('onDeleteSplit',arguments);
		var s = this.state.splits.slice();
		s.splice(index, 1);
		this.setState({
			splits: s
		})
	}

	onDeletePerformance() {
		console.log('onDeletePerformance');
		this.state.event.actions.removePerformanceFromEvent(this);
		this.delete();
		this.setState({deleted: true});
	}
}

PerformanceStore.keys = keys;

export {
	PerformanceStore
}

/**
TODO
implement delete
separate out the lux loaded, errored, saved states
implement localstorage (with successful rehydration)
handle multiple action sources
Store-ify AthletePerformance
 */
