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
				<Navbar dark expand="xs">
					<NavbarBrand href="/">Lapper</NavbarBrand>
					<NavbarToggler onClick={this.toggle}/>
					<Collapse isOpen={this.state.isOpen} navbar>
						<Nav className="ml-auto" navbar>
							<NavItem>
								<Link href="/event" className="nav-link">
									<i class="fa fa-plus" aria-hidden="true"></i> event
								</Link>
							</NavItem>
							<NavItem>
								{/*<Link href="/events?live" className="nav-link">
									<i>live</i>
								</Link>*/}
								<Link href="/events" className="nav-link">
									events
								</Link>
							</NavItem>
							<NavItem>
								<Link href="/athletes" className="nav-link">athletes</Link>
							</NavItem>
							{/*
							<UncontrolledDropdown nav inNavbar>
								<DropdownToggle nav>
									<i class="fa fa-bars" aria-hidden="true"></i>
								</DropdownToggle>
								<DropdownMenu right>
									<DropdownItem>
										<Link href="/athletes">athletes</Link>
									</DropdownItem>
									<DropdownItem>
										<Link href="/meets">meets</Link>
									</DropdownItem>
									<DropdownItem>
										<Link href="/events?single">one-off events</Link>
									</DropdownItem>
									<DropdownItem divider />
									<DropdownItem>
										<Link href="/event">
											<i class="fa fa-plus" aria-hidden="true"></i> event
										</Link>
									</DropdownItem>
									<DropdownItem>
										<Link href="/athlete">
											<i class="fa fa-plus" aria-hidden="true"></i> athlete
										</Link>
									</DropdownItem>
									<DropdownItem divider />
									<DropdownItem>
										<Link href="/">my account</Link>
									</DropdownItem>
									<DropdownItem>
										<Link href="/">log out</Link>
									</DropdownItem>
								</DropdownMenu>
							</UncontrolledDropdown>
							*/}
						</Nav>
					</Collapse>
				</Navbar>
		);
	}
}
