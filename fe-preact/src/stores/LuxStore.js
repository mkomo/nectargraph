import Reflux from 'reflux';

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

class LuxStore extends Reflux.Store {
	constructor() {
		super();
		this.cache = __cache;
	}
}

class LuxMemStore extends LuxStore {
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
		// new Promise(function(resolve, reject) {
		// 	setTimeout(() => resolve({
		// 		guid: '123456-1234',
		// 		name: o.name,
		// 		avatar: 'taco',
        //
		// 		organization: o.org,
		// 		affiliations: [o.org],
		// 	}), 2000);
		// }).then((res) => {
		// 	console.log('resolved',res);
		// 	res.isLoaded = true;
		// 	this.onUpdateAthlete(res);
		// });
	}

	list(filter) {
		console.log('listing items with filter', filter);
		return this.cache.list(this.constructor.name, filter);
	}

	update(item) {
		//do nothing -- item is it's own store
	}
}

class LuxLocalStore extends LuxStore {
	constructor() {
		super();
	}

}

class LuxRestStore extends LuxStore {
	constructor() {
		super();
	}
}

export {
	LuxStore,
	LuxMemStore,
	LuxLocalStore,
	LuxRestStore
}
