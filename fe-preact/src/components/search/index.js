import { h, Component } from 'preact';
import { Lux } from '../../stores/LuxStore';
import List from '../list';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import style from './style.less';

export default class StoreSearch extends Component {

	constructor(props) {
		super(props);
		console.log('StoreSearch', props);
		this.state = {
			modal: false,
			type: props.type,
			view: props.view
		};

		this.toggle = this.toggle.bind(this);
	}

	toggle() {
		console.log(this);
		this.setState({
			modal: !this.state.modal
		});
	}

	select(){

	}

	render() {
		var classes = "fa fa-search " + style.text_action;
		return (
			<span>
				<i class={classes} aria-hidden="true" onClick={this.toggle}></i>
				<Modal isOpen={this.state.modal} toggle={this.toggle}>
					<ModalHeader toggle={this.toggle}>Search {this.state.type.name}</ModalHeader>
					<ModalBody>
						<List type={this.state.type}
							view={this.state.view}
							noActions
							onClickItem={this.select} />
					</ModalBody>
					<ModalFooter>
						<Button color="primary" onClick={this.toggle}>Update</Button>{' '}
						<Button color="secondary" onClick={this.toggle}>Cancel</Button>
					</ModalFooter>
				</Modal>
			</span>
		);
	}
}
