import { h, Component } from 'preact';
import { Util, Split } from '../util';
import InlineInput from '../inline';
import StoreSearch from '../search';
import style from './style.less';
import { Lux } from '../../stores/LuxStore';
import { PerformanceStore } from '../../stores/PerformanceStore';
import { AthleteStore } from '../../stores/AthleteStore';
import Athlete from '../../components/athlete';
import { Button, Fade } from 'reactstrap';

var util = new Util();

var LuxComponent = Lux.Component.extend(Component);

export default class AthletePerformance extends LuxComponent {
	constructor(props) {
		console.debug('new AthletePerformance()', props);
		super(props);

		this.state = {};
		if (props && 'PerformanceStore' in props) {
			this.setStore(props.PerformanceStore);
		} else {
			this.setStore(Lux.get(PerformanceStore, props));
		}

		//TODO handle multiple stores (potentially with multiple overlapping stores)
		this.actions = this.store.actions;

		this.updateBib = this.updateBib.bind(this);
		this.updateName = this.updateName.bind(this);
		this.handleAthleteClick = this.handleAthleteClick.bind(this);
		this.deletePerformance = this.deletePerformance.bind(this);
		this.replaceAthlete = this.replaceAthlete.bind(this);
	}

	addSplit(split) {
		this.actions.recordSplit(split);
	}

	deleteSplit(index) {
		this.actions.deleteSplit(index);
	}

	get completedLaps() {
		//TODO consider split spans
		return this.state.splits.length > 0 ? this.state.splits.length - 1 : '-';
	}

	get splitElements() {
		var splits = this.state.splits;
		var elts = [];
		for (let i = 0; i < splits.length; i++) {
			var lapTime = splits[i].timestamp - (i == 0
						? this.state.event.state.startSplit.timestamp
						: splits[i-1].timestamp);
			var splitTime = splits[i].timestamp - splits[0].timestamp
			elts.push((
				<td style="padding: 0 5px">
					<a onClick={(e)=>{/*TODO*/e.preventDefault()}}>{util.formatDuration(lapTime)}</a>
					{
						!this.props.noActions
							? <a href="" onClick={(e)=>{this.deleteSplit(i); e.preventDefault()}}><sup>x</sup></a>
							: ''
					}
					<br/>
					<a onClick={(e)=>{e.preventDefault()}}>{util.formatDuration(splitTime)}</a>
				</td>
			));
		}
		return (<table class={style.nested_table}><tr>{elts}</tr></table>);
	}

	get currentLapTime() {
		//TODO consider split spans
		if (this.state.splits.length > 0) {
			var ts = this.state.splits[this.state.splits.length - 1].timestamp;
			var ts0 = this.state.splits[0].timestamp;
			return (
				<div>
					{util.formatDuration(new Date().getTime() - ts)}<br/>
					{util.formatDuration(new Date().getTime() - ts0)}
				</div>
			);
		}
	}

	handleAthleteClick() {
		if (this.state.event.isRunning()) {
			this.actions.recordSplit(new Split());
		}
	}

	updateBib(b) {
		this.actions.setBibNumber(b);
	}

	updateName(name) {
		//this.displayName = name;
		console.debug('updateName',this);
		this.state.athlete.actions.updateAthlete({name: name});
	}

	replaceAthlete(nextAthlete){
		console.debug('replaceAthlete', arguments);
		this.store.setState({athlete: nextAthlete});
	}

	deletePerformance() {
		if (this.state.splits.length == 0 || confirm('Are you sure you want to delete this performance?')) {
			console.debug('deleting performance', this);
			this.actions.deletePerformance();
		}
	}

	render() {
		if (this.props.view == 'list') {
			return this.renderList();
		}
		console.log('render performance',this.props);
		var classes = `${style.vcenter}`;
		var isStarted = this.state.event.isStarted();
		var isRunning = this.state.event.isRunning();
		var icon_classes = "fa fa-trash " + style.text_action;
		if (isRunning) {
			classes += ` ${style.user_link}`
		}
		return (
			<tr class={style.hoverable}>
				<td class={style.vcenter}><InlineInput
					value={this.state.bibNumber}
					onChange={this.updateBib}
					width="3em"
					/></td>
				<td class={classes} onClick={this.handleAthleteClick}>
					{this.state.athlete.state && !this.state.athlete.state.deleted
						? (<span>
								{this.state.athlete.state.avatar
									? <span><img width="18" height="18" src={this.state.athlete.state.avatar} />&nbsp;</span>
									: <span></span>
								}
								<InlineInput
								value={this.state.athlete.state.name}
								onChange={this.updateName}
								placeholder={this.state.athlete.state.guid.substring(0,8)}
								width="15em"
								/>
							</span>)
						: (<span>[deleted athlete]</span>)
					}
					<StoreSearch type={AthleteStore} view={Athlete} field="name" onSelectItem={this.replaceAthlete}/>
					<span
							onClick={this.deletePerformance}>
						<i class={icon_classes} aria-hidden="true"></i>
					</span>
				</td>
				{isStarted ? <td class={style.vcenter}></td> : ''}
				{isStarted ? <td class={style.vcenter}>{this.completedLaps}</td> : ''}
				{isRunning ? <td>{this.currentLapTime}</td> : ''}
				{isStarted ? <td class="small">{this.splitElements}</td> : ''}
			</tr>
		);
	}

	renderList() {
		return (
			<div>
				<span>{this.state.event.state.name}</span> -
				<span>{new Date(this.state.event.state.startSplit.timestamp).toLocaleString()}</span>
				{this.splitElements}
			</div>
		);
	}
}
