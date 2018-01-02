import { h, Component } from 'preact';

//TODO actually implement this stuff
export default class InlineInput extends Component {

	state = {};

	constructor(props) {
		super(props);
		console.log(this, props);
		this.state = {
			value: props.value,
			propName: props.propName,
			onChange: props.onChange,
			validate: props.validate
		};
	}

	render() {
		return (<span>{this.state.value}</span>);
	}
}
