import * as chai from 'chai';
import { expect, assert } from 'chai';
// import * as chaiAlmost from 'chai-almost';
const chaiAlmost = require('chai-almost');
chai.use(chaiAlmost());

import * as gu from "components/util/GraphUtil";
import {
	GraphStore,
	Node,
	Edge
} from 'stores/GraphStore';

function checkHullCycle(nodes, expectedHull) {
	assert.deepEqual(gu.convexHullRadius2(nodes).seq.map(n=>n.name), expectedHull.map(n=>n.name));
}

describe('GraphUtil', function() {
	describe("#convexHullRadius", function() {
		let nodes;
		it('should return 0 node when 0 nodes are passed', function() {
			nodes = {};
			assert.deepEqual(gu.convexHullRadius2(Object.values(nodes)).seq, []);
		});
		it('should return 1 node when 1 node is passed', function() {
			nodes = {a : new Node(0,0,'a')};
			assert.deepEqual(gu.convexHullRadius2(Object.values(nodes)).seq, [nodes.a]);

			nodes = {boop : new Node(100,-10,'boop',100)}
			assert.deepEqual(gu.convexHullRadius2(Object.values(nodes),1100).seq, [nodes.boop]);
		});
		it('should return first node when two nodes of same radius and position are passed', function() {
			nodes = {a : new Node(0,0,'a',8), b : new Node(0,0,'b',8)};
			assert.deepEqual(gu.convexHullRadius2(Object.values(nodes)).seq, [nodes.a]);
		});
		it('should return larger node when two concentric nodes are passed', function() {
			nodes = {a : new Node(0,0,'a',8), b : new Node(0,0,'b',10)};
			assert.deepEqual(gu.convexHullRadius2(Object.values(nodes)).seq, [nodes.b]);
			nodes = {a : new Node(0,0,'a',12), b : new Node(0,0,'b',10)};
			assert.deepEqual(gu.convexHullRadius2(Object.values(nodes)).seq, [nodes.a]);
		});
		it('should return outer node when all other nodes are contained by it', function() {
			// nodes = {a : new Node(0,0,'a',20), b : new Node(10,0,'b',10), c : new Node(0,10,'c',10)};
			// assert.deepEqual(gu.convexHullRadius2(Object.values(nodes)).seq, [nodes.a]);
			nodes = {a : new Node(6,8,'a',10), b : new Node(10,0,'b',10), c : new Node(0,10,'c',10), d : new Node(0,0,'d',20)};
			assert.deepEqual(gu.convexHullRadius2(Object.values(nodes)).seq, [nodes.d]);
		});
		it('handle big middle node', function() {
			nodes = {
				a: new Node(458.47308349609375,	178.56248474121094,	'a',	8),
				b: new Node(369.6355285644531,	157.6595458984375,	'b',	20),
				c: new Node(248.1371307373047,	147.20806884765625,	'c',	8)
			}
			checkHullCycle(Object.values(nodes), [nodes.a,nodes.b,nodes.c,nodes.b]);
		});
		it('handle pimple', function() {
			nodes = {
				e: new Node(253.67733764648438,	116.07489013671875,	'e',	8),
				big: new Node(307.6970520019531,	192.6197967529297,	'big',	100),
				d: new Node(192.46788024902344,	312.138916015625,	'd',	8)
			}

			checkHullCycle(Object.values(nodes), [nodes.e,nodes.big,nodes.d,nodes.big]);
		});
		it('handle multiple points of protrusion', function() {
			nodes = {
				e: new Node(254.2005615234375,	118.61630249023438,	'e',	8),
				big: new Node(307.6970520019531,	192.6197967529297,	'big',	100),
				d: new Node(192.46788024902344,	312.138916015625,	'd',	8),
				a: new Node(407.2757568359375,	98.19026184082031,	'a',	8),
				c: new Node(247.9593048095703,	314.7701416015625,	'c',	8),
				b: new Node(287.1900634765625,	300.5044250488281,	'b',	8)
			};
			checkHullCycle(Object.values(nodes), [nodes.e,nodes.big,nodes.a,nodes.big,nodes.b,nodes.c,nodes.d,nodes.big]);
		});
		it('handle two-node hulls with different orders', function() {
			nodes = {
				a: new Node(331.9317932128906,	155.11814880371094,	'a',	8),
				b: new Node(311.48736572265625,	150.57579040527344,	'b',	8),
				c: new Node(471.06439208984375,	187.60104370117188,	'c',	8),
				BIGGIE: new Node(555.7636108398438,	204.9051971435547,	'BIGGIE',	40)
			};
			checkHullCycle(Object.values(nodes), [nodes.b,nodes.BIGGIE]);
		});
		it('TODO this computes the order correctly, but draws a full rotation around a.', function() {
			nodes = {
				a: new Node(357.728515625,	167.2665557861328,	'a',	8),
				b: new Node(311.48736572265625,	150.57579040527344,	'b',	8),
				c: new Node(471.06439208984375,	187.60104370117188,	'c',	8),
				BIGGIE: new Node(424.8306884765625,	157.62310791015625,	'BIGGIE',	40)
			};
			checkHullCycle(Object.values(nodes), [nodes.e,nodes.big,nodes.a,nodes.big,nodes.b,nodes.c,nodes.d,nodes.big]);
		});
	});


	describe("#angleFormedBy", function() {
		it('unit right vectors centered at origin', function() {
			assert.equal(gu.angleFormedBy([1,0],[0,0],[0,1]), 90);
			assert.equal(gu.angleFormedBy([0,1],[0,0],[1,0]), 270);
			assert.equal(gu.angleFormedBy([1,0],[0,0],[1,0]), 0);
		});

		it('non-unit right vectors centered at origin', function() {
			assert.equal(gu.angleFormedBy([1,0],[0,0],[10000,0]), 0);
			assert.equal(gu.angleFormedBy([100,100],[0,0],[1,-1]), 270);
			assert.equal(gu.angleFormedBy([100,100],[0,0],[-6,-6]), 180);
			assert.equal(gu.angleFormedBy([3,4],[0,0],[-80,60]), 90);
		});

		it('non-unit vectors not centered at origin', function() {
			assert.equal(gu.angleFormedBy([1,0],[0,0],[10000,10000]), 45);
			expect(gu.angleFormedBy([100,100],[0,0],[1,Math.sqrt(3)])).to.almost.equal(15);
			expect(gu.angleFormedBy([-1*Math.sqrt(3), 1],[0,0],[100,100])).to.almost.equal(255);
		});

	});
})
