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
		var textarea = this.textarea = document.createElement('textarea');

		var textareaDiv = this.textareaDiv = document.createElement('div');
		textareaDiv.className = 'textarea';
		textareaDiv.appendChild(textarea);
		//this.input.parentNode.appendChild(textareaDiv);
		document.body.appendChild(textareaDiv);
		cursor.className = 'cursor';
		this.value = '';
		var self = this;
		this.blinkTimer;
		textarea.bind({
			keydown: function (e) {
				self.keydown(e);
			},
			keyup: function (e) {
				self.keyup(e);
			},
			focus: function (e) {
				input.classList.add('focus');
				self.resetBlinkTimer();
			},
			blur: function (e) {
				input.classList.remove('focus');
				self.cursor.style.visibility = 'none';
				
				clearInterval(self.blinkTimer);
				self.blinkTimer = false;
			}
		});
		window.t = self.textarea;
		input.bind({
			mousedown: function (e) {
				self.textarea.focus();
			},
			focus: function (e) {
				self.textarea.focus();
				
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
	var iOS = /iP(hone|ad)/.test(navigator.userAgent);
	function StringForKeyIdentifier(e, t){
		if(e.keyIdentifier) {
			switch(e.keyIdentifier) {
				case "U+003D":
				return MyLang.sop.equal;
				case "U+002B":
				return MyLang.sop.or;
				case "U+002A":
				return MyLang.sop.and;
				case "U+005E":
				return MyLang.sop.xor;
				case "U+0028":
				return '(';
				case "U+0029":
				return ')';
				case "U+007B":
				return '{';
				case "U+007D":
				return '}';
				case "U+007C":
				return MyLang.sop.or;
				case "U+003C":
				return MyLang.sop.thenif;
				case "U+003E":
				return MyLang.sop.ifthen;
				case "U+002E":
				return MyLang.sop.and;
				case "U+0021":
				return MyLang.sop.not;
				case "U+0027":
				return "'";
				case "U+0022":
				return '"';
				case "U+002C":
				return MyLang.sop.or;
			}
		}
		switch(e.keyCode) {
			case 84:
				return 'true';
			case 70:
				return 'false';
			case 107:
			case 187:
				return e.shiftKey ? MyLang.sop.or : MyLang.sop.equal;
			case 61: 
				return MyLang.sop.equal;
			case 49:
				return e.shiftKey ? MyLang.sop.not : '1';
			case 54:
				return e.shiftKey ? MyLang.sop.and : '6';
			case 55:
				return e.shiftKey ? MyLang.sop.and : '7';
			case 56:
				return e.shiftKey ? MyLang.sop.and : '8';
			case 57:
				return e.shiftKey ? '(' : '9';
			case 48:
				return e.shiftKey ? ')' : '0';
			case 219:
				return e.shiftKey ? '{' : '[';
			case 221:
				return e.shiftKey ? '}' : ']';
			case 109:
			case 189:
				return '-';
			case 220:
				return e.shiftKey ? MyLang.sop.or : (MyLang.sop.and + MyLang.sop.not)/* '\\'*/;
			case 191:
				return e.shiftKey ? '?' : '/';
			case 188:
				return e.shiftKey ? MyLang.sop.thenif : ',';
			case 190:
				return e.shiftKey ? MyLang.sop.ifthen : '.';
				
		}

		if(iOS) {
			return String.fromCharCode(e.keyCode).toUpperCase();
		}
		
		return String.fromCharCode(e.keyCode);
		return JSON.parse("\"\\u" + e.keyIdentifier.substring(2) + "\"");
	}
	var firefoxIsShitAndItJustGaveZero = false;
	var firefox = /Firefox/.test(navigator.userAgent);
	EditableElement.prototype.keydown = function (e) {
		if(firefox && e.which === 0) {
			this.textarea.value = '';
			firefoxIsShitAndItJustGaveZero = true;
			return;
		}
		if(e.metaKey) {
			var str = StringForKeyIdentifier(e, this.textarea);
			switch(str) {
				case 'A':
					e.preventDefault();
					return false;
				default:
			}
			return;
		}
		switch(e.which) {
			case 8:
				// backspace
				var prev;

				if(prev = this.cursor.previousSibling) {
					this.input.removeChild(prev);
				}
				
				this.resetBlinkTimer();
				e.preventDefault();
				return false;
			case 16:
				return;
			case 13:
				if(this.onenter) {
					this.onenter(e);
				}
				return;
			case 37:
			case 'Left':
				var prev;
				if(prev = this.cursor.previousSibling) {
					this.input.removeChild(this.cursor);
					this.input.insertBefore(this.cursor, prev);
				}
				this.resetBlinkTimer();
				return;
			case 39:
			case 'Right':
				var next;
				if(next = this.cursor.nextSibling) {
					this.input.removeChild(this.cursor);
					this.input.insertBefore(this.cursor, next.nextSibling);
				}
				this.resetBlinkTimer();
				return;
			case 20:
			case 'CapsLock':
			default:
		}
		var str = StringForKeyIdentifier(e, this.textarea);
		if(!e.shiftKey && !iOS) {
			str = str.toLowerCase();
		}

		this.input.insertBefore(document.createTextNode(str), this.cursor);
	};
	EditableElement.prototype.keyup = function (e) {
		if(firefoxIsShitAndItJustGaveZero) {
			firefoxIsShitAndItJustGaveZero = false;
			var s = this.textarea.value;
			switch(s) {
				case '<':
				return this.keydown({keyIdentifier: "U+003C"});
				case '>':
				return this.keydown({keyIdentifier: "U+003E"});
			}
		}
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