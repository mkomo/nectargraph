import { h, Component } from 'preact';
import { Link, route } from 'preact-router';

import * as d3 from "d3";
import 'd3-selection-multi';
import { parseSvg } from "d3-interpolate/src/transform/parse";

import style from './style.less';
import { Form, FormGroup, Label, Input, Button, FormText } from 'reactstrap';
import InlineInput from '../inline';

import { Lux } from '../../stores/LuxStore'
import {
	GraphViewStore,
	GraphStore,
	Node,
	GroupStore,
	Edge,
	GroupConnectionStore
} from '../../stores/GraphStore';

import { Util, Split } from '../util';
var util = new Util();

var LuxComponent = Lux.Component.extend(Component);

//TODO remove this? or keep this as a shim between the view and the store?

export default class Graph extends LuxComponent {

	/*
	TODO
	get persistence working. one option is to use Store objects for nodes and edges and groups,
	another option is to use plain objects for nodes, edges, groups, but eliminate the infinite loops
	by including a reference to the GraphStore instead of directly to the nodes. this would be replaced on persist by a reference.

	*/

	constructor(props) {
		super(props);

		this.state = {
			selectedNodes: null,
			selectedEdges: null,
			dragged: null,
			keys: [],
			background: {
				url: "/assets/char-map-base-layer.svg",
				containerSelector: "#layer1"
			}
		};

		this.setStore(props);

		this.update = this.update.bind(this);
		this.createGraph = this.createGraph.bind(this);
		this.getDimensions = this.getDimensions.bind(this);
		this.redraw = this.redraw.bind(this);
		this.updateSelected = this.updateSelected.bind(this);
		this.deleteSelected = this.deleteSelected.bind(this);
		this.randomGraphClick = this.randomGraphClick.bind(this);
		this.clickPane = this.clickPane.bind(this);
		this.onSelectNode = this.onSelectNode.bind(this);
	}

	componentWillReceiveProps(nextProps, nextState) {
		if (!nextProps.guid || nextProps.guid !== this.state.guid) {
			console.debug("reloading event", nextProps);
			this.setStore(nextProps);
		}
	}

	setStore(props) {
		if (props && 'GraphStore' in props) {
			super.setStore(props.GraphStore);
		} else {
			super.setStore(Lux.get(GraphStore, props));
		}
		if (!('view' in this.props) || this.props['view'] == 'std') {
			route('/graphs' + this.store.url(), true);
		}
	}

	update(state) {
		console.log(this, state);
		this.store.setState(state);
	}

	originate() {
		var p = this.state.background && this.state.background.url && this.state.background.containerSelector
			? fetch(this.state.background.url).then(function(response) {
				return response.text();
			}).then(function(svg) {
				return svg;
			})
			: new Promise((resolve) => {
				resolve(null);
			});
		p.then((svg)=>{
			console.log("originate", document, svg);
			this.createGraph(svg);
		});
	}

	getDimensions() {

		return {
			width: window.innerWidth,
			height: window.innerHeight -
				(document.getElementById('graph_svg').getBoundingClientRect().top -
					document.body.getBoundingClientRect().top)
				- 8
		}
	}

	randomGraphClick(event) {

		event.preventDefault();
		event.stopPropagation();
		if (confirm("Are you sure you want to delete current graph?")){
			console.log("removing", JSON.stringify(this.state));

			var d = this.getDimensions();
			this.state.nodes = d3.range(1, 10).map(function(i) {
				return new Node(i * d.width / 10,
					50 + Math.random() * (d.height - 100));
			})
			var ns = this.state.nodes;
			this.state.edges = d3.range(1, 10).map(function(i) {
				var source = Math.floor(Math.random() * ns.length);
				var dest = (source + (1 + Math.floor(Math.random() * (ns.length - 1))))
						% ns.length;
				return new Edge(this.store, ns[source], ns[dest]);
			});

			this.store.setState({
				nodes: this.state.nodes,
				edges: this.state.edges
			});
			this.redraw(false);
		}
	}

