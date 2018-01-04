import { h, Component } from 'preact';
import style from './style.less';
import { Button, Table } from 'reactstrap';
import InlineInput from '../inline';
import AthletePerformance from '../performance';
import 'bootstrap/dist/css/bootstrap.css';
import Util from '../util';

var util = new Util();

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

	updateState(changes) {
		this.setState(changes);
	}

	isStarted() {
		return this.state.startSplit != null;
	}

	isRunning() {
		return this.state.startSplit != null && this.state.endSplit == null;
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
		if (this.isStarted()) {
			startTimeText = 'started: ' + new Date(this.state.startSplit.timestamp).toLocaleString();
			if (!this.isRunning()) {
				buttonText = 'Resume';
			} else {
				clockReading =
						util.formatDuration((new Date().getTime() - this.state.startSplit.timestamp), true);
				buttonText = 'Complete';
			}
		}
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
					width="10em"
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
							{this.isStarted() ? <th>Place{/* Position */}</th> : ''}
							{this.isStarted() ? <th>Lap #{/* what lap is this user on? */}</th> : ''}
							{this.isRunning() ? <th>Current<br/>Lap/Split{/* what is the time of the current user's lap? */}</th> : ''}
							{this.isStarted() ? <th><span>{this.isRunning() ? 'Previous' : ' ' }<br/></span>Laps/Splits{/* one column contains all laps */}</th> : ''}
						</tr>
					</thead>
					<tfoot>
					</tfoot>
					<tbody>
						{this.state.athletePerformances.map(p=>p.render())}
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
