import { h, Component } from 'preact';
import style from './style.less';

import { Util } from '../util';
var util = new Util();

export default class Clock extends Component {

	constructor(props) {
		super(props);
		console.debug('new Clock()',props);
		this.state = props;
	}

	// update the current time
	updateTime = () => {
		let time = new Date().toLocaleTimeString();
		this.setState({ currentTime: time });
	}

	// gets called when this route is navigated to
	componentDidMount() {
		// start a timer for the clock:
		//TODO change this to setTimeout? it seems laggy in chrome android,
		//but maybe it's something else.
		//https://www.thecodeship.com/web-development/alternative-to-javascript-evil-setinterval/
		//45ms seems to be the largest interval that looks like a stopwatch. any slower and it looks laggy
		this.timer = setInterval(this.updateTime, 45);
		this.updateTime();
	}

	// gets called just before navigating away from the route
	componentWillUnmount() {
		clearInterval(this.timer);
	}

	componentWillReceiveProps(nextProps, nextState) {
		console.debug('componentWillReceiveProps', nextProps, nextState);
		this.setState(nextProps);
	}

	render() {
		console.debug('render', this.state);
		let runningClockText = null;
		let startTimeText = null;
		let endTimeText = null;
		if (this.state.startTime) {
			startTimeText = 'started: ' + new Date(this.state.startTime.timestamp).toLocaleString();
		}
		if (this.state.isRunning) {
			runningClockText =
					util.formatDuration((new Date().getTime() - this.state.startTime.timestamp), true);
		}
		if (this.state.endTime) {
			endTimeText = 'completed: ' + new Date(this.state.endTime.timestamp).toLocaleString();
		}
		return (
			<div class='float-right text-right'>
				<div>{this.state.currentTime}</div>
				<div><small>{startTimeText}</small></div>
				<div class={style.running_clock}>{runningClockText}</div>
				<div><small>{endTimeText}</small></div>
			</div>
		);
	}

}
