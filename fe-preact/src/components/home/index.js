import { h, Component } from 'preact';
import { Link } from 'preact-router';
import { Jumbotron, Button } from 'reactstrap';
import style from './style.less';

export default class Home extends Component {

	constructor(props) {
		super(props);
	}

	// gets called when this route is navigated to
	componentDidMount() {
	}

	// gets called just before navigating away from the route
	componentWillUnmount() {
	}

	render() {
		return (
			<section class="home">
			  <Jumbotron>
				<h1 className="display-3">
					Timers, ready!
				</h1>
				<p className="lead">
					Lapper is a tool for recording splits for athletes.
					Use lapper to plan meets and workouts, record splits for all
					your athletes, and keep track of progress over the course of the season.</p>
				<hr className="my-2" />
				<p><b><a href="#">Log in</a></b> to share your events or <i>get started right away</i>:</p>
				<p className="lead">
				  <Link className="btn btn-primary" href="/event">new standalone event</Link>&nbsp;
  				  <Link className="btn btn-primary" href="/meet">new meet</Link>
				</p>
			  </Jumbotron>
			</section>
		);
	}

	/*homepage

	LAPPER

	Lapper is a tool for recording splits for athletes. Use lapper to plan meets and workouts, keep track of splits for all your athletes, and
	/create new meet
	active/upcoming meets/event
	browse meets/events
	browse Athletes
	*/
}
