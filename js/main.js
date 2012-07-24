(function () {
	

	function $$() {
		return document.querySelectorAll.apply(document, arguments);
	}
	function findvars(vars, m) {
		if(m instanceof Array) {
			m.forEach(function (e) {
				findvars(vars, e);
			})
			return;
		}
		if(typeof m === 'string') {
			vars[m] = true;
		}
	}
	function variableNames(m) {
		var vars = {};
		findvars(vars, m);
		return Object.keys(vars);
	}
	function sub(m, x, v) {
		if(m instanceof Array) {
			var t = m.operator;
			var n = m.map(function (e) {
				return sub(e, x, v);
			});
			n.operator = t;
			return n;
		}
		if(typeof m === 'string') {
			return m === x ? v : m;
		}
		return m;
	}
	function c_s(m) {
		if(m instanceof Array) {
			if(m.length === 1) {
				return '!'  + c_s(m[0]);
			}
			var o = '';
			switch(m.operator) {
				case MyLang.sop.and:
					o = '&&';
					break;
				case MyLang.sop.or:
					o = '||';
					break;
				case MyLang.sop.ifthen:
					return '(!(' + c_s(m[0]) + ') || (' + c_s(m[1]) + '))';
				case MyLang.sop.xor:
					o = '^';
					break;
			}
			return '(' + c_s(m[0]) + o + c_s(m[1]) + ')';
		}
		
		return m.toString();
	}
	function compile(args, m) {
		return Function(args, 'return ' + c_s(m));
	}
	function TruthTable(tt) {
		var n = tt.n;
		var table = document.createElement('table');
		var tr = document.createElement('tr');
		var i;
		for(i = 0; i < n; i++) {
			var th = document.createElement('th');
			th.appendChild(document.createTextNode(tt.vars[i]))
			tr.appendChild(th);
		}
		
		var th = document.createElement('th');
		th.appendChild(document.createTextNode('•'));
		th.style.color = '#555';
		tr.appendChild(th);
		
		table.appendChild(tr);
		for(i = 0; i < tt.length; i++) {
			var row = tt[i];
			var c;
			var tr = document.createElement('tr');
			for(c = 0; c < row.length; c++) {
				var td = document.createElement('td');
				td.appendChild(document.createTextNode(row[c] ? '1' : '0'));
				td.className = row[c] ? 'true' : 'false';
				if(c === row.length - 1) {
					td.classList.add('value');
				}
				tr.appendChild(td);
			}
			table.appendChild(tr);
		}
		var container = document.createElement('div');
		container.className = 'table container';
		container.appendChild(table);
		return container;
	}
	function HistoryElement(o) {
		//<div class="item"><span class="cursor">></span><div class="query">3+2</div><div class="result">5</div></div>
		var d = document.createElement('div');
		d.className = 'item';
		var s = document.createElement('span');
		s.className = 'cursor';
		var q = document.createElement('div');
		q.className = 'query';
		var r = document.createElement('div');
		r.className = 'result';
		s.appendChild(document.createTextNode('>'));
		q.appendChild(document.createTextNode(o.query));
		if(o.error) {
			r.appendChild(document.createTextNode(o.error));
			r.classList.add('error');
		} else {
			r.appendChild(o.result);
		}
		d.appendChild(s);
		d.appendChild(q);
		d.appendChild(r);
		if(o.math && o.math !== true) {
			var vars = variableNames(o.math);
			if(vars.length === 0) {
				return d;
			}
			//var j = sub(o.math, 'A', true);
			//var res = MyLang.execute(j);
			
			var f = compile(vars.join(','), o.math);
			var n = [];
			var vl = vars.length;
			var tt = [];
			var i;
			for(i = 0; i < vl; i++) {
				n[i] = 1 << i;
			}
			var l = 1 << vl;
			tt.n = vl;
			tt.vars = vars;
			for(i = 0; i < l; i++) {
				var b;
				var current = [];
				for(b = 0; b < vl; b++) {
					current[b] = !!(i & n[b]);
				}
				var result = f.apply(this, current);
				var ttr = [];
				current.forEach(function (p) {
					ttr.push(p);
				});
				ttr.push(result);
				tt.push(ttr);
			}
			var created = false;
			var visible = false;
			var tH = {};
			var padding = 8;
			d.addEventListener('click', function () {
				if(created === false) {
					created = TruthTable(tt);
					d.appendChild(created);
					visible = true;
					setTimeout(function () {
						var crect = created.firstChild.getBoundingClientRect();
						tH.max = (crect.height + padding) + 'px';;
						created.style.height = tH.max;
					}, 0);
					return;
				}
				if (visible) {
					created.style.height = 0 + 'px';
				} else {
					created.style.height = tH.max;
				}
				visible = !visible;
			})
		}
		return d;
	}
	var history = $$('#history')[0];
	var inputbox = $$('.inputbox')[0];
	var j = new EditableElement(inputbox, '');
	inputbox.addEventListener('keydown', function (e) {
		if(e.keyIdentifier === 'Enter') {
			var text = j.text();
			if(text === '__fs__') {
				$$('#main')[0].webkitRequestFullScreen();
				return;
			}
			if(text === '') {
				return;
			}
			j.text('');
			var h;
			try {

				var res = MyLang.execute(text);
				h = new HistoryElement({
					query: text,
					result: MyLang.HTML(res),
					math: res
				});
				
			} catch(ex) {
				console.error(ex);
				h = new HistoryElement({
					query: text,
					error: ex.message
				});
				
			}
			
			
			history.appendChild(h);
			document.body.scrollTop = document.body.scrollHeight;
		}
	});
	$$('.item.current')[0].addEventListener('click', function () {
		inputbox.focus();
		
	});
	document.body.addEventListener('click', function (e) {
		if(e.target === document.body) {
			inputbox.focus();
		}
	});
	inputbox.focus();
	
	
}());