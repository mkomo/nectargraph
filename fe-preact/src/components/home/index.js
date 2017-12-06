import { h, Component } from 'preact';
import style from './style.less';

export default class Home extends Component {

	state = {
		startTimeMillis: null,
		currentTime: null,
		pauseTicks: [],
		athletes: []
	};

	constructor(props) {
		super(props);

		//button action setup
		this.handleStartClick = this.handleStartClick.bind(this);

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

	handleStartClick(e) {
		e.preventDefault();
		this.setState({ startTimeMillis: new Date().getTime() });
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
		let buttonText = 'Start';
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
			buttonText = 'Restart';
		}
		return (
			<div class={style.home}>
				{startTimeText ? <h1>{startTimeText}</h1> : ''}
				<h1>Curr time: {this.state.currentTime}</h1>
				<div class={style.clock}>{clockReading}</div>
				<div><button onClick={this.handleStartClick}>{buttonText}</button></div>
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
		*/
	}
}
