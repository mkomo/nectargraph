import { h, Component } from 'preact';
import { Link, route } from 'preact-router';
import style from './style.less';
import { Lux } from '../../stores/LuxStore';
import { AthleteStore } from '../../stores/AthleteStore';
import { Button } from 'reactstrap';
import InlineInput from '../inline';

var LuxComponent = Lux.Component.extend(Component);

export default class Athlete extends LuxComponent {
	constructor(props = {}) {
		console.debug('Athlete constructor',props);
		super(props);
		this.state = {};
		this.setStore(props);
	}

	componentWillReceiveProps(nextProps, nextState) {
		if (!nextProps.guid || nextProps.guid !== this.state.guid) {
			console.debug("reloading Athlete", nextProps);
			this.setStore(nextProps);
		}
	}

	setStore(props) {
		if (props && 'AthleteStore' in props) {
			super.setStore(props.AthleteStore);
		} else {
			super.setStore(Lux.get(AthleteStore, props));
		}
		if (!('view' in this.props) || this.props['view'] == 'std') {
			route('/athletes' + this.store.url(), true);
		}
	}

	render() {
		console.debug('Athlete.render',this.state);
		return !this.state.isLoaded
				? this.renderLoading()
				: (!('view' in this.props) || this.props['view'] == 'std'
						? this.renderLoaded()
						: this.renderList());
	}

	renderList() {
		console.debug('Athlete.renderList',this.props);
		var href = "/athletes" + this.store.url();
		var name = this.state.name ? this.state.name : '(unnamed athlete)';

		if (this.state.deleted) {
				return '';
		}

		/**
		icon (user avatar)
		name (editable)
		organizations/affiliations
		 */
		return (
<div>
	<span class={style.list_entry_elt}><i class="fa fa-user" aria-hidden="true"></i></span>
	<span class={style.list_entry_elt}>
		{ this.props.noActions
			? (this.state.name ? this.state.name : this.state.guid.substring(0,8))
			: (<Link href={href}>
				<InlineInput
					value={this.state.name}
					onChange={this.actions.updateAthlete}
					propName="name"
					placeholder={this.state.guid.substring(0,8)}
					width="10em"
					showAlways
					/>
			</Link>)
		}
	</span>
</div>
		);
	}

	renderLoaded() {
		return (
			<div class={style.profile}>
				<h1><InlineInput
					value={this.state.name}
					onChange={this.actions.updateAthlete}
					placeholder={this.state.guid.substring(0,8)}
					propName="name"
					width="15em"
					showAlways
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
