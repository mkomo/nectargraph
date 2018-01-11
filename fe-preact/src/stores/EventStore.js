import { LuxLocalStore, Lux } from './LuxStore';

let EventActions = Lux.createActions([
	'startEvent',
	'endEvent',
	'updateEvent',
	'deleteEvent'
]);

var keys = [
	a => a.guid ? "/" + a.guid : undefined,
]

class EventStore extends LuxLocalStore {
	constructor(props = {}) {
		console.debug('EventStore constructor', props);
		super(props);
		this.state = {
			guid: Lux.guid(),
			eventName: null,
			startSplit: null,
			endSplit: null,
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

	onDeleteEvent() {
		console.log('onDeleteEvent');
		this.delete();
		this.setState({deleted: true});
	}
}

EventStore.keys = keys;

EventStore.init = function(Proto){
	console.log("inside EventStore init function");
}

export {
	EventActions,
	EventStore
}
