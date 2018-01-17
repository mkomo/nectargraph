//https://gist.github.com/jed/982883
function uuidv4() {
	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
		(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	);
}

const LUX_GUID_KEY = '__guid';

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

	list(type, filter=[]) {
		//TODO impl filter

		type = this.normalizeType(type);

		if (!Array.isArray(filter)) {
			console.warn('list filtering not implemented for filter of this type', filter);
			return this.itemsByType[type];
		}
		var items = {};
		Object.keys(this.itemsByType[type]).forEach(guid=>{
			var pass = true;
			var item = this.itemsByType[type][guid];
			filter.forEach(f=> {
				var sub = item;
				f[0].forEach(e=>{
					if (e in sub) {
						sub = sub[e];
					} else {
						console.warn('oops, could not find elt', item, sub, e)
					}
				});
				if (sub != f[1]) {
					console.debug('did not pass filter',sub, f[1]);
					pass = false;
				}
			})
			if (pass) {
				items[guid] = item;
			}
		})
		return items;
	}

	store(type, value) {
		var keys = createKeys(value.state, type.keys);
		type = this.normalizeType(type);
		console.log('storing item with created keys',type);
		if (!value[LUX_GUID_KEY]) {
			value[LUX_GUID_KEY] = value.state.guid ? value.state.guid : uuidv4();
		}
		this.itemsByType[type][value[LUX_GUID_KEY]] = value;
		for (var i = 0; i < keys.length; i++) {
			this.synonymsByType[type][keys[i]] = value[LUX_GUID_KEY];
		}
		return keys;
	}

	delete(type, value) {
		var keys = createKeys(value.state, type.keys);
		type = this.normalizeType(type);
		keys.forEach(k=>{
			delete this.synonymsByType[type][value[LUX_GUID_KEY]];
		});
		delete this.itemsByType[type][value[LUX_GUID_KEY]];
	}

	rehome(type, oldkeys, value) {
		var newkeys = this.store(type, value);
		type = this.normalizeType(type);
		oldkeys.filter(k => !newkeys.includes(k)).forEach(k=>{
			delete this.synonymsByType[type][value[LUX_GUID_KEY]];
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
		setStore(store) {
			if (this.store) {
				this.store.unregister(this);
			}
			this.store = store;
			//TODO handle multiple stores (potentially with multiple overlapping actions)
			this.actions = this.store.actions;
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
	//TODO cascade
	return __cache.delete(Proto, props);
}

function luxInit(ProtoOrArray, arr=null){
	if (Array.isArray(ProtoOrArray)) {
		ProtoOrArray.forEach(P => luxInit(P, ProtoOrArray));
	} else {
		var Proto = ProtoOrArray;
		arr = arr ? arr : [Proto];
		if (!('init' in Proto) || !Proto.init.__luxIsInitialized) {
			var ProtoParent = Object.getPrototypeOf(Proto);
			if (ProtoParent.prototype instanceof LuxAbstractStore || ProtoParent === LuxAbstractStore) {
				luxInit(ProtoParent, arr);
			}

			if (('init' in Proto && typeof Proto.init === 'function') && !Proto.init.__luxIsInitialized) {
				console.log('init: calling init for Store', Proto.name);
				Proto.init(Proto, arr);
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
		//TODO ensure that this is working. when component count goes down to zero, this should be eligible for GC
		this.components = this.components.filter(c => (c !== component));
	}

	delete() {
		//TODO cascade delete, possibly with a function on the object like actions
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

function luxLocalStorageName() {
	return '__lux_store';
}

function luxCacheFlatten(o, depth = 0, maxDepth = 2, filter = null) {
	if (typeof o === 'object') {
		if (o === null || typeof o === 'undefined') {
			return o;
		} else if (o.constructor.prototype instanceof LuxAbstractStore) {
			if (depth > maxDepth) {
				return {
					__luxObject: true,
					type: o.constructor.name,
					guid: o[LUX_GUID_KEY]
				};
			} else {
				filter = ['state', LUX_GUID_KEY];
			}
		}
		var output = Array.isArray(o) ? [] : {};
		for (var key in o) {
			if (!filter || filter.includes(key)) {
				output[key] = luxCacheFlatten(o[key], depth + 1);
			}
		}
		return output;
	} else {
		return o;
	}
}

function luxCacheEmboss(o, root, depth = 0, parent, key) {
	if (typeof o !== 'object' || o === null || typeof o === 'undefined') {
		// console.log(depth + ' '.repeat(depth), '!!!!!!!!!!!!!', k, o);
	} else if ('__luxObject' in o) {
		// console.log('found and lux object', o, root[o.type][o.guid]);
		var replacement = root[o.type][o.guid];
		if (replacement) {
			parent[key] = replacement;
		} else {
			console.log('failed to find replacement', o);
		}
	} else {
		for (var k in o) {
			luxCacheEmboss(o[k], root, depth + 1, o, k);
		}
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

		console.log('updating local storage for type ' + this.constructor.name, cacheStats());

		if (!this.constructor.init.__luxIsInitialized) {
			console.log("!!!!!!!! trying to update before cache is initialized");
			//TODO create an action queue
			return;
		}
		var denested = luxCacheFlatten(cache);
		var localStorageName = luxLocalStorageName();
		localStorage.setItem(localStorageName, JSON.stringify(denested, null, 2));
		console.debug('saved local storage', JSON.stringify(denested, null, 2));
	}
}

function cacheStats() {
	var a=[];
	Object.keys(__cache.itemsByType).forEach(k=>{
		a.push(Object.keys(__cache.itemsByType[k]).length)
	});
	return a;
}
LuxLocalStore.init = function(Proto, arr){
	console.log("LuxLocalStore: reading from LocalStorage:", Proto.name, arr.map(P=>P.name));
	var localStorageName = luxLocalStorageName();
	var localStorageString = localStorage.getItem(localStorageName);

	var plainItems = JSON.parse(localStorageString);
	console.debug('items', plainItems);

	var types = {};
	arr.forEach(a=>{types[a.name] = a});

	console.debug('starting with empty cache', __cache);
	var flatItems = {};
	for (var type in plainItems) {
		flatItems[type] = {};
		for (var i in plainItems[type]) {
			var P = types[type];
			var item = new P({});
			item.state = plainItems[type][i]['state'];
			item[LUX_GUID_KEY] = i;
			flatItems[type][i] = item;
		}
	}

	luxCacheEmboss(flatItems, flatItems);
	var embossed = flatItems;

	console.debug('fully embossed', embossed);
	for (var type in embossed) {
		for (var i in embossed[type]) {
			var P = types[type];
			__cache.store(P, embossed[type][i]);
		}
	}

	console.log('populated cache', cacheStats(), __cache);
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
