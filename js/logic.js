window.MyLang = (function () {
	var left, right;
	var L = left = 0;
	var R = right = 1;
	
	var operators = [
		[';'],
		[','],
		[['=>', '⇒', '>', '->']],
		[['<=', '⇐', '<', '<-']],
		[['v', '+', '||', '∨']],
		[['^', '*', '&&', '&','∧']],
		[['=', '==', '<=>','<>', '⇔', '⇐⇒']],
		[['!', '¬'], R, 1]
	];
	var operators_list = [];
	operators.forEach(function (o) {
		if(o[0] instanceof Array) {
			o[0].forEach(function (d) {
				operators_list.push(d);
			})
		} else {
			operators_list.push(o[0]);
		}
	});
	operators_list.push('-');
	operators_list.push('|');
	var parser = new Parser({
		token_types: {
			parenopen: {
				match: function (x) {
					return (x.length == 1) && ('[{('.indexOf(x) !== -1);
				}
			},
			parenclose: {
				match: function (x) {
					return (x.length == 1) && (')}]'.indexOf(x) !== -1);
				}
			},
			number: {
				match: function (x) {
					return "012345689.".indexOf(x[x.length - 1]) !== -1;
				},
				parse: function (x) {
					return !!Number(x);
				}
			},
			whitespace: {
				match: function (x) {
					return x[x.length-1] === ' ';
				},
				parse: function (x) {
					return x;
				}
			},
			symbol: {
				match: function (x) {
					return /^[A-Za-z]$/.test(x[x.length-1]);
				},
				parse: function (x) {
					if(x === 'false') {
						return false;
					}
					if(x === 'true') {
						return true;
					}
				
					return x;
				}
			},
			operator: {
				match: function operator(x) {
					return operators_list.indexOf(x) !== -1;
				}
			},
			error: {
				match: function (x) {
					throw new SyntaxError("Invalid character: '" + x + "'")
				}
			}
		
		},
		operators: operators
	});
	var strop = {
		not: '¬',
		and: '∧',
		or: '∨',
		ifthen: '⇒',
		thenif: '⇐',
		xor: '⊕',
		equal: '⇔'
	};
	function AST(op, j) {
		
		j.operator = op;
		
		return j;
	}
	var op = {
		not: function (ast) {
			ast.operator = strop.not;
			if(ast[0] === true) {
				return false;
			}
			if(ast[0] === false) {
				return true;
			}
			if(ast[0].operator === strop.not) {
				return ast[0][0];
			}
			if(ast[0].operator === strop.and) {
				// !(AB) => !A + !B
				return op.or([op.not([ast[0][0]]),op.not([ast[0][1]])]);
			}
			return ast;
		},
		and: function (ast) {
			ast.operator = strop.and;
			if (ast[0] === false || ast[1] === false) {
				return false;
			}
			if(ast[0] === true) {
				return ast[1];
			}
			if(ast[1] === true) {
				return ast[0];
			}
			if (ast[0] === ast[1]) {
				return ast[0];
			}
			return ast;
		},
		equal: function (ast) {
			ast.operator = strop.equal;
			if(ast[0] === true) {
				return ast[1];
			}
			if(ast[1] === true) {
				return ast[0];
			}
			if (ast[0] === ast[1]) {
				return true;
			}
			return ast;
		},
		ifthen: function(ast) {
			ast.operator = strop.ifthen;
			if (ast[0] === false) {
				return true;
			}
			if (ast[0] === true) {
				return ast[1];
			}
			return ast;
		},
		thenif: function (ast) {
			// Fuck that:
			return op.ifthen([ast[1], ast[0]]);
		},
		or: function (ast) {
			ast.operator = strop.or;
			if(ast[0] === true || ast[1] === true) {
				return true;
			}
			if(ast[0] === false) {
				return ast[1];
			}
			if(ast[1] === false) {
				return ast[0];
			}
			if (ast[0] === ast[1]) {
				return ast[0];
			}
			return ast;
		}
		
	}
	window.op = op;
	function execute(ast) {
		if(ast instanceof Array) {
			var o = ast.operator;
			ast = ast.map(execute);
			ast.operator = o;
			switch(ast.operator) {
				case '!':
				case '¬':
					return op.not(ast);
				case '=':
				case '<=>':
				case '⇔':
				case '<>':
				case '==':
				case '⇐⇒':
					return op.equal(ast);
				case '=>':
				case '>':
				case '⇒':
				case '->':
					return op.ifthen(ast);
				case '<=':
				case '⇐':
				case '<':
				case '<-':
					return op.thenif(ast);
				case '⊕':
					ast.operator = '⊕';
					return ast;
				case '^':
				case '*':
				case '&':
				case '&&':
				case '∧':
					return op.and(ast);
				case '||':
				case '+':
				case '∨':
					return op.or(ast);
				case '⊕':
					return op.xor(ast);
			}
		}
		return ast;
	}
	function paren(h, e) {
		if(!e) {
			return h;
		}
		var sp1 = document.createElement('span');
		sp1.appendChild(document.createTextNode('('));

		var sp2 = document.createElement('span');
		
		sp2.appendChild(document.createTextNode(')'));
		var sp = document.createElement('span');
		
		sp.appendChild(sp1);
		sp.appendChild(h);
		sp.appendChild(sp2);
		return sp;
	}
	function precedence(o) {
		return parser.precedence(o);
	}
	function needparen(inner, outer, operator) {
		if(inner === outer) {
			return parser.assoc(operator)
		}
		return inner <= outer;
	}
	function html(ast) {
		if(ast instanceof Array) {
			var p = precedence(ast.operator);
			var sp = document.createElement('span');
			if(ast.length === 2) {
				var a = html(ast[0]);
				a = paren(a, needparen(a.p, p, ast.operator));
				sp.appendChild(a);
				
				if(ast.operator !== '∧') {
					var op = document.createElement('span');
					op.className = 'operator';
					op.appendChild(document.createTextNode(ast.operator));
					if(ast.operator === '∨' || ast.operator === '∧') {
						op.classList.add('small');
					}
					
					sp.appendChild(op);
				} else {

					var op = document.createElement('span');
					op.appendChild(document.createTextNode(' '));
					op.style.fontSize = '6px';
					
					sp.appendChild(op);
					
				}
				var b = html(ast[1]);
				b = paren(b, needparen(b.p, p, ast.operator));
				sp.appendChild(b);
			} else {

				var op = document.createElement('span');
				op.className = 'operator';
				op.appendChild(document.createTextNode(ast.operator));
				if(ast.operator === '∨' || ast.operator === '∧') {
					op.classList.add('small');
				}
				sp.appendChild(op);
				
				var a = html(ast[0]);
				a = paren(a, needparen(a.p, p, ast.operator));
				sp.appendChild(a);
			}
			sp.p = p;
			return sp;
		}
		var d = document.createElement('span');
		if(typeof ast === 'boolean') {
			d.style.color = ast ? '#0c0' : '#c00';
			d.appendChild(document.createTextNode(ast.toString()));
		} else {
			d.className = 'varname';
			if(ast === 'A' || ast === 'B' || ast === 'C') {
				d.classList.add(ast);
			}
			d.appendChild(document.createTextNode(ast));
			d.p = Infinity;
			
		}
		return d;
	}
	var compiler = new Compiler();
	var ML = {
		execute: function (str) {
			if(typeof str === 'string') {
				str = parser(str);
			}
			return execute(str);
		},
		compile: function (str) {
			return parser(str);
		},
		HTML: function (ast) {
			return html(ast);
		},
		sop: strop
	};
	
	return ML;
}());