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

	componentDidMount() {
	}

	componentWillUnmount() {
	}

	render() {
		console.debug('List.render()', this);

		var name = this.props.view.name;
		var items = Lux.list(this.props.type, this.props.filter);
		console.debug('retrieved list of items:', items);
		var views = [];
		for (var key in items) {
			var obj = {};
			obj[this.props.type.name] = items[key];
			obj['view'] = 'list';
			obj['key'] = items[key].state.guid;
			console.debug('rendering list item ', name, obj);
			views.push(h(this.props.view, obj));
		}
		return (
			<div class={style.list}>
				<h1>{name} List</h1>
				{/*TODO add canned filters, add search above list*/}
				{views}
			</div>
		);
	}
}
