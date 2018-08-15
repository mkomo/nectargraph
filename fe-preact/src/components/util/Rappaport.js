// * Given the directed lines L1 and L2, the function alpha(L1, L2) returns the positive
// angle swept clockwise from L1, to L2.
function alpha(l1,l2) {

}

// * Given a disc s in CH(P), the function succ(s) denotes the successor of s in
// CH(P). If Hull(P) is a single disc p then CH(P) =p, and succ(p) returns p
// always.
function succ(p) {

}

// * Given parallel supporting lines of P and Q, respectively denoted by L1 and L2,
// the function dom(L1, L2) returns true if H(L2) is a proper subset of H(L1).
function dom(l1, l2) {

}

// * Given a list P and an element p, the function Add(P, p) returns P if p is
// currently the last item in P, otherwise it inserts p at the end of P and then returns
// P.
function add(P, p) {
	
}


// Algorithm Hull
// 1. Split S arbitrarily into two disjoint subsets of discs, P and Q, such that IPI
// and 1Q 1 differ by at most one.
// 2. Recursively find CH(P) and CH(Q).
// 3. Use algorithm merge to merge CH(P) and CL-L(Q) resulting in CH(S).
function hull(S) {

}


// Algorithm Merge
// Input: CH(P) and CH(Q).
// Output: CH(S) = CH(P U Q)
// {Initialization}
// Let L, and L, denote lines supporting P and Q respectively, and tangent to the
// sites p E P and q E Q such that both Lp and L, are parallel to a given line L*.
// Initialize CH(S) empty.
// {We make use of a procedure Advance to advance to the next arc in either
// CH(P) or CL?(Q).}
// repeat
// if dom(L,, L4) then Add(CH(S), p); Advance(L*, p, q);
// else {dom(L,, L,)} Add(CH(S), q); Advance(L*, q, p);
// L, +line parallel to L* and tangent to P at p ;
// L, +line parallel to L* and tangent to Q at q ;
// until every arc in CH(P) and CH(Q) has been visited.
// procedure Advance (L*, x, y );
// {Find common lines of support and advance on the minimum angle.}
// {We test for edges that bridge the two hulls, that is, edges of the form t(x, y) and
// f(Y, x). >
// {If L(x, y) does not exist then a(L*, L(x, y)) is undefined.}
// a, + a(L*, L(x, y)); u2 + Lu(L*, L(x, succ(x)));
// a3+ GJ*, L(Y, succ(y))); a4+ a(L*, L(Y, x));
// if al = min(a,, a2, u3) then Add(CH(S), y); {t(x, y) is a bridge}
// if u4 = min(u,, u2, u3) then Add(CH(S), x); {and t(y, x) is a bridge too}
// if u2 < u3 then L* + L(x, succ(x)); x ~succ(x);
// else {a3 <a*} L* * L(y, succ(y)); y +succ(y);
