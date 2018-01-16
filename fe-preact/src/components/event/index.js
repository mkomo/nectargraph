import { h, Component } from 'preact';
import { Link, route } from 'preact-router';
import style from './style.less';
import { Button, Table, Fade } from 'reactstrap';
import InlineInput from '../inline';
import AthletePerformance from '../performance';
import Clock from '../clock';

import { Lux } from '../../stores/LuxStore'
import { EventStore } from '../../stores/EventStore'
import { AthleteStore } from '../../stores/AthleteStore'
import { PerformanceStore } from '../../stores/PerformanceStore'

import { Util, Split } from '../util';
var util = new Util();

var LuxComponent = Lux.Component.extend(Component);

export default class Event extends LuxComponent {

	constructor(props) {
		super(props);

		this.state = {};
		this.setStore(props);

		//TODO handle this in a much cleaner way
		this.store.hideBib = true;

		//button action setup
		this.handleStartEndResumeClick = this.handleStartEndResumeClick.bind(this);
		this.handleAddAthlete = this.handleAddAthlete.bind(this);
		this.handleResetClick = this.handleResetClick.bind(this);
		this.updateState = this.updateState.bind(this);
	}

	componentWillReceiveProps(nextProps, nextState) {
		if (!nextProps.guid || nextProps.guid !== this.state.guid) {
			console.debug("reloading event", nextProps);
			this.setStore(nextProps);
		}
	}

	setStore(props) {
		if (props && 'EventStore' in props) {
			super.setStore(props.EventStore);
		} else {
			super.setStore(Lux.get(EventStore, props));
		}
		if (!('view' in this.props) || this.props['view'] == 'std') {
			route('/events' + this.store.url(), true);
		}
	}

	handleResetClick() {
		if (!confirm('Are you sure you want to reset event?')) return;
		this.state.athletePerformances.forEach(function(ap) {
			ap.setState({splits : []});
		});

		this.actions.updateEvent({
			startSplit: null,
			endSplit: null
		});
	}

	handleStartEndResumeClick() {
		if (this.state.startSplit) {
			if (this.state.endSplit) {
				this.actions.updateEvent({ endSplit : null});
			} else {
				this.actions.updateEvent({ endSplit : new Split()});
			}
		} else {
			var split = new Split();
			this.state.athletePerformances.forEach(function(ap) {
				ap.setState({splits : [split]});
			});
			this.actions.updateEvent({ startSplit: split });
		}
	}

	handleAddAthlete() {
		var athletePerformances = this.state.athletePerformances;
		var bibNumber = athletePerformances.map(a => a.state.bibNumber).reduce(function(a, b) {
			return Math.max(a, b);
		}, 0) + 1;
		//TODO create athlete object
		var athlete = Lux.get(AthleteStore,{});
		var ap = Lux.get(PerformanceStore, {event: this.store, athlete: athlete, bibNumber: bibNumber});
		if (this.state.startSplit != null) {
			ap.actions.recordSplit(this.state.startSplit);
		}
		athletePerformances.push(ap);
		this.actions.updateEvent({ athletePerformances: athletePerformances });
	}

	deleteEvent() {
		this.actions.deleteEvent();
		console.log('onDeleteEvent has run', this.store);
	}

	updateState(changes) {
		this.actions.updateEvent(changes);
	}

	render() {
		console.debug('Event.render',this.state);
		return (!('view' in this.props) || this.props['view'] == 'std')
				? this.renderLoaded()
				: this.renderList();
	}

	renderList() {
		console.debug('inline',this.state);
		var href = "/events" + this.store.url();

		if (this.state.deleted) {
				return (
					<Fade in={false} tag="div" className={style.list_entry}
							unmountOnExit
							onEnter={e=>(console.log('enter', new Date()))}
							onExit={e=>{console.log('exit', new Date())}}>deleted</Fade>
				);
		}
		/**
		icon (event status)
		event name
		date created
		parent meet?
		athlete count?
		 */
		var rowClass = style.hoverable + " " + style.list_entry;
		return (
<div>
	<span class={style.list_entry_elt}>
		{this.store.isStarted()
			? (this.store.isRunning()
				? <i class="fa fa-hourglass-half" aria-hidden="true"></i>
				: <i class="fa fa-check-circle" aria-hidden="true"></i>
			)
			: <i class="fa fa-clock-o" aria-hidden="true"></i>
		}
	</span>
	<span class={style.list_entry_elt}><Link href={href}>
		<InlineInput
			value={this.state.name}
			onChange={this.actions.updateEvent}
			propName="name"
			placeholder={this.state.guid.substring(0,8)}
			width="10em"
			showAlways
			/>
	</Link></span>
</div>
		);
	}

	renderLoaded() {
		let buttonText = 'Start Timer';
		let buttonColor = 'secondary';
		if (this.store.isStarted()) {
			if (!this.store.isRunning()) {
				buttonText = 'Resume';
			} else {
				buttonText = 'Complete';
			}
		}
		return (
			<div class={style.event}>
				<Clock startTimes={[this.state.startSplit]}
						endTime={this.state.endSplit}
						isRunning={this.store.isRunning()}
						showWallTime showStartTime showEndTime largeRunning right/>
				<h1><InlineInput
					value={this.state.name}
					propName='name'
					onChange={this.updateState}
					placeholder={this.state.guid.substring(0,8)}
					width="10em"
					showAlways
					/></h1>
				{this.store.isStarted() ? <div></div> : ''}
				<div>
					<Button color="primary" onClick={this.handleAddAthlete}>+ Add Athlete</Button>&nbsp;
					<Button color={buttonColor} onClick={this.handleStartEndResumeClick}>{buttonText}</Button>&nbsp;
					{
						this.store.isStarted()
						? <Button color="warning" onClick={this.handleResetClick}>Reset</Button>
						: ''
					}
				</div>
				<Table hover responsive>
					<thead>
						<tr>
							{this.store.hideBib ? '' : <th>&nbsp;<br/>Bib{/* bib */}</th> }
							<th>Athlete{/* avatar and user name */}</th>
							<th>{/* actions */}</th>
							{false && this.store.isStarted() ? <th>Place{/* Position */}</th> : ''}
							{this.store.isStarted() ? <th>Laps{/* what lap is this user on? */}</th> : ''}
							{this.store.isRunning() ? <th>Current<br/>Lap/Split</th> : <th>Total Time</th>}
							{this.store.isStarted() ? <th><span>{this.store.isRunning() ? 'Previous' : ' ' }<br/></span>Laps/Splits{/* one column contains all laps */}</th> : ''}
						</tr>
					</thead>
					<tfoot>
					</tfoot>
					<tbody>
						{this.state.athletePerformances.map(p=>h(AthletePerformance, {PerformanceStore: p, key: p.state.guid}))}
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
		x update header to use  bootstrap
		minimize mode - show event name, elapsed time and user table, locking the
			top part (including headers) on scroll
		don't actually delete anything -- just mark as inactive
		move split to another runner
		*/
	}

}
