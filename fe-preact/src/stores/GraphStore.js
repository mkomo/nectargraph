import { LuxLocalStore, Lux } from './LuxStore';


class Node {
	constructor(x, y, name, size = 8, categories = []) {
		this.id = Lux.guid();
		this.type = 'node';
		this.x = x;
		this.y = y;
		this.size = size;
		this.name = name;
		this.categories = categories;
		this.deleted = false;
	}
}

Node.type = 'node';

class Edge {
	constructor(graph, source, target) {
		this.id = Lux.guid();
		this.type = 'edge';
		this.graphStore = graph;
		this.source_id = source.id;
		this.target_id = target.id;
		this.deleted = false;
	}
}

Edge.type = 'edge';

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

	copy() {
		var c = super.copy(['guid']);
		c.setState({ name : "Copy of " + c.state.name});
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
