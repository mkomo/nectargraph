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

	delete(type, value) {
		var keys = createKeys(value.state, type.keys);
		type = this.normalizeType(type);
		keys.forEach(k=>{
			delete this.synonymsByType[type][value.__guid];
		});
		delete this.itemsByType[type][value.__guid];
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

function luxDelete(Proto, props) {
	return __cache.delete(Proto, props);
}

function luxInit(ProtoOrArray){
	if (Array.isArray(ProtoOrArray)) {
		ProtoOrArray.forEach(P => luxInit(P));
	} else {
		var Proto = ProtoOrArray;
		if (!('init' in Proto) || !Proto.init.__luxIsInitialized) {
			var ProtoParent = Object.getPrototypeOf(Proto);
			if (ProtoParent.prototype instanceof LuxAbstractStore || ProtoParent === LuxAbstractStore) {
				luxInit(ProtoParent);
			}

			if (('init' in Proto && typeof Proto.init === 'function') && !Proto.init.__luxIsInitialized) {
				console.log('init: calling init for Store', Proto.name);
				Proto.init(Proto);
				Proto.init.__luxIsInitialized = true;
			} else {
				console.log('init: no init for Store', Proto.name);
			}
		}
	}
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

	/**
	 * entry point for updating an object
	 */
	get : function(Proto, props){
		luxInit(Proto);
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
		__cache.store(Proto, p);
		//TODO separate isLoaded isErrored isSaved into some separate encapsulated property like athlete.lux.isLoaded or something
		p.setState({isLoaded : true});
		return p;
	},

	list : function(Proto, filter) {
		luxInit(Proto);
		console.debug('listing items with filter', filter);
		return __cache.list(Proto, filter);
	},

	guid: uuidv4,

	Component : LuxComponent,

	init: luxInit
};

class LuxAbstractStore {
	constructor(props) {
		this.props = props;
		this.components = [];
		this.state = {};
	}

	/**
	 * entry point for updating an object
	 */
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

	setActions(actions) {
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

	delete() {
		return luxDelete(this.constructor, this);
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
		console.error('could not create url', this);
		return 'TODOfixurlguidstuff';
	}

}

class LuxMemStore extends LuxAbstractStore {
	constructor(props) {
		super(props);
	}
}

function luxCacheFlatten(o, replacer, depth = 0, maxDepth = 2, filter = null) {
	if (typeof o === 'object') {
		if (o === null || typeof o === 'undefined') {
			return o;
		} else if (o.constructor.prototype instanceof LuxAbstractStore) {
			if (depth > maxDepth) {
				return {
					__luxObject: true,
					type: o.constructor.name,
					guid: o['__guid']
				};
			} else {
				filter = ['state', '__guid'];
			}
		}
		var output = Array.isArray(o) ? [] : {};
		for (var key in o) {
			if (!filter || filter.includes(key)) {
				output[key] = luxCacheFlatten(o[key], replacer, depth + 1);
			}
		}
		return output;
	} else {
		return o;
	}
}

class LuxLocalStore extends LuxMemStore {
	constructor(props) {
		super(props);
	}

	delete() {
		super.delete();
		this._persist();
	}

	_persist() {
		var cache = __cache.itemsByType;
		var ids = {};
		for (var t in cache) {
			ids[t] = [];
			for (var k in cache[t]) {
				ids[t].push(cache[t][k]['__guid'])
			}
		}

		console.log('updating local storage for type ' + this.constructor.name);
		// console.log(JSON.stringify(ids, null, 2));

		var denested = luxCacheFlatten(cache);
		var localStorageName = luxLocalStorageName();
		localStorage.setItem(localStorageName, JSON.stringify(denested, null, 2));
		// console.log(JSON.stringify(denested, null, 2));
	}
}



LuxLocalStore.init = function(Proto){
	console.log("LuxLocalStore: reading from LocalStorage:", Proto.name);
	var localStorageKey = "Lux." + Proto.name;
	var localStorageString = localStorage.getItem(localStorageKey);

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
