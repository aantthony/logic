window.Parser = (function () {
	function Tokenizer(options) {
			
		var token_types = options;
		var default_operator = 'default';
		var match = Object.keys(options).map(function (n) {
			return options[n].match;
		});
		
		return function (s) {
			var tokens = [];

			var last_token_type = token_types.parenopen;
			
			function next_token(obj) {
				tokens.push(obj);
			}
			function next_raw_token(str, t) {
			    next_token({v: str, t: t});
			    last_token_type = t;
			}
			var i = 0;
			var l = s.length;
			var current_token = s[0];
			var t;
			var ml = match.length;
			// 8 : Object.keys(token_types).count + 1
			for (t = 0; t < ml; t++) {
				if (match[t](current_token)) {
					break;
				}
			}
	        for (i = 1; i < l; i++) {
	            var ds = s[i];
	            var cds = current_token + ds;
	            if (match[t](cds)) {
	                current_token = cds;
	            } else {
	                var nt;
	                for (nt = 0; nt < ml; nt++) {
	                    if (match[nt](ds)) {
	                        break;
	                    }
	                }
	                next_raw_token(current_token, t);
	                t = nt;
	                current_token = ds;
	            }
	        }
	        next_raw_token(current_token, t);
			return tokens;
		};
	}
	
	
	function Parser(options) {
		

		var tokenizer = new Tokenizer(options.token_types);
	
		var operators = {};
		var op_precedence = 0;
	
		var left, right;
		var R = right = true;
		var L = left = !right;
	
		this.operators = operators;// todo: hack
	
		function op(v, assoc,arg_c) {
			//Register an operator
			var memsave = [!!assoc, op_precedence++, arg_c];
			if (typeof v === 'object') {
				for (var i=0; i<v.length; i++) {
					operators[v[i]] = memsave;
				}
			} else {
				operators[v] = memsave;
			}
		}
		options.operators.forEach(function(o) {
			op(o[0], o[1] || L, (o[2] === undefined) ? 2 : o[2]);
		});
		window.o = operators;
		
		var token_types = {};
		var keys = Object.keys(options.token_types);
		token_types.parenopen = keys.indexOf('parenopen');
		token_types.parenclose = keys.indexOf('parenclose');
		token_types.operator = keys.indexOf('operator');
		token_types.whitespace = keys.indexOf('whitespace');
		
		var parse = Object.keys(options.token_types).map(function (n) {
			return options.token_types[n].parse;
		});
		
		
		var func =  function (str) {
			var tokens = tokenizer(str);
			var stack = [];
			var rpn_stack = [];
		
			//The evelauation part of the shunting yard algorithm.
			function next_rpn(token) {
				// While there are input tokens left
				// Read the next token from input.
				// If the token is a value
				if (token.t !== token_types.operator) {
					// Push it onto the stack.
					rpn_stack.push(token.v);
				}
				// Otherwise,
				else {
					//the token is an operator (operator here includes both operators, and functions).
					// It is known a priori that the operator takes n arguments.
					var n = operators[token.v][2];
					// If there are fewer than n values on the stack
					if (rpn_stack.length < n) {
						// (Error) The user has not input sufficient values in the expression.
						throw (new SyntaxError('The \'' + token.v + '\' operator requires exactly ' + n + ' operands, whereas only ' + rpn_stack.length + ' ' + (rpn_stack.length === 1 ? 'was ': 'were ') + 'supplied'));
						// Else,
					} else {
						// Pop the top n values from the stack.
						var spliced = rpn_stack.splice( - n, n);
						//var values = ExpressionWithArray(spliced, token.v);
						// TODO: check non-binary operators
						// var values = spliced[0].apply(token.v, spliced.slice(1)[0]);
						var j = spliced.splice(1)[0];
						var values;
						if(j === undefined) {
							values = [spliced[0]];
						} else {
							values = [spliced[0], j];
						}
						values.operator = token.v;
						//var values = spliced[0][token.v](spliced.splice(1)[0]);
						// Evaluate the operator, with the values as arguments.
						//var evaled=(' ('+values[0]+token.v+values[1]+')');
						// Push the returned results, if any, back onto the stack.
						rpn_stack.push(values);
					}
				}
			}
			
			function next_token(token) {
				if (token.t === token_types.whitespace) {
					return;
				}
				//Comments from http://en.wikipedia.org/wiki/Shunting-yard_algorithm
				// Read a token.
				// If the token is a number, then add it to the output queue.
				if (token.t !== token_types.parenopen && token.t !== token_types.parenclose && token.t !== token_types.operator) {
					token.v = parse[token.t](token.v);
					next_rpn(token);
				}
				// If the token is an operator
				if (token.t === token_types.operator) {
					//, o1, then:
					var o1 = token;
					var o1precedence = operators[o1.v][1];
					//var o1associative=associativity(o1.v);
					var o1associative = operators[o1.v][0];
					// ('o2 ' is assumed to exist)
					var o2;
					// while
					while (
					//there is an operator token, o2, at the top of the stack
					(stack.length && (o2 = stack[stack.length - 1]).t === token_types.operator)
					//and
					&&
					// either
					(
					//o1 is left-associative and its precedence is less than or equal to that of o2,
					(o1associative == left && o1precedence <= operators[o2.v][1])
					//or
					||
					//o1 is right-associative and its precedence is less than that of o2
					(o1associative != left && o1precedence < operators[o2.v][1])

					)

					) {
						// pop o2 off the stack, onto the output queue;
						next_rpn(stack.pop());
					}

					// push o1 onto the stack.
					stack.push(o1);
				}
				// If the token is a left parenthesis,
				if (token.t === token_types.parenopen) {
					//then push it onto the stack.
					stack.push(token);
				}
				// If the token is a right parenthesis:
				if (token.t === token_types.parenclose) {
					// Until the token at the top of the stack is a left parenthesis,
					while ((!stack.length && (function () {throw (new SyntaxError('There are mismatched parentheses.'));;}())) || (stack[stack.length - 1].t !== token_types.parenopen)) {
						// If the stack runs out without finding a left parenthesis, then
						
						// pop operators off the stack onto the output queue.
						next_rpn(stack.pop());
					}

					// Pop the left parenthesis from the stack, but not onto the output queue.
					if (stack.pop().t !== token_types.parenopen) {
						throw (new Error('Pop the left parenthesis from the stack: Not found ! '))
					}
				}
			}
			tokens.forEach(function (x) {
				next_token(x);
			})
			//Shunting yard algorithm:
			// (The final part that does not read tokens)
			// When there are no more tokens to read:
			// While there are still operator tokens in the stack:
			while (stack.length) {
				var the_operator;
				// If the operator token on the top of the stack is a parenthesis, then
				var t__ = (the_operator = stack.pop()).t;
				if ((t__ === token_types.parenopen) || (t__ === token_types.parenclose)) {
					//there are mismatched parentheses.
					throw (new SyntaxError('Unexpected EOF'));
				}
				//Pop the operator onto the output queue.
				next_rpn(the_operator);
			}
			if (rpn_stack.length !== 1) {
				throw(new Error('Stack not the right size!'));
			}

			return rpn_stack[0];
		
			
		};

		func.precedence = function (o) {
			return operators[o][1];
		};

		func.assoc = function(o) {
			return operators[o][1] === true;
		};
		
		return func;
		
	}
	return Parser;
}());