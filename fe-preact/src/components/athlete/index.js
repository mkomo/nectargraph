import { h, Component } from 'preact';
import { Link } from 'preact-router';
import style from './style.less';
import { Lux } from '../../stores/LuxStore';
import { AthleteStore } from '../../stores/AthleteStore'
import InlineInput from '../inline';

var LuxComponent = Lux.Component.extend(Component);

export default class Athlete extends LuxComponent {
	constructor(props) {
		console.log('Athlete constructor',props);
		super(props);
		this.state = {};
		if (props && 'AthleteStore' in props) {
			this.store = props.AthleteStore;
		} else {
			this.store = new AthleteStore(props).get();
		}
		//TODO handle multiple stores (potentially with multiple overlapping stores)
		this.actions = this.store.actions;
	}

	render() {
		console.log('Athlete.render',this.state);
		return this.state.isLoaded ? this.renderLoaded() : this.renderLoading();
	}

	renderLoaded() {
		if (!('view' in this.props) || this.props['view'] == 'std') {
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
		} else {
			console.log('inline',this.props);
			var href = "/athletes/" + this.state.organization + "/" + this.state.name;
			return (
				<div>
					<Link href={href}>{this.state.name}</Link>
				</div>
			);
		}
	}

	renderLoading() {
		return(
			<div class={style.profile}>
				<h1>loading...</h1>
			</div>
		);
	}
}
