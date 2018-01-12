import { h, Component } from 'preact';
import { AthleteStore } from '../../stores/AthleteStore'
import { Lux } from '../../stores/LuxStore'
import style from './style.less';

export default class StoreSearch extends Component {

	constructor(props) {
		super(props);
	}

	componentDidMount() {
	}

	componentWillUnmount() {
	}

	render() {
		var classes = "fa fa-search " + style.text_action;
		return (
			<span>
				<i class={classes} aria-hidden="true"></i>
			</span>
		);
	}
}
