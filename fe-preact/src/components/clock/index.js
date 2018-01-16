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
		this.timer = setInterval(this.updateTime, 145);
		this.updateTime();
	}

	// gets called just before navigating away from the route
	componentWillUnmount() {
		clearInterval(this.timer);
	}

	componentWillReceiveProps(nextProps, nextState) {
		//TODO decompose this so it's more clear what's needed
		this.setState(nextProps);
	}

	render() {

		var times = this.state.startTimes;
		if (times == null) {
			times = []
		} else if (!Array.isArray(times)) {
			times = [times];
		}
		times = times.filter(t=>(t != null));

		var runningStyle = this.state.largeRunning ? style.running_clock : '';

		let runningClocks = !this.state.isRunning
			? []
			: times.map(time=>{
					let runningClockText = util.formatDuration((new Date().getTime() - time.timestamp), true);
					return (<div class={runningStyle}>{runningClockText}</div>)
				});

		let startTimeText = null;
		let endTimeText = null;
		if (times.length > 0) {
			startTimeText = 'started: ' + new Date(times[0].timestamp).toLocaleString();
		}
		if (this.state.endTime) {
			endTimeText = 'completed: ' + new Date(this.state.endTime.timestamp).toLocaleString();
		}
		return (
			<div class={this.state.right ? 'float-right text-right' : ''}>
				{ this.state.showWallTime ? <div>{this.state.currentTime}</div> : ''}
				{ this.state.showStartTime ? <div class="small">{startTimeText}</div> : ''}
				{ this.state.showEndTime ? <div class="small">{endTimeText}</div> : ''}

				{runningClocks}

			</div>
		);
	}

}