	clickPane() {
		if (!d3.event.ctrlKey) {
			this.setState({
				selectedNodes: null,
				selectedEdges: null,
				dragged: null,
			});
			this.redraw();
		} else {
			console.log("click", d3.event, this.state.dragged);
			var coord = d3.mouse(this.container.node());
			var node = new Node(coord[0], coord[1], "(no name)");

			this.state.nodes.push(node);
			this.setState({
				selectedNodes: node,
				selectedEdges: null,
				dragged: null,
			});
			this.store.setState({
				nodes: this.state.nodes
			});
			this.redraw();
		}
	}

	createGraph(svg) {
		var that = this;

		d3.select("svg").remove();
		if (svg) {
			d3.select('#graph').html(svg);
			console.log('downloaded svg');
			this.svg = d3.select("svg")
				.attr("id", 'graph_svg')
				.attr('style', 'background-color: #fbf1cd');
			this.container = this.svg.select(this.state.background.containerSelector);
		} else {
			this.svg = d3.select("#graph").append("svg")
				.attr("id", 'graph_svg')
				.attr('style', 'background-color: #fbf1cd');
			this.container = this.svg.append('g');
		}

		this.svg
			.on("mousemove", mousemove)
			.on("mouseup", mouseup)
			.on("keydown", keydown)
			.on("keyup", keyup)
			.on("click", this.clickPane);

		console.log('this.container', this.container);

		// d3.select("#button_random").on("click", function(){
		// });

		function zoomed() {
			var t = d3.event.transform;
			that.container.attr("transform", t);
			that.store.setState({
				transform: t,
				transformSvg: that.container.attr("transform")
			});
			that.redraw();
		}

		var zoom = d3.zoom()
			.scaleExtent([0.2, 10])
			.on("zoom", zoomed);

		if (this.state.transformSvg != null) {
			//https://stackoverflow.com/questions/38224875/replacing-d3-transform-in-d3-v4/38230545
			var transform = parseSvg(this.state.transformSvg);
			this.container.attr("transform", this.state.transformSvg);
			this.svg.call(zoom.transform, d3.zoomIdentity.translate(transform.translateX, transform.translateY).scale(transform.scaleX));
		}
		this.svg.call(zoom);

		this.svg.node().focus();

		function mousemove() {
			if (!that.state.dragged) return;

			d3.event.preventDefault();
			d3.event.stopPropagation();
			var m = d3.mouse(that.container.node());
			that.state.dragged.x = m[0];
			that.state.dragged.y = m[1];
			that.redraw();
		}

		function mouseup() {
			if (!that.state.dragged) return;
			mousemove();
			that.setState({
				dragged: null
			});
		}

		function keyup() {
			console.log('keyup', d3.event);
			var i = that.state.keys.indexOf(d3.event.key);
			if (i != -1) {
				that.state.keys.splice(i, 1);
				that.setState({
					keys: that.state.keys
				})
			}
		}

		function keydown() {
			if (! that.state.keys.includes(d3.event.key)) {
				that.state.keys.push(d3.event.key);
				that.setState({
					keys: that.state.keys
				})
			}

			switch (d3.event.keyCode) {
				case 8: // backspace
				case 46:
				{ // delete
					that.deleteSelected()
					break;
				}
			}
		}

		this.redraw();

		window.addEventListener("resize", this.redraw);
		document.addEventListener('DOMContentLoaded', this.redraw, false);

	}

	onSelectNode(d) {
		d3.event.preventDefault();
		d3.event.stopPropagation();
		console.log(d3.event.type);
		if (d3.event.ctrlKey && this.state.selectedNodes != null
				&& this.state.selectedNodes !== d) {
			if (d3.event.type == 'mousedown') {
				var e = new Edge(this.store, this.state.selectedNodes, d);
				console.log('new edge', e, d3.event.type);
				this.state.edges.push(e);
				this.store.setState({
					edges: this.state.edges
				});
				this.redraw(true);
			}
		} else {
			// console.log("mousedown", d, d3.event);
			this.setState({
				selectedNodes: d,
				selectedEdges: d3.event.shiftKey ? this.state.selectedEdges : null,
				dragged: d3.event.type == "mousedown" ? d : null
			});
			this.redraw();
		}
	}

