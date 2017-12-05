import { h, Component } from 'preact';
import { Link } from 'preact-router';
import style from './style.less';

export default class Header extends Component {
	render() {
		return (
			<header class={style.header}>
				<h1>Lapper</h1>
				<nav>
					<Link href="/">New Workout</Link>
					<Link href="/athlete">Athletes</Link>
					<Link href="/workout">Workouts</Link>
				</nav>
			</header>
		);
	}
}
