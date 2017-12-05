import { h, Component } from 'preact';
import style from './style.less';

export default class Home extends Component {

	state = {
		startTimeMillis: null,
		time: null
	};

	constructor(props) {
		super(props);
		this.handleStartClick = this.handleStartClick.bind(this);
		this.timeFormat = new Intl.NumberFormat('en-US', {
			maximumFractionDigits: 2,
			minimumFractionDigits: 2,
		})
	}

	handleStartClick(e) {
		e.preventDefault();
		this.setState({ startTimeMillis: new Date().getTime() });
	}
	// update the current time
	updateTime = () => {
		let time = new Date().toLocaleString();
		this.setState({ time: time });
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

	// Note: `user` comes from the URL, courtesy of our router
	render({ user }, { time }) {
		let clockReading = 'waiting...';
		let buttonText = 'Start';
		if (this.state.startTimeMillis != null) {
			clockReading = this.timeFormat.format(
				(new Date().getTime() - this.state.startTimeMillis)/1000.0
			);
			buttonText = 'Restart';
		}
		return (
			<div class={style.home}>
				<h1>Current time: {time}</h1>
				<div class={style.clock}>{clockReading}</div>
				<div><button onClick={this.handleStartClick}>{buttonText}</button></div>
			</div>
		);
	}
}
