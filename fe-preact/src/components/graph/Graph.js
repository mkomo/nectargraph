import { h, Component } from 'preact';
import { Link, route } from 'preact-router';

import * as d3 from "d3";
import 'd3-selection-multi';
import { parseSvg } from "d3-interpolate/src/transform/parse";

import * as gu from "../util/GraphUtil";

import style from './style.less';
import { Form, FormGroup, Label, Input, Button, FormText } from 'reactstrap';
import InlineInput from '../inline';
import Tooltip from '../tooltip/Tooltip';

import { Lux } from '../../stores/LuxStore'
import {
	GraphStore,
	Node,
	Edge,
	GroupStore,
	GroupConnectionStore
} from '../../stores/GraphStore';

var LuxComponent = Lux.Component.extend(Component);

const MODE_SELECT = 'select';
const MODE_SELECT_ADD = 'select_add';
const MODE_ADD = 'add';

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

		//stuff that won't be persisted
		this.state = {
			mode: MODE_SELECT,
			selectedNodes: [],
			selectedEdges: null,
			dragged: null,
			keys: [],

			labelsVisible: true,
			nodesVisible: true,
			edgesVisible: true,
			groupsVisible: false,
			backgroundVisible: false,

			menuVisible: false,
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
		this.keyCheck = this.keyCheck.bind(this);
		this.mouseCheck = this.mouseCheck.bind(this);
		this.nodes = this.nodes.bind(this);

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

	mode() {
		if (this.state.keys.includes('shift')) {
			return this.state.mode === MODE_SELECT_ADD ? MODE_SELECT : MODE_SELECT_ADD;
		} else if (this.state.keys.includes('ctrl')) {
			return this.state.mode === MODE_ADD ? MODE_SELECT : MODE_ADD;
		}
		return this.state.mode;
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
		this.redraw();
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
			this.redraw();
		}
	}

	clickPane() {
		if (this.mode() !== MODE_ADD) {
			if (this.state.selectedNodes || this.state.selectedEdges || this.state.dragged) {
				this.setState({
					selectedNodes: [],
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
				selectedNodes: [node],
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
			console.log('loaded background svg');
			this.svg = d3.select("svg")
				.attr("id", 'graph_svg')
			this.container = this.svg.select(this.state.background.containerSelector);
		} else {
			console.log('creating blank svg');
			this.svg = d3.select("#graph").append("svg")
				.attr("id", 'graph_svg')
			this.container = this.svg.append('g');
		}

		this.svg.style('background-color','#fbf1cd')
			.style('font-family','sans-serif')
			.on("mousemove", mousemove)
			.on("mouseup", mouseup)
			.on("mousedown", mousedown)
			.on("mousein",()=>this.svg.node.focus())
			.on("keydown", keydown)
			.on("keyup", keyup)
			.on("click", this.clickPane);

		// d3.select("#button_random").on("click", function(){
		// });

		var zoom = d3.zoom()
			.scaleExtent([0.2, 10])
			.filter(function() {
				that.keyCheck();
				if (that.mode() == MODE_SELECT_ADD && d3.event.type !== 'wheel') {
					console.log('zoom.filtered for MODE_SELECT_ADD', d3.event);
					that.setState({
						mousedownPixel: d3.mouse(that.container.node())
					});
					return false;
				} else {
					return true;
				}
			})
			.on("zoom", function() {
				var t = d3.event.transform;
				that.container.attr("transform", t);
				that.setState({
					transform: t,
					transformSvg: that.container.attr("transform")
				});
				that.redraw();
			})
			.on("end", function() {
				if (!Lux.eq(that.state.transform, that.store.state.transform) ||
						!Lux.eq(that.state.transformSvg, that.store.state.transformSvg)) {
					that.store.setState({
						transform: that.state.transform,
						transformSvg: that.state.transformSvg
					});
				}
			});

		if (this.state.transformSvg != null) {
			//https://stackoverflow.com/questions/38224875/replacing-d3-transform-in-d3-v4/38230545
			var transform = parseSvg(this.state.transformSvg);
			this.container.attr("transform", this.state.transformSvg);
			this.svg.call(zoom.transform,
				d3.zoomIdentity.translate(transform.translateX, transform.translateY).scale(transform.scaleX));
		}
		this.svg.call(zoom);

		function mousemove() {
			// console.log(d3.event);
			that.keyCheck();
			that.mouseCheck();

			if (that.state.dragged) {
				d3.event.preventDefault();
				d3.event.stopPropagation();
				var m = d3.mouse(that.container.node());
				that.state.dragged.x = m[0];
				that.state.dragged.y = m[1];
				that.redraw();
			} else if (that.state.mousedownPixel) {
				if (that.mode() == MODE_SELECT_ADD) {
					that.setState({
						selectionEnd: d3.mouse(that.container.node())
					})
					that.redraw();
				}
			}
		}

		function mouseup() {
			that.keyCheck();
			console.log('mouseup', d3.event);
			var updateObj = {};
			if (that.state.dragged) {
				updateObj.dragged = null;
				console.log('drag complete', that.state.dragged);
				that.store.setState({
					nodes: that.state.nodes
				});
			}
			if (that.state.mousedownPixel && that.state.selectionEnd) {
				var s = that.nodes(that.state.mousedownPixel, that.state.selectionEnd);

				updateObj.selectedNodes = s.concat(that.mode() == MODE_SELECT_ADD ? that.state.selectedNodes : []);
				updateObj.mousedownPixel = null;
				updateObj.selectionEnd = null;
			}
			that.setState(updateObj);
			that.redraw();
		}

		function mousedown() {
			console.debug('mousedown', d3.event);
		}

		function keyup() {
			console.debug('keyup', d3.event);
			that.keyCheck();
		}

		function keydown() {
			console.log('keydown');
			that.keyCheck();

			switch (d3.event.keyCode) {
				case 8: // backspace
				case 46:
				{ // delete
					that.deleteSelected()
					break;
				}
			}
		}

		window.addEventListener("resize", this.redraw);
		document.addEventListener('DOMContentLoaded', this.redraw, false);

		this.redraw();

		this.svg.node().focus();
	}

	nodes(c1, c2) {
		// establish bounding box
		var min = [Math.min(c1[0],c2[0]),
				Math.min(c1[1],c2[1])];
		var max = [Math.max(c1[0],c2[0]),
				Math.max(c1[1],c2[1])];
		// find nodes in bounding box
		return this.state.nodes.filter(n=> !n.deleted &&
			(n.x >= min[0] && n.x <=max[0]) &&
			(n.y >= min[1] && n.y <=max[1]));
	}

	keyCheck() {
		var o = {};
		if (d3.event.shiftKey) o['shift'] = true;
		if (d3.event.ctrlKey) o['ctrl'] = true;
		if (d3.event.altKey) o['alt'] = true;
		var keys =  Object.keys(o);
		if (!Lux.eq(this.state.keys, keys)) {
			this.setState({keys: keys});
		}

	}

	mouseCheck() {
		if (d3.event.buttons !== 1 && this.state.mousedownPixel) {
			console.log('removing mousedownPixel');
			this.setState({
				mousedownPixel: null,
				selectionEnd: null
			});
			this.redraw();
		}
	}

	onSelectNode(d) {
		this.keyCheck();
		d3.event.preventDefault();
		d3.event.stopPropagation();
		console.log(d3.event.type);
		if (this.mode() == MODE_ADD && this.state.selectedNodes != null
				&& this.state.selectedNodes.length == 1
				&& !this.state.selectedNodes.includes(d)) {
			if (d3.event.type == 'mousedown') {
				var e = new Edge(this.store, this.state.selectedNodes[0], d);
				console.log('new edge', e, d3.event.type);
				this.state.edges.push(e);
				this.store.setState({
					edges: this.state.edges
				});
				this.redraw();
			}
		} else {
			this.state.selectedNodes = (this.state.selectedNodes && this.mode() == MODE_SELECT_ADD ? this.state.selectedNodes : []);
			this.state.selectedNodes.push(d);
			this.setState({
				selectedNodes: this.state.selectedNodes,
				selectedEdges: this.mode() == MODE_SELECT_ADD ? this.state.selectedEdges : null,
				dragged: d3.event.type == "mousedown" ? d : null
			});
			this.redraw();
		}
	}

	redraw() {
		console.log('redraw');

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

		//selection
		var selectionBox = this.container.selectAll('rect.selection')
			.data((this.state.mousedownPixel && this.state.selectionEnd)
				? [{start: this.state.mousedownPixel, end: this.state.selectionEnd}]
				: []
			);

		selectionBox.exit().remove();
		selectionBox.enter().append("rect")
			.attr('class', 'selection')
			.attr('stroke-dasharray',"5, 5")
			.style('stroke', d=>d===that.state.selectedEdges ? '#ff7f0e' : '#444')
			.style('stroke-width','1px')
			.style('fill', '#ff7f0e44')
		.merge(selectionBox)
			.attr('x', d=>Math.min(d.start[0],d.end[0]))
			.attr('y', d=>Math.min(d.start[1],d.end[1]))
			.attr('width', d=>Math.abs(d.start[0]-d.end[0]))
			.attr('height', d=>Math.abs(d.start[1]-d.end[1]));

		//Groups
		this.state.nodes.forEach(node => { if (!node.size) node.size = 8 });
		var hullNodes = gu.convexHull(this.state.nodes.filter(node => this.state.nodesVisible && !node.deleted));
		var hull = this.container.selectAll("path.hull").data([hullNodes]);
		hull.exit().remove();
		if (hullNodes.length > 0) {
			hull.enter().append("path")
				.attr("class", "hull")
			.merge(hull)
				.attr("d", function(d) { return gu.path(d); })
				.style('stroke', '#ff7f0e')
				.style('stroke-width','20px')
				.style('stroke-linejoin','round')
				.style('fill','none');
		}

		var hullNodes2 = gu.convexHullRadius2(this.state.nodes.filter(node => this.state.nodesVisible && !node.deleted)).seq;
		console.log('hull!', ...hullNodes2.map(n=>n.name));
		var hull2 = this.container.selectAll("path.hull2").data([hullNodes2]);
		hull2.exit().remove();
		if (hullNodes.length > 0) {
			hull2.enter().append("path")
				.attr("class", "hull2")
			.merge(hull2)
				.attr("d", function(d) { return gu.radialPath(d, 3); })
				.style('stroke', 'rgb(23, 61, 68)')
				.style('stroke-width','1px')
				.style('stroke-linejoin','round')
				.style('fill','none')
		}

		//Edges
		var edge = this.container.selectAll("path." + style.line)
			.data(this.state.edges.filter(edge => (this.state.edgesVisible && this.store.line(edge) !== null)));

		edge.exit().remove();

		edge.enter().append("path")
			.attr("class", style.line)
			.on("click", function(d) {
				d3.event.preventDefault();
				d3.event.stopPropagation();
				that.setState({
					selectedEdges: d,
					selectedNodes: that.mode() == MODE_SELECT_ADD ? that.state.selectedNodes : [],
					dragged: null
				});
				that.redraw();
			})
			.style("opacity", 0)
			.transition(t)
				.style("opacity", 1)
		.selection().merge(edge)
			.style('stroke', d=>d===that.state.selectedEdges ? '#ff7f0e' : '#77777788')
			.style('stroke-width','1.5px')
			.attr("d", function(a) {
				return line(that.store.line(a));
			}).classed(style.selected, function(d) {
				return d === that.state.selectedEdges;
			});

		//Nodes
		var circle = this.container.selectAll("circle")
			.data(this.state.nodes.filter(node => this.state.nodesVisible && !node.deleted));

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
				return that.state.selectedNodes.includes(d);
			})
			.style('fill', d=>that.state.selectedNodes.includes(d) ? '#ff7f0e' : 'rgba(255,255,255,1.0)')
			.attr("cx", function(d) {
				return d.x;
			})
			.attr("cy", function(d) {
				return d.y;
			})
			.attr("r", function(d){
				return (d.size);
			})
			.style('stroke','#444')
			.style('stroke-width','1.5px');

		const MIN_LABEL_SIZE = 6.4;
		const LABEL_SIZE_FACTOR = 2;
		const LABEL_SIZE_DEFAULT = 10;

		var factor = this.state.transform ? this.state.transform.k : 1;

		//Labels
		var nodelabels = this.container.selectAll('.' + style.nodelabel)
			.data(this.state.nodes.filter(node => {
				var fontSize = node.size ? node.size * LABEL_SIZE_FACTOR : LABEL_SIZE_DEFAULT;
				// console.log(fontSize * factor);
				return this.state.labelsVisible && !node.deleted && factor * fontSize > MIN_LABEL_SIZE }));

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

		this.container.selectAll("circle").sort(function(a,b){
			return a.size == b.size ? 0 : (a.size > b.size ? -1 : 1);
		});
		nodelabels.raise();
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
		//it appears that in FF, you must append an element to the dom tree before click() will work
		document.body.append(downloadAnchorNode);
		downloadAnchorNode.click();
		downloadAnchorNode.remove();
	}

	updateSelected(type = null){
		var updateNodes = type == null || type == 'nodes';
		var updateNodes = type == null || type == 'edges';
		if (this.state.selectedNodes) {
			var cap = document.getElementById("nodeCaption").value;
			var size = document.getElementById("nodeSize").value;
			size = size.length == 0 ? null : parseFloat(size);
			this.state.selectedNodes.forEach(n=>{
				if (cap.length != 0) n.name = cap;
				if (size !== null && !isNaN(size)) n.size = size;
			});
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
			this.state.selectedNodes.forEach(n=>n.deleted = true);
			this.store.setState({
				selectedNodes: [],
				nodes: this.store.state.nodes
			});
		}
		if (this.state.selectedEdges && deleteEdges) {
			this.state.selectedEdges.deleted = true;
			this.store.setState({
				selectedEdges: null,
				nodes: this.store.state.nodes
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
		var expanded = (node && node.length > 0) || edge;
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
				<div class={style.graph_menu + (!this.state.menuVisible
						? ' ' + style.graph_menu_hidden
						: (expanded ? ' ' + style.graph_menu_expanded : '')
					)}>
					<a class={style.graph_menu_toggle} onClick={ e=>this.handleToggle('menuVisible', !this.state.menuVisible) }>
						<i class={ 'fa fa-angle-double-' + (this.state.menuVisible ? 'left' : 'right') } aria-hidden="true"></i>
					</a>
					<div class={style.graph_form_wrapper}>
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
								{this.state.edges.filter(edge => this.store.line(edge)).length} edges,&nbsp;0 groups
							</div>
							{/*
							<div class="small">
								zoom: {this.state.transform ? this.state.transform.k : ''}
							</div>
							<div class="small">
								keys: { this.state.keys ? this.state.keys.join(',') : (<i>none</i>)}
							</div>
							*/}
							<a onClick={ e=>this.handleToggle('toolboxVisible', !this.state.toolboxVisible) } class={style.menu_expand_button}>
								{ this.state.toolboxVisible
									? (<i class="fa fa-angle-up" aria-hidden="true"></i>)
									: (<i class="fa fa-ellipsis-v" aria-hidden="true"></i>)
								}
							</a>
						</div>
						<div class={style.menu_minimal + ' ' + style.toolbox + (this.state.toolboxVisible ? '' : (' ' + style.closed))}>

							<h6>view</h6>
							<div class={style.toolbox_row}>
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
									<Tooltip text="toggle background image">
										<button class={style.icon + (this.state.backgroundVisible ? ' ' + style.active : '')}
											onClick={ e=>this.handleToggle('backgroundVisible', !this.state.backgroundVisible) }>
											<i class="fa fa-picture-o" aria-hidden="true"></i>
										</button>
									</Tooltip>
									<Tooltip text="toggle groups">
										<button class={style.icon + (this.state.groupsVisible ? ' ' + style.active : '')}
											onClick={ e=>this.handleToggle('groupsVisible', !this.state.groupsVisible) }>
											<i class="fa fa-object-ungroup" aria-hidden="true"></i>
										</button>
									</Tooltip>
									<Tooltip text="toggle edges">
										<button class={style.icon + (this.state.edgesVisible ? ' ' + style.active : '')}
											onClick={ e=>this.handleToggle('edgesVisible', !this.state.edgesVisible) }>
											<i class="fa fa-code-fork" aria-hidden="true"></i>
										</button>
									</Tooltip>
									<Tooltip text="toggle nodes">
										<button class={style.icon + (this.state.nodesVisible ? ' ' + style.active : '')}
											onClick={ e=>this.handleToggle('nodesVisible', !this.state.nodesVisible) }>
											<i class="fa fa-dot-circle-o" aria-hidden="true"></i>
										</button>
									</Tooltip>
									<Tooltip text="toggle labels">
										<button class={style.icon + (this.state.labelsVisible ? ' ' + style.active : '')}
											onClick={ e=>this.handleToggle('labelsVisible', !this.state.labelsVisible) }>
											<i class="fa fa-font" aria-hidden="true"></i>
										</button>
									</Tooltip>
								</span>
							</div>
							<h6>edit</h6>
							<div class={style.toolbox_row}>
								<span class={style.toolbox_grp}>
									{/*select/multiselect/add*/}
									<Tooltip text="select nodes and edges">
										<button class={style.icon + (this.mode() === MODE_SELECT ? ' ' + style.active : '')}
											onClick={ e=>this.handleToggle('mode', MODE_SELECT) }>
											<i class="fa fa-mouse-pointer" aria-hidden="true"></i>
										</button>
									</Tooltip>
									<Tooltip text="add to selelection (shift)">
										<button class={style.icon + (this.mode() === MODE_SELECT_ADD ? ' ' + style.active : '')}
											onClick={ e=>this.handleToggle('mode', MODE_SELECT_ADD) }>
											<i class="fa fa-object-group" aria-hidden="true"></i>
										</button>
									</Tooltip>
									<Tooltip text="insert mode (ctrl)">
										<button class={style.icon + (this.mode() === MODE_ADD ? ' ' + style.active : '')}
											onClick={ e=>this.handleToggle('mode', MODE_ADD) }>
											<i class="fa fa-plus" aria-hidden="true"></i>
										</button>
									</Tooltip>
								</span>
								<span class={style.toolbox_grp}>
									{/*snap to hex,quad grid,spread*/}
									<Tooltip text="snap nodes to hex grid">
										<button class={style.icon}>
											hx
										</button>
									</Tooltip>
									<Tooltip text="snap nodes to quad grid">
										<button class={style.icon}>
											qd
										</button>
									</Tooltip>
									<Tooltip text="spread selected nodes">
										<button class={style.icon}>
											sp
										</button>
									</Tooltip>
								</span>
								<span class={style.toolbox_grp}>
									{/*undo*/}
									<Tooltip text="undo last action" position="bottom">
										<button class={style.icon}>
											<i class="fa fa-undo" aria-hidden="true"></i>
										</button>
									</Tooltip>
								</span>
							</div>
							<div class={style.toolbox_row}>
								<span class={style.toolbox_grp}>
									{/*undo*/}
									<Tooltip text="undo last action" position="bottom">
										<button>
											bulk add ...
										</button>
									</Tooltip>
								</span>
							</div>
							<h6>download</h6>
							<div class={style.toolbox_row}>
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
					</div>
					<div class={style.menu_expansion}>
						{ node && node.length > 0
							? (
								<Form onSubmit={e=>{e.preventDefault();this.updateSelected()}}>
									<h5>
										{node.length + (node.length > 1 ? ' nodes' : ' node') + ' selected'}
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
