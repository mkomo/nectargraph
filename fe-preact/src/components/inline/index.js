import { h, Component } from 'preact';

//TODO actually implement this stuff
export default class InlineInput extends Component {

	state = {};

	constructor(props) {
		super(props);
		this.state = {
			value: props.value,
			propName: props.propName,
			onChange: props.onChange,
			validate: props.validate,
			inEdit: false
		};
	    this.setEditState = this.setEditState.bind(this);
	    this.handleChange = this.handleChange.bind(this);
	    this.handleSubmit = this.handleSubmit.bind(this);
	}

	setEditState(e) {
		this.setState({inEdit : true, tempValue : this.state.value});
	}
	handleChange(e) {
		this.setState({tempValue : e.target.value});
	}
	handleSubmit(e) {
		event.preventDefault();
		event.stopPropagation();
		this.setState({inEdit : false, value : e.target.value, tempValue: null});
		let updateObj = {};
		updateObj[this.state.propName] = this.state.value;
		this.state.onChange(updateObj);
	}

	render() {
		return this.state.inEdit
				? this.renderInput()
				: (<span onClick={this.setEditState}>{this.state.value}</span>);
	}

	renderInput() {
		return (
			<form onSubmit={this.handleSubmit}>
				<input type="text"
					value={this.state.tempValue}
					onInput={e=>this.handleChange(e)}
					onBlur={this.handleSubmit}
					 />
			</form>
		);
	}
}
