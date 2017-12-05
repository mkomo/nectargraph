import { h, Component } from 'preact';
import style from './style.less';

export default class Workout extends Component {
	state = {};

	// Note: `user` comes from the URL, courtesy of our router
	render() {
		return (
			<div class={style.workout}>
				<h1>Workout</h1>
			</div>
		);
	}
}
