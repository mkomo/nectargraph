import Reflux from 'reflux';

let EventActions = Reflux.createActions([
  'startEvent','endEvent'
]);

class EventStore extends Reflux.Store {
	constructor() {
		super();
		this.state = {
			eventName: 'Event 1',
			startSplit: null,
			endSplit: null,
			currentTime: null,
			athletePerformances: [],
			_fields: ['eventName','startSplit','endSplit','athletePerformances']
		};
		this.listenables = EventActions;
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
