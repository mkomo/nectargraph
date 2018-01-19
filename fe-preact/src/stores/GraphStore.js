import { LuxLocalStore, Lux } from './LuxStore';

class GraphViewStore extends LuxLocalStore {
	constructor(props = {}) {
		super(props);

		this.state = {
			graph: null,
			selectedNodes: [],
			selectedEdges: [],
			mode: null,

		}
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
			groups: [],
			nodeConnections: [],
			groupConnections: []
		}

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
	GraphViewStore,
	GraphStore,
	NodeStore,
	GroupStore,
	NodeConnectionStore,
	GroupConnectionStore
}
