// Enable add/removeEventListener if it is not present (retrieved from https://developer.mozilla.org/en-US/docs/DOM/element.removeEventListener)
if (!Element.prototype.addEventListener) {
	var oListeners = {};
	function runListeners(oEvent) {
		if (!oEvent) { oEvent = window.event; }
		for (var iLstId = 0, iElId = 0, oEvtListeners = oListeners[oEvent.type]; iElId < oEvtListeners.aEls.length; iElId++) {
			if (oEvtListeners.aEls[iElId] === this) {
				for (iLstId; iLstId < oEvtListeners.aEvts[iElId].length; iLstId++) { oEvtListeners.aEvts[iElId][iLstId].call(this, oEvent); }
					break;
			}
		}
	}
	Element.prototype.addEventListener = function (sEventType, fListener /*, useCapture (will be ignored!) */) {
		if (oListeners.hasOwnProperty(sEventType)) {
			var oEvtListeners = oListeners[sEventType];
			for (var nElIdx = -1, iElId = 0; iElId < oEvtListeners.aEls.length; iElId++) {
				if (oEvtListeners.aEls[iElId] === this) { nElIdx = iElId; break; }
			}
			if (nElIdx === -1) {
				oEvtListeners.aEls.push(this);
				oEvtListeners.aEvts.push([fListener]);
				this["on" + sEventType] = runListeners;
			} else {
				var aElListeners = oEvtListeners.aEvts[nElIdx];
				if (this["on" + sEventType] !== runListeners) {
					aElListeners.splice(0);
					this["on" + sEventType] = runListeners;
				}
				for (var iLstId = 0; iLstId < aElListeners.length; iLstId++) {
					if (aElListeners[iLstId] === fListener) { return; }
				}
				aElListeners.push(fListener);
			}
		} else {
			oListeners[sEventType] = { aEls: [this], aEvts: [ [fListener] ] };
			this["on" + sEventType] = runListeners;
		}
	};
	Element.prototype.removeEventListener = function (sEventType, fListener /*, useCapture (will be ignored!) */) {
		if (!oListeners.hasOwnProperty(sEventType)) { return; }
		var oEvtListeners = oListeners[sEventType];
		for (var nElIdx = -1, iElId = 0; iElId < oEvtListeners.aEls.length; iElId++) {
			if (oEvtListeners.aEls[iElId] === this) { nElIdx = iElId; break; }
		}
		if (nElIdx === -1) { return; }
		for (var iLstId = 0, aElListeners = oEvtListeners.aEvts[nElIdx]; iLstId < aElListeners.length; iLstId++) {
			if (aElListeners[iLstId] === fListener) { aElListeners.splice(iLstId, 1); }
		}
	};
}

