import { LuxLocalStore, Lux } from './LuxStore';


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
	constructor(graph, source, target) {
		this.graphStore = graph;
		this.source_id = source.id;
		this.target_id = target.id;
		this.deleted = false;
	}

	toString() {
		return "Edge(" + this.source_id + "," + this.target_id + ")"
	}
}

var keys = [
	a => a.guid ? "/" + a.guid : undefined
]

class GraphStore extends LuxLocalStore {
	constructor(props = {}) {
		super(props);

		this.state = {
			guid: (props.guid ? props.guid : Lux.guid()),
			name: null,
			factoids: {},
			size: [0, 0],
			nodes: [],
			edges: [],
			groups: [],
			groupEdges: []
		}

		// var model_from_storage = localStorage.getItem('model');
		// if (model_from_storage != null) {
		// 	var m = JSON.parse(model_from_storage);
		// 	console.log('loading model from local storage', m.transform);
		// 	console.debug(model_from_storage);
		// 	this.state.nodes = m.nodes.map(o=>Object.setPrototypeOf(o, Node.prototype));
		// 	this.state.edges = m.edges.map(o=>Object.setPrototypeOf(o, Edge.prototype));
		// 	m.edges.forEach(e=>{
		// 		e.graphStore = this;
		// 		// e.source = this.state.nodes.find(n => n.id === e.source_id);
		// 		// e.target = this.state.nodes.find(n => n.id === e.target_id);
		// 	})
		// 	this.state.transformSvg = m.transform;
		// 	this.state.transform = m.transform;
		// }
		// console.log('######loaded nodes from storage', this.state);

	}

	line(edge) {
		var s = this.state.nodes.find(n => n.id === edge.source_id);
		var t = this.state.nodes.find(n => n.id === edge.target_id);

		return  (!edge.deleted && !t.deleted && !s.deleted)
			? [s, t]
			: null
	}

	delete() {
		console.log('onDeleteGraph');
		super.delete();
		this.setState({deleted: true});
	}
}
GraphStore.keys = keys;

class NodeStore extends LuxLocalStore {
	constructor(props = {}) {
		super(props);

		this.state = {
			name: null,
			graph: null,
			aliases: [], //array of strings
			factoids: {}, //mention count, age,
			rank: 0, //importance/level
			coords: [0, 0],
			labelAngle: null,
			labelName: [], //for custom multilining
			//other tables?
			groupConnections: [],
			nodeConnections: []
		}

	}
}

class GroupStore extends LuxLocalStore {
	constructor(props = {}) {
		super(props);

		this.state = {
			name: null,
			aliases: [],
			color: null,
			shape: null,//square? rounded? oval?
			nodeConnections: []
		}

	}
}

class NodeConnectionStore extends LuxLocalStore {
	constructor(props = {}) {
		super(props);

		this.state = {
			source: null,
			target: null,
			type: null, //mono, bi, similarity
			rank: null, //importance
			curve: []
		}

	}
}

class GroupConnectionStore extends LuxLocalStore {
	constructor(props = {}) {
		super(props);

		this.state = {
			node: null,
			group: null,
			type: null, //included,related,
			rank: null, //importance
			curve: [],
			groupConnectionCoord: null
		}

	}
}

export {
	GraphStore,
	Node,
	Edge,
	GroupStore,
	GroupConnectionStore
}
