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

function convexHullRadius(nodes, margin = 0) {
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

function radialPath(nodes, margin = 0){
	var path = 'M';
	var seg = leftTangentSegment(nodes[nodes.length - 1], nodes[0], margin);
	var first = seg.slice();
	path += seg.join('L');
	for (var i = 0; i < nodes.length - 1; i++) {
		var next = leftTangentSegment(nodes[i], nodes[i+1], margin);
		/*
		A rx ry x-axis-rotation large-arc-flag sweep-flag x y
		*/
		// path += 'M'
		path += ['A',nodes[i].size + margin,nodes[i].size + margin,0,
			0,
			1
		].join(' ');
		path += next.join('L');
		seg = next;
	}
	path += ['A',nodes[nodes.length - 1].size + margin,nodes[nodes.length - 1].size + margin,0,
		0,
		1
	].join(' ');
	path += first[0];
	return path;
}

function path(nodes, margin, closed = true){
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
