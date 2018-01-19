import { h, Component } from 'preact';
import { Link, route } from 'preact-router';
import style from './style.less';
import { Button, Table, Fade } from 'reactstrap';
import InlineInput from '../inline';
import AthletePerformance from '../performance';
import Clock from '../clock';

import { Lux } from '../../stores/LuxStore'
import {
	GraphViewStore,
	GraphStore,
	NodeStore,
	GroupStore,
	NodeConnectionStore,
	GroupConnectionStore
} from '../../stores/GraphStore';
import { AthleteStore } from '../../stores/AthleteStore'
import { PerformanceStore } from '../../stores/PerformanceStore'

import { Util, Split } from '../util';
var util = new Util();

var LuxComponent = Lux.Component.extend(Component);

export default class Graph extends LuxComponent {

	constructor(props) {
		super(props);

		this.state = {};
		this.setStore(props);

		this.update = this.update.bind(this);
	}

	componentWillReceiveProps(nextProps, nextState) {
		if (!nextProps.guid || nextProps.guid !== this.state.guid) {
			console.debug("reloading event", nextProps);
			this.setStore(nextProps);
		}
	}

	setStore(props) {
		if (props && 'GraphStore' in props) {
			super.setStore(props.GraphStore);
		} else {
			super.setStore(Lux.get(GraphStore, props));
		}
		if (!('view' in this.props) || this.props['view'] == 'std') {
			route('/graphs' + this.store.url(), true);
		}
	}

	update(state) {
		console.log(this, state);
		this.store.setState(state);
	}

	deleteEvent() {
		this.actions.deleteEvent();
		console.log('onDeleteEvent has run', this.store);
	}

	render() {
		console.debug('Graph.render',this.state);
		return (!('view' in this.props) || this.props['view'] == 'std')
				? this.renderLoaded()
				: this.renderList();
	}2209

	renderList() {
		console.debug('inline',this.state);
		var href = "/graphs" + this.store.url();

		/**
		icon (event status)
		event name
		date created
		parent meet?
		athlete count?
		 */
		return (
<div>
	<span class={style.list_entry_elt}>
		<i class="fa fa-check-circle" aria-hidden="true"></i>
	</span>
	<span class={style.list_entry_elt}><Link href={href}>
		<InlineInput
			value={this.state.name}
			onChange={this.update}
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
		return (
			<div class={style.event}>
				<InlineInput
					value={this.state.name}
					onChange={this.update}
					propName="name"
					placeholder={this.state.guid.substring(0,8)}
					width="10em"
					showAlways
					/>
			</div>
		);

		/**
		TODO
		*/
	}

}
