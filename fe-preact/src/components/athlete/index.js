import { h, Component } from 'preact';
import { Link, route } from 'preact-router';
import List from '../list';
import { Lux } from '../../stores/LuxStore';
import { AthleteStore } from '../../stores/AthleteStore';
import { PerformanceStore } from '../../stores/PerformanceStore';
import AthletePerformance from '../performance';
import { Button, ButtonGroup, Media, Container, Row, Col } from 'reactstrap';
import InlineInput from '../inline';
import style from './style.less';

var LuxComponent = Lux.Component.extend(Component);

export default class Athlete extends LuxComponent {
	constructor(props = {}) {
		console.debug('Athlete constructor',props);
		super(props);
		this.state = {};
		this.setStore(props);
		this.updateAvatar = this.updateAvatar.bind(this);
		this.uploadAvatar = this.uploadAvatar.bind(this);
		this.deleteAvatar = this.deleteAvatar.bind(this);
		this.goToEvent = this.goToEvent.bind(this);
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

	uploadAvatar(file) {
		var input = file.target;
		var reader = new FileReader();
		var store = this.store;
		reader.onload = function(){
			var dataUrl = reader.result;
			store.setState({avatar: dataUrl});
		};
		reader.readAsDataURL(input.files[0]);
	}

	deleteAvatar() {
		this.store.setState({avatar: null});
	}

	updateAvatar() {
		this.actions.updateAvatar();
	}

	goToEvent(performance) {
		console.log('goToEvent', arguments);
		route('/events' + performance.state.event.url(), true);
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
	<span class={style.list_entry_elt}>
		{this.state.avatar
			? <img width="36" height="36" src={this.state.avatar} />
			: (<div class={style.icon_container}><i class="fa fa-user" aria-hidden="true"></i></div>)
		}
	</span>
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
					showAlways />
			</Link>)
		}
	</span>
</div>
		);
	}

	renderLoaded() {
		var avatarSize = 100;
		return (
			<div class={style.profile}>
				<Media>
					<Media left>
						{this.state.avatar
							? <Media object width={avatarSize} height={avatarSize} src={this.state.avatar} />
							: <div class={style.icon_container_large}><i class="fa fa-user" aria-hidden="true"></i></div>
						}
						<div class={style.avatar_actions}>
							<Button color="secondary" size="sm" onClick={this.updateAvatar}>
								<i class="fa fa-refresh" aria-hidden="true"></i></Button>
							<label class="btn btn-secondary btn-sm">
								<i class="fa fa-upload" aria-hidden="true"></i>
								<input type="file" accept='image/*' style="display: none;" onChange={this.uploadAvatar}/>
							</label>
							<Button color="secondary" size="sm" onClick={this.deleteAvatar}>
								<i class="fa fa-trash" aria-hidden="true"></i></Button>
						</div>
					</Media>
					<Media body>
						{/*
							user page
							Performances
						*/}
						<Container>
							<Row>
								<Col>
									<h1>
										<InlineInput
											value={this.state.name}
											onChange={this.actions.updateAthlete}
											placeholder={this.state.guid.substring(0,8)}
											propName="name"
											width="100%"
											showAlways
											/>
									</h1>
								</Col>
							</Row>
							<Row>
								<Col sm="3" xs="12" className="small">full name</Col>
								<Col xs="auto">
									<InlineInput
										value={this.state.fullName}
										onChange={this.actions.updateAthlete}
										placeholder="(none)"
										propName="fullName"
										width="100%"
										showAlways
										/>
								</Col>
							</Row>
							<Row>
								<Col sm="3" xs="12" className="small">organization</Col>
								<Col xs="auto">
									<InlineInput
										value={this.state.organization}
										onChange={this.actions.updateAthlete}
										placeholder="(none)"
										propName="organization"
										width="100%"
										showAlways
										/>
								</Col>
							</Row>
							<Row>
								<Col sm="3" xs="12" className="small">affiliations</Col>
								<Col xs="auto">{this.state.affiliations.length ? this.state.affiliations : (<span class="text-muted">(none)</span>)}</Col>
							</Row>
						</Container>
					</Media>
				</Media>
				<h2>Performances</h2>
				<List type={PerformanceStore} view={AthletePerformance}
					onClickItem={this.goToEvent}
					filter={[[['state','athlete','state','guid'],this.state.guid]]}
					noActions
					fields={['event', 'totalTime', 'date']/*TODO hanlde this -- sometimes we want to show the event, sometimes we will want to show the athlete*/} />
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
