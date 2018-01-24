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
	GraphStore,
	Node,
	Edge,
	GroupStore,
	GroupConnectionStore
} from '../../stores/GraphStore';

var LuxComponent = Lux.Component.extend(Component);

export default class Graph extends LuxComponent {

	/*
TODO
implement groups
spruce up edge Data view - source, target, directionality, label
multiselect, do not jump
multi-line label with tspan
animate pan on select
animate zoom to selection/extent
modal for bulk input
x move all graph style out of css (for download and flexibility)
x download JSON, download svg
x toggle show background
x toggle show edges

nodes edges categories traversals adjacency reachability = nectar
	*/

	constructor(props) {
		super(props);

		this.state = {
			selectedNodes: null,
			selectedEdges: null,
			dragged: null,
			keys: [],
			edgesVisible: false,
			backgroundVisible: false,
			toolboxVisible: true,
			background: {
				//TODO make this editable
				url: "/assets/char-map-base-layer.svg",
				containerSelector: "#layer1",
				bgid: 'g4599'
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
		this.handleToggle = this.handleToggle.bind(this);
		this.downloadGraphJson = this.downloadGraphJson.bind(this);
		this.downloadGraphSvg = this.downloadGraphSvg.bind(this);
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
		var p = this.state.background &&
				this.state.background.url &&
				this.state.background.containerSelector
			? fetch(this.state.background.url).then(function(response) {
				return response.text();
			}).then(function(svg) {
				return svg;
			})
			: new Promise((resolve) => {
				resolve(null);
			});
		p.then((svg)=>{
			this.createGraph(svg);
		});
	}

	getDimensions() {

		return {
			width: window.innerWidth,
			height: window.innerHeight -
				(document.getElementById('graph_svg').getBoundingClientRect().top -
					document.body.getBoundingClientRect().top) - 8
		}
	}

	handleToggle(key, value){
		console.log('handleToggle', key, value);
		var obj = {};
		obj[key] = value;
		this.setState(obj);
		this.redraw(true);
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
			if (this.state.selectedNodes || this.state.selectedEdges || this.state.dragged) {
				this.setState({
					selectedNodes: null,
					selectedEdges: null,
					dragged: null,
				});
				this.redraw();
			}
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
			this.container = this.svg.select(this.state.background.containerSelector);
		} else {
			this.svg = d3.select("#graph").append("svg")
				.attr("id", 'graph_svg')
			this.container = this.svg.append('g');
		}

		this.svg.style('background-color','#fbf1cd')
			.style('font-family','sans-serif')
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
			that.store.setState({
				nodes: that.state.nodes
			});
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
			this.setState({
				selectedNodes: d,
				selectedEdges: d3.event.shiftKey ? this.state.selectedEdges : null,
				dragged: d3.event.type == "mousedown" ? d : null
			});
			this.redraw();
		}
	}

