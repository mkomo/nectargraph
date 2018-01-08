import { LuxMemStore, Lux } from './LuxStore';

let EventActions = Lux.createActions([
	'startEvent',
	'endEvent'
]);

class EventStore extends LuxMemStore {
	constructor(props = {}) {
		super();
		this.state = {
			eventName: 'Event 1',
			startSplit: null,
			endSplit: null,
			currentTime: null,
			athletePerformances: [],
			_fields: ['eventName','startSplit','endSplit','athletePerformances']
		};
		this.setActions(EventActions());
	}

	onStartEvent(split) {
		this.setState({startSplit: split});
	}

	onEndEvent(split) {
		this.setState({endSplit: split});
	}
}

export {
	EventActions,
	EventStore
}
