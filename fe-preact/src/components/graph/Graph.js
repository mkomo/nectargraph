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
	NodeStore,
	GroupStore,
	NodeConnectionStore,
	GroupConnectionStore
} from '../../stores/GraphStore';

import { Util, Split } from '../util';
var util = new Util();

var LuxComponent = Lux.Component.extend(Component);

//TODO remove this? or keep this as a shim between the view and the store?
class Node {
	constructor(x, y, name, categories = []) {
		this.x = x;
		this.y = y;
		this.name = name;
		this.id = Math.random().toString(36).substring(2);
		this.categories = categories;
		this.deleted = false;
	}
	toString() {
		return "Node(" + this.x + "," + this.y + ")"
	}
}

class Edge {
	constructor(source, target) {
		this.source = source;
		this.target = target;
		this.source_id = source.id;
		this.target_id = target.id;
		this.deleted = false;
	}
	toString() {
		return "Edge(" + this.source_id + "," + this.target_id + ")"
	}
}

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
			selected: null,
			dragged: null,
			nodes: [],
			edges: [],
			groups: []
		};

		this.setStore(props);

		var model_from_storage = localStorage.getItem('model');
		if (model_from_storage != null) {
			console.log('loading model from local storage', model_from_storage);
			var m = JSON.parse(model_from_storage);
			this.state.nodes = m.nodes.map(o=>Object.setPrototypeOf(o, Node.prototype));
			this.state.edges = m.edges.map(o=>Object.setPrototypeOf(o, Edge.prototype));
			m.edges.forEach(e=>{
				e.source = this.state.nodes.find(n => n.id === e.source_id);
				e.target = this.state.nodes.find(n => n.id === e.target_id);
			})
			this.state.transformSvg = m.transform;
			this.state.transform = m.transform;
		}
		console.log('######loaded nodes from storage', this.state);

		this.update = this.update.bind(this);
		this.createGraph = this.createGraph.bind(this);
		this.getDimensions = this.getDimensions.bind(this);
		this.redraw = this.redraw.bind(this);
		this.updateSelected = this.updateSelected.bind(this);
		this.randomGraphClick = this.randomGraphClick.bind(this);
		this.clickCreateNode = this.clickCreateNode.bind(this);
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

	componentDidUpdate() {
		if (!this.isOriginated) {
			this.originate();
			this.isOriginated = true;
		}
	}

	originate() {
		console.log("originate");
		// fetch("http://localhost:8000/char-map-base-layer.svg").then(function(response) {
		// 	return response.text();
		// }).then(function(svg) {
		// 	//console.log(svg);
		// 	document.getElementsByTagName('body')[0].insertAdjacentHTML('beforeend', svg);
		// })
		new Promise((resolve, reject) => {
			// We call resolve(...) when what we were doing asynchronously was successful, and reject(...) when it failed.
			// In this example, we use setTimeout(...) to simulate async code.
			// In reality, you will probably be using something like XHR or an HTML5 API.
			setTimeout(function(){
				resolve("Success!"); // Yay! Everything went well!
			}, 250);
		})
		.then(()=>this.createGraph());
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
				return new Edge(ns[source], ns[dest]);
			});

			this.redraw(false);
		}
	}

	clickCreateNode() {
		console.log("click", d3.event, this.state.dragged);
		var coord = d3.mouse(this.container.node());
		var node = new Node(coord[0], coord[1], "(no name)");

		this.setState({
			selected: node,
			dragged: null
		});
		this.state.nodes.push(node);
		this.setState({
			nodes: this.state.nodes
		})
		this.redraw();
	}

	createGraph() {

		//TODO handle resize https://bl.ocks.org/curran/3a68b0c81991e2e94b19

		var that = this;

		this.svg = d3.select("#graph").append("svg")
			.attr("id", 'graph_svg')
			.attr('style', 'background-color: #fbf1cd');

		this.svg
			.on("mousemove", mousemove)
			.on("mouseup", mouseup)
			.on("keydown", keydown)
			.on("click", this.clickCreateNode);

		this.container = this.svg.append('g');//select("#layer1");
		console.log('this.container', this.container);

		// d3.select("#button_random").on("click", function(){
		// });

		function zoomed() {
			var t = d3.event.transform;
			that.container.attr("transform", t);
			that.setState({
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

		function keydown() {
			// console.log('keydown');
			if (!that.state.selected) return;
			switch (d3.event.keyCode) {
				case 8: // backspace
				case 46:
					{ // delete
						that.state.selected.deleted = true;
						that.setState({selected: null});
						that.redraw();
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
		console.log(d3.event);
		if (d3.event.shiftKey && this.state.selected != null
			&& this.state.selected !== d) {
				if (d3.event.type == 'click') {
					var e = new Edge(this.state.selected, d);
					console.log('new edge', e, d3.event.type);
					this.state.edges.push(e);
					this.setState({
						edges: this.state.edges
					})
				}
		} else {
			// console.log("mousedown", d, d3.event);
			this.setState({
				selected: d,
				dragged: d3.event.type == "mousedown" ? d : null
			});
		}
		this.redraw(true);
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
		// console.log("redraw", d.width, d.height);
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
			.data(this.state.edges.filter(edge => (
				!edge.deleted && !edge.source.deleted && !edge.target.deleted)));

		edge.exit().remove();

		edge.enter().append("path")
			.attr("class", style.line)
			.on("click", function(d) {
				d3.event.preventDefault();
				d3.event.stopPropagation();
				that.setState({
					selected: d,
					dragged: null
				});
				that.redraw(true);
			})
			.style("opacity", 0)
			.transition(t)
				.style("opacity", 1)
		.selection().merge(edge)
			.attr("d", function(a) {
				return line([a.source, a.target]);
			}).classed(style.selected, function(d) {
				return d === that.state.selected;
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
				return d === that.state.selected;
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
		//Labels
		var nodelabels = this.container.selectAll('.' + style.nodelabel)
			.data(this.state.nodes.filter(node => !node.deleted && this.state.transform.k * (node.size ? node.size * LABEL_SIZE_FACTOR : LABEL_SIZE_DEFAULT) > MIN_LABEL_SIZE));

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
				if (a.constructor.name === Node.name){
					if (b.constructor.name === Node.name){
						return a.toString().localeCompare(b.toString());
					} else {
						return 1;
					}
				} else {
					if (b.constructor.name === Node.name){
						return -1;
					} else {
						return a.toString().localeCompare(b.toString());
					}
				}
			});
		}
	}

	updateSelected(e){
		console.log('updateSelected', arguments, this.svg);
		e.preventDefault();
		e.stopPropagation();
		if (this.state.selected) {
			this.state.selected.name = document.getElementById("nodeCaption").value;
			this.state.selected.size = parseFloat(document.getElementById("nodeSize").value);
			this.svg.node().focus();
			this.redraw();
		}
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
		var node = this.state.selected;
		var edge = null;
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
			<div class={style.graph_container} id="graph">
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
								nodes: {this.state.nodes.filter(node => !node.deleted).length} { node ? ' (1 selected)' : ''}
							</h5>

							{ node
								? (
									<Form onSubmit={this.updateSelected}>
										<FormGroup>
											<Label for="nodeCaption">caption</Label>
											<Input bsSize="sm" type="textarea" name="nodeCaption" id="nodeCaption" value={node.name}/>
										</FormGroup>
										<FormGroup>
											<Label for="nodeCaptionAngle">caption angle</Label>
											<Input bsSize="sm" name="nodeCaptionAngle" id="nodeCaptionAngle" />
										</FormGroup>
										<FormGroup>
											<Label for="nodeSize">size</Label>
											<Input bsSize="sm" name="nodeSize" id="nodeSize" value={node.size}/>
										</FormGroup>
										<Button id="button_update">update</Button>
									</Form>
								)
								: ''
							}
						</div>
						<hr />
						<div>
							<h5>
								connections: {this.state.edges.filter(edges => !edges.deleted).length} { edge ? ' (1 selected)' : ''}
							</h5>
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
								zoom: {this.state.transform.k}
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
