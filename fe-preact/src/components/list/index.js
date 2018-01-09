import { h, Component } from 'preact';
import { AthleteStore } from '../../stores/AthleteStore'
import { Lux } from '../../stores/LuxStore'
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
		console.log('List.render()', this);

		var name = this.props.view.name;
		var items = Lux.list(this.props.type.name, this.props.filter);
		console.log('retrieved list of items:', items);
		var views = [];
		for (var key in items) {
			var obj = {};
			obj[this.props.type.name] = items[key];
			obj['view'] = 'list';
			console.log('rendering list item ', name, obj);
			views.push(h(this.props.view, obj));
		}
		return (
			<div class={style.list}>
				<h1>{name} list</h1>
				{views}
			</div>
		);
	}
}