	redraw(sort=false) {

		var bg = (this.state.background && this.state.background.bgid) ? document.getElementById(this.state.background.bgid) : null;
		if (bg != null) {
			bg.setAttribute('visibility', (this.state.backgroundVisible ? 'visible' : 'hidden'));
		}

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
			.data(this.state.edges.filter(edge => (this.state.edgesVisible && this.store.line(edge) !== null)));

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
			.style('stroke', d=>d===that.state.selectedEdges ? '#ff7f0e' : '#444')
			.style('stroke-width','2.5px')
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
			.style('fill', d=>d===that.state.selectedNodes ? '#ff7f0e' : 'rgba(255,255,255,1.0)')
			.attr("cx", function(d) {
				return d.x;
			})
			.attr("cy", function(d) {
				return d.y;
			})
			.attr("r", function(d){
				return (d.size ? d.size : radius);
			})
			.style('stroke','#444')
			.style('stroke-width','2.5px');

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
					if (!d.size || d.size * LABEL_SIZE_FACTOR > LABEL_SIZE_DEFAULT) {
						return LABEL_SIZE_DEFAULT + 'px'
					}
					return d.size*LABEL_SIZE_FACTOR + 'px';
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
			var comps = 0;
			this.container.selectAll("path,circle").sort(function(a,b){
				comps++;
				if (a.type ===  b.type){
					//a and b are either both nodes or both edges
					return a.id.localeCompare(b.id);
				} else if (a.type ===  Node.type){
					// a is an edge and b is not
					return 1;
				} else {
					// b is an edge and a is not
					return -1;
				}
			});
			console.debug('sorting', comps);
		} else {
			console.debug('not sorting');
		}
	}

	downloadGraphJson() {
		var dataStr = "data:text/json;charset=utf-8," +
			encodeURIComponent(
				JSON.stringify(Lux.removeCircular(this.state), null, 1)
			);
		this.download(dataStr, this.state.name + ".json");
	}

	downloadGraphSvg() {
		var html = this.svg
			.attr("title", this.state.name)
			.attr("version", 1.1)
			.attr("xmlns", "http://www.w3.org/2000/svg")
			.node().parentNode.innerHTML;
		var dataStr = "data:image/svg+xml;charset=utf-8," +
			encodeURIComponent( html );
		this.download(dataStr, this.state.name + ".svg");
	}

	download(dataStr, filename) {
		console.log('download', filename);
		var exportName = this.state.name;
		var downloadAnchorNode = document.createElement('a');
		downloadAnchorNode.setAttribute("href",     dataStr);
		downloadAnchorNode.setAttribute("download", filename);
		downloadAnchorNode.setAttribute("style", 'display: none');
		document.body.append(downloadAnchorNode);
		downloadAnchorNode.click();
		downloadAnchorNode.remove();
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
		var expanded = node || edge;
		// console.log('loaded', this.state);
		/*

when you click on the pane:
	drag ()
	add (ctrl)
	draw selection box (shift)

when you click on a node
	select ()
	add to selection (shift)
	move ()
	draw edge (ctrl)

when you click on an edge
	select ()
	add to selection (shift)
	bend ()

pane:
	click:
	dblclick:
	mousedown:
	mousemove:
	mouseup


		Graph data
			name
			# nodes
			# categories
			# connections
			background image/color
		*/
		return (
			<div class={style.graph_container}>
				<div id="graph"></div>
				<div class={expanded ? style.graph_menu + ' ' + style.graph_menu_expanded : style.graph_menu}>
					<div class={style.graph_form}>
						<div class={style.menu_minimal}>
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
							<div class="small">
								{this.state.nodes.filter(node => !node.deleted).length} nodes,&nbsp;
								{this.state.edges.filter(edge => !edge.deleted).length} edges,&nbsp;0 groups
							</div>
							<a onClick={ e=>this.handleToggle('toolboxVisible', !this.state.toolboxVisible) } class={style.menu_expand_button}>
								{ this.state.toolboxVisible
									? (<i class="fa fa-angle-double-up" aria-hidden="true"></i>)
									: (<i class="fa fa-angle-double-down" aria-hidden="true"></i>)
								}
							</a>
						</div>
						<div class={style.menu_minimal + ' ' + style.toolbox + (this.state.toolboxVisible ? '' : (' ' + style.closed))}>
							{/*
								graph_menu
									menu_raised_under (contrast color)
										menu_raised
											menu_title
											menu_toolbox (expandable)
									menu_item_editor
							<h6>
								zoom: {this.state.transform ? this.state.transform.k : ''}
							</h6>
							<h6>
								keys: { this.state.keys ? this.state.keys.join(',') : (<i>none</i>)}
							</h6>
							*/}
							<h6>view</h6>
							<div>
								<span class={style.toolbox_grp}>
									{/*zoom to extent, zoom to selection*/}
									<button class={style.icon + (this.state.modeAdd ? ' ' + style.active : '')}>
										<i class="fa fa-arrows-alt" aria-hidden="true"></i>
									</button>
									<button class={style.icon + (this.state.modeAdd ? ' ' + style.active : '')}>
										<i class="fa fa-search-plus" aria-hidden="true"></i>
									</button>
								</span>
								<span class={style.toolbox_grp}>
								</span>
								<span class={style.toolbox_grp}>
									{/*bg,groups,edges,nodes,labels*/}
									<button class={style.icon + (this.state.backgroundVisible ? ' ' + style.active : '')}
										onClick={ e=>this.handleToggle('backgroundVisible', !this.state.backgroundVisible) }>
										<i class="fa fa-picture-o" aria-hidden="true"></i>
									</button>
									<button class={style.icon + (this.state.groupsVisible ? ' ' + style.active : '')}
										onClick={ e=>this.handleToggle('groupsVisible', !this.state.groupsVisible) }>
										<i class="fa fa-object-ungroup" aria-hidden="true"></i>
									</button>
									<button class={style.icon + (this.state.edgesVisible ? ' ' + style.active : '')}
										onClick={ e=>this.handleToggle('edgesVisible', !this.state.edgesVisible) }>
										<i class="fa fa-code-fork" aria-hidden="true"></i>
									</button>
									<button class={style.icon + (this.state.nodesVisible ? ' ' + style.active : '')}
										onClick={ e=>this.handleToggle('nodesVisible', !this.state.nodesVisible) }>
										<i class="fa fa-dot-circle-o" aria-hidden="true"></i>
									</button>
									<button class={style.icon + (this.state.labelsVisible ? ' ' + style.active : '')}
										onClick={ e=>this.handleToggle('labelsVisible', !this.state.labelsVisible) }>
										<i class="fa fa-font" aria-hidden="true"></i>
									</button>
								</span>
							</div>
							<h6>edit</h6>
							<div>
								<span class={style.toolbox_grp}>
									{/*select/multiselect(shift)/add*/}
									<button class={style.icon + (this.state.modeAdd ? ' ' + style.active : '')}>
										<i class="fa fa-mouse-pointer" aria-hidden="true"></i>
									</button>
									<button class={style.icon + (this.state.modeAdd ? ' ' + style.active : '')}>
										<i class="fa fa-object-group" aria-hidden="true"></i>
									</button>
									<button class={style.icon + (this.state.modeAdd ? ' ' + style.active : '')}>
										<i class="fa fa-plus" aria-hidden="true"></i>
									</button>
								</span>
								<span class={style.toolbox_grp}>
									{/*snap to hex,quad grid,spread*/}
									<button class={style.icon}>
										hx
									</button>
									<button class={style.icon}>
										qd
									</button>
									<button class={style.icon}>
										sp
									</button>
								</span>
								<span class={style.toolbox_grp}>
									{/*undo*/}
									<button class={style.icon}>
										<i class="fa fa-undo" aria-hidden="true"></i>
									</button>
								</span>
							</div>
							<h6>download</h6>
							<div>
								<span class={style.toolbox_grp}>
									<button onClick={this.downloadGraphSvg}>
										<i class="fa fa-arrow-circle-down" aria-hidden="true"></i> svg
									</button>
									<button onClick={this.downloadGraphJson}>
										<i class="fa fa-arrow-circle-down" aria-hidden="true"></i> json
									</button>
								</span>
							</div>
						</div>
					</div>
					<div>
						{ node
							? (
								<Form onSubmit={e=>{e.preventDefault();this.updateSelected()}}>
									<hr />
									<h5>
										{ node ? (<small>1 node selected</small>) : ''}
									</h5>
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
						{ edge
							?
								<Form onSubmit={this.updateSelected}>
									<hr />
									<h5>
										{ edge ? (<small>1 edge selected</small>) : ''}
									</h5>
									<Button onClick={e=>this.deleteSelected('edges')}>delete</Button>
								</Form>
							: ''
						}
					</div>
				</div>
			</div>
		);
	}

}
