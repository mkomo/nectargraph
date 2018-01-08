import { h, Component } from 'preact';
import { Router } from 'preact-router';

import Header from './header';
import Home from './home';
import Event from './event';
import { EventStore } from '../stores/EventStore';
import Athlete from './athlete';
import { AthleteStore } from '../stores/AthleteStore';
import Meet from './meet';
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
				<div class="container-fluid app-content">
					<Router onChange={this.handleRoute}>
						<Home path="/" />

						<Athlete path="/athlete" />
						<Event path="/event" />
						<Meet path="/meet" />

						<Athlete path="/athletes/:organization/:name" />
						<Athlete path="/athletes/:guid" />
						<Event path="/events/:event_guid" />
						<Meet path="/meets/:meet_guid" />

						<List path="/athletes" type={AthleteStore} view={Athlete}/>
						<List path="/events" type={EventStore}/>
						<List path="/meets" type={Meet}/>
					</Router>
				</div>
			</div>
		);
	}
}
