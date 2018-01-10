import { h, Component } from 'preact';
import style from './style.less';

import Util from '../util';
var util = new Util();

export default class Clock extends Component {

	constructor(props) {
		super(props);
		console.log('new Clock()',props);
		this.state = {};
	}

	// update the current time
	updateTime = () => {
		let time = new Date().toLocaleString();
		this.setState({ currentTime: time });
	}

	// gets called when this route is navigated to
	componentDidMount() {
		// start a timer for the clock:
		//TODO change this to setTimeout? it seems laggy in chrome android,
		//but maybe it's something else.
		//https://www.thecodeship.com/web-development/alternative-to-javascript-evil-setinterval/
		this.timer = setInterval(this.updateTime, 1000);
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
		let runningClockText = '';
		let startTimeText = null;
		if (this.state.startTime) {
			startTimeText = 'started: ' + new Date(this.state.startTime.timestamp).toLocaleString();
			if (!this.state.isRunning) {
			} else {
				runningClockText =
						util.formatDuration((new Date().getTime() - this.state.startTime.timestamp), true);
			}
		}
		return (
			<div class='float-right text-right'>
				<div>{this.state.currentTime}</div>
				<div><small>{startTimeText}</small></div>
				<div class={style.running_clock}>{runningClockText}</div>
			</div>
		);
	}

}
