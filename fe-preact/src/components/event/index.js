import { h, Component } from 'preact';
import style from './style.less';
import { Button, Table } from 'reactstrap';
import InlineInput from '../inline';
import 'bootstrap/dist/css/bootstrap.css';

var formatDuration = (function() {
	var HOUR_FORMAT_MIN = 1 * 60 * 60 * 1000;
	var MILLIS_IN_DAY = 24 * 60 * 60 * 1000;
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
	return function(millis, alwaysIncludeFrac = false) {
		let d = new Date(millis);
		var hundredths = Math.floor(millis / 10) % 100;
		if (millis > MILLIS_IN_DAY) {
			var days = Math.floor(millis / MILLIS_IN_DAY);
			return days + 'd ' + timeFormatHour.format(d) +
					(alwaysIncludeFrac ? ('.' + fracFormat.format(hundredths)) : '');
		} else if (millis > HOUR_FORMAT_MIN) {
			return timeFormatHour.format(d) +
					(alwaysIncludeFrac ? ('.' + fracFormat.format(hundredths)) : '');
		} else {
			return timeFormatMin.format(d) + '.' + fracFormat.format(hundredths);
		}
	};
})();

class AthletePerformance {
	constructor(workout, athlete, bibNumber, displayName) {
		this.workout = workout;
		this.athlete = athlete;
		this.displayName = displayName;
		this.bibNumber = bibNumber;
		this.splits = [];
		this._fields = ['athlete','bibNumber','splits','displayName'];
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
					<a href="" onClick={(e)=>{/*TODO*/e.preventDefault()}}>{formatDuration(lapTime)}</a>
					<a href="" onClick={(e)=>{this.dropSplit(i); e.preventDefault()}}><sup>x</sup></a>
					<br/>
					<a href="" onClick={(e)=>{e.preventDefault()}}>{formatDuration(splitTime)}</a>
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
				<div>
					{formatDuration(new Date().getTime() - ts)}<br/>
					{formatDuration(new Date().getTime() - ts0)}
				</div>
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
	constructor(timestamp=new Date().getTime()) {
		this.span = 1;
		this.timestamp = timestamp;
	}
}

export default class Event extends Component {

	state = {
		eventName: 'Event 1',
		startSplit: null,
		endSplit: null,
		currentTime: null,
		athletePerformances: [],
		_fields: ['eventName','startSplit','endSplit','athletePerformances']
	};

	constructor(props) {
		super(props);

		//add one athlete to workout
		this.state.athletePerformances.push(
			new AthletePerformance(this, {name : 'Athlete 1'}, 1, 'Athlete 1')
		);

		//TODO remove this -- for debugging
		document.event = this;

		//button action setup
		this.handleStartEndResumeClick = this.handleStartEndResumeClick.bind(this);
		this.handleAddAthlete = this.handleAddAthlete.bind(this);
		this.handleAthleteClick = this.handleAthleteClick.bind(this);
		this.handleResetClick = this.handleResetClick.bind(this);
		this.handleDebugClick = this.handleDebugClick.bind(this);
		this.updateState = this.updateState.bind(this);

	}

	loadFromObject(o) {
		var asArray = o.athletePerformances.map(function(ap) {
			var aso = new AthletePerformance(this, ap.athlete, ap.bibNumber, ap.displayName);
			aso.splits = ap.splits;
			return aso;
		}, this);
		this.setState({
			startSplit: o.startSplit,
			athletePerformances: asArray
		});
	}

	serializeToJson(indent = null) {
		return JSON.stringify(this.state, function(key, value) {
			return (!this.hasOwnProperty('_fields') || this['_fields'].includes(key))
					? value
					: undefined;
		}, indent);
	}

	handleAthleteClick(ap) {
		if (this.state.startSplit != null) {
			ap.addSplit(new Split());
		} else {
			//TODO rename
		}
	}

	handleDebugClick() {
		console.log(this.serializeToJson(2));
	}

	handleResetClick() {
		if (!confirm('Are you sure you want to reset event?')) return;
		this.state.startSplit = null;
		this.state.endSplit = null;
		this.state.athletePerformances.forEach(function(ap) {
			ap.splits = [];
		});
	}

	handleStartEndResumeClick() {
		if (this.state.startSplit) {
			if (this.state.endSplit) {
				this.state.endSplit = null;
			} else {
				this.state.endSplit = new Split();
			}
		} else {
			var split = new Split();
			this.state.athletePerformances.forEach(function(ap) {
				ap.splits = [split];
			});
			this.setState({ startSplit: split });
		}
	}

