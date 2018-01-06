import { h, Component } from 'preact';
import style from './style.less';

export default class Athlete extends Component {
	constructor(props) {
		console.log(props);
		super(props);
	}

	// Note: `user` comes from the URL, courtesy of our router
	render({ user }) {
		return (
			<div class={style.profile}>
				<h1>Athlete: {user}</h1>
				<p>This is the athlete profile for a <b>{user}</b>.</p>
			</div>
		);
	}
}
