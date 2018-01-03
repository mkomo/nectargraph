import { h, Component } from 'preact';
import Util from '../util';
import InlineInput from '../inline';

var util = new Util();

export default class AthletePerformance extends Component {
	constructor(workout, athlete, bibNumber, displayName) {
		super({});
		this.workout = workout;
		this.athlete = athlete;
		this.displayName = displayName;
		this.bibNumber = bibNumber;
		this.splits = [];
		this._fields = ['athlete','bibNumber','splits','displayName'];


		this.updateBib = this.updateBib.bind(this);
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
					<a href="" onClick={(e)=>{/*TODO*/e.preventDefault()}}>{util.formatDuration(lapTime)}</a>
					<a href="" onClick={(e)=>{this.dropSplit(i); e.preventDefault()}}><sup>x</sup></a>
					<br/>
					<a href="" onClick={(e)=>{e.preventDefault()}}>{util.formatDuration(splitTime)}</a>
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
					{util.formatDuration(new Date().getTime() - ts)}<br/>
					{util.formatDuration(new Date().getTime() - ts0)}
				</div>
			);
		}
	}

	dropSplit(index) {
		var s = this.splits.slice();
		s.splice(index, 1);
		this.splits = s;
	}

	updateBib(b) {
		this.bibNumber = b;
	}

	render() {
		let w = this.workout;
		return (
			<tr>
				<td><InlineInput
					value={this.bibNumber}
					onChange={this.updateBib}
					/></td>
				<td>
					<a class="block" href=""
							onClick={(e)=>{w.handleAthleteClick(this); e.preventDefault()}}>
						{this.displayName}</a><br/>&nbsp;</td>
				{w.isStarted() ? <td></td> : ''}
				{w.isStarted() ? <td>{this.currentLap}</td> : ''}
				{w.isRunning() ? <td>{this.currentLapTime}</td> : ''}
				{w.isStarted() ? <td class="small">{this.splitElements}</td> : ''}
			</tr>
		);
	}
}
