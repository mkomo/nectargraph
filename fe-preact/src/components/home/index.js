import { h, Component } from 'preact';
import { Link } from 'preact-router';
import { Jumbotron, Button } from 'reactstrap';
import style from './style.less';

export default class Home extends Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<section class="home">
			  <Jumbotron>
				<h1 class="display-3">
					Connections Matter.
				</h1>
				<p class="lead">
					nectarGRAPH is a tool for creating graphs and visualizing connections.</p>
				<hr class="my-2" />
				<p>{/*<b><a href="#">Log in</a></b> to share your events or */}
					Graphs are stored locally so you can come back to view or edit the graphs you create <i>anytime</i>!</p>
				<p class="lead">
				  <Link className="btn btn-primary" href="/graph">new graph</Link>&nbsp;
				</p>
			  </Jumbotron>
			</section>
		);
	}
}