tabIndent = {
	version: '0.1.6',
	config: {
		tab: '    ',
		images: '../images/'
	},
	events: {
		keydown: function(e) {
			var tab = tabIndent.config.tab;
			var tabWidth = tab.length;
			if (e.keyCode === 9) {
				e.preventDefault();
				var	currentStart = this.selectionStart,
					currentEnd = this.selectionEnd;
				if (e.shiftKey === false) {
					// Normal Tab Behaviour
					if (!tabIndent.isMultiLine(this)) {
						// Add tab before selection, maintain highlighted text selection
						this.value = this.value.slice(0, currentStart) + tab + this.value.slice(currentStart);
						this.selectionStart = currentStart + tabWidth;
						this.selectionEnd = currentEnd + tabWidth;
					} else {
						// Iterating through the startIndices, if the index falls within selectionStart and selectionEnd, indent it there.
						var	startIndices = tabIndent.findStartIndices(this),
							l = startIndices.length,
							newStart = undefined,
							newEnd = undefined,
							affectedRows = 0;

						while(l--) {
							var lowerBound = startIndices[l];
							if (startIndices[l+1] && currentStart != startIndices[l+1]) lowerBound = startIndices[l+1];

							if (lowerBound >= currentStart && startIndices[l] < currentEnd) {
								this.value = this.value.slice(0, startIndices[l]) + tab + this.value.slice(startIndices[l]);

								newStart = startIndices[l];
								if (!newEnd) newEnd = (startIndices[l+1] ? startIndices[l+1] - 1 : 'end');
								affectedRows++;
							}
						}

						this.selectionStart = newStart;
						this.selectionEnd = (newEnd !== 'end' ? newEnd + (tabWidth * affectedRows) : this.value.length);
					}
				} else {
					// Shift-Tab Behaviour
					if (!tabIndent.isMultiLine(this)) {
						if (this.value.substr(currentStart - tabWidth, tabWidth) == tab) {
							// If there's a tab before the selectionStart, remove it
							this.value = this.value.substr(0, currentStart - tabWidth) + this.value.substr(currentStart);
							this.selectionStart = currentStart - tabWidth;
							this.selectionEnd = currentEnd - tabWidth;
						} else if (this.value.substr(currentStart - 1, 1) == "\n" && this.value.substr(currentStart, tabWidth) == tab) {
							// However, if the selection is at the start of the line, and the first character is a tab, remove it
							this.value = this.value.substring(0, currentStart) + this.value.substr(currentStart + tabWidth);
							this.selectionStart = currentStart;
							this.selectionEnd = currentEnd - tabWidth;
						}
					} else {
						// Iterating through the startIndices, if the index falls within selectionStart and selectionEnd, remove an indent from that row
						var	startIndices = tabIndent.findStartIndices(this),
							l = startIndices.length,
							newStart = undefined,
							newEnd = undefined,
							affectedRows = 0;

						while(l--) {
							var lowerBound = startIndices[l];
							if (startIndices[l+1] && currentStart != startIndices[l+1]) lowerBound = startIndices[l+1];

							if (lowerBound >= currentStart && startIndices[l] < currentEnd) {
								if (this.value.substr(startIndices[l], tabWidth) == tab) {
									// Remove a tab
									this.value = this.value.slice(0, startIndices[l]) + this.value.slice(startIndices[l] + tabWidth);
									affectedRows++;
								} else {}	// Do nothing

								newStart = startIndices[l];
								if (!newEnd) newEnd = (startIndices[l+1] ? startIndices[l+1] - 1 : 'end');
							}
						}

						this.selectionStart = newStart;
						this.selectionEnd = (newEnd !== 'end' ? newEnd - (affectedRows * tabWidth) : this.value.length);
					}
				}
			} else if (e.keyCode == 27) {
				tabIndent.events.disable(e);
			}
		},
		disable: function(e) {
			var events = this;

			// Temporarily suspend the main tabIndent event
			tabIndent.remove(e.target);

			// ... but re-add it upon re-focus
			tabIndent.render(e.target);
		}
	},
    focusEvent: function () {
        tabIndent.el.addEventListener('keydown', tabIndent.events.keydown);
        if (!$(tabIndent.el).hasClass('tabIndent')) {
          $(tabIndent.el).addClass('tabIndent');
        }
        tabIndent.el.removeEventListener('focus', tabIndent.focusEvent);
    },
	render: function(el) {
		var self = this;
        tabIndent.el = el;

		if (el.nodeName === 'TEXTAREA') {
            el.addEventListener('focus', tabIndent.focusEvent);
			el.addEventListener('blur', function b(e) {
				self.events.disable(e);
                el.removeEventListener('keydown', self.events.keydown);
                el.addEventListener('focus', tabIndent.focusEvent);
			});
		}
	},
	remove: function(el) {
        tabIndent.el = el;
		if (el.nodeName === 'TEXTAREA') {
			el.removeEventListener('keydown', this.events.keydown);
            el.removeEventListener('focus', tabIndent.focusEvent);

            if ($(el).hasClass('tabIndent')) {
              $(el).removeClass('tabIndent');
            }
		}
	},
	isMultiLine: function(el) {
		// Extract the selection
		var	snippet = el.value.slice(el.selectionStart, el.selectionEnd),
			nlRegex = new RegExp(/\n/);

		if (nlRegex.test(snippet)) return true;
		else return false;
	},
	findStartIndices: function(el) {
		var	text = el.value,
			startIndices = [],
			offset = 0;

		while(text.match(/\n/) && text.match(/\n/).length > 0) {
			offset = (startIndices.length > 0 ? startIndices[startIndices.length - 1] : 0);
			var lineEnd = text.search("\n");
			startIndices.push(lineEnd + offset + 1);
			text = text.substring(lineEnd + 1);
		}
		startIndices.unshift(0);

		return startIndices;
	}
}
