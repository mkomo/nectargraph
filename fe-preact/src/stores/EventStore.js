import { LuxLocalStore, Lux } from './LuxStore';

let EventActions = Lux.createActions([
	'startEvent',
	'endEvent',
	'updateEvent',
	'deleteEvent',
	'removePerformanceFromEvent'
]);

var keys = [
	a => a.guid ? "/" + a.guid : undefined,
]

class EventStore extends LuxLocalStore {
	constructor(props = {}) {
		console.debug('EventStore constructor', props);
		super(props);
		//TODO move this into a static getInitState(props) method.
		//if some fuck puts a setState call in the constructor, it will set off a persistence loop
		this.state = {
			//TODO handle not found
			guid: (props.guid ? props.guid : Lux.guid()),
			name: null,
			startSplit: null,
			endSplit: null,
			dateCreated: new Date(),
			athletePerformances: []
		};
		this.setActions(EventActions());
	}

	icon() {
		return this.isStarted()
			? (this.isRunning()
				? "fa-hourglass-half"
				: "fa-check-circle"
			)
			: "fa-clock-o"

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
		this.state.athletePerformances.forEach(p=>p.actions.deletePerformance());
		this.delete();
		this.setState({deleted: true, athletePerformances: []});
	}

	onRemovePerformanceFromEvent(performance) {
		console.log('onRemovePerformanceFromEvent', performance, this.state.athletePerformances);
		this.setState({
			athletePerformances: this.state.athletePerformances.filter(p=>(p.state.guid !== performance.state.guid))
		})
	}

	isStarted() {
		return this.state.startSplit != null;
	}

	isRunning() {
		return this.state.startSplit != null && this.state.endSplit == null;
	}
}

EventStore.keys = keys;

EventStore.init = function(Proto){
	console.log("inside EventStore init function");
}



export {
	EventStore
}
