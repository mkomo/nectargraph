import { h, Component } from 'preact';
import style from './style.less';
import { Button, Table } from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.css';

class AthleteSplit {
	constructor(workout, athlete, bibNumber) {
		this.workout = workout;
		this.displayName = athlete.name;
		this.bibNumber = bibNumber;
		this.athlete = athlete;
		this.splits = [];
		this.formatDuration = (function() {
			//time format setup
			var fracFormat = new Intl.NumberFormat('en-US', {
				maximumFractionDigits: 0,
				minimumIntegerDigits: 2
			});
			var timeFormatHour = new Intl.DateTimeFormat('en-US', {
				hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false,
				timeZone: 'UTC'
			});
			var timeFormatMin = new Intl.DateTimeFormat('en-US', {
				minute: 'numeric', second: 'numeric', hour12: false,
				timeZone: 'UTC'
			});
			return function(millis) {
				let d = new Date(millis);
				var hundredths = Math.floor(millis / 10) % 100;
				return (millis > this.HOUR_FORMAT_MIN
						? timeFormatHour.format(d)
						: timeFormatMin.format(d))
						+ '.' + fracFormat.format(hundredths);
			};
		})();
	}

	addSplit(split) {
		this.splits.push(split);
	}

	get currentLap() {
		//TODO consider split spans
		return this.splits.length;
	}

	get splitElements() {
		var elts = [];
		for (let i = 0; i < this.splits.length; i++) {
			var lapTime = this.splits[i].timestamp - (i == 0
						? this.workout.state.startSplit.timestamp
						: this.splits[i-1].timestamp);
			var splitTime = this.splits[i].timestamp - this.splits[0].timestamp
			elts.push((
				<td style="padding: 0 5px">
					<a href="" onClick={(e)=>{console.log(this); e.preventDefault()}}>{this.formatDuration(lapTime)}</a>
					<a href="" onClick={(e)=>{this.dropSplit(i); e.preventDefault()}}><sup>x</sup></a>
					<br/>
					<a href="" onClick={(e)=>{console.log(this); e.preventDefault()}}>{this.formatDuration(splitTime)}</a>
				</td>
			));
		}
		return (<table><tr>{elts}</tr></table>);
	}

	get currentLapTime() {
		//TODO consider split spans
		if (this.splits.length > 0) {
			var ts = this.splits[this.splits.length - 1].timestamp;
			var ts0 = this.splits[0].timestamp;
			return (
				<table><tr>
				<td style="padding: 0 5px">
					{this.formatDuration(new Date().getTime() - ts)}<br/>
					{this.formatDuration(new Date().getTime() - ts0)}
				</td>
				</tr></table>
			);
		}
	}

	dropSplit(index) {
		var s = this.splits.slice();
		s.splice(index, 1);
		this.splits = s;
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
		startSplit: null,
		currentTime: null,
		pauseTicks: [],
		athleteSplits: []
	};

	constructor(props) {
		super(props);

		//add one athlete to workout
		this.state.athleteSplits.push(
			new AthleteSplit(this, {name : 'Athlete 1'}, 1)
		);

		//button action setup
		this.handleStartClick = this.handleStartClick.bind(this);
		this.handleAddAthlete = this.handleAddAthlete.bind(this);
		this.handleAthleteClick = this.handleAthleteClick.bind(this);

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
			return timeFormat1.format(d) + '.' +
					fracFormat.format( Math.floor(millis / 10) % 100 );
		};
	}

	handleAthleteClick(as) {
		if (this.state.startSplit != null) {
			as.addSplit(new Split(new Date().getTime()));
		} else {
			//TODO rename
		}
	}

	handleStartClick(e) {
		e.preventDefault();
		var split = new Split(new Date().getTime());
		this.state.athleteSplits.forEach(function(as) {
			as.splits = [split];
		});

		this.setState({ startSplit: split });
	}

	handleAddAthlete(e) {
		e.preventDefault();
		var athleteSplits = this.state.athleteSplits;
		var bibNumber = athleteSplits.map(a => a.bibNumber).reduce(function(a, b) {
			return Math.max(a, b);
		}) + 1;
		var as = new AthleteSplit(this, {name : 'Athlete ' + bibNumber}, bibNumber);
		if (this.state.startSplit != null) {
			as.addSplit(this.state.startSplit);
		}
		athleteSplits.push(as);
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
		if (this.state.startSplit != null) {
			clockReading = this.timerFormat(
				(new Date().getTime() - this.state.startSplit.timestamp)
			);
			startTimeText = 'Strt time: ' +
					new Date(this.state.startSplit.timestamp).toLocaleString();
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
					<a class="block" href=""
							onClick={(e)=>{this.handleAthleteClick(as); e.preventDefault()}}>
						{as.displayName}</a></td>
				<td>{as.currentLap}</td>
				<td>{as.currentLapTime}</td>
				<td class="col-md-2 small">{as.splitElements}</td>
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
							<th>Current<br/>Lap/Split{/* what is the time of the current user's lap? */}</th>
							<th class="col-md-2">Previous<br/>Laps/Splits{/* one column contains all laps */}</th>
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
		x add useradd - user table which includes an icon/name column, a current lap time
		x user click adds laps for users
		table sortable by place
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
