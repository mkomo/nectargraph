import { h, Component } from 'preact';
import style from './style.less';

export default class Athlete extends Component {

	// Note: `user` comes from the URL, courtesy of our router
	render({ user }, { time, count }) {
		return (
			<div class={style.profile}>
				<h1>Athlete: {user}</h1>
				<p>This is the athlete profile for a <b>{user}</b>.</p>
			</div>
		);
	}
}
