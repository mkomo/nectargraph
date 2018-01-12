import { h, Component } from 'preact';
import { Router } from 'preact-router';

import Header from './header';
import Home from './home';
import Event from './event';
import { Lux } from '../stores/LuxStore';
import { EventStore } from '../stores/EventStore';
import { AthleteStore } from '../stores/AthleteStore';
import { PerformanceStore } from '../stores/PerformanceStore';
import Athlete from './athlete';
import Meet from './meet';
import List from './list';

export default class App extends Component {

	constructor(props) {
		super(props);
		Lux.init([EventStore, AthleteStore, PerformanceStore]);
	}
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
						<Event path="/events/:guid" />
						<Meet path="/meets/:guid" />

						<List path="/athletes" type={AthleteStore} view={Athlete}/>
						<List path="/events" type={EventStore} view={Event}/>
						<List path="/meets" type={Meet}/>
					</Router>
				</div>
			</div>
		);
	}
}