	redraw(sort=false) {
		// Persist changes
		// localStorage.setItem('model', JSON.stringify({
		// 		nodes: model.nodes,
		// 		edges: model.edges,
		// 		transform: this.container.attr("transform")
		// }, null, '\t'));

		let that = this;

		var line = d3.line()
				.x(d=>d.x)
				.y(d=>d.y);

		var d = this.getDimensions();

		this.svg
			.attr("width", d.width)
			.attr("height", d.height)
			.attr("tabindex", 1);

		var t = d3.transition()
			.duration(1750)
			.ease(d3.easeSin);

		//Regions

		//Edges
		var edge = this.container.selectAll("path")
			.data(this.state.edges.filter(edge => (this.store.line(edge) !== null)));

		edge.exit().remove();

		edge.enter().append("path")
			.attr("class", style.line)
			.on("click", function(d) {
				d3.event.preventDefault();
				d3.event.stopPropagation();
				that.setState({
					selectedEdges: d,
					selectedNodes: d3.event.shiftKey ? that.state.selectedNodes : null,
					dragged: null
				});
				that.redraw(true);
			})
			.style("opacity", 0)
			.transition(t)
				.style("opacity", 1)
		.selection().merge(edge)
			.attr("d", function(a) {
				return line(that.store.line(a));
			}).classed(style.selected, function(d) {
				return d === that.state.selectedEdges;
			});

		//Nodes
		var circle = this.container.selectAll("circle")
			.data(this.state.nodes.filter(node => !node.deleted));
		var radius = 8.5

		circle.exit().remove();
		circle.enter().append("circle")
			.style("opacity", 0)
			.on("mousedown", this.onSelectNode)
			.on("click", this.onSelectNode)
			.on("dblclick", this.onSelectNode)
			.transition(t)
				.style("opacity", 1)
		.selection().merge(circle)
			.classed(style.selected, function(d) {
				return d === that.state.selectedNodes;
			})
			.attr("cx", function(d) {
				return d.x;
			})
			.attr("cy", function(d) {
				return d.y;
			})
			.attr("r", function(d){
				return (d.size ? d.size : radius);
			});

		const MIN_LABEL_SIZE = 6.4;
		const LABEL_SIZE_FACTOR = 2;
		const LABEL_SIZE_DEFAULT = 10;

		var factor = this.state.transform ? this.state.transform.k : 1;

		//Labels
		var nodelabels = this.container.selectAll('.' + style.nodelabel)
			.data(this.state.nodes.filter(node => !node.deleted
				&& factor * (node.size ? node.size * LABEL_SIZE_FACTOR : LABEL_SIZE_DEFAULT) > MIN_LABEL_SIZE));

		nodelabels.exit().remove();
		nodelabels.enter().append("text")
				.style("opacity", 0)
				.on("mousedown", this.onSelectNode)
				.on("click", this.onSelectNode)
				.on("dblclick", this.onSelectNode)
				.transition(t)
					.style("opacity", 1)
		.selection().merge(nodelabels)
			.style('font-size',
				function(d){
					if (d.size && d.size > 12) {
						return LABEL_SIZE_DEFAULT + 'px'
					}
					return (d.size ? (d.size*LABEL_SIZE_FACTOR) + 'px' : '');
				})
			.attrs({
					"x":function(d){
						if (d.size && d.size > 12) {
							return d.x;
						}
						return d.x + (d.size ? d.size : radius);
					},
					"y":function(d){
						if (d.size && d.size > 12) {
							return d.y;
						}
						return d.y - (d.size ? d.size : radius);
					},
					"text-anchor" : function(d) {
						return d.size && d.size > 12 ? "middle" : "start";
					},
					"alignment-baseline" : function(d) {
						return d.size && d.size > 12 ? "middle" : "bottom";
					},
					"class":style.nodelabel,
				})
				.text(d=>d.name);

		//Cleanup (sorting)
		if (sort) {
			this.container.selectAll("path,circle").sort(function(a,b){
				if (a.constructor.name === b.constructor.name){
					return a.toString().localeCompare(b.toString());
				} else if (a.constructor.name === Node.name){
					return 1;
				} else {
					return -1;
				}
			});
		}
	}

	updateSelected(type = null){
		var deleteNodes = type == null || type == 'nodes';
		var deleteEdges = type == null || type == 'edges';
		if (this.state.selectedNodes) {
			this.state.selectedNodes.name = document.getElementById("nodeCaption").value;
			var size = document.getElementById("nodeSize").value;
			this.state.selectedNodes.size = size.length == 0 ? null : parseFloat(size);
			this.store.setState({
				nodes: this.state.nodes
			});
			this.svg.node().focus();
			this.redraw();
		}
	}

