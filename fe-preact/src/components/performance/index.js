import { h, Component } from 'preact';
import { Util, Split } from '../util';
import InlineInput from '../inline';
import style from './style.less';
import { Lux } from '../../stores/LuxStore'
import { PerformanceStore } from '../../stores/PerformanceStore'

var util = new Util();

var LuxComponent = Lux.Component.extend(Component);

export default class AthletePerformance extends LuxComponent {
	constructor(props) {
		console.debug('new AthletePerformance()', props);
		super(props);

		this.state = {};
		if (props && 'PerformanceStore' in props) {
			this.store = props.PerformanceStore;
		} else {
			this.store = Lux.get(PerformanceStore, props);
		}

		//TODO handle multiple stores (potentially with multiple overlapping stores)
		this.actions = this.store.actions;

		this.updateBib = this.updateBib.bind(this);
		this.updateName = this.updateName.bind(this);
		this.handleAthleteClick = this.handleAthleteClick.bind(this);
	}

	addSplit(split) {
		this.actions.recordSplit(split);
	}

	deleteSplit(index) {
		this.actions.deleteSplit(index);
	}

	get completedLaps() {
		//TODO consider split spans
		return this.store.state.splits.length > 0 ? this.store.state.splits.length - 1 : '-';
	}

	get splitElements() {
		var elts = [];
		for (let i = 0; i < this.store.state.splits.length; i++) {
			var lapTime = this.store.state.splits[i].timestamp - (i == 0
						? this.state.event.state.startSplit.timestamp
						: this.store.state.splits[i-1].timestamp);
			var splitTime = this.store.state.splits[i].timestamp - this.store.state.splits[0].timestamp
			elts.push((
				<td style="padding: 0 5px">
					<a href="" onClick={(e)=>{/*TODO*/e.preventDefault()}}>{util.formatDuration(lapTime)}</a>
					<a href="" onClick={(e)=>{this.deleteSplit(i); e.preventDefault()}}><sup>x</sup></a>
					<br/>
					<a href="" onClick={(e)=>{e.preventDefault()}}>{util.formatDuration(splitTime)}</a>
				</td>
			));
		}
		return (<table><tr>{elts}</tr></table>);
	}

	get currentLapTime() {
		//TODO consider split spans
		if (this.store.state.splits.length > 0) {
			var ts = this.store.state.splits[this.store.state.splits.length - 1].timestamp;
			var ts0 = this.store.state.splits[0].timestamp;
			return (
				<div>
					{util.formatDuration(new Date().getTime() - ts)}<br/>
					{util.formatDuration(new Date().getTime() - ts0)}
				</div>
			);
		}
	}

	handleAthleteClick() {
		if (this.state.event.state.startSplit != null) {
			this.actions.recordSplit(new Split());
		} else {
			//TODO rename
		}
	}

	updateBib(b) {
		this.actions.setBibNumber(b);
	}

	updateName(name) {
		//this.displayName = name;
		console.debug('updateName',this);
		this.store.state.athlete.actions.updateAthlete({name: name});
	}

	render() {
		var classes = `${style.user_cell} ${style.vcenter}`;
		var isStarted = this.state.event.state.startSplit ? true : false;
		var isRunning = isStarted && (this.state.event.state.endSplit ? false : true);
		if (isRunning) {
			classes += ` ${style.user_link}`
		}
		return (
			<tr>
				<td class={style.vcenter}><InlineInput
					value={this.store.state.bibNumber}
					onChange={this.updateBib}
					width="3em"
					/></td>
				<td class={classes} onClick={this.handleAthleteClick}>
					<InlineInput
						value={this.store.state.athlete.state.name}
						onChange={this.updateName}
						width="15em"
						/>
				</td>
				{isStarted ? <td class={style.vcenter}></td> : ''}
				{isStarted ? <td class={style.vcenter}>{this.completedLaps}</td> : ''}
				{isRunning ? <td>{this.currentLapTime}</td> : ''}
				{isStarted ? <td class="small">{this.splitElements}</td> : ''}
			</tr>
		);
	}
}
