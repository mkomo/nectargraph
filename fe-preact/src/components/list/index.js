import { h, Component } from 'preact';
import style from './style.less';

export default class List extends Component {

	// gets called when this route is navigated to
	componentDidMount() {
	}

	// gets called just before navigating away from the route
	componentWillUnmount() {
	}

	// Note: `user` comes from the URL, courtesy of our router
	render({ user }, { time, count }) {

		return (
			<div class={style.list}>
				<h1>List</h1>
			</div>
		);
	}
}
