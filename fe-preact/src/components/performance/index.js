import { h, Component } from 'preact';
import Util from '../util';
import InlineInput from '../inline';
import style from './style.less';

var util = new Util();

export default class AthletePerformance extends Component {
	constructor(workout, athlete, bibNumber, displayName = null) {
		super({});
		this.workout = workout;
		this.athlete = athlete;
		this.displayName = displayName;
		this.bibNumber = bibNumber;
		this.splits = [];
		this._fields = ['athlete','bibNumber','splits','displayName'];

		this.updateBib = this.updateBib.bind(this);
		this.updateName = this.updateName.bind(this);
	}

	addSplit(split) {
		this.splits.push(split);
	}

	get completedLaps() {
		//TODO consider split spans
		return this.splits.length > 0 ? this.splits.length - 1 : '-';
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

	updateName(name) {
		this.displayName = name;
	}

	render() {
		let w = this.workout;
		var classes = `${style.user_cell} ${style.vcenter}`;
		if (w.isRunning()) {
			classes += ` ${style.user_link}`
		}
		return (
			<tr>
				<td class={style.vcenter}><InlineInput
					value={this.bibNumber}
					onChange={this.updateBib}
					width="3em"
					/></td>
				<td class={classes} onClick={(e)=>{w.handleAthleteClick(this); e.preventDefault()}}>
					<InlineInput
						value={this.displayName ? this.displayName : this.athlete.state.name}
						onChange={this.updateName}
						width="15em"
						/>
				</td>
				{w.isStarted() ? <td class={style.vcenter}></td> : ''}
				{w.isStarted() ? <td class={style.vcenter}>{this.completedLaps}</td> : ''}
				{w.isRunning() ? <td>{this.currentLapTime}</td> : ''}
				{w.isStarted() ? <td class="small">{this.splitElements}</td> : ''}
			</tr>
		);
	}
}
