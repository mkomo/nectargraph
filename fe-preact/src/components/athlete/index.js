import { h, Component } from 'preact';
import { Link } from 'preact-router';
import style from './style.less';
import { Lux } from '../../stores/LuxStore';
import { AthleteStore } from '../../stores/AthleteStore';
import { Button, Fade } from 'reactstrap';
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

	deleteAthlete(e) {
		//TODO add confirm
		this.actions.deleteAthlete();
		return true;
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
				return (
					<Fade in={false} tag="div" className={style.list_entry}
							unmountOnExit
							onEnter={e=>(console.log('enter', new Date()))}
							onExit={e=>{console.log('exit', new Date())}}>deleted</Fade>
				);
		}

		/**
		icon (user avatar)
		name (editable)
		organizations/affiliations
		 */
		return (
			<div class={style.list_entry}>
				<div class="pull-right">
					<Button className={style.list_entry_action} color="link"
							onClick={e=>(this.deleteAthlete())}>
						<i class="fa fa-trash" aria-hidden="true"></i>
					</Button>
				</div>
				<span><i class="fa fa-user" aria-hidden="true"></i></span>
				<span><Link href={href}>
					<InlineInput
						value={this.state.name}
						onChange={this.actions.updateAthlete}
						propName="name"
						width="10em"
						/>
				</Link></span>
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
