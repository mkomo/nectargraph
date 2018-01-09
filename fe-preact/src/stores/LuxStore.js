//https://gist.github.com/jed/982883
function uuidv4() {
	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
		(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	);
}

class LuxCache {
	constructor() {
		this.synonymsByType = {};
		this.itemsByType = {};
		window.cache = this;
	}

	normalizeType(type) {
		if (typeof type === "function") {
			type = type.name;
		}
		if (!(type in this.itemsByType)) this.itemsByType[type] = {};
		if (!(type in this.synonymsByType)) this.synonymsByType[type] = {};

		return type;
	}

	fetch(type, key) {
		type = this.normalizeType(type);
		var items = this.itemsByType[type];
		var synonyms = this.synonymsByType[type];
		var normKey = key in synonyms ? synonyms[key] : key;
		return normKey in items ? items[normKey] : null;

	}

	list(type, filter) {
		//TODO impl filter
		type = this.normalizeType(type);
		return this.itemsByType[type];
	}

	store(type, value) {
		var keys = createKeys(value.state, type.keys);
		type = this.normalizeType(type);
		console.log('storing item with created keys',type, keys, value);
		if (!value.__guid) {
			value.__guid = uuidv4();
		}
		this.itemsByType[type][value.__guid] = value;
		for (var i = 0; i < keys.length; i++) {
			this.synonymsByType[type][keys[i]] = value.__guid;
		}
		return keys;
	}

	rehome(type, oldkeys, value) {
		var newkeys = this.store(type, value);
		type = this.normalizeType(type);
		oldkeys.filter(k => !newkeys.includes(k)).forEach(k=>{
			delete this.synonymsByType[type][value.__guid];
		})
	}
}

var __cache = new LuxCache();

class LuxComponent {

}

LuxComponent.extend = function(Proto) {
	return class extends Proto {
		constructor(props) {
			super(props);
		}
		setState(obj) {
			return super.setState(obj);
		}
		componentWillMount() {
			//TODO handle multiple stores
			if (this.store) {
				this.store.register(this);
			}
		}
		componentWillUnmount() {
			if (this.store) {
				this.store.unregister(this);
			}
		}
	}
}

function createKeys(obj, kfs) {
	console.debug('createKeys', obj, kfs);
	return kfs.map(f=>f(obj)).filter(k=>k!==undefined);
}

var Lux = {
	createActions : function(actionNames) {
		return function() {
			console.debug('createActions', arguments);
			var actions = {};
			actionNames.forEach(name => {
				var callCount = 0;
				var listeners = [];
				var onFuncName = 'on' + name.charAt(0).toUpperCase() + name.slice(1);
				var f = function(){
					callCount += 1;
					console.debug('executing action', name, callCount, arguments, this);
					listeners.forEach(l => {
						if (onFuncName in l) {
							l[onFuncName](...arguments);
						}
					});
				};
				f.addListener = function(store) {
					listeners.push(store);
				}
				f.removeListener = function(store) {
					listeners = listeners.filter(s => (s !== store));
				}
				actions[name] = f;
			});
			window.actions = actions;
			return actions;
		}
	},

	get : function(Proto, props){
		var keys = createKeys(props, Proto.keys);
		console.debug('created keys', keys);
		if (keys != null && keys.length > 0) {
			//Just choose the first key because the item will be fetchable from cache with any of the keys
			var key = keys[0];
			console.debug('fetching item with key', key);
			var item = __cache.fetch(Proto, key);
			if (item != null) {
				console.debug('fetched item with key', key, item);
				return item;
			}
		}
		//either no keys or item not found in cache
		var p = new Proto(props);
		//TODO separate isLoaded isErrored isSaved into some separate encapsulated property like athlete.lux.isLoaded or something
		p.setState({isLoaded : true});
		__cache.store(Proto, p);
		return p;
	},

	list : function(Proto, filter) {
		console.log('listing items with filter', filter);
		return __cache.list(Proto, filter);
	},

	guid: uuidv4,

	Component : LuxComponent
};

class LuxAbstractStore {
	constructor(props) {
		this.props = props;
		this.components = [];
		this.state = {};
	}

	setState(obj) {
		console.debug('LuxStore.setState()', obj);
		this.components.forEach(function(c) {
			c.setState(obj);
		});

		for (var key in obj) {
			this.state[key] = obj[key];
		}

		//TODO __cache.rehome()
		this._persist();
	}

	setActions(actions){
		this.actions = actions;
		for (var name in actions) {
			// console.log(actions[name]);
			actions[name].addListener(this);
		}
	}

	register(component) {
		this.components.push(component);
		component.setState(this.state);
	}

	unregister(component) {
		this.components = this.components.filter(c => (c !== component));
	}

	_persist() {
		//override as needed -- should probably only be called internally
	}

	url() {
		var keys = createKeys(this.state, this.constructor.keys);
		if (keys != null && keys.length > 0) {
			//Just choose the first key because the item will be fetchable from cache with any of the keys
			return keys[0];
		}
		return 'TODOfixurlguidstuff';
	}

}

class LuxMemStore extends LuxAbstractStore {
	constructor(props) {
		super(props);
	}
}

class LuxLocalStore extends LuxMemStore {
	constructor(props) {
		super(props);
	}

}

class LuxRestStore extends LuxMemStore {
	constructor(props) {
		super(props);
	}
}

class LuxWebsocketStore extends LuxMemStore {
	constructor(props) {
		super(props);
	}
}

export {
	Lux,
	LuxMemStore,
	LuxLocalStore,
	LuxRestStore
}
