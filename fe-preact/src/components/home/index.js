import { h, Component } from 'preact';
import style from './style.less';

export default class Home extends Component {
	render() {
		return (
			<div class={style.home}>
				<h1>New Workout</h1>
				<p></p>
			</div>
		);
	}
}
