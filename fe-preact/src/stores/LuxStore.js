class LuxCache {
	constructor() {
		this.synonymsByType = {};
		this.itemsByType = {};
		window.cache = this;
	}

	fetch(type, key) {
		if (type in this.itemsByType) {
			var items = this.itemsByType[type];
			var synonyms = type in this.synonymsByType ? this.synonymsByType[type] : {};
			var normKey = key in synonyms ? synonyms[key] : key;
			return normKey in items ? items[normKey] : null;
		} else {
			this.itemsByType[type] = {};
			this.synonymsByType[type] = {};
			return null;
		}
	}

	list(type, filter) {
		return type in this.itemsByType ? this.itemsByType[type] : [];
	}

	store(type, keys, value) {
		console.log('store',type, keys, value);
		this.itemsByType[type][keys[0]] = value;
		for (var i = 1; i < keys.length; i++) {
			this.synonymsByType[type][keys[i]] = keys[0];
		}
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
			console.log('new setState()####################################', obj);
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

var Lux = {
	createActions : function(actionNames) {
		return function() {
			console.log('createActions', arguments);
			var actions = {};
			actionNames.forEach(name => {
				var callCount = 0;
				var listeners = [];
				var onFuncName = 'on' + name.charAt(0).toUpperCase() + name.slice(1);
				var f = function(){
					callCount += 1;
					console.log('executing action', name, callCount, arguments, this);
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
	Component : LuxComponent
};

class LuxAbstractStore {
	constructor() {
		this.cache = __cache;
		this.components = [];
		this.state = {};
	}

	setState(obj) {
		console.log('LuxStore.setState()', obj);
		this.components.forEach(function(c) {
			c.setState(obj);
		});
		for (var key in obj) {
			this.state[key] = obj[key];
		}
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

}

class LuxMemStore extends LuxAbstractStore {
	constructor() {
		super();
	}

	fetch(key, synonymFuct) {
		console.log('fetching item with key', key)
		var item = this.cache.fetch(this.constructor.name, key);
		if (item == null) {
			console.log('item not found in cache with key', key)
			this.cache.store(this.constructor.name, [key], this);
			item = this;
			item.setState({isLoaded: true});
		}
		return item;
	}

	list(filter) {
		console.log('listing items with filter', filter);
		return this.cache.list(this.constructor.name, filter);
	}
}

class LuxLocalStore extends LuxMemStore {
	constructor() {
		super();
	}

}

class LuxRestStore extends LuxMemStore {
	constructor() {
		super();
	}
}

class LuxWebsocketStore extends LuxMemStore {
	constructor() {
		super();
	}
}

export {
	Lux,
	LuxMemStore,
	LuxLocalStore,
	LuxRestStore
}
