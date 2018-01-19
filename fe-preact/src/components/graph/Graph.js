import { h, Component } from 'preact';
import { Link, route } from 'preact-router';

import * as d3 from "d3";
import 'd3-selection-multi';
import { parseSvg } from "d3-interpolate/src/transform/parse";

import style from './style.less';
import { Button, Table, Fade } from 'reactstrap';
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

export default class Graph extends LuxComponent {

	constructor(props) {
		super(props);

		this.state = {};
		this.setStore(props);

		this.update = this.update.bind(this);
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
		.then(function() {
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
					this.source_id = source;
					this.target_id = target;
					this.deleted = false;
				}
				source() {
					return model.nodes.find(n => n.id === this.source_id);
				}
				target() {
					return model.nodes.find(n => n.id === this.target_id);
				}
				toString() {
					return "Edge(" + this.source_id + "," + this.target_id + ")"
				}
			}

			//TODO handle resize https://bl.ocks.org/curran/3a68b0c81991e2e94b19
			var model = {};
			window.model = model;

			function random_graph(model) {
				model.nodes = d3.range(1, 10).map(function(i) {
					return new Node(i * width / 10,
						50 + Math.random() * (height - 100));
				})
				var ns = model.nodes;
				model.edges = d3.range(1, 10).map(function(i) {
					var source = Math.floor(Math.random() * ns.length);
					var dest = (source + (1 + Math.floor(Math.random() * (ns.length - 1))))
							% ns.length;
					return new Edge(ns[source].id, ns[dest].id);
				});
			}

			var model_from_storage = localStorage.getItem('model');
			if (model_from_storage != null) {
				// console.log('loading model from local storage', model_from_storage);
				var m = JSON.parse(model_from_storage);
				model.nodes = m.nodes.map(o=>Object.setPrototypeOf(o, Node.prototype));
				model.edges = m.edges.map(o=>Object.setPrototypeOf(o, Edge.prototype));
				model.transform = m.transform;
			} else {
				random_graph(model);
			}

			var dragged = null,
				selected = null;

			var line = d3.line()
					.x(d=>d.x)
					.y(d=>d.y);


			console.log(window.innerHeight, document.getElementById('graph').scrollTop);

			var svg = d3.select("#graph").append("svg")
				.attr("id", 'graph_svg');

			var width = document.body.scrollWidth - 15,
				height = window.innerHeight - 35 - document.getElementById('graph_svg').getBoundingClientRect().top;

			svg
				.attr("width", width)
				.attr("height", height)
				.attr("tabindex", 1);

			svg
				.on("mousemove", mousemove)
				.on("mouseup", mouseup)
				.on("keydown", keydown)
				.on("click", click_create_node);

			var container = svg.append('g');//select("#layer1");
			console.log('container', container);

			d3.select("#button_random").on("click", function(){
				d3.event.preventDefault();
				d3.event.stopPropagation();
				if (confirm("Are you sure you want to delete current graph?")){
					console.log("removing", JSON.stringify({
						nodes: model.nodes,
						edges: model.edges
					}));
					random_graph(model);
					redraw(false);
				}
			});

			d3.select("#button_update").on("click", function(){
				d3.event.preventDefault();
				d3.event.stopPropagation();
				if (selected != null && selected.constructor.name === Node.name){
					selected.name = document.getElementById("input_name").value;
					selected.size = parseFloat(document.getElementById("input_size").value);
					console.log(selected);
					redraw(false);
				}
			});

			var zoom = d3.zoom()
				.scaleExtent([0.2, 10])
				.on("zoom", zoomed);

			if (model.transform != null) {
				//https://stackoverflow.com/questions/38224875/replacing-d3-transform-in-d3-v4/38230545
				var transform = parseSvg(model.transform);
				container.attr("transform", model.transform);
				svg.call(zoom.transform, d3.zoomIdentity.translate(transform.translateX, transform.translateY).scale(transform.scaleX));
			}
			svg.call(zoom);

			function zoomed() {
				container.attr("transform", d3.event.transform);
				redraw();
			}

			svg.node().focus();

			function redraw(sort=false) {
				console.log("redraw");
				// Persist changes
				localStorage.setItem('model', JSON.stringify({
						nodes: model.nodes,
						edges: model.edges,
						transform: container.attr("transform")
				}, null, '\t'));

				var t = d3.transition()
					.duration(1750)
					.ease(d3.easeSin);

				//Regions

				//Edges
				var edge = container.selectAll("path")
					.data(model.edges.filter(edge => (
						!edge.deleted && !edge.source().deleted && !edge.target().deleted)));

				edge.exit().remove();

				edge.enter().append("path")
					.attr("class", style.line)
					.on("mousedown", function(d) {
						selected = dragged = d;
						redraw(true);
					})
					.style("opacity", 0)
					.transition(t)
						.style("opacity", 1)
				.selection().merge(edge)
					.attr("d", function(a) {
						return line([a.source(), a.target()]);
					}).classed(style.selected, function(d) {
						return d === selected;
					});

				//Nodes
				var circle = container.selectAll("circle")
					.data(model.nodes.filter(node => !node.deleted));
				var radius = 8.5

				var mousedown = function(d) {
					d3.event.preventDefault();
					d3.event.stopPropagation();
					if (d3.event.shiftKey && selected != null && selected !== d) {
						model.edges.push(new Edge(selected.id, d.id));
					} else {
						console.log("mousedown", d);
						selected = dragged = d;
					}
					redraw(true);
				}

				circle.exit().remove();
				circle.enter().append("circle")
					.style("opacity", 0)
					.on("mousedown", mousedown)
					.transition(t)
						.style("opacity", 1)
				.selection().merge(circle)
					.classed(style.selected, function(d) {
						return d === selected;
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

				//Labels
				var nodelabels = container.selectAll('.' + style.nodelabel)
					.data(model.nodes.filter(node => !node.deleted));

				nodelabels.exit().remove();
				nodelabels.enter().append("text")
						.style("opacity", 0)
						.on("mousedown", mousedown)
						.transition(t)
							.style("opacity", 1)
					.selection().merge(nodelabels)
					.style('font-size',
						function(d){
							if (d.size && d.size > 12) {
								return '10px'
							}
							return (d.size ? (d.size*2) + 'px' : '');
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
					container.selectAll("path,circle").sort(function(a,b){
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

			function click_create_node() {
				console.log("click", d3.event, dragged);
				var coord = d3.mouse(container.node());
				var node = new Node(coord[0], coord[1], "(no name)");
				dragged = null;
				model.nodes.push(selected = node);
				redraw();
			}

			function mousemove() {
				if (!dragged) return;

				d3.event.preventDefault();
				d3.event.stopPropagation();
				var m = d3.mouse(container.node());
				dragged.x = m[0];//Math.max(0, Math.min(width, m[0]));
				dragged.y = m[1];//Math.max(0, Math.min(height, m[1]));
				redraw();
			}

			function mouseup() {
				if (!dragged) return;
				mousemove();
				dragged = null;
			}

			function keydown() {
				console.log('keydown');
				if (!selected) return;
				switch (d3.event.keyCode) {
					case 8: // backspace
					case 46:
						{ // delete
							selected.deleted = true;
							selected = null;
							redraw();
							break;
						}
				}
			}

			redraw();

			// window.addEventListener("resize", redraw);
			document.addEventListener('DOMContentLoaded', function() {
				redraw();
			}, false);
		});

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

		/**
		icon (event status)
		event name
		date created
		parent meet?
		athlete count?
		 */
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
		return (
			<div class={style.graph_container} id="graph">
				<InlineInput
					value={this.state.name}
					onChange={this.update}
					propName="name"
					placeholder={this.state.guid.substring(0,8)}
					width="10em"
					showAlways
					/>

				<form class={style.graph_form}>
					<input id="input_name" />
					<input id="input_size" />
					<button id="button_update">update</button>
					<button id="button_random">random</button>
				</form>
			</div>
		);

		/**
		TODO
		*/
	}

}
