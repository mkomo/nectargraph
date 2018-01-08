import { h, Component } from 'preact';
import { AthleteStore } from '../../stores/AthleteStore'
import style from './style.less';

export default class List extends Component {

	constructor(props) {
		super(props);
		console.log('new list', props);
		window.list = this;
	}

	// gets called when this route is navigated to
	componentDidMount() {
	}

	// gets called just before navigating away from the route
	componentWillUnmount() {
	}

	// Note: `user` comes from the URL, courtesy of our router
	render() {
		console.log(this);

		var name = (new this.props.view()).constructor.name;
		var store = new this.props.type();
		var items = store.list();
		console.log('retrieved list of items:', items);
		var views = [];
		for (var key in items) {
			var obj = {};
			obj[store.constructor.name] = items[key];
			obj['view'] = 'list';
			views.push(h(this.props.view, obj));
		}
		console.log('rendering list of ', name, list);
		return (
			<div class={style.list}>
				<h1>{name} list</h1>
				{views}
			</div>
		);
	}
}
