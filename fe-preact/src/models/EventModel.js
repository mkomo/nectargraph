class EventModel {
	constructor() {
		this.event = this.getNewEvent();
	}
	getLiveEvents(){

	}
	getNewEvent(){
		return {
			eventName: 'Event 1',
			startSplit: null,
			endSplit: null,
			currentTime: null,
			athletePerformances: [],
			_fields: ['eventName','startSplit','endSplit','athletePerformances']
		};
	}

	getEvent(props) {

		return this.event;
	}
}
export let eventModel = new EventModel();