	deleteSelected(type = null){
		var deleteNodes = type == null || type == 'nodes';
		var deleteEdges = type == null || type == 'edges';

		if (this.state.selectedNodes && deleteNodes) {
			this.state.selectedNodes.deleted = true;
			this.setState({
				selectedNodes: null
			});
		}
		if (this.state.selectedEdges && deleteEdges) {
			this.state.selectedEdges.deleted = true;
			this.setState({
				selectedEdges: null
			});
		}
		if (deleteNodes || deleteEdges) {
			this.redraw();
		}
		this.svg.node().focus();
	}
	render() {
		console.debug('Graph.render',this.state);
		return (!('view' in this.props) || this.props['view'] == 'std')
				? this.renderLoaded()
				: this.renderList();
	}

	renderList() {
		console.debug('inline',this.state);
		var href = "/graphs" + this.store.url();

		return (
<div>
	<span class={style.list_entry_elt}>
		<i class="fa fa-check-circle" aria-hidden="true"></i>
	</span>
	<span class={style.list_entry_elt}><Link href={href}>
		<InlineInput
			value={this.state.name}
			onChange={this.update}
			propName="name"
			placeholder={this.state.guid.substring(0,8)}
			width="10em"
			showAlways
			/>
	</Link></span>
</div>
		);
	}

	renderLoaded() {
		if (!this.isOriginated) {
			this.originate();
			this.isOriginated = true;
		}
		var node = this.state.selectedNodes;
		var edge = this.state.selectedEdges;
		// console.log('loaded', this.state);
		/*

		Controls
			select/multiselect(shift)/add, zoom to extent, snap to hex/quad grid, spread evenly
		Graph data
			name
			# nodes
			# categories
			# connections
			background image/color
		*/
		return (
			<div class={style.graph_container}>
				<div id="graph">
				</div>
				<div class={style.graph_form}>
					<h2>
						<InlineInput
							value={this.state.name}
							onChange={this.update}
							propName="name"
							placeholder="(untitled)"
							width="100%"
							showAlways
							/>
					</h2>
					<div>
						<hr />
						<div>
							<h5>
								nodes: {this.state.nodes.filter(node => !node.deleted).length} { node ? (<small>(1 selected)</small>) : ''}
							</h5>

							{ node
								? (
									<Form onSubmit={e=>{e.preventDefault();this.updateSelected()}}>
										<FormGroup>
											<Label for="nodeCaption">caption</Label>
											<Input bsSize="sm" type="textarea" name="nodeCaption" id="nodeCaption" value={node.name}/>
										</FormGroup>
										{/*<FormGroup>
											<Label for="nodeCaptionAngle">caption angle</Label>
											<Input bsSize="sm" name="nodeCaptionAngle" id="nodeCaptionAngle" />
										</FormGroup>*/}
										<FormGroup>
											<Label for="nodeSize">size</Label>
											<Input bsSize="sm" name="nodeSize" id="nodeSize" value={node.size}/>
										</FormGroup>
										<Button onClick={e=>this.updateSelected('nodes')}>update</Button>{' '}
										<Button onClick={e=>this.deleteSelected('nodes')}>delete</Button>
									</Form>
								)
								: ''
							}
						</div>
						<hr />
						<div>
							<h5>
								edges: {this.state.edges.filter(edges => !edges.deleted).length} { edge ? ' (1 selected)' : ''}
							</h5>
							{ edge
								?
									<Form onSubmit={this.updateSelected}>
										<Button onClick={e=>this.deleteSelected('edges')}>delete</Button>
									</Form>
								: ''
							}
						</div>
						<hr />
						<div>
							<h5>
								groups: 42
							</h5>
						</div>
						<hr />
						<div>
							<h6>
								zoom: {this.state.transform ? this.state.transform.k : ''}
							</h6>
							<h6>
								keys: { this.state.keys ? this.state.keys.join(',') : (<i>none</i>)}
							</h6>
						</div>
					</div>
				</div>
			</div>
		);

		/**
		TODO
		*/
	}

}
