import { h, Component } from 'preact';
import { Link } from 'preact-router';
import style from './style.less';
import { Button, Table, Fade } from 'reactstrap';
import InlineInput from '../inline';
import AthletePerformance from '../performance';
import Clock from '../clock';

import { Lux } from '../../stores/LuxStore'
import { EventStore } from '../../stores/EventStore'
import { AthleteStore } from '../../stores/AthleteStore'

import 'bootstrap/dist/css/bootstrap.css';

import Util from '../util';
var util = new Util();

class Split {
	constructor(timestamp=new Date().getTime()) {
		this.span = 1;
		this.timestamp = timestamp;
	}
}

var LuxComponent = Lux.Component.extend(Component);

export default class Event extends LuxComponent {

	constructor(props) {
		super(props);

		this.state = {};
		if (props && 'EventStore' in props) {
			this.store = props.EventStore;
		} else {
			this.store = Lux.get(EventStore, props);
		}
		//TODO handle multiple stores (potentially with multiple overlapping stores)
		this.actions = this.store.actions;

		//TODO remove this -- for debugging
		window.event = this;

		//button action setup
		this.handleStartEndResumeClick = this.handleStartEndResumeClick.bind(this);
		this.handleAddAthlete = this.handleAddAthlete.bind(this);
		this.handleAthleteClick = this.handleAthleteClick.bind(this);
		this.handleResetClick = this.handleResetClick.bind(this);
		this.updateState = this.updateState.bind(this);

	}

	//TODO remove this in favor of LuxStore persisting
	loadFromObject(o) {
		var asArray = o.athletePerformances.map(function(ap) {
			var aso = new AthletePerformance(this, Lux.get(AthleteStore,ap.athlete), ap.bibNumber, ap.displayName);
			aso.splits = ap.splits;
			return aso;
		}, this);
		this.actions.updateEvent({
			startSplit: o.startSplit,
			athletePerformances: asArray
		});
	}

	handleAthleteClick(ap) {
		if (this.state.startSplit != null) {
			ap.addSplit(new Split());
		} else {
			//TODO rename
		}
	}

	handleResetClick() {
		if (!confirm('Are you sure you want to reset event?')) return;
		this.state.athletePerformances.forEach(function(ap) {
			ap.splits = [];
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
				ap.splits = [split];
			});
			this.actions.updateEvent({ startSplit: split });
		}
	}

	handleAddAthlete() {
		var athletePerformances = this.state.athletePerformances;
		var bibNumber = athletePerformances.map(a => a.bibNumber).reduce(function(a, b) {
			return Math.max(a, b);
		}, 0) + 1;
		//TODO create athlete object
		var athlete = Lux.get(AthleteStore,{});
		var ap = new AthletePerformance(this, athlete, bibNumber);
		if (this.state.startSplit != null) {
			ap.addSplit(this.state.startSplit);
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

	isStarted() {
		return this.state.startSplit != null;
	}

	isRunning() {
		return this.state.startSplit != null && this.state.endSplit == null;
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
		return (
			<div class={style.list_entry}>
				<div class="pull-right">
					<Button className={style.list_entry_action} color="link"
							onClick={e=>(this.deleteEvent())}>
						<i class="fa fa-trash" aria-hidden="true"></i>
					</Button>
				</div>
				<span>
					{this.isStarted()
						? (this.isRunning()
							? <i class="fa fa-hourglass-half" aria-hidden="true"></i>
							: <i class="fa fa-check-circle" aria-hidden="true"></i>
						)
						: <i class="fa fa-clock-o" aria-hidden="true"></i>
					}
				</span>
				<span><Link href={href}>
					<InlineInput
						value={this.state.eventName}
						onChange={this.actions.updateEvent}
						propName="eventName"
						width="10em"
						/>
				</Link></span>
				<span></span>
			</div>
		);
	}

	renderLoaded() {
		let buttonText = 'Start Timer';
		let buttonColor = 'secondary';
		if (this.isStarted()) {
			if (!this.isRunning()) {
				buttonText = 'Resume';
			} else {
				buttonText = 'Complete';
			}
		}
		return (
			<div class={style.event}>
				<Clock startTime={this.state.startSplit}
						endTime={this.state.endSplit}
						isRunning={this.isRunning()}/>
				<h1><InlineInput
					value={this.state.eventName}
					propName='eventName'
					onChange={this.updateState}
					validate={this.validateEventName}
					width="10em"
					/></h1>
				{this.isStarted() ? <div></div> : ''}
				<div>
					<Button color="primary" onClick={this.handleAddAthlete}>+ Add Athlete</Button>&nbsp;
					<Button color={buttonColor} onClick={this.handleStartEndResumeClick}>{buttonText}</Button>&nbsp;
					{
						this.isStarted()
						? <Button color="warning" onClick={this.handleResetClick}>Reset</Button>
						: ''
					}
					<Button color="link" onClick={e=>console.log(util.serializeToJson(this.state, 2))}>debug</Button>
				</div>
				<Table hover responsive>
					<thead>
						<tr>
							<th>&nbsp;<br/>Bib{/* bib */}</th>
							<th>Athlete&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{/* avatar and user name */}</th>
							{this.isStarted() ? <th>Place{/* Position */}</th> : ''}
							{this.isStarted() ? <th>Laps{/* what lap is this user on? */}</th> : ''}
							{this.isRunning() ? <th>Current<br/>Lap/Split{/* what is the time of the current user's lap? */}</th> : ''}
							{this.isStarted() ? <th><span>{this.isRunning() ? 'Previous' : ' ' }<br/></span>Laps/Splits{/* one column contains all laps */}</th> : ''}
						</tr>
					</thead>
					<tfoot>
					</tfoot>
					<tbody>
						{this.state.athletePerformances.map(p=>p.render())}
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
