import { h, Component } from 'preact';
import { Link } from 'preact-router';
import style from './style.less';
import { Lux } from '../../stores/LuxStore';
import { AthleteStore } from '../../stores/AthleteStore'
import InlineInput from '../inline';

var LuxComponent = Lux.Component.extend(Component);

export default class Athlete extends LuxComponent {
	constructor(props = {}) {
		console.debug('Athlete constructor',props);
		super(props);
		this.state = {};
		if (props && 'AthleteStore' in props) {
			this.store = props.AthleteStore;
		} else {
			this.store = Lux.get(AthleteStore, props);
		}
		//TODO handle multiple stores (potentially with multiple overlapping stores)
		this.actions = this.store.actions;
	}

	render() {
		console.debug('Athlete.render',this.state);
		return !this.state.isLoaded
				? this.renderLoading()
				: (!('view' in this.props) || this.props['view'] == 'std'
						? this.renderLoaded()
						: this.renderInline());
	}

	renderInline() {
		console.debug('Athlete.renderInline',this.props);
		var href = "/athletes" + this.store.url();
		return (
			<div>
				<Link href={href}>{this.state.name ? this.state.name : '(unnamed athlete)'}</Link>
			</div>
		);
	}

	renderLoaded() {
		return (
			<div class={style.profile}>
				<h1><InlineInput
					value={this.state.name}
					onChange={this.actions.updateAthlete}
					propName="name"
					width="15em"
					/></h1>
				<p>This is the athlete profile for <b>{this.state.name}</b>.</p>
				<button onClick={e=>(console.log(this.store))}>debug</button>
			</div>
		);
	}

	renderLoading() {
		return(
			<div class={style.profile}>
				<h1>loading...</h1>
			</div>
		);
	}
}
