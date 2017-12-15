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
import 'bootstrap/dist/css/bootstrap.css';

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
				<Navbar light expand="md">
					<NavbarBrand href="/">Lapper</NavbarBrand>
					<NavbarToggler onClick={this.toggle}/>
					<Collapse isOpen={this.state.isOpen} navbar>
						<Nav className="ml-auto" navbar>
							<NavItem>
								<NavLink href="/athletes/">Athletes</NavLink>
							</NavItem>
							<NavItem>
								<NavLink href="/meets/">Meets</NavLink>
							</NavItem>
							<UncontrolledDropdown nav inNavbar>
								<DropdownToggle nav caret>
									Events
								</DropdownToggle>
								<DropdownMenu right>
									<DropdownItem>
										Event 1
									</DropdownItem>
									<DropdownItem>
										Event 2
									</DropdownItem>
									<DropdownItem divider />
									<DropdownItem>
										new Event
									</DropdownItem>
								</DropdownMenu>
							</UncontrolledDropdown>
						</Nav>
					</Collapse>
				</Navbar>
		);
	}
}
