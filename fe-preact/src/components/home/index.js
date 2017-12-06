import { h, Component } from 'preact';
import style from './style.less';
import { Button, Table } from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.css';

class AthleteSplit {
	constructor(athlete, bibNumber) {
		this.displayName = athlete.name;
		this.bibNumber = bibNumber;
		this.athlete = athlete;
		this.splits = [];
	}

	addSplit(split) {
		this.splits.push(split);
	}

	get currentLap() {
		//TODO consider split spans
		return this.splits.length;
	}

	get currentLapTime() {
		//TODO consider split spans
		if (this.splits.length > 0) {
			return new Date().getTime() - this.splits[this.splits.length - 1].timestamp;
		}
	}
}

class Split {
	constructor(timestamp) {
		this.span = 1;
		this.timestamp = timestamp;
	}
}

export default class Home extends Component {

	state = {
		startTimeMillis: null,
		currentTime: null,
		pauseTicks: [],
		athleteSplits: []
	};

	constructor(props) {
		super(props);

		//add one athlete to workout
		this.state.athleteSplits.push(
			new AthleteSplit({name : 'Athlete 1'}, 1)
		);

		//button action setup
		this.handleStartClick = this.handleStartClick.bind(this);
		this.handleAddAthlete = this.handleAddAthlete.bind(this);
		this.handleAthleteSplit = this.handleAthleteSplit.bind(this);

		//time format setup
		var fracFormat = new Intl.NumberFormat('en-US', {
			maximumFractionDigits: 0,
			minimumIntegerDigits: 2
		});
		var timeFormat1 = new Intl.DateTimeFormat('en-US', {
			hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false,
			timeZone: 'UTC'
		});
		this.timerFormat = function(millis) {
			let d = new Date(millis);
			return timeFormat1.format(d) + '.' + fracFormat.format( Math.floor(millis / 10) % 100 );
		};
	}

	handleAthleteSplit(as) {
		console.log('athlete split!', as);
		as.addSplit(new Split(new Date().getTime()));
	}

	handleStartClick(e) {
		e.preventDefault();
		var split = new Split(new Date().getTime());
		this.state.athleteSplits.forEach(function(as) {
			as.splits = [split];
		});

		this.setState({ startTimeMillis: split.timestamp });
	}

	handleAddAthlete(e) {
		e.preventDefault();
		var athleteSplits = this.state.athleteSplits;
		var bibNumber = athleteSplits.map(a => a.bibNumber).reduce(function(a, b) {
			return Math.max(a, b);
		}) + 1;
		athleteSplits.push(
			new AthleteSplit({name : 'Athlete ' + (athleteSplits.length + 1)}, bibNumber)
		);
		this.setState({ athleteSplits: athleteSplits });
	}

	// update the current time
	updateTime = () => {
		let time = new Date().toLocaleString();
		this.setState({ currentTime: time });
	};

	// gets called when this route is navigated to
	componentDidMount() {
		// start a timer for the clock:
		this.timer = setInterval(this.updateTime, 20);
		this.updateTime();
	}

	// gets called just before navigating away from the route
	componentWillUnmount() {
		clearInterval(this.timer);
	}

	render() {
		let clockReading = 'waiting...';
		let buttonText = 'Start All';
	  let startTimeText = null;
		if (this.state.startTimeMillis != null) {
			clockReading = this.timerFormat(
				(new Date().getTime() - this.state.startTimeMillis)
			);
			startTimeText = 'Strt time: ' +
					new Date(this.state.startTimeMillis).toLocaleString();
			if (clockReading.length > 11) {
				//TODO handle error state
				console.log(clockReading);
			}
			buttonText = 'Restart All';
		}
		let userRows = this.state.athleteSplits.map(as => (
			<tr>
				<td></td>
				<td>{as.bibNumber}</td>
				<td class="col-md-4">
					<a class="block" href="" onClick={(e)=>{this.handleAthleteSplit(as); e.preventDefault()}}>
						{as.displayName}</a></td>
				<td>{as.currentLap}</td>
				<td>{as.currentLapTime}</td>
				<td class="col-md-2"></td>
			</tr>
		));
		return (
			<div class={style.home}>
				{startTimeText ? <h3>{startTimeText}</h3> : ''}
				<h3>Curr time: {this.state.currentTime}</h3>
				<div class={style.clock}>{clockReading}</div>
				<div>
					<Button color="primary" onClick={this.handleAddAthlete}>+ Add Athlete</Button>
					&nbsp;
					<Button color="success" onClick={this.handleStartClick}>{buttonText}</Button>
				</div>
				<Table hover responsive>
					<thead>
						<tr>
							<th>Place{/* Position */}</th>
							<th>Bib{/* bib */}</th>
							<th class="col-md-4">User{/* avatar and user name */}</th>
							<th>Lap #{/* what lap is this user on? */}</th>
							<th>Lap Time{/* what is the time of the current user's lap? */}</th>
							<th class="col-md-2">Splits{/* one column contains all laps */}</th>
						</tr>
					</thead>
					<tfoot>
					</tfoot>
					<tbody>
						{userRows}
					</tbody>
				</Table>
			</div>
		);

		/**
		TODO
		x figure out best practice for events
		add "are you sure" to Restart
		add pause and stop button? essentially mimic functionality of timex ironman
		add useradd - user table which includes an icon/name column, a current lap time
		user click adds laps for users
		table sortable
		icon working
		user system (search user, reset user id, icon, name to selected user)
		save activity
		save splits
		output entire state as json
		async save
		add user column for undo last split
		style - https://github.com/reactstrap/reactstrap
		button to toggle lock scroll for maximizing space taken up by users (squares vs rows?)
		use local storage for offline immediate backup
		glyphicons
		*/
	}
}
