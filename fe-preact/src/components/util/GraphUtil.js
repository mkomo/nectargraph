function cross(a, b, o) {
	return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}

function convexHull(nodes, space = 0) {
	nodes.sort(function(a, b) {
		return a.x == b.x ? a.y - b.y : a.x - b.x;
	});

	var lower = [];
	for (var i = 0; i < nodes.length; i++) {
		while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], nodes[i]) <= 0) {
			lower.pop();
		}
		lower.push(nodes[i]);
	}

	var upper = [];
	for (var i = nodes.length - 1; i >= 0; i--) {
		while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], nodes[i]) <= 0) {
			upper.pop();
		}
		upper.push(nodes[i]);
	}

	upper.pop();
	lower.pop();
	return lower.concat(upper);
}


class Hull {
	constructor(margin = 0) {
		this.margin = 0;
		//This always starts with the node with the leftmost edge. if nodes are tied for leftmost, take the bottommost
		//TODO make private
		this.seq = [];
	}

	add(node) {
		var debug = console.log;
		if (this.seq.length === 0) {
			// seq is empty, add unconditionally
			this.seq.push(node);
			return 1;
		} else {
			var places = 0;
			var loops = 0;
			for (let i = 0; i < this.seq.length; i++) {
				loops++;
				if (loops > 20) {
					console.error('you fucked it up, matt');
					return;
				}
				var z = this.seq[(i + this.seq.length - 1) % this.seq.length];
				var a = this.seq[i];
				var b = this.seq[(i+1) % this.seq.length];
				debug('+should?', node.name, 'to (', ...this.seq.map(n=>n.name), ') after', a.name, '@', i);

				//new chunklet
				if (z === a && b === a) {
					let isOutside = node !== a && !isNodeAinNodeB(node, a);
					if (isOutside) {
						debug('+    splice ONE NODE', isOutside);
						this.seq.splice(i+1, 0, node);
					}
				} else if (isOutsideNew(node, z, a, b)) {
					// this is necessary and sufficient
					let nodesToRemoveForward = 0;

					//TODO remove back? this didn't seem necessary? think abt that edge case

					let newi = i;
					// if (isOutsideNew(a, a, node, b)) {
					// 	debug('+    splice pimple', node.name, 'at', i+1, 'in', ...this.seq.map(n=>n.name))
					// 	this.seq.splice(newi + 1, 0, node, a);
					// }
					debug('adding, but first removing')
					while (isOutsideNew(
							...this.subseq(i + nodesToRemoveForward + 2, 1),
							a,
							node,
							...this.subseq(i + nodesToRemoveForward + 1, 1))) {
						nodesToRemoveForward++
						if (nodesToRemoveForward > 10) {
							debug('you fucked up, forward');
							break;
						}
					}
					debug('removing forward', nodesToRemoveForward);
					for (let j = 0; j < (nodesToRemoveForward); j++) {
						let rempos = (newi + this.seq.length + 1) % this.seq.length;
						debug('removing', rempos, this.seq[rempos].name, 'from [', ...this.seq.map(n=>n.name), '] with i @', i)
						this.seq.splice(rempos, 1);
						if (rempos <= i) {
							newi--;
						}
					}
					i = newi;
					debug('+    splice', node.name, 'at', newi+1, 'in', ...this.seq.map(n=>n.name))
					this.seq.splice(newi+1, 0, node);

				}
			}

			return places;
		}
	}

	subseq(start, length) {
		let subseq = [];
		for (let offset = 0; offset < length; offset++) {
			let index = ((start % this.seq.length) + this.seq.length + offset) % this.seq.length;
			subseq.push(this.seq[index]);
		}
		return subseq;
	}

	addAll(nodes) {
		nodes = nodes.slice().sort((a,b)=>(b.size - a.size));
		console.log('nodes\n' + nodes.map(n=>('\t' + n.name + ": new Node(" + n.x + ",\t" +
			n.y + ",\t'" +
			n.name + "',\t" +
			n.size + ')')).join('\n'));
		for (var i = 0; i < nodes.length; i++) {
			this.add(nodes[i]);
		}
	}
}

function isNodeAinNodeB(inside, outside) {
	var offset = [(outside.x - inside.x), (outside.y - inside.y)];
	return inside.size + Math.sqrt(Math.pow(offset[0], 2) + Math.pow(offset[1], 2)) <= outside.size;
}


function isOutsideNew(node, z, a, b) {
	var debug = console.log;
	debug('is', a.name, node.name, 'in between', z.name, a.name, 'and', a.name, b.name);
	if (node === a) {
		debug('isOutsideNew node === a', false);
		return false;
	} else if (isNodeAinNodeB(a, node)) {
		debug('isOutsideNew node surrounds a', true);
		return true;
	} else {
		let za = leftTangentAngle(z, a);
		let anode = leftTangentAngle(a, node);
		let ab = leftTangentAngle(a, b);
		if (za < ab) {
			let isOutside = anode > za && anode < ab;
			debug('isOutsideNew za >= ab', za,anode, ab, isOutside);
			return isOutside;
		} else {
			let isOutside = anode > za || anode < ab;
			debug('isOutsideNew za >= ab', za,anode, ab, isOutside);
			return isOutside;
		}
	}
}

