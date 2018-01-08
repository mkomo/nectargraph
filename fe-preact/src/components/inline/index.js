import { h, Component } from 'preact';
import style from './style.less';

//TODO actually implement this stuff
export default class InlineInput extends Component {

	/*
	TODO
	handle escape press
	optional draw edit button
	mutually cancel if more than one is open?
	 */
	state = {};

	constructor(props) {
		super(props);
		this.state = {
			value: props.value,
			propName: props.propName,
			onChange: props.onChange,
			validate: props.validate,
			width: props.width,
			placeholder: 'placeholder' in props ? props.placeholder : '(empty)',
			inEdit: false
		};
	    this.setEditState = this.setEditState.bind(this);
	    this.handleChange = this.handleChange.bind(this);
	    this.handleSubmit = this.handleSubmit.bind(this);
	}
	componentDidUpdate(){
		if (this.state.inEdit) {
			this.textInput.focus();
		}
	}
	setEditState(e) {
		event.preventDefault();
		event.stopPropagation();
		this.setState({inEdit : true, tempValue : this.state.value});
	}
	handleChange(e) {
		this.setState({tempValue : e.target.value});
	}
	handleSubmit(e) {
		event.preventDefault();
		event.stopPropagation();
		this.setState({inEdit : false, value : e.target.value, tempValue: null});
		if (this.state.propName != null) {
			let updateObj = {};
			updateObj[this.state.propName] = this.state.value;
			this.state.onChange(updateObj);
		} else {
			this.state.onChange(this.state.value);
		}
	}

	valueStyle() {
		return this.state.value ? '' : 'font-style: italic; opacity: 0.5';
	}

	valueWithPlaceholder() {
		return this.state.value
				? this.state.value
				: this.state.placeholder;
	}

	render() {
		return this.state.inEdit
				? this.renderInput()
				: this.renderValue()
	}

	renderValue() {
		return (
			<span class={style.editable} style={this.valueStyle()}>
				{this.valueWithPlaceholder()}
				<i onClick={this.setEditState} class="fa fa-pencil" aria-hidden="true"></i>
			</span>
		);
	}

	renderInput() {
		return (
			<form onSubmit={this.handleSubmit}>
				<input type="text"
					ref={(input) => { this.textInput = input; }}
					value={this.state.tempValue}
					onInput={this.handleChange}
					onBlur={this.handleSubmit}

					style={this.state.width != null ? 'width:' + this.state.width : ''}
					 />
			</form>
		);
	}
}
