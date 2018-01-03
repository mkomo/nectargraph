import { h, Component } from 'preact';
import { Router } from 'preact-router';

import Header from './header';
import Event from './event';
import Athlete from './athlete';
import Workout from './workout';
import List from './list';

export default class App extends Component {
	/** Gets fired when the route changes.
	 *	@param {Object} event		"change" event from [preact-router](http://git.io/preact-router)
	 *	@param {string} event.url	The newly routed URL
	 */
	handleRoute = e => {
		this.currentUrl = e.url;
	};

	render() {
		return (
			<div id="app">
				<Header />
				<div class="container-fluid">
					<Router onChange={this.handleRoute}>
						<Event path="/" />
						<Workout path="/workout/:workout_guid" />
						<Athlete path="/athlete/:user" />
						<List path="/athlete" />
						<List path="/workout" />
					</Router>
				</div>
			</div>
		);
	}
}
