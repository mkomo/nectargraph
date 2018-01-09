import { LuxMemStore, Lux } from './LuxStore';

let EventActions = Lux.createActions([
	'startEvent',
	'endEvent',
	'updateEvent'
]);

var keys = [
	a => a.guid ? "/" + a.guid : undefined,
]

class EventStore extends LuxMemStore {
	constructor(props = {}) {
		console.debug('EventStore constructor', props);
		super(props);
		this.state = {
			guid: Lux.guid(),
			eventName: null,
			startSplit: null,
			endSplit: null,
			currentTime: null,
			dateCreated: new Date(),
			athletePerformances: []
		};
		this.setActions(EventActions());
	}

	onStartEvent(split) {
		this.setState({startSplit: split});
	}

	onEndEvent(split) {
		this.setState({endSplit: split});
	}

	onUpdateEvent(obj) {
		this.setState(obj);
	}
}

EventStore.keys = keys;

export {
	EventActions,
	EventStore
}
