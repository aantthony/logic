(function () {
	HTMLElement.prototype.bind = function (events) {
		var i;
		for(i in events) {
			if (events.hasOwnProperty(i)) {
				this.addEventListener(i, events[i]);
			}
		}
		return this;
	};

	function EditableElement(input, value) {
		this.input = input;
		var cursor = this.cursor = document.createElement('span');
		cursor.className = 'cursor';
		this.value = '';
		var self = this;
		this.blinkTimer;
		input.bind({
			keydown: function (e) {
				self.keydown(e);
			},
			keyup: function (e) {
				self.keyup(e);
			},
			focus: function (e) {
				self.resetBlinkTimer();
			},
			blur: function (e) {
				clearInterval(this.blinkTimer);
				this.blinkTimer = false;
			}
		});
		this.text(value || '');
		window.c = cursor;
	}
	EditableElement.prototype.text = function (value) {
		var input = this.input;
		if(value === undefined) {
			var node = input.firstChild;
			var str = '';
			do{
				if(node === this.cursor) {
					continue;
				}
				str += node.nodeValue;
			} while(node = node.nextSibling);
			return str;
		}
		while(input.firstChild) {
			input.removeChild(input.firstChild);
		}
		(value || '').split('').forEach(function (s) {
			input.appendChild(document.createTextNode(s));
		});
		input.appendChild(this.cursor);
		
	};
	window.EditableElement = EditableElement;
	EditableElement.prototype.resetBlinkTimer = function () {
		var self = this;
		this.blinkTicks = 0;
		if(this.blinkTimer) {
			clearInterval(this.blinkTimer);
		}
		self.cursor.style.visibility = '';
		this.blinkTimer = setInterval(function () {
			self.cursor.style.visibility = self.blinkTicks % 2 ? '' : 'hidden';
			self.blinkTicks++;
		}, 500);
		
	};
	function StringForKeyIdentifier(e){
		return JSON.parse("\"\\u" + e.keyIdentifier.substring(2) + "\"")
	}
	EditableElement.prototype.keydown = function (e) {
		if(e.metaKey) {
			var str = StringForKeyIdentifier(e);
			switch(str) {
				case 'A':
					e.preventDefault();
					return false;
				default:
			}
			return;
		}
		switch(e.keyIdentifier) {
			case 'U+0008':
				// backspace
				var prev;

				if(prev = this.cursor.previousSibling) {
					this.input.removeChild(prev);
				}
				
				this.resetBlinkTimer();
				e.preventDefault();
				return false;
			case 'Shift':
			case 'Enter':
				return;
			case 'Left':
				var prev;
				if(prev = this.cursor.previousSibling) {
					this.input.removeChild(this.cursor);
					this.input.insertBefore(this.cursor, prev);
				}
				this.resetBlinkTimer();
				return;
			case 'Right':
				var next;
				if(next = this.cursor.nextSibling) {
					this.input.removeChild(this.cursor);
					this.input.insertBefore(this.cursor, next.nextSibling);
				}
				this.resetBlinkTimer();
				return;
			case 'CapsLock':
			default:
		}
		var str = StringForKeyIdentifier(e);
		if(!e.shiftKey) {
			str = str.toLowerCase();
		}

		this.input.insertBefore(document.createTextNode(str), this.cursor);
		
	};
	EditableElement.prototype.keyup = function (e) {
		
	};
	EditableElement.prototype.update = function () {
		inp.innerHTML = generate(inp.innerText);
		if(inp.nodeType === 3) {
			
			return;
		}
		var node = inp.firstChild;
		while(node = node.firstSibling) {
			handleChanges(node);
		}
		
	};
	
	
}());