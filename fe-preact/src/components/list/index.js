import { h, Component } from 'preact';
import { route } from 'preact-router';
import { Lux } from '../../stores/LuxStore';
import { Button } from 'reactstrap';
import style from './style.less';

export default class List extends Component {

	constructor(props) {
		super(props);
		console.log('new list', props);
		this.state = {};
		this.updateFromProps(props);

		this.handleItemClick = this.handleItemClick.bind(this);
	}

	componentWillReceiveProps(nextProps) {
		this.updateFromProps(nextProps);
	}

	updateFromProps(props) {
		this.setState({
			view: props.view,
			type: props.type,
			filter: props.filter,
			noActions: props.noActions,
			deleteAction: props.deleteAction,
			onClickItem: props.onClickItem,
			newPath: props.newPath,
			//update items at the same time or else you'll cause an error with items that don't match their type
			items: this.fetchItems(props)
		});
	}

	fetchItems(stateObj) {
		return Lux.list(stateObj.type, stateObj.filter);
	}

	handleItemClick(item) {
		if (this.state.onClickItem) {
			return this.state.onClickItem(item);
		}
	}

	render() {
		console.debug('List.render()', this);

		var name = this.state.view.name;
		var items = this.state.items;
		console.debug('retrieved list of items:', items);
		var views = [];
		var itemStyle = style.list_entry + ' ' + style.hoverable + (this.state.onClickItem ? (' ' + style.list_entry_clickable) : '');
		for (let key in items) {
			var obj = {};
			obj[this.state.type.name] = items[key];
			obj['view'] = 'list';
			obj['noActions'] = this.state.noActions;
			obj['listProps'] = this.props;
			obj['key'] = items[key].state.guid;
			views.push((
				<div class={itemStyle} onClick={e=>this.handleItemClick(items[key])} key={key}>
					{
						(this.state.deleteAction || this.state.copyAction) && !this.state.noActions
						? (<div class={style.tool_right}>
							{
								this.state.deleteAction
								? <Button className={style.list_entry_action} color="link"
										onClick={e=>{
											items[key].delete();
											this.setState({items : this.fetchItems(this.state)})
										}}>
									<i class="fa fa-trash" aria-hidden="true"></i>
								</Button>
								: ''
							}
								<Button className={style.list_entry_action} color="link"
										onClick={e=>{
											items[key].copy();
											this.setState({items : this.fetchItems(this.state)})
										}}>
									<i class="fa fa-clone" aria-hidden="true"></i>
								</Button>
						</div>)
						: ''
					}
					{ h(this.state.view, obj) }
				</div>));
		}
		return (
			<div class={style.list}>
				{ this.state.noActions ? '' : (
					<div>
						{ this.state.newPath
							? (<div class="pull-right">
								<Button color="primary"
										onClick={e=>{
											console.log('new');
											route(this.state.newPath, true);
										}}>
									<i class="fa fa-plus" aria-hidden="true"></i>
									{' ' + name}
								</Button>
							</div>)
							: ''
						}
						<h1>{name} List</h1>
					</div>
				)}
				{/*TODO add canned filters, add search above list*/}
				{views}
			</div>
		);
	}
}