	handleAddAthlete() {
		var athletePerformances = this.state.athletePerformances;
		var bibNumber = athletePerformances.map(a => a.bibNumber).reduce(function(a, b) {
			return Math.max(a, b);
		}) + 1;
		//TODO create athlete object
		var ap = new AthletePerformance(this, {name : 'Athlete ' + bibNumber}, bibNumber, 'Athlete ' + bibNumber);
		if (this.state.startSplit != null) {
			ap.addSplit(this.state.startSplit);
		}
		athletePerformances.push(ap);
		this.setState({ athletePerformances: athletePerformances });
	}

	// update the current time
	updateTime = () => {
		let time = new Date().toLocaleString();
		this.setState({ currentTime: time });
	};

	updateState(state) {
		this.setState(state);
	}

	// gets called when this route is navigated to
	componentDidMount() {
		// start a timer for the clock:
		//TODO change this to setTimeout? it seems laggy in chrome android,
		//but maybe it's something else.
		//https://www.thecodeship.com/web-development/alternative-to-javascript-evil-setinterval/
		this.timer = setInterval(this.updateTime, 20);
		this.updateTime();
	}

	// gets called just before navigating away from the route
	componentWillUnmount() {
		clearInterval(this.timer);
	}

	render() {
		let clockReading = '';
		let buttonText = 'Start Timer';
		let buttonColor = 'secondary';
		let startTimeText = null;
		let isRunning = false;
		let isStarted = false;
		if (this.state.startSplit != null) {
			isStarted = true;
			startTimeText = 'started: ' + new Date(this.state.startSplit.timestamp).toLocaleString();
			if (this.state.endSplit  != null) {
				buttonText = 'Resume';
			} else {
				isRunning = true;
				clockReading =
						formatDuration((new Date().getTime() - this.state.startSplit.timestamp), true);
				buttonText = 'Complete';
			}
		}
		let userRows = this.state.athletePerformances.map(ap => (
			<tr>
				<td>{ap.bibNumber}</td>
				<td>
					<a class="block" href=""
							onClick={(e)=>{this.handleAthleteClick(ap); e.preventDefault()}}>
						{ap.displayName}</a><br/>&nbsp;</td>
				{isStarted ? <td></td> : ''}
				{isStarted ? <td>{ap.currentLap}</td> : ''}
				{isRunning ? <td>{ap.currentLapTime}</td> : ''}
				{isStarted ? <td class="small">{ap.splitElements}</td> : ''}
			</tr>
		));
		return (
			<div class={style.event}>
				<div class='float-right text-right'>
					{this.state.currentTime}<br/>
					<small>{startTimeText}</small>
					<div class={style.clock}>{clockReading}</div>
				</div>
				<h1><InlineInput
					value={this.state.eventName}
					propName='eventName'
					onChange={this.updateState}
					validate={this.validateEventName}
					/></h1>
				{startTimeText ? <div></div> : ''}
				<div>
					<Button color="primary" onClick={this.handleAddAthlete}>+ Add Athlete</Button>&nbsp;
					<Button color={buttonColor} onClick={this.handleStartEndResumeClick}>{buttonText}</Button>&nbsp;
					{
						startTimeText
						? <Button color="warning" onClick={this.handleResetClick}>Reset</Button>
						: ''
					}
					<Button color="link" onClick={this.handleDebugClick}>debug</Button>
				</div>
				<Table hover responsive>
					<thead>
						<tr>
							<th>&nbsp;<br/>Bib{/* bib */}</th>
							<th>User&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{/* avatar and user name */}</th>
							{isStarted ? <th>Place{/* Position */}</th> : ''}
							{isStarted ? <th>Lap #{/* what lap is this user on? */}</th> : ''}
							{isRunning ? <th>Current<br/>Lap/Split{/* what is the time of the current user's lap? */}</th> : ''}
							{isStarted ? <th><span>{isRunning ? 'Previous' : ' ' }<br/></span>Laps/Splits{/* one column contains all laps */}</th> : ''}
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
		x add "are you sure" to Restart
		x add pause and stop button? essentially mimic functionality of timex ironman
		x add useradd - user table which includes an icon/name column, a current lap time
		x user click adds laps for users
		user system (search user, reset user id, icon, name to selected user)
		x output entire state as json
		table sortable by place
		icon working
		save activity
		save splits
		async save
		add user column for undo last split
		style - https://github.com/reactstrap/reactstrap
		button to toggle lock scroll for maximizing space taken up by users (squares vs rows?)
		use local storage for offline immediate backup
		glyphicons
		add show place column toggle
		add split order toggle (ascending/descending)
		update header to use  bootstrap
		minimize mode - show event name, elapsed time and user table, locking the
			top part (including headers) on scroll
		don't actually delete anything -- just mark as inactive
		move split to another runner
		*/
	}
}
