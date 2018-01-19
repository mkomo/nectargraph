import { h, Component } from 'preact';
import { Link } from 'preact-router';
import {
	Collapse,
	Navbar,
	NavbarToggler,
	NavbarBrand,
	Nav,
	NavItem,
	NavLink,
	UncontrolledDropdown,
	DropdownToggle,
	DropdownMenu,
	DropdownItem } from 'reactstrap';
import style from './style.less';

export default class Header extends Component {
	constructor(props) {
		super(props);

		this.toggle = this.toggle.bind(this);
		this.state = {
			isOpen: false
		};
	}
	toggle() {
		this.setState({
			isOpen: !this.state.isOpen
		});
	}
	render() {
		return (
				<Navbar dark expand="xs">
					<NavbarBrand className={style.storynotes_title} href="/">storynotes</NavbarBrand>
					<NavbarToggler onClick={this.toggle}/>
					<Collapse isOpen={this.state.isOpen} navbar>
						<Nav className="ml-auto" navbar>
							<NavItem>
								<Link href="/graphs" className="nav-link">graphs</Link>
							</NavItem>
						</Nav>
					</Collapse>
				</Navbar>
		);
	}
}
