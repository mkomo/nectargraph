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

function convexHullNodes(nodes, margin) {
	//return only the nodes
}

function convexHullPath(ch, margin){
	//return the path
	return
}

class ConvexHull {
	constructor(margin = 0) {
		this.margin = 0;
		this.seq = [];
	}

	push(node) {
		console.log('push', this.seq);
		if (this.seq.length == 0) {
			this.seq.push(node);
		} else {
			for (var i = 0; i < this.seq.length; i++) {
				var l = this.seq.length;
				if (this.isOutside(node, this.seq[i], this.seq[(i+1) % l])) {
					console.log(node.name, 'is outside', this.seq.map(n=>n.name));
					var nodesToRemove = 0
					while (nodesToRemove < l && !this.isOutside(this.seq[(i+nodesToRemove) % l],node,this.seq[(i+nodesToRemove+1) % l])) {
						console.log('removing',this.seq[(i+nodesToRemove) % l].name);
						nodesToRemove++;
					}
					this.seq.splice(i,nodesToRemove,node);
					i++;
					if (i + nodesToRemove > l) {
						this.seq.splice(0, nodesToRemove - l)
					}
				}
			}
		}
	}

	isOutside(node, a, b) {
		if (a === b || node === a || node === b) {
			if (!this.isNodeContainedBy(node, a)) {
				return true;
			}
		} else {
			//if node contains a or b
			if (this.isNodeContainedBy(a, node) || this.isNodeContainedBy(b, node)) {
				console.log('node contained by')
				return true;
			}
			var seg = leftTangentSegment(a, b, this.margin);
			var segA = leftTangentSegment(a, node, this.margin);
			if (seg[0][0] == seg[1][0]) {
				return (seg[0][1] > seg[1][1]) ? node.x + node.size > seg[0][0] : node.x - node.size < seg[0][0]
			} else {
				var mOrig = (seg[1][1] - seg[0][1]) / (seg[1][0] - seg[0][0]);
				var mNew = (segA[1][1] - segA[0][1]) / (segA[1][0] - segA[0][0]);
				if (seg[0][0] < seg[1][0]) {
					return mOrig < mNew;
				} else {
					return mOrig > mNew;
				}
			}
		}
	}

	isNodeContainedBy(inside, outside) {
		var offset = [(outside.x - inside.x), (outside.y - inside.y)];
		return inside.size + Math.sqrt(Math.pow(offset[0], 2) + Math.pow(offset[1], 2)) < outside.size;
	}
}

function convexHullRadius(nodes, margin = 0, ch = new ConvexHull(margin)) {
	/*
	All segments will have monotonically decreasing slopes

	get node W that starts first (x-size is least)
	get node N that is the highest (y+size greatest)
	D = sort all nodes A by (A.x-A.size) where A.x-A.size is less than N.x (this will include N)
	...
	for a in D, if
	get node E that ends last (x+size is greatest)
	E = sort all nodes A by (A.x+A.size) where A.x+A.size is greater than N.x
	...
	get node S that is the lowest (y-size is smallest)
	...
	...

	*/
	var origNodes = nodes.slice();
	if (origNodes.length == 0) {
		return ch;
	} else {
		ch.push(origNodes[0]);
		return convexHullRadius(origNodes.slice(1), margin, ch);
	}
}


function leftTangentSegment(b, a, margin) {
	//https://en.wikipedia.org/wiki/Tangent_lines_to_circles#Tangent_lines_to_two_circles

	//y axis must be reversed
	const dy = -1 * (b.y - a.y);
	const dx = b.x - a.x;
	const hp = Math.PI / 2;
	var gamma = Math.atan2(dy, dx);
	var beta = Math.asin((b.size - a.size)/Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2)));
	var alpha = gamma - beta;
	var start = [a.x + (a.size + margin)*Math.cos(hp - alpha), a.y + (a.size + margin)*Math.sin(hp - alpha)];
	var end = [b.x + (b.size + margin)*Math.cos(hp - alpha), b.y + (b.size + margin)*Math.sin(hp - alpha)];
	return [end, start];
}

function crossProduct(u,v){
	//U x V = Ux*Vy-Uy*Vx
	return (u[1][0] - u[0][0])*(v[1][1] - v[0][1]) - (u[1][1] - u[0][1])*(v[1][0] - v[0][0])
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
				crossProduct(seg, next) > 0 ? 0 : 1, // test to see if angle between vectors is pos or neg
				1
			].join(' ');
			path += next.join('L');
			seg = next;
		}
		path += ['A',nodes[nodes.length - 1].size + margin,nodes[nodes.length - 1].size + margin,0,
			crossProduct(seg, first) > 0 ? 0 : 1,
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
	convexHullRadius,
	radialPath,
	path
}