function convexHullRadius2(nodes, margin = 0, h = new Hull(margin)) {
	/*
	All segments will have monotonically decreasing slopes


	=========================new version=============================
	iterate through nodes. get N:
		if ch empty, add N to ch
		else
			for M in ch:
				if M inside N, replace M with N
				else
	=========================old version=============================
	...
	...

	*/
	h.addAll(nodes);
	return h;
}

function leftTangentAngle(start, end) {
	var v = vector(leftTangentSegment(start, end));
	return angleOf(v);
}

function leftTangentSegment(start, end, margin = 0) {
	//https://en.wikipedia.org/wiki/Tangent_lines_to_circles#Tangent_lines_to_two_circles

	const dy = end.y - start.y;
	const dx = end.x - start.x;
	const hp = Math.PI / 2;
	var gamma = Math.atan2(dx,-1*dy);
	var beta = Math.asin((start.size - end.size)/Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2)));
	var alpha = gamma + beta;
	var start = [start.x - (start.size + margin)*Math.cos(alpha), start.y - (start.size + margin)*Math.sin(alpha)];
	var end = [end.x - (end.size + margin)*Math.cos(alpha), end.y - (end.size + margin)*Math.sin(alpha)];

	return [start, end];
}

function angleOf(v) {
	var angle = 180 - Math.atan2(v[0],v[1]) * 180 / Math.PI
	return angle;
}

function angleDifference(alpha, beta) {
	return (180 - (beta - alpha + (beta < alpha ? 360 : 0)));
}

function angleFormedBy(a, b, c) {
	var v1 = normal(vector([b,a]));
	var v2 = normal(vector([b,c]));

	var sin = crossProduct(v1, v2);
	var cos = dotProduct(v1, v2);
	var acos = Math.acos(cos) * 180 / Math.PI; // 0 <= acos <= 180
	console.debug(v1,v2,sin,cos,acos);
	return (sin >= 0) ? acos : 360 - acos;
}

function dotProduct(u, v) {
	return u[0] * v[0] + u[1] * v[1];
}

function crossProduct(u, v){
	return u[0]*v[1] - u[1]*v[0];
}

function normal(v) {
	let length = vLength(v);
	return [v[0]/length, v[1]/length];
}

function vLength(v) {
	return Math.sqrt(Math.pow(v[0],2) + Math.pow(v[1],2));
}

function vector(segment) {
	return [segment[1][0] - segment[0][0], segment[1][1] - segment[0][1]];
}


function radialPath(nodes, margin = 0){
	var path = 'M';
	if (nodes.length == 1) {
		var n = nodes[0];
		var r = n.size + margin;
		//create two separate arcs so that svg doesn't get confused about which one is going which way.
		path += ' ' + [[n.x, n.y - r]].join('');
		//arc 1 (90deg)
		path += ' ' + ['A', r, r, 0, 0, 0].join(' ');
		path += ' ' + [[n.x - r, nodes[0].y]].join('');
		//arc 2 (270deg)
		path += ' ' + ['A', r, r, 0, 1, 0].join(' ');
		path += ' ' + [[n.x, n.y - r]].join('');
		console.log('nodes.length == 1', path);
	} else {
		var seg = leftTangentSegment(nodes[nodes.length - 1], nodes[0], margin);
		var first = seg.slice();
		path += seg.join('L');
		for (var i = 0; i < nodes.length - 1; i++) {
			var next = leftTangentSegment(nodes[i], nodes[i+1], margin);
			/*
			A rx ry x-axis-rotation large-arc-flag sweep-flag x y
			*/
			path += ['A',nodes[i].size + margin,nodes[i].size + margin,0,
				crossProduct(vector(seg), vector(next)) > 0 ? 0 : 1, // test to see if angle between vectors is pos or neg
				1
			].join(' ');
			path += next.join('L');
			seg = next;
		}
		path += ['A',nodes[nodes.length - 1].size + margin,nodes[nodes.length - 1].size + margin,0,
			crossProduct(vector(seg), vector(first)) > 0 ? 0 : 1,
			1
		].join(' ');
		path += first[0];
	}
	return path;
}

function path(nodes, closed = true){
	var path = 'M';
	path += nodes.map(n=>[n.x, n.y]).join('L');
	if (closed) path += 'Z';
	return path;
}

export {
	convexHull,
	angleFormedBy,
	convexHullRadius2,
	radialPath,
	path
}
