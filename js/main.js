(function () {
	

	function $$() {
		return document.querySelectorAll.apply(document, arguments);
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
		return d;
	}
	var history = $$('#history')[0];
	var inputbox = $$('.inputbox')[0];
	var j = new EditableElement(inputbox, '');
	inputbox.addEventListener('keydown', function (e) {
		if(e.keyIdentifier === 'Enter') {
			var text = j.text();
			if(text === '') {
				return;
			}
			j.text('');
			var h;
			try {

				var res = MyLang.execute(text);
			
				h = new HistoryElement({
					query: text,
					result: MyLang.HTML(res)
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
	inputbox.addEventListener('blur', function () {

		inputbox.focus();
		
	});

	inputbox.focus();
	
	
}());