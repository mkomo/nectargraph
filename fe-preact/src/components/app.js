import { h, Component } from 'preact';
import { Router } from 'preact-router';

import Header from './header';
import Home from './home';
import { Lux } from '../stores/LuxStore';
import { GraphStore } from '../stores/GraphStore';
import Graph from './graph/Graph';
import List from './list';

export default class App extends Component {

	constructor(props) {
		super(props);
		Lux.init([GraphStore]);
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

						<Graph path="/graph" />
						<Graph path="/graphs/:guid" />

						<List path="/graphs" type={GraphStore} view={Graph} newPath="/graph" deleteAction/>
					</Router>
				</div>
			</div>
		);
	}
}
