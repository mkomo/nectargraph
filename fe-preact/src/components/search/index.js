import { h, Component } from 'preact';
import { Lux } from '../../stores/LuxStore';
import List from '../list';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import style from './style.less';

export default class StoreSearch extends Component {

	constructor(props) {
		super(props);
		console.debug('StoreSearch', props);
		this.state = {
			modal: false,
			type: props.type,
			view: props.view,
			onSelectItem: props.onSelectItem
		};

		this.toggle = this.toggle.bind(this);
		this.setOpen = this.setOpen.bind(this);
		this.select = this.select.bind(this);
	}

	toggle() {
		this.setOpen(!this.state.modal);
	}

	setOpen(open) {
		this.setState({
			modal: open
		});
	}

	select(item){
		console.debug('calling select', arguments);
		if (this.state.onSelectItem) {
			this.state.onSelectItem(item);
		}
		this.setOpen(false);
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
							onClickItem={this.select}
							noActions />
					</ModalBody>
					<ModalFooter>
						<Button color="secondary" onClick={this.toggle}>Cancel</Button>
					</ModalFooter>
				</Modal>
			</span>
		);
	}
}
