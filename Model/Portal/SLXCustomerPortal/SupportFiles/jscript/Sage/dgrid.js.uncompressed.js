//>>built
require({cache:{
'dgrid/Selection':function(){
define("dgrid/Selection", ["dojo/_base/kernel", "dojo/_base/declare", "dojo/_base/Deferred", "dojo/on", "dojo/has", "dojo/aspect", "./List", "dojo/has!touch?./util/touch", "put-selector/put", "dojo/query", "dojo/_base/sniff"],
function(kernel, declare, Deferred, on, has, aspect, List, touchUtil, put){

has.add("dom-comparedocumentposition", function(global, doc, element){
	return !!element.compareDocumentPosition;
});

has.add("pointer", function(global, doc, element){
	return "onpointerdown" in element ? "pointer" :
		"onmspointerdown" in element ? "MSPointer" : false;
});

// Add feature test for user-select CSS property for optionally disabling
// text selection.
// (Can't use dom.setSelectable prior to 1.8.2 because of bad sniffs, see #15990)
has.add("css-user-select", function(global, doc, element){
	var style = element.style,
		prefixes = ["Khtml", "O", "ms", "Moz", "Webkit"],
		i = prefixes.length,
		name = "userSelect";

	// Iterate prefixes from most to least likely
	do{
		if(typeof style[name] !== "undefined"){
			// Supported; return property name
			return name;
		}
	}while(i-- && (name = prefixes[i] + "UserSelect"));

	// Not supported if we didn't return before now
	return false;
});

// Also add a feature test for the onselectstart event, which offers a more
// graceful fallback solution than node.unselectable.
has.add("dom-selectstart", typeof document.onselectstart !== "undefined");

var ctrlEquiv = has("mac") ? "metaKey" : "ctrlKey",
	hasUserSelect = has("css-user-select"),
	hasPointer = has("pointer"),
	hasMSPointer = hasPointer && hasPointer.slice(0, 2) === "MS",
	downType = hasPointer ? hasPointer + (hasMSPointer ? "Down" : "down") : "mousedown",
	upType = hasPointer ? hasPointer + (hasMSPointer ? "Up" : "up") : "mouseup";

function makeUnselectable(node, unselectable){
	// Utility function used in fallback path for recursively setting unselectable
	var value = node.unselectable = unselectable ? "on" : "",
		elements = node.getElementsByTagName("*"),
		i = elements.length;
	
	while(--i){
		if(elements[i].tagName === "INPUT" || elements[i].tagName === "TEXTAREA"){
			continue; // Don't prevent text selection in text input fields.
		}
		elements[i].unselectable = value;
	}
}

function setSelectable(grid, selectable){
	// Alternative version of dojo/dom.setSelectable based on feature detection.
	
	// For FF < 21, use -moz-none, which will respect -moz-user-select: text on
	// child elements (e.g. form inputs).  In FF 21, none behaves the same.
	// See https://developer.mozilla.org/en-US/docs/CSS/user-select
	var node = grid.bodyNode,
		value = selectable ? "text" : has("ff") < 21 ? "-moz-none" : "none";
	
	// In IE10+, -ms-user-select: none will block selection from starting within the
	// element, but will not block an existing selection from entering the element.
	// When using a modifier key, IE will select text inside of the element as well
	// as outside of the element, because it thinks the selection started outside.
	// Therefore, fall back to other means of blocking selection for IE10+.
	if(hasUserSelect && hasUserSelect !== "msUserSelect"){
		node.style[hasUserSelect] = value;
	}else if(has("dom-selectstart")){
		// For browsers that don't support user-select but support selectstart (IE<10),
		// we can hook up an event handler as necessary.  Since selectstart bubbles,
		// it will handle any child elements as well.
		// Note, however, that both this and the unselectable fallback below are
		// incapable of preventing text selection from outside the targeted node.
		if(!selectable && !grid._selectstartHandle){
			grid._selectstartHandle = on(node, "selectstart", function(evt){
				var tag = evt.target && evt.target.tagName;
				
				// Prevent selection except where a text input field is involved.
				if(tag !== "INPUT" && tag !== "TEXTAREA"){
					evt.preventDefault();
				}
			});
		}else if(selectable && grid._selectstartHandle){
			grid._selectstartHandle.remove();
			delete grid._selectstartHandle;
		}
	}else{
		// For browsers that don't support either user-select or selectstart (Opera),
		// we need to resort to setting the unselectable attribute on all nodes
		// involved.  Since this doesn't automatically apply to child nodes, we also
		// need to re-apply it whenever rows are rendered.
		makeUnselectable(node, !selectable);
		if(!selectable && !grid._unselectableHandle){
			grid._unselectableHandle = aspect.after(grid, "renderRow", function(row){
				makeUnselectable(row, true);
				return row;
			});
		}else if(selectable && grid._unselectableHandle){
			grid._unselectableHandle.remove();
			delete grid._unselectableHandle;
		}
	}
}

return declare(null, {
	// summary:
	//		Add selection capabilities to a grid. The grid will have a selection property and
	//		fire "dgrid-select" and "dgrid-deselect" events.
	
	// selectionDelegate: String
	//		Selector to delegate to as target of selection events.
	selectionDelegate: ".dgrid-row",
	
	// selectionEvents: String|Function
	//		Event (or comma-delimited events, or extension event) to listen on
	//		to trigger select logic.
	selectionEvents: downType + "," + upType + ",dgrid-cellfocusin",
	
	// selectionTouchEvents: String|Function
	//		Event (or comma-delimited events, or extension event) to listen on
	//		in addition to selectionEvents for touch devices.
	selectionTouchEvents: has("touch") ? touchUtil.tap : null,
	
	// deselectOnRefresh: Boolean
	//		If true, the selection object will be cleared when refresh is called.
	deselectOnRefresh: true,
	
	// allowSelectAll: Boolean
	//		If true, allow ctrl/cmd+A to select all rows.
	//		Also consulted by the selector plugin for showing select-all checkbox.
	allowSelectAll: false,
	
	// selection:
	//		An object where the property names correspond to 
	//		object ids and values are true or false depending on whether an item is selected
	selection: {},
	
	// selectionMode: String
	//		The selection mode to use, can be "none", "multiple", "single", or "extended".
	selectionMode: "extended",
	
	// allowTextSelection: Boolean
	//		Whether to still allow text within cells to be selected.  The default
	//		behavior is to allow text selection only when selectionMode is none;
	//		setting this property to either true or false will explicitly set the
	//		behavior regardless of selectionMode.
	allowTextSelection: undefined,
	
	// _selectionTargetType: String
	//		Indicates the property added to emitted events for selected targets;
	//		overridden in CellSelection
	_selectionTargetType: "rows",
	
	create: function(){
		this.selection = {};
		return this.inherited(arguments);
	},
	postCreate: function(){
		this.inherited(arguments);
		
		this._initSelectionEvents();
		
		// Force selectionMode setter to run
		var selectionMode = this.selectionMode;
		this.selectionMode = "";
		this._setSelectionMode(selectionMode);
	},
	
	destroy: function(){
		this.inherited(arguments);
		
		// Remove any extra handles added by Selection.
		if(this._selectstartHandle){ this._selectstartHandle.remove(); }
		if(this._unselectableHandle){ this._unselectableHandle.remove(); }
		if(this._removeDeselectSignals){ this._removeDeselectSignals(); }
	},
	
	_setSelectionMode: function(mode){
		// summary:
		//		Updates selectionMode, resetting necessary variables.
		if(mode == this.selectionMode){ return; } // prevent unnecessary spinning
		
		// Start selection fresh when switching mode.
		this.clearSelection();
		
		this.selectionMode = mode;
		
		// Compute name of selection handler for this mode once
		// (in the form of _fooSelectionHandler)
		this._selectionHandlerName = "_" + mode + "SelectionHandler";
		
		// Also re-run allowTextSelection setter in case it is in automatic mode.
		this._setAllowTextSelection(this.allowTextSelection);
	},
	setSelectionMode: function(mode){
		kernel.deprecated("setSelectionMode(...)", 'use set("selectionMode", ...) instead', "dgrid 0.4");
		this.set("selectionMode", mode);
	},
	
	_setAllowTextSelection: function(allow){
		if(typeof allow !== "undefined"){
			setSelectable(this, allow);
		}else{
			setSelectable(this, this.selectionMode === "none");
		}
		this.allowTextSelection = allow;
	},
	
	_handleSelect: function(event, target){
		// Don't run if selection mode doesn't have a handler (incl. "none"), target can't be selected,
		// or if coming from a dgrid-cellfocusin from a mousedown
		if(!this[this._selectionHandlerName] || !this.allowSelect(this.row(target)) ||
				(event.type === "dgrid-cellfocusin" && event.parentType === "mousedown") ||
				(event.type === upType && target != this._waitForMouseUp)){
			return;
		}
		this._waitForMouseUp = null;
		this._selectionTriggerEvent = event;
		
		// Don't call select handler for ctrl+navigation
		if(!event.keyCode || !event.ctrlKey || event.keyCode == 32){
			// If clicking a selected item, wait for mouseup so that drag n' drop
			// is possible without losing our selection
			if(!event.shiftKey && event.type === downType && this.isSelected(target)){
				this._waitForMouseUp = target;
			}else{
				this[this._selectionHandlerName](event, target);
			}
		}
		this._selectionTriggerEvent = null;
	},
	
	_singleSelectionHandler: function(event, target){
		// summary:
		//		Selection handler for "single" mode, where only one target may be
		//		selected at a time.
		
		var ctrlKey = event.keyCode ? event.ctrlKey : event[ctrlEquiv];
		if(this._lastSelected === target){
			// Allow ctrl to toggle selection, even within single select mode.
			this.select(target, null, !ctrlKey || !this.isSelected(target));
		}else{
			this.clearSelection();
			this.select(target);
			this._lastSelected = target;
		}
	},
	
	_multipleSelectionHandler: function(event, target){
		// summary:
		//		Selection handler for "multiple" mode, where shift can be held to
		//		select ranges, ctrl/cmd can be held to toggle, and clicks/keystrokes
		//		without modifier keys will add to the current selection.
		
		var lastRow = this._lastSelected,
			ctrlKey = event.keyCode ? event.ctrlKey : event[ctrlEquiv],
			value;
		
		if(!event.shiftKey){
			// Toggle if ctrl is held; otherwise select
			value = ctrlKey ? null : true;
			lastRow = null;
		}
		this.select(target, lastRow, value);

		if(!lastRow){
			// Update reference for potential subsequent shift+select
			// (current row was already selected above)
			this._lastSelected = target;
		}
	},
	
	_extendedSelectionHandler: function(event, target){
		// summary:
		//		Selection handler for "extended" mode, which is like multiple mode
		//		except that clicks/keystrokes without modifier keys will clear
		//		the previous selection.
		
		// Clear selection first for right-clicks outside selection and non-ctrl-clicks;
		// otherwise, extended mode logic is identical to multiple mode
		if(event.button === 2 ? !this.isSelected(target) :
				!(event.keyCode ? event.ctrlKey : event[ctrlEquiv])){
			this.clearSelection(null, true);
		}
		this._multipleSelectionHandler(event, target);
	},
	
	_toggleSelectionHandler: function(event, target){
		// summary:
		//		Selection handler for "toggle" mode which simply toggles the selection
		//		of the given target.  Primarily useful for touch input.
		
		this.select(target, null, null);
	},

	_initSelectionEvents: function(){
		// summary:
		//		Performs first-time hookup of event handlers containing logic
		//		required for selection to operate.
		
		var grid = this,
			contentNode = this.contentNode,
			selector = this.selectionDelegate;
		
		this._selectionEventQueues = {
			deselect: [],
			select: []
		};
		
		if(has("touch") && !has("pointer") && this.selectionTouchEvents){
			// Listen for taps, and also for mouse/keyboard, making sure not
			// to trigger both for the same interaction
			on(contentNode, touchUtil.selector(selector, this.selectionTouchEvents), function(evt){
				grid._handleSelect(evt, this);
				grid._ignoreMouseSelect = this;
			});
			on(contentNode, on.selector(selector, this.selectionEvents), function(event){
				if(grid._ignoreMouseSelect !== this){
					grid._handleSelect(event, this);
				}else if(event.type === upType){
					grid._ignoreMouseSelect = null;
				}
			});
		}else{
			// Listen for mouse/keyboard actions that should cause selections
			on(contentNode, on.selector(selector, this.selectionEvents), function(event){
				grid._handleSelect(event, this);
			});
		}
		
		// Also hook up spacebar (for ctrl+space)
		if(this.addKeyHandler){
			this.addKeyHandler(32, function(event){
				grid._handleSelect(event, event.target);
			});
		}
		
		// If allowSelectAll is true, bind ctrl/cmd+A to (de)select all rows,
		// unless the event was received from an editor component.
		// (Handler further checks against _allowSelectAll, which may be updated
		// if selectionMode is changed post-init.)
		if(this.allowSelectAll){
			this.on("keydown", function(event) {
				if(event[ctrlEquiv] && event.keyCode == 65 &&
						!/\bdgrid-input\b/.test(event.target.className)){
					event.preventDefault();
					grid[grid.allSelected ? "clearSelection" : "selectAll"]();
				}
			});
		}
		
		// Update aspects if there is a store change
		if(this._setStore){
			aspect.after(this, "_setStore", function(){
				grid._updateDeselectionAspect();
			});
		}
		this._updateDeselectionAspect();
	},
	
	_updateDeselectionAspect: function(){
		// summary:
		//		Hooks up logic to handle deselection of removed items.
		//		Aspects to an observable store's notify method if applicable,
		//		or to the list/grid's removeRow method otherwise.
		
		var self = this,
			store = this.store,
			beforeSignal,
			afterSignal;

		function ifSelected(object, idToUpdate, methodName){
			// Calls a method if the row corresponding to the object is selected.
			var id = idToUpdate || (object && object[self.idProperty || "id"]);
			if(id != null){
				var row = self.row(id),
					selection = row && self.selection[row.id];
				// Is the row currently in the selection list.
				if(selection){
					self[methodName](row, null, selection);
				}
			}
		}
		
		// Remove anything previously configured
		if(this._removeDeselectSignals){
			this._removeDeselectSignals();
		}

		// Is there currently an observable store?
		if(store && store.notify){
			beforeSignal = aspect.before(store, "notify", function(object, idToUpdate){
				if(!object){
					// Call deselect on the row if the object is being removed.  This allows the
					// deselect event to reference the row element while it still exists in the DOM.
					ifSelected(object, idToUpdate, "deselect");
				}
			});
			afterSignal = aspect.after(store, "notify", function(object, idToUpdate){
				// When List updates an item, the row element is removed and a new one inserted.
				// If at this point the object is still in grid.selection, then call select on the row so the
				// element's CSS is updated.  If the object was removed then the aspect-before has already deselected it.
				ifSelected(object, idToUpdate, "select");
			}, true);
			
			this._removeDeselectSignals = function(){
				beforeSignal.remove();
				afterSignal.remove();
			};
		}else{
			beforeSignal = aspect.before(this, "removeRow", function(rowElement, justCleanup){
				var row;
				if(!justCleanup){
					row = this.row(rowElement);
					// if it is a real row removal for a selected item, deselect it
					if(row && (row.id in this.selection)){
						this.deselect(row);
					}
				}
			});
			this._removeDeselectSignals = function(){
				beforeSignal.remove();
			};
		}
	},
	
	allowSelect: function(row){
		// summary:
		//		A method that can be overriden to determine whether or not a row (or 
		//		cell) can be selected. By default, all rows (or cells) are selectable.
		return true;
	},
	
	_fireSelectionEvent: function(type){
		// summary:
		//		Fires an event for the accumulated rows once a selection
		//		operation is finished (whether singular or for a range)
		
		var queue = this._selectionEventQueues[type],
			triggerEvent = this._selectionTriggerEvent,
			eventObject;
		
		eventObject = {
			bubbles: true,
			grid: this
		};
		if(triggerEvent){
			eventObject.parentType = triggerEvent.type;
		}
		eventObject[this._selectionTargetType] = queue;
		
		on.emit(this.contentNode, "dgrid-" + type, eventObject);
		
		// Clear the queue so that the next round of (de)selections starts anew
		this._selectionEventQueues[type] = [];
	},
	
	_fireSelectionEvents: function(){
		var queues = this._selectionEventQueues,
			type;
		
		for(type in queues){
			if(queues[type].length){
				this._fireSelectionEvent(type);
			}
		}
	},
	
	_select: function(row, toRow, value){
		// summary:
		//		Contains logic for determining whether to select targets, but
		//		does not emit events.  Called from select, deselect, selectAll,
		//		and clearSelection.
		
		var selection,
			previousValue,
			element,
			toElement,
			direction;
		
		if(typeof value === "undefined"){
			// default to true
			value = true;
		} 
		if(!row.element){
			row = this.row(row);
		}
		
		// Check whether we're allowed to select the given row before proceeding.
		// If a deselect operation is being performed, this check is skipped,
		// to avoid errors when changing column definitions, and since disabled
		// rows shouldn't ever be selected anyway.
		if(value === false || this.allowSelect(row)){
			selection = this.selection;
			previousValue = !!selection[row.id];
			if(value === null){
				// indicates a toggle
				value = !previousValue;
			}
			element = row.element;
			if(!value && !this.allSelected){
				delete this.selection[row.id];
			}else{
				selection[row.id] = value;
			}
			if(element){
				// add or remove classes as appropriate
				if(value){
					put(element, ".dgrid-selected" +
						(this.addUiClasses ? ".ui-state-active" : ""));
				}else{
					put(element, "!dgrid-selected!ui-state-active");
				}
			}
			if(value !== previousValue && element){
				// add to the queue of row events
				this._selectionEventQueues[(value ? "" : "de") + "select"].push(row);
			}
			
			if(toRow){
				if(!toRow.element){
					toRow = this.row(toRow);
				}
				
				if(!toRow){
					this._lastSelected = element;
					console.warn("The selection range has been reset because the " +
						"beginning of the selection is no longer in the DOM. " +
						"If you are using OnDemandList, you may wish to increase " +
						"farOffRemoval to avoid this, but note that keeping more nodes " +
						"in the DOM may impact performance.");
					return;
				}
				
				toElement = toRow.element;
				if(toElement){
					direction = this._determineSelectionDirection(element, toElement);
					if(!direction){
						// The original element was actually replaced
						toElement = document.getElementById(toElement.id);
						direction = this._determineSelectionDirection(element, toElement);
					}
					while(row.element != toElement && (row = this[direction](row))){
						this._select(row, null, value);
					}
				}
			}
		}
	},
	
	// Implement _determineSelectionDirection differently based on whether the
	// browser supports element.compareDocumentPosition; use sourceIndex for IE<9
	_determineSelectionDirection: has("dom-comparedocumentposition") ? function (from, to) {
		var result = to.compareDocumentPosition(from);
		if(result & 1){
			return false; // Out of document
		}
		return result === 2 ? "down" : "up";
	} : function(from, to) {
		if(to.sourceIndex < 1){
			return false; // Out of document
		}
		return to.sourceIndex > from.sourceIndex ? "down" : "up";
	},
	
	select: function(row, toRow, value){
		// summary:
		//		Selects or deselects the given row or range of rows.
		// row: Mixed
		//		Row object (or something that can resolve to one) to (de)select
		// toRow: Mixed
		//		If specified, the inclusive range between row and toRow will
		//		be (de)selected
		// value: Boolean|Null
		//		Whether to select (true/default), deselect (false), or toggle
		//		(null) the row
		
		this._select(row, toRow, value);
		this._fireSelectionEvents();
	},
	deselect: function(row, toRow){
		// summary:
		//		Deselects the given row or range of rows.
		// row: Mixed
		//		Row object (or something that can resolve to one) to deselect
		// toRow: Mixed
		//		If specified, the inclusive range between row and toRow will
		//		be deselected
		
		this.select(row, toRow, false);
	},
	
	clearSelection: function(exceptId, dontResetLastSelected){
		// summary:
		//		Deselects any currently-selected items.
		// exceptId: Mixed?
		//		If specified, the given id will not be deselected.
		
		this.allSelected = false;
		for(var id in this.selection){
			if(exceptId !== id){
				this._select(id, null, false);
			}
		}
		if(!dontResetLastSelected){
			this._lastSelected = null;
		}
		this._fireSelectionEvents();
	},
	selectAll: function(){
		this.allSelected = true;
		this.selection = {}; // we do this to clear out pages from previous sorts
		for(var i in this._rowIdToObject){
			var row = this.row(this._rowIdToObject[i]);
			this._select(row.id, null, true);
		}
		this._fireSelectionEvents();
	},
	
	isSelected: function(object){
		// summary:
		//		Returns true if the indicated row is selected.
		
		if(typeof object === "undefined" || object === null){
			return false;
		}
		if(!object.element){
			object = this.row(object);
		}
		
		// First check whether the given row is indicated in the selection hash;
		// failing that, check if allSelected is true (testing against the
		// allowSelect method if possible)
		return (object.id in this.selection) ? !!this.selection[object.id] :
			this.allSelected && (!object.data || this.allowSelect(object));
	},
	
	refresh: function(){
		if(this.deselectOnRefresh){
			this.clearSelection();
		}
		this._lastSelected = null;
		return this.inherited(arguments);
	},
	
	renderArray: function(){
		var grid = this,
			rows = this.inherited(arguments);
		
		Deferred.when(rows, function(rows){
			var selection = grid.selection,
				i, row, selected;
			for(i = 0; i < rows.length; i++){
				row = grid.row(rows[i]);
				selected = row.id in selection ? selection[row.id] : grid.allSelected;
				if(selected){
					grid._select(row, null, selected);
				}
			}
			grid._fireSelectionEvents();
		});
		return rows;
	}
});

});

},
'xstyle/has-class':function(){
define("xstyle/has-class", ["dojo/has"], function(has){
	var tested = {};
	return function(){
		var test, args = arguments;
		for(var i = 0; i < args.length; i++){
			var test = args[i];
			if(!tested[test]){
				tested[test] = true;
				var parts = test.match(/^(no-)?(.+?)((-[\d\.]+)(-[\d\.]+)?)?$/), // parse the class name
					hasResult = has(parts[2]), // the actual has test
					lower = -parts[4]; // lower bound if it is in the form of test-4 or test-4-6 (would be 4)
				if((lower > 0 ? lower <= hasResult && (-parts[5] || lower) >= hasResult :  // if it has a range boundary, compare to see if we are in it
						!!hasResult) == !parts[1]){ // parts[1] is the no- prefix that can negate the result
					document.documentElement.className += ' has-' + test;
				}
			}
		}
	}
});
},
'dgrid/OnDemandGrid':function(){
define("dgrid/OnDemandGrid", ["dojo/_base/declare", "./Grid", "./OnDemandList"], function(declare, Grid, OnDemandList){
	return declare([Grid, OnDemandList], {});
});
},
'dgrid/Grid':function(){
define("dgrid/Grid", ["dojo/_base/kernel", "dojo/_base/declare", "dojo/on", "dojo/has", "put-selector/put", "./List", "./util/misc", "dojo/_base/sniff"],
function(kernel, declare, listen, has, put, List, miscUtil){
	var contentBoxSizing = has("ie") < 8 && !has("quirks");
	
	function appendIfNode(parent, subNode){
		if(subNode && subNode.nodeType){
			parent.appendChild(subNode);
		}
	}
	
	function replaceInvalidChars(str) {
		// Replaces invalid characters for a CSS identifier with hyphen,
		// as dgrid does for field names / column IDs when adding classes.
		return miscUtil.escapeCssIdentifier(str, "-");
	}
	
	var Grid = declare(List, {
		columns: null,
		// cellNavigation: Boolean
		//		This indicates that focus is at the cell level. This may be set to false to cause
		//		focus to be at the row level, which is useful if you want only want row-level
		//		navigation.
		cellNavigation: true,
		tabableHeader: true,
		showHeader: true,
		column: function(target){
			// summary:
			//		Get the column object by node, or event, or a columnId
			if(typeof target != "object"){
				return this.columns[target];
			}else{
				return this.cell(target).column;
			}
		},
		listType: "grid",
		cell: function(target, columnId){
			// summary:
			//		Get the cell object by node, or event, id, plus a columnId
			
			if(target.column && target.element){ return target; }
			
			if(target.target && target.target.nodeType){
				// event
				target = target.target;
			}
			var element;
			if(target.nodeType){
				var object;
				do{
					if(this._rowIdToObject[target.id]){
						break;
					}
					var colId = target.columnId;
					if(colId){
						columnId = colId;
						element = target;
						break;
					}
					target = target.parentNode;
				}while(target && target != this.domNode);
			}
			if(!element && typeof columnId != "undefined"){
				var row = this.row(target),
					rowElement = row && row.element;
				if(rowElement){
					var elements = rowElement.getElementsByTagName("td");
					for(var i = 0; i < elements.length; i++){
						if(elements[i].columnId == columnId){
							element = elements[i];
							break;
						}
					}
				}
			}
			if(target != null){
				return {
					row: row || this.row(target),
					column: columnId && this.column(columnId),
					element: element
				};
			}
		},
		
		createRowCells: function(tag, each, subRows, object){
			// summary:
			//		Generates the grid for each row (used by renderHeader and and renderRow)
			var row = put("table.dgrid-row-table[role=presentation]"),
				cellNavigation = this.cellNavigation,
				// IE < 9 needs an explicit tbody; other browsers do not
				tbody = (has("ie") < 9 || has("quirks")) ? put(row, "tbody") : row,
				tr,
				si, sl, i, l, // iterators
				subRow, column, id, extraClasses, className,
				cell, innerCell, colSpan, rowSpan; // used inside loops
			
			// Allow specification of custom/specific subRows, falling back to
			// those defined on the instance.
			subRows = subRows || this.subRows;
			
			for(si = 0, sl = subRows.length; si < sl; si++){
				subRow = subRows[si];
				// for single-subrow cases in modern browsers, TR can be skipped
				// http://jsperf.com/table-without-trs
				tr = put(tbody, "tr");
				if(subRow.className){
					put(tr, "." + subRow.className);
				}

				for(i = 0, l = subRow.length; i < l; i++){
					// iterate through the columns
					column = subRow[i];
					id = column.id;

					extraClasses = column.field ?
						".field-" + replaceInvalidChars(column.field) :
						"";
					className = typeof column.className === "function" ?
						column.className(object) : column.className;
					if(className){
						extraClasses += "." + className;
					}

					cell = put(tag + (
							".dgrid-cell.dgrid-cell-padding" +
							(id ? ".dgrid-column-" + replaceInvalidChars(id) : "") +
							extraClasses.replace(/ +/g, ".")
						) + "[role=" + (tag === "th" ? "columnheader" : "gridcell") + "]");
					cell.columnId = id;
					if(contentBoxSizing){
						// The browser (IE7-) does not support box-sizing: border-box, so we emulate it with a padding div
						innerCell = put(cell, "!dgrid-cell-padding div.dgrid-cell-padding");// remove the dgrid-cell-padding, and create a child with that class
						cell.contents = innerCell;
					}else{
						innerCell = cell;
					}
					colSpan = column.colSpan;
					if(colSpan){
						cell.colSpan = colSpan;
					}
					rowSpan = column.rowSpan;
					if(rowSpan){
						cell.rowSpan = rowSpan;
					}
					each(innerCell, column);
					// add the td to the tr at the end for better performance
					tr.appendChild(cell);
				}
			}
			return row;
		},
		
		left: function(cell, steps){
			if(!cell.element){ cell = this.cell(cell); }
			return this.cell(this._move(cell, -(steps || 1), "dgrid-cell"));
		},
		right: function(cell, steps){
			if(!cell.element){ cell = this.cell(cell); }
			return this.cell(this._move(cell, steps || 1, "dgrid-cell"));
		},
		
		renderRow: function(object, options){
			var self = this;
			var row = this.createRowCells("td", function(td, column){
				var data = object;
				// Support get function or field property (similar to DataGrid)
				if(column.get){
					data = column.get(object);
				}else if("field" in column && column.field != "_item"){
					data = data[column.field];
				}
				
				if(column.renderCell){
					// A column can provide a renderCell method to do its own DOM manipulation,
					// event handling, etc.
					appendIfNode(td, column.renderCell(object, data, td, options));
				}else{
					defaultRenderCell.call(column, object, data, td, options);
				}
			}, options && options.subRows, object);
			// row gets a wrapper div for a couple reasons:
			//	1. So that one can set a fixed height on rows (heights can't be set on <table>'s AFAICT)
			// 2. So that outline style can be set on a row when it is focused, and Safari's outline style is broken on <table>
			return put("div[role=row]>", row);
		},
		renderHeader: function(){
			// summary:
			//		Setup the headers for the grid
			var
				grid = this,
				columns = this.columns,
				headerNode = this.headerNode,
				i = headerNode.childNodes.length;
			
			headerNode.setAttribute("role", "row");
			
			// clear out existing header in case we're resetting
			while(i--){
				put(headerNode.childNodes[i], "!");
			}
			
			var row = this.createRowCells("th", function(th, column){
				var contentNode = column.headerNode = th;
				if(contentBoxSizing){
					// we're interested in the th, but we're passed the inner div
					th = th.parentNode;
				}
				var field = column.field;
				if(field){
					th.field = field;
				}
				// allow for custom header content manipulation
				if(column.renderHeaderCell){
					appendIfNode(contentNode, column.renderHeaderCell(contentNode));
				}else if("label" in column || column.field){
					contentNode.appendChild(document.createTextNode(
						"label" in column ? column.label : column.field));
				}
				if(column.sortable !== false && field && field != "_item"){
					th.sortable = true;
					th.className += " dgrid-sortable";
				}
			}, this.subRows && this.subRows.headerRows);
			this._rowIdToObject[row.id = this.id + "-header"] = this.columns;
			headerNode.appendChild(row);
			
			// If the columns are sortable, re-sort on clicks.
			// Use a separate listener property to be managed by renderHeader in case
			// of subsequent calls.
			if(this._sortListener){
				this._sortListener.remove();
			}
			this._sortListener = listen(row, "click,keydown", function(event){
				// respond to click, space keypress, or enter keypress
				if(event.type == "click" || event.keyCode == 32 /* space bar */ || (!has("opera") && event.keyCode == 13) /* enter */){
					var target = event.target,
						field, sort, newSort, eventObj;
					do{
						if(target.sortable){
							// If the click is on the same column as the active sort,
							// reverse sort direction
							newSort = [{
								attribute: (field = target.field || target.columnId),
								descending: (sort = grid._sort[0]) && sort.attribute == field &&
									!sort.descending
							}];
							
							// Emit an event with the new sort
							eventObj = {
								bubbles: true,
								cancelable: true,
								grid: grid,
								parentType: event.type,
								sort: newSort
							};
							
							if (listen.emit(event.target, "dgrid-sort", eventObj)){
								// Stash node subject to DOM manipulations,
								// to be referenced then removed by sort()
								grid._sortNode = target;
								grid.set("sort", newSort);
							}
							
							break;
						}
					}while((target = target.parentNode) && target != headerNode);
				}
			});
		},
		
		resize: function(){
			// extension of List.resize to allow accounting for
			// column sizes larger than actual grid area
			var
				headerTableNode = this.headerNode.firstChild,
				contentNode = this.contentNode,
				width;
			
			this.inherited(arguments);
			
			if(!has("ie") || (has("ie") > 7 && !has("quirks"))){
				// Force contentNode width to match up with header width.
				// (Old IEs don't have a problem due to how they layout.)
				
				contentNode.style.width = ""; // reset first
				
				if(contentNode && headerTableNode){
					if((width = headerTableNode.offsetWidth) != contentNode.offsetWidth){
						// update size of content node if necessary (to match size of rows)
						// (if headerTableNode can't be found, there isn't much we can do)
						contentNode.style.width = width + "px";
					}
				}
			}
		},
		
		destroy: function(){
			// Run _destroyColumns first to perform any column plugin tear-down logic.
			this._destroyColumns();
			if(this._sortListener){
				this._sortListener.remove();
			}
			
			this.inherited(arguments);
		},
		
		_setSort: function(property, descending){
			// summary:
			//		Extension of List.js sort to update sort arrow in UI
			
			// Normalize _sort first via inherited logic, then update the sort arrow
			this.inherited(arguments);
			this.updateSortArrow(this._sort);
		},
		
		_findSortArrowParent: function(field){
			// summary:
			//		Method responsible for finding cell that sort arrow should be
			//		added under.  Called by updateSortArrow; separated for extensibility.
			
			var columns = this.columns;
			for(var i in columns){
				var column = columns[i];
				if(column.field == field){
					return column.headerNode;
				}
			}
		},
		
		updateSortArrow: function(sort, updateSort){
			// summary:
			//		Method responsible for updating the placement of the arrow in the
			//		appropriate header cell.  Typically this should not be called (call
			//		set("sort", ...) when actually updating sort programmatically), but
			//		this method may be used by code which is customizing sort (e.g.
			//		by reacting to the dgrid-sort event, canceling it, then
			//		performing logic and calling this manually).
			// sort: Array
			//		Standard sort parameter - array of object(s) containing attribute
			//		and optionally descending property
			// updateSort: Boolean?
			//		If true, will update this._sort based on the passed sort array
			//		(i.e. to keep it in sync when custom logic is otherwise preventing
			//		it from being updated); defaults to false
			
			// Clean up UI from any previous sort
			if(this._lastSortedArrow){
				// Remove the sort classes from the parent node
				put(this._lastSortedArrow, "<!dgrid-sort-up!dgrid-sort-down");
				// Destroy the lastSortedArrow node
				put(this._lastSortedArrow, "!");
				delete this._lastSortedArrow;
			}
			
			if(updateSort){ this._sort = sort; }
			if(!sort[0]){ return; } // nothing to do if no sort is specified
			
			var prop = sort[0].attribute,
				desc = sort[0].descending,
				// if invoked from header click, target is stashed in _sortNode
				target = this._sortNode || this._findSortArrowParent(prop),
				arrowNode;
			
			delete this._sortNode;
			
			// Skip this logic if field being sorted isn't actually displayed
			if(target){
				target = target.contents || target;
				// Place sort arrow under clicked node, and add up/down sort class
				arrowNode = this._lastSortedArrow = put("div.dgrid-sort-arrow.ui-icon[role=presentation]");
				arrowNode.innerHTML = "&nbsp;";
				target.insertBefore(arrowNode, target.firstChild);
				put(target, desc ? ".dgrid-sort-down" : ".dgrid-sort-up");
				// Call resize in case relocation of sort arrow caused any height changes
				this.resize();
			}
		},
		
		styleColumn: function(colId, css){
			// summary:
			//		Dynamically creates a stylesheet rule to alter a column's style.
			
			return this.addCssRule("#" + miscUtil.escapeCssIdentifier(this.domNode.id) +
				" .dgrid-column-" + replaceInvalidChars(colId), css);
		},
		
		/*=====
		_configColumn: function(column, columnId, rowColumns, prefix){
			// summary:
			//		Method called when normalizing base configuration of a single
			//		column.  Can be used as an extension point for behavior requiring
			//		access to columns when a new configuration is applied.
		},=====*/
		
		_configColumns: function(prefix, rowColumns){
			// configure the current column
			var subRow = [],
				isArray = rowColumns instanceof Array;
			
			function configColumn(column, columnId){
				if(typeof column == "string"){
					rowColumns[columnId] = column = {label:column};
				}
				if(!isArray && !column.field){
					column.field = columnId;
				}
				columnId = column.id = column.id || (isNaN(columnId) ? columnId : (prefix + columnId));
				// allow further base configuration in subclasses
				if(this._configColumn){
					this._configColumn(column, columnId, rowColumns, prefix);
					// Allow the subclasses to modify the column id.
					columnId = column.id;
				}
				if(isArray){ this.columns[columnId] = column; }

				// add grid reference to each column object for potential use by plugins
				column.grid = this;
				if(typeof column.init === "function"){ column.init(); }
				
				subRow.push(column); // make sure it can be iterated on
			}
			
			miscUtil.each(rowColumns, configColumn, this);
			return isArray ? rowColumns : subRow;
		},
		
		_destroyColumns: function(){
			// summary:
			//		Iterates existing subRows looking for any column definitions with
			//		destroy methods (defined by plugins) and calls them.  This is called
			//		immediately before configuring a new column structure.
			
			var subRows = this.subRows,
				// if we have column sets, then we don't need to do anything with the missing subRows, ColumnSet will handle it
				subRowsLength = subRows && subRows.length,
				i, j, column, len;
			
			// First remove rows (since they'll be refreshed after we're done),
			// so that anything aspected onto removeRow by plugins can run.
			// (cleanup will end up running again, but with nothing to iterate.)
			this.cleanup();
			
			for(i = 0; i < subRowsLength; i++){
				for(j = 0, len = subRows[i].length; j < len; j++){
					column = subRows[i][j];
					if(typeof column.destroy === "function"){ column.destroy(); }
				}
			}
		},
		
		configStructure: function(){
			// configure the columns and subRows
			var subRows = this.subRows,
				columns = this._columns = this.columns;
			
			// Reset this.columns unless it was already passed in as an object
			this.columns = !columns || columns instanceof Array ? {} : columns;
			
			if(subRows){
				// Process subrows, which will in turn populate the this.columns object
				for(var i = 0; i < subRows.length; i++){
					subRows[i] = this._configColumns(i + "-", subRows[i]);
				}
			}else{
				this.subRows = [this._configColumns("", columns)];
			}
		},
		
		_getColumns: function(){
			// _columns preserves what was passed to set("columns"), but if subRows
			// was set instead, columns contains the "object-ified" version, which
			// was always accessible in the past, so maintain that accessibility going
			// forward.
			return this._columns || this.columns;
		},
		_setColumns: function(columns){
			this._destroyColumns();
			// reset instance variables
			this.subRows = null;
			this.columns = columns;
			// re-run logic
			this._updateColumns();
		},
		
		_setSubRows: function(subrows){
			this._destroyColumns();
			this.subRows = subrows;
			this._updateColumns();
		},
		
		setColumns: function(columns){
			kernel.deprecated("setColumns(...)", 'use set("columns", ...) instead', "dgrid 0.4");
			this.set("columns", columns);
		},
		setSubRows: function(subrows){
			kernel.deprecated("setSubRows(...)", 'use set("subRows", ...) instead', "dgrid 0.4");
			this.set("subRows", subrows);
		},
		
		_updateColumns: function(){
			// summary:
			//		Called when columns, subRows, or columnSets are reset
			
			this.configStructure();
			this.renderHeader();
			
			this.refresh();
			// re-render last collection if present
			this._lastCollection && this.renderArray(this._lastCollection);
			
			// After re-rendering the header, re-apply the sort arrow if needed.
			if(this._started){
				if(this._sort && this._sort.length){
					this.updateSortArrow(this._sort);
				} else {
					// Only call resize directly if we didn't call updateSortArrow,
					// since that calls resize itself when it updates.
					this.resize();
				}
			}
		}
	});
	
	function defaultRenderCell(object, data, td, options){
		if(this.formatter){
			// Support formatter, with or without formatterScope
			var formatter = this.formatter,
				formatterScope = this.grid.formatterScope;
			td.innerHTML = typeof formatter === "string" && formatterScope ?
				formatterScope[formatter](data, object) : this.formatter(data, object);
		}else if(data != null){
			td.appendChild(document.createTextNode(data)); 
		}
	}
	
	// expose appendIfNode and default implementation of renderCell,
	// e.g. for use by column plugins
	Grid.appendIfNode = appendIfNode;
	Grid.defaultRenderCell = defaultRenderCell;
	
	return Grid;
});

},
'dgrid/_StoreMixin':function(){
define("dgrid/_StoreMixin", ["dojo/_base/kernel", "dojo/_base/declare", "dojo/_base/lang", "dojo/_base/Deferred", "dojo/on", "dojo/aspect", "put-selector/put"],
function(kernel, declare, lang, Deferred, listen, aspect, put){
	// This module isolates the base logic required by store-aware list/grid
	// components, e.g. OnDemandList/Grid and the Pagination extension.
	
	// Noop function, needed for _trackError when callback due to a bug in 1.8
	// (see http://bugs.dojotoolkit.org/ticket/16667)
	function noop(value){ return value; }
	
	function emitError(err){
		// called by _trackError in context of list/grid, if an error is encountered
		if(typeof err !== "object"){
			// Ensure we actually have an error object, so we can attach a reference.
			err = new Error(err);
		}else if(err.dojoType === "cancel"){
			// Don't fire dgrid-error events for errors due to canceled requests
			// (unfortunately, the Deferred instrumentation will still log them)
			return;
		}
		// TODO: remove this @ 0.4 (prefer grid property directly on event object)
		err.grid = this;
		
		if(listen.emit(this.domNode, "dgrid-error", {
				grid: this,
				error: err,
				cancelable: true,
				bubbles: true })){
			console.error(err);
		}
	}
	
	return declare(null, {
		// store: Object
		//		The object store (implementing the dojo/store API) from which data is
		//		to be fetched.
		store: null,
		
		// query: Object
		//		Specifies query parameter(s) to pass to store.query calls.
		query: null,
		
		// queryOptions: Object
		//		Specifies additional query options to mix in when calling store.query;
		//		sort, start, and count are already handled.
		queryOptions: null,
		
		// getBeforePut: boolean
		//		If true, a get request will be performed to the store before each put
		//		as a baseline when saving; otherwise, existing row data will be used.
		getBeforePut: true,
		
		// noDataMessage: String
		//		Message to be displayed when no results exist for a query, whether at
		//		the time of the initial query or upon subsequent observed changes.
		//		Defined by _StoreMixin, but to be implemented by subclasses.
		noDataMessage: "",
		
		// loadingMessage: String
		//		Message displayed when data is loading.
		//		Defined by _StoreMixin, but to be implemented by subclasses.
		loadingMessage: "",
		
		constructor: function(){
			// Create empty objects on each instance, not the prototype
			this.query = {};
			this.queryOptions = {};
			this.dirty = {};
			this._updating = {}; // Tracks rows that are mid-update
			this._columnsWithSet = {};

			// Reset _columnsWithSet whenever column configuration is reset
			aspect.before(this, "configStructure", lang.hitch(this, function(){
				this._columnsWithSet = {};
			}));
		},
		
		postCreate: function(){
			this.inherited(arguments);
			if(this.store){
				this._updateNotifyHandle(this.store);
			}
		},
		
		destroy: function(){
			this.inherited(arguments);
			if(this._notifyHandle){
				this._notifyHandle.remove();
			}
		},
		
		_configColumn: function(column){
			// summary:
			//		Implements extension point provided by Grid to store references to
			//		any columns with `set` methods, for use during `save`.
			if (column.set){
				this._columnsWithSet[column.field] = column;
			}
			this.inherited(arguments);
		},
		
		_updateNotifyHandle: function(store){
			// summary:
			//		Unhooks any previously-existing store.notify handle, and
			//		hooks up a new one for the given store.
			
			if(this._notifyHandle){
				// Unhook notify handler from previous store
				this._notifyHandle.remove();
				delete this._notifyHandle;
			}
			if(store && typeof store.notify === "function"){
				this._notifyHandle = aspect.after(store, "notify",
					lang.hitch(this, "_onNotify"), true);
				
				var sort = this.get("sort");
				if (!sort || !sort.length) {
					console.warn("Observable store detected, but no sort order specified. " +
						"You may experience quirks when adding/updating items.  " +
						"These can be resolved by setting a sort order on the list or grid.");
				}
			}
		},
		
		_setStore: function(store, query, queryOptions){
			// summary:
			//		Assigns a new store (and optionally query/queryOptions) to the list,
			//		and tells it to refresh.
			
			this._updateNotifyHandle(store);
			
			this.store = store;
			this.dirty = {}; // discard dirty map, as it applied to a previous store
			this.set("query", query, queryOptions);
		},
		_setQuery: function(query, queryOptions){
			// summary:
			//		Assigns a new query (and optionally queryOptions) to the list,
			//		and tells it to refresh.
			
			var sort = queryOptions && queryOptions.sort;
			
			this.query = query !== undefined ? query : this.query;
			this.queryOptions = queryOptions || this.queryOptions;
			
			// If we have new sort criteria, pass them through sort
			// (which will update _sort and call refresh in itself).
			// Otherwise, just refresh.
			sort ? this.set("sort", sort) : this.refresh();
		},
		setStore: function(store, query, queryOptions){
			kernel.deprecated("setStore(...)", 'use set("store", ...) instead', "dgrid 0.4");
			this.set("store", store, query, queryOptions);
		},
		setQuery: function(query, queryOptions){
			kernel.deprecated("setQuery(...)", 'use set("query", ...) instead', "dgrid 0.4");
			this.set("query", query, queryOptions);
		},
		
		_getQueryOptions: function(){
			// summary:
			//		Get a fresh queryOptions object, also including the current sort
			var options = lang.delegate(this.queryOptions, {});
			if(typeof(this._sort) === "function" || this._sort.length){
				// Prevents SimpleQueryEngine from doing unnecessary "null" sorts (which can
				// change the ordering in browsers that don't use a stable sort algorithm, eg Chrome)
				options.sort = this._sort;
			}
			return options;
		},
		_getQuery: function(){
			// summary:
			//		Implemented consistent with _getQueryOptions so that if query is
			//		an object, this returns a protected (delegated) object instead of
			//		the original.
			var q = this.query;
			return typeof q == "object" && q != null ? lang.delegate(q, {}) : q;
		},
		
		_setSort: function(property, descending){
			// summary:
			//		Sort the content
			
			// prevent default storeless sort logic as long as we have a store
			if(this.store){ this._lastCollection = null; }
			this.inherited(arguments);
		},
		
		_onNotify: function(object, existingId){
			// summary:
			//		Method called when the store's notify method is called.
			
			// Call inherited in case anything was mixed in earlier
			this.inherited(arguments);
			
			// For adds/puts, check whether any observers are hooked up;
			// if not, force a refresh to properly hook one up now that there is data
			if(object && this._numObservers < 1){
				this.refresh({ keepScrollPosition: true });
			}
		},
		
		insertRow: function(object, parent, beforeNode, i, options){
			var store = this.store,
				dirty = this.dirty,
				id = store && store.getIdentity(object),
				dirtyObj;
			
			if(id in dirty && !(id in this._updating)){ dirtyObj = dirty[id]; }
			if(dirtyObj){
				// restore dirty object as delegate on top of original object,
				// to provide protection for subsequent changes as well
				object = lang.delegate(object, dirtyObj);
			}
			return this.inherited(arguments);
		},
		
		updateDirty: function(id, field, value){
			// summary:
			//		Updates dirty data of a field for the item with the specified ID.
			var dirty = this.dirty,
				dirtyObj = dirty[id];
			
			if(!dirtyObj){
				dirtyObj = dirty[id] = {};
			}
			dirtyObj[field] = value;
		},
		setDirty: function(id, field, value){
			kernel.deprecated("setDirty(...)", "use updateDirty() instead", "dgrid 0.4");
			this.updateDirty(id, field, value);
		},
		
		save: function() {
			// Keep track of the store and puts
			var self = this,
				store = this.store,
				dirty = this.dirty,
				dfd = new Deferred(), promise = dfd.promise,
				getFunc = function(id){
					// returns a function to pass as a step in the promise chain,
					// with the id variable closured
					var data;
					return (self.getBeforePut || !(data = self.row(id).data)) ?
						function(){ return store.get(id); } :
						function(){ return data; };
				};
			
			// function called within loop to generate a function for putting an item
			function putter(id, dirtyObj) {
				// Return a function handler
				return function(object) {
					var colsWithSet = self._columnsWithSet,
						updating = self._updating,
						key, data;

					if (typeof object.set === "function") {
						object.set(dirtyObj);
					} else {
						// Copy dirty props to the original, applying setters if applicable
						for(key in dirtyObj){
							object[key] = dirtyObj[key];
						}
					}

					// Apply any set methods in column definitions.
					// Note that while in the most common cases column.set is intended
					// to return transformed data for the key in question, it is also
					// possible to directly modify the object to be saved.
					for(key in colsWithSet){
						data = colsWithSet[key].set(object);
						if(data !== undefined){ object[key] = data; }
					}
					
					updating[id] = true;
					// Put it in the store, returning the result/promise
					return Deferred.when(store.put(object), function() {
						// Clear the item now that it's been confirmed updated
						delete dirty[id];
						delete updating[id];
					});
				};
			}
			
			// For every dirty item, grab the ID
			for(var id in dirty) {
				// Create put function to handle the saving of the the item
				var put = putter(id, dirty[id]);
				
				// Add this item onto the promise chain,
				// getting the item from the store first if desired.
				promise = promise.then(getFunc(id)).then(put);
			}
			
			// Kick off and return the promise representing all applicable get/put ops.
			// If the success callback is fired, all operations succeeded; otherwise,
			// save will stop at the first error it encounters.
			dfd.resolve();
			return promise;
		},
		
		revert: function(){
			// summary:
			//		Reverts any changes since the previous save.
			this.dirty = {};
			this.refresh();
		},
		
		_trackError: function(func){
			// summary:
			//		Utility function to handle emitting of error events.
			// func: Function|String
			//		A function which performs some store operation, or a String identifying
			//		a function to be invoked (sans arguments) hitched against the instance.
			//		If sync, it can return a value, but may throw an error on failure.
			//		If async, it should return a promise, which would fire the error
			//		callback on failure.
			// tags:
			//		protected
			
			var result;
			
			if(typeof func == "string"){ func = lang.hitch(this, func); }
			
			try{
				result = func();
			}catch(err){
				// report sync error
				emitError.call(this, err);
			}
			
			// wrap in when call to handle reporting of potential async error
			return Deferred.when(result, noop, lang.hitch(this, emitError));
		},
		
		newRow: function(){
			// Override to remove no data message when a new row appears.
			// Run inherited logic first to prevent confusion due to noDataNode
			// no longer being present as a sibling.
			var row = this.inherited(arguments);
			if(this.noDataNode){
				put(this.noDataNode, "!");
				delete this.noDataNode;
			}
			return row;
		},
		removeRow: function(rowElement, justCleanup){
			var row = {element: rowElement};
			// Check to see if we are now empty...
			if(!justCleanup && this.noDataMessage &&
					(this.up(row).element === rowElement) &&
					(this.down(row).element === rowElement)){
				// ...we are empty, so show the no data message.
				this.noDataNode = put(this.contentNode, "div.dgrid-no-data");
				this.noDataNode.innerHTML = this.noDataMessage;
			}
			return this.inherited(arguments);
		}
	});
});

},
'put-selector/put':function(){
(function(define){
var forDocument, fragmentFasterHeuristic = /[-+,> ]/; // if it has any of these combinators, it is probably going to be faster with a document fragment 
define("put-selector/put", [], forDocument = function(doc, newFragmentFasterHeuristic){
"use strict";
	// module:
	//		put-selector/put
	// summary:
	//		This module defines a fast lightweight function for updating and creating new elements
	//		terse, CSS selector-based syntax. The single function from this module creates
	// 		new DOM elements and updates existing elements. See README.md for more information.
	//	examples:
	//		To create a simple div with a class name of "foo":
	//		|	put("div.foo");
	fragmentFasterHeuristic = newFragmentFasterHeuristic || fragmentFasterHeuristic;
	var selectorParse = /(?:\s*([-+ ,<>]))?\s*(\.|!\.?|#)?([-\w%$|]+)?(?:\[([^\]=]+)=?['"]?([^\]'"]*)['"]?\])?/g,
		undefined, namespaceIndex, namespaces = false,
		doc = doc || document,
		ieCreateElement = typeof doc.createElement == "object"; // telltale sign of the old IE behavior with createElement that does not support later addition of name 
	function insertTextNode(element, text){
		element.appendChild(doc.createTextNode(text));
	}
	function put(topReferenceElement){
		var fragment, lastSelectorArg, nextSibling, referenceElement, current,
			args = arguments,
			returnValue = args[0]; // use the first argument as the default return value in case only an element is passed in
		function insertLastElement(){
			// we perform insertBefore actions after the element is fully created to work properly with 
			// <input> tags in older versions of IE that require type attributes
			//	to be set before it is attached to a parent.
			// We also handle top level as a document fragment actions in a complex creation 
			// are done on a detached DOM which is much faster
			// Also if there is a parse error, we generally error out before doing any DOM operations (more atomic) 
			if(current && referenceElement && current != referenceElement){
				(referenceElement == topReferenceElement &&
					// top level, may use fragment for faster access 
					(fragment || 
						// fragment doesn't exist yet, check to see if we really want to create it 
						(fragment = fragmentFasterHeuristic.test(argument) && doc.createDocumentFragment()))
							// any of the above fails just use the referenceElement  
							 ? fragment : referenceElement).
								insertBefore(current, nextSibling || null); // do the actual insertion
			}
		}
		for(var i = 0; i < args.length; i++){
			var argument = args[i];
			if(typeof argument == "object"){
				lastSelectorArg = false;
				if(argument instanceof Array){
					// an array
					current = doc.createDocumentFragment();
					for(var key = 0; key < argument.length; key++){
						current.appendChild(put(argument[key]));
					}
					argument = current;
				}
				if(argument.nodeType){
					current = argument;
					insertLastElement();
					referenceElement = argument;
					nextSibling = 0;
				}else{
					// an object hash
					for(var key in argument){
						current[key] = argument[key];
					}				
				}
			}else if(lastSelectorArg){
				// a text node should be created
				// take a scalar value, use createTextNode so it is properly escaped
				// createTextNode is generally several times faster than doing an escaped innerHTML insertion: http://jsperf.com/createtextnode-vs-innerhtml/2
				lastSelectorArg = false;
				insertTextNode(current, argument);
			}else{
				if(i < 1){
					// if we are starting with a selector, there is no top element
					topReferenceElement = null;
				}
				lastSelectorArg = true;
				var leftoverCharacters = argument.replace(selectorParse, function(t, combinator, prefix, value, attrName, attrValue){
					if(combinator){
						// insert the last current object
						insertLastElement();
						if(combinator == '-' || combinator == '+'){
							// + or - combinator, 
							// TODO: add support for >- as a means of indicating before the first child?
							referenceElement = (nextSibling = (current || referenceElement)).parentNode;
							current = null;
							if(combinator == "+"){
								nextSibling = nextSibling.nextSibling;
							}// else a - operator, again not in CSS, but obvious in it's meaning (create next element before the current/referenceElement)
						}else{
							if(combinator == "<"){
								// parent combinator (not really in CSS, but theorized, and obvious in it's meaning)
								referenceElement = current = (current || referenceElement).parentNode;
							}else{
								if(combinator == ","){
									// comma combinator, start a new selector
									referenceElement = topReferenceElement;
								}else if(current){
									// else descendent or child selector (doesn't matter, treated the same),
									referenceElement = current;
								}
								current = null;
							}
							nextSibling = 0;
						}
						if(current){
							referenceElement = current;
						}
					}
					var tag = !prefix && value;
					if(tag || (!current && (prefix || attrName))){
						if(tag == "$"){
							// this is a variable to be replaced with a text node
							insertTextNode(referenceElement, args[++i]);
						}else{
							// Need to create an element
							tag = tag || put.defaultTag;
							var ieInputName = ieCreateElement && args[i +1] && args[i +1].name;
							if(ieInputName){
								// in IE, we have to use the crazy non-standard createElement to create input's that have a name 
								tag = '<' + tag + ' name="' + ieInputName + '">';
							}
							// we swtich between creation methods based on namespace usage
							current = namespaces && ~(namespaceIndex = tag.indexOf('|')) ?
								doc.createElementNS(namespaces[tag.slice(0, namespaceIndex)], tag.slice(namespaceIndex + 1)) : 
								doc.createElement(tag);
						}
					}
					if(prefix){
						if(value == "$"){
							value = args[++i];
						}
						if(prefix == "#"){
							// #id was specified
							current.id = value;
						}else{
							// we are in the className addition and removal branch
							var currentClassName = current.className;
							// remove the className (needed for addition or removal)
							// see http://jsperf.com/remove-class-name-algorithm/2 for some tests on this
							var removed = currentClassName && (" " + currentClassName + " ").replace(" " + value + " ", " ");
							if(prefix == "."){
								// addition, add the className
								current.className = currentClassName ? (removed + value).substring(1) : value;
							}else{
								// else a '!' class removal
								if(argument == "!"){
									var parentNode;
									// special signal to delete this element
									if(ieCreateElement){
										// use the ol' innerHTML trick to get IE to do some cleanup
										put("div", current, '<').innerHTML = "";
									}else if(parentNode = current.parentNode){ // intentional assigment
										// use a faster, and more correct (for namespaced elements) removal (http://jsperf.com/removechild-innerhtml)
										parentNode.removeChild(current);
									}
								}else{
									// we already have removed the class, just need to trim
									removed = removed.substring(1, removed.length - 1);
									// only assign if it changed, this can save a lot of time
									if(removed != currentClassName){
										current.className = removed;
									}
								}
							}
							// CSS class removal
						}
					}
					if(attrName){
						if(attrValue == "$"){
							attrValue = args[++i];
						}
						// [name=value]
						if(attrName == "style"){
							// handle the special case of setAttribute not working in old IE
							current.style.cssText = attrValue;
						}else{
							var method = attrName.charAt(0) == "!" ? (attrName = attrName.substring(1)) && 'removeAttribute' : 'setAttribute';
							attrValue = attrValue === '' ? attrName : attrValue;
							// determine if we need to use a namespace
							namespaces && ~(namespaceIndex = attrName.indexOf('|')) ?
								current[method + "NS"](namespaces[attrName.slice(0, namespaceIndex)], attrName.slice(namespaceIndex + 1), attrValue) :
								current[method](attrName, attrValue);
						}
					}
					return '';
				});
				if(leftoverCharacters){
					throw new SyntaxError("Unexpected char " + leftoverCharacters + " in " + argument);
				}
				insertLastElement();
				referenceElement = returnValue = current || referenceElement;
			}
		}
		if(topReferenceElement && fragment){
			// we now insert the top level elements for the fragment if it exists
			topReferenceElement.appendChild(fragment);
		}
		return returnValue;
	}
	put.addNamespace = function(name, uri){
		if(doc.createElementNS){
			(namespaces || (namespaces = {}))[name] = uri;
		}else{
			// for old IE
			doc.namespaces.add(name, uri);
		}
	};
	put.defaultTag = "div";
	put.forDocument = forDocument;
	return put;
});
})(function(id, deps, factory){
	factory = factory || deps;
	if(typeof define === "function"){
		// AMD loader
		define([], function(){
			return factory();
		});
	}else if(typeof window == "undefined"){
		// server side JavaScript, probably (hopefully) NodeJS
		require("./node-html")(module, factory);
	}else{
		// plain script in a browser
		put = factory();
	}
});

},
'dgrid/OnDemandList':function(){
define("dgrid/OnDemandList", ["./List", "./_StoreMixin", "dojo/_base/declare", "dojo/_base/lang", "dojo/_base/Deferred", "dojo/dom", "dojo/on", "./util/misc", "put-selector/put"],
function(List, _StoreMixin, declare, lang, Deferred, dom, listen, miscUtil, put){

return declare([List, _StoreMixin], {
	// summary:
	//		Extends List to include virtual scrolling functionality, querying a
	//		dojo/store instance for the appropriate range when the user scrolls.
	
	// minRowsPerPage: Integer
	//		The minimum number of rows to request at one time.
	minRowsPerPage: 25,
	
	// maxRowsPerPage: Integer
	//		The maximum number of rows to request at one time.
	maxRowsPerPage: 250,
	
	// maxEmptySpace: Integer
	//		Defines the maximum size (in pixels) of unrendered space below the
	//		currently-rendered rows. Setting this to less than Infinity can be useful if you
	//		wish to limit the initial vertical scrolling of the grid so that the scrolling is
	// 		not excessively sensitive. With very large grids of data this may make scrolling
	//		easier to use, albiet it can limit the ability to instantly scroll to the end.
	maxEmptySpace: Infinity,	
	
	// bufferRows: Integer
	//	  The number of rows to keep ready on each side of the viewport area so that the user can
	//	  perform local scrolling without seeing the grid being built. Increasing this number can
	//	  improve perceived performance when the data is being retrieved over a slow network.
	bufferRows: 10,
	
	// farOffRemoval: Integer
	//		Defines the minimum distance (in pixels) from the visible viewport area
	//		rows must be in order to be removed.  Setting to Infinity causes rows
	//		to never be removed.
	farOffRemoval: 2000,
	
	// queryRowsOverlap: Integer
	//		Indicates the number of rows to overlap queries. This helps keep
	//		continuous data when underlying data changes (and thus pages don't
	//		exactly align)
	queryRowsOverlap: 0,
	
	// pagingMethod: String
	//		Method (from dgrid/util/misc) to use to either throttle or debounce
	//		requests.  Default is "debounce" which will cause the grid to wait until
	//		the user pauses scrolling before firing any requests; can be set to
	//		"throttleDelayed" instead to progressively request as the user scrolls,
	//		which generally incurs more overhead but might appear more responsive.
	pagingMethod: "debounce",
	
	// pagingDelay: Integer
	//		Indicates the delay (in milliseconds) imposed upon pagingMethod, to wait
	//		before paging in more data on scroll events. This can be increased to
	//		reduce client-side overhead or the number of requests sent to a server.
	pagingDelay: miscUtil.defaultDelay,
	
	// keepScrollPosition: Boolean
	//		When refreshing the list, controls whether the scroll position is
	//		preserved, or reset to the top.  This can also be overridden for
	//		specific calls to refresh.
	keepScrollPosition: false,
	
	rowHeight: 22,
	
	postCreate: function(){
		this.inherited(arguments);
		var self = this;
		// check visibility on scroll events
		listen(this.bodyNode, "scroll",
			miscUtil[this.pagingMethod](function(event){ self._processScroll(event); },
				null, this.pagingDelay));
	},
	
	renderQuery: function(query, preloadNode, options){
		// summary:
		//		Creates a preload node for rendering a query into, and executes the query
		//		for the first page of data. Subsequent data will be downloaded as it comes
		//		into view.
		var self = this,
			preload = {
				query: query,
				count: 0,
				node: preloadNode,
				options: options
			},
			priorPreload = this.preload,
			results;
		
		if(!preloadNode){
			// Initial query; set up top and bottom preload nodes
			var topPreload = {
				node: put(this.contentNode, "div.dgrid-preload", {
					rowIndex: 0
				}),
				count: 0,
				query: query,
				next: preload,
				options: options
			};
			topPreload.node.style.height = "0";
			preload.node = preloadNode = put(this.contentNode, "div.dgrid-preload");
			preload.previous = topPreload;
		}
		// this preload node is used to represent the area of the grid that hasn't been
		// downloaded yet
		preloadNode.rowIndex = this.minRowsPerPage;

		if(priorPreload){
			// the preload nodes (if there are multiple) are represented as a linked list, need to insert it
			if((preload.next = priorPreload.next) && 
					// is this preload node below the prior preload node?
					preloadNode.offsetTop >= priorPreload.node.offsetTop){
				// the prior preload is above/before in the linked list
				preload.previous = priorPreload;
			}else{
				// the prior preload is below/after in the linked list
				preload.next = priorPreload;
				preload.previous = priorPreload.previous;
			}
			// adjust the previous and next links so the linked list is proper
			preload.previous.next = preload;
			preload.next.previous = preload; 
		}else{
			this.preload = preload;
		}
		
		var loadingNode = put(preloadNode, "-div.dgrid-loading"),
			innerNode = put(loadingNode, "div.dgrid-below");
		innerNode.innerHTML = this.loadingMessage;

		function errback(err) {
			// Used as errback for when calls;
			// remove the loadingNode and re-throw if an error was passed
			put(loadingNode, "!");
			
			if(err){
				if(self._refreshDeferred){
					self._refreshDeferred.reject(err);
					delete self._refreshDeferred;
				}
				throw err;
			}
		}

		// Establish query options, mixing in our own.
		// (The getter returns a delegated object, so simply using mixin is safe.)
		options = lang.mixin(this.get("queryOptions"), options, 
			{ start: 0, count: this.minRowsPerPage },
			"level" in query ? { queryLevel: query.level } : null);
		
		// Protect the query within a _trackError call, but return the QueryResults
		this._trackError(function(){ return results = query(options); });
		
		if(typeof results === "undefined"){
			// Synchronous error occurred (but was caught by _trackError)
			errback();
			return;
		}
		
		// Render the result set
		Deferred.when(self.renderArray(results, preloadNode, options), function(trs){
			var total = typeof results.total === "undefined" ?
				results.length : results.total;
			return Deferred.when(total, function(total){
				var trCount = trs.length,
					parentNode = preloadNode.parentNode,
					noDataNode = self.noDataNode;
				
				put(loadingNode, "!");
				if(!("queryLevel" in options)){
					self._total = total;
				}
				// now we need to adjust the height and total count based on the first result set
				if(total === 0){
					if(noDataNode){
						put(noDataNode, "!");
						delete self.noDataNode;
					}
					self.noDataNode = noDataNode = put("div.dgrid-no-data");
					parentNode.insertBefore(noDataNode, self._getFirstRowSibling(parentNode));
					noDataNode.innerHTML = self.noDataMessage;
				}
				var height = 0;
				for(var i = 0; i < trCount; i++){
					height += self._calcRowHeight(trs[i]);
				}
				// only update rowHeight if we actually got results and are visible
				if(trCount && height){ self.rowHeight = height / trCount; }
				
				total -= trCount;
				preload.count = total;
				preloadNode.rowIndex = trCount;
				if(total){
					preloadNode.style.height = Math.min(total * self.rowHeight, self.maxEmptySpace) + "px";
				}else{
					// if total is 0, IE quirks mode can't handle 0px height for some reason, I don't know why, but we are setting display: none for now
					preloadNode.style.display = "none";
					// This is a hack to get Observable to recognize that this is the
					// last page, like is done in the processScroll function
					options.count++;
				}
				
				if (self._previousScrollPosition) {
					// Restore position after a refresh operation w/ keepScrollPosition
					self.scrollTo(self._previousScrollPosition);
					delete self._previousScrollPosition;
				}
				
				// Redo scroll processing in case the query didn't fill the screen,
				// or in case scroll position was restored
				self._processScroll();
				
				// If _refreshDeferred is still defined after calling _processScroll,
				// resolve it now (_processScroll will remove it and resolve it itself
				// otherwise)
				if(self._refreshDeferred){
					self._refreshDeferred.resolve(results);
					delete self._refreshDeferred;
				}
				
				return trs;
			}, errback);
		}, errback);
		
		return results;
	},
	
	refresh: function(options){
		// summary:
		//		Refreshes the contents of the grid.
		// options: Object?
		//		Optional object, supporting the following parameters:
		//		* keepScrollPosition: like the keepScrollPosition instance property;
		//			specifying it in the options here will override the instance
		//			property's value for this specific refresh call only.
		
		var self = this,
			keep = (options && options.keepScrollPosition),
			dfd, results;
		
		// Fall back to instance property if option is not defined
		if(typeof keep === "undefined"){ keep = this.keepScrollPosition; }
		
		// Store scroll position to be restored after new total is received
		if(keep){ this._previousScrollPosition = this.getScrollPosition(); }
		
		this.inherited(arguments);
		if(this.store){
			// render the query
			dfd = this._refreshDeferred = new Deferred();
			
			// renderQuery calls _trackError internally
			results = self.renderQuery(function(queryOptions){
				return self.store.query(self.query, queryOptions);
			});
			if(typeof results === "undefined"){
				// Synchronous error occurred; reject the refresh promise.
				dfd.reject();
			}
			
			// Internally, _refreshDeferred will always be resolved with an object
			// containing `results` (QueryResults) and `rows` (the rendered rows);
			// externally the promise will resolve simply with the QueryResults, but
			// the event will be emitted with both under respective properties.
			return dfd.then(function(results){
				// Emit on a separate turn to enable event to be used consistently for
				// initial render, regardless of whether the backing store is async
				setTimeout(function() {
					listen.emit(self.domNode, "dgrid-refresh-complete", {
						bubbles: true,
						cancelable: false,
						grid: self,
						results: results // QueryResults object (may be a wrapped promise)
					});
				}, 0);
				
				// Delete the Deferred immediately so nothing tries to re-resolve
				delete self._refreshDeferred;
				
				// Resolve externally with just the QueryResults
				return results;
			}, function(err){
				delete self._refreshDeferred;
				throw err;
			});
		}
	},
	
	resize: function(){
		this.inherited(arguments);
		this._processScroll();
	},

	_getFirstRowSibling: function(container){
		// summary:
		//		Returns the DOM node that a new row should be inserted before
		//		when there are no other rows in the current result set.
		//		In the case of OnDemandList, this will always be the last child
		//		of the container (which will be a trailing preload node).
		return container.lastChild;
	},
	
	_calcRowHeight: function(rowElement){
		// summary:
		//		Calculate the height of a row. This is a method so it can be overriden for
		//		plugins that add connected elements to a row, like the tree
		
		var sibling = rowElement.previousSibling;
		
		// If a previous row exists, compare the top of this row with the
		// previous one (in case "rows" are actually rendering side-by-side).
		// If no previous row exists, this is either the first or only row,
		// in which case we count its own height.
		if(sibling && !/\bdgrid-preload\b/.test(sibling.className)){
			return rowElement.offsetTop - sibling.offsetTop;
		}
		
		return rowElement.offsetHeight;
	},
	
	lastScrollTop: 0,
	_processScroll: function(evt){
		// summary:
		//		Checks to make sure that everything in the viewable area has been
		//		downloaded, and triggering a request for the necessary data when needed.
		var grid = this,
			scrollNode = grid.bodyNode,
			// grab current visible top from event if provided, otherwise from node
			visibleTop = (evt && evt.scrollTop) || this.getScrollPosition().y,
			visibleBottom = scrollNode.offsetHeight + visibleTop,
			priorPreload, preloadNode, preload = grid.preload,
			lastScrollTop = grid.lastScrollTop,
			requestBuffer = grid.bufferRows * grid.rowHeight,
			searchBuffer = requestBuffer - grid.rowHeight, // Avoid rounding causing multiple queries
			// References related to emitting dgrid-refresh-complete if applicable
			refreshDfd,
			lastResults,
			lastRows,
			preloadSearchNext = true;
		
		// XXX: I do not know why this happens.
		// munging the actual location of the viewport relative to the preload node by a few pixels in either
		// direction is necessary because at least WebKit on Windows seems to have an error that causes it to
		// not quite get the entire element being focused in the viewport during keyboard navigation,
		// which means it becomes impossible to load more data using keyboard navigation because there is
		// no more data to scroll to to trigger the fetch.
		// 1 is arbitrary and just gets it to work correctly with our current test cases; don’t wanna go
		// crazy and set it to a big number without understanding more about what is going on.
		// wondering if it has to do with border-box or something, but changing the border widths does not
		// seem to make it break more or less, so I do not know…
		var mungeAmount = 1;
		
		grid.lastScrollTop = visibleTop;

		function removeDistantNodes(preload, distanceOff, traversal, below){
			// we check to see the the nodes are "far off"
			var farOffRemoval = grid.farOffRemoval,
				preloadNode = preload.node;
			// by checking to see if it is the farOffRemoval distance away
			if(distanceOff > 2 * farOffRemoval){
				// ok, there is preloadNode that is far off, let's remove rows until we get to in the current viewpoint
				var row, nextRow = preloadNode[traversal];
				var reclaimedHeight = 0;
				var count = 0;
				var toDelete = [];
				while((row = nextRow)){
					var rowHeight = grid._calcRowHeight(row);
					if(reclaimedHeight + rowHeight + farOffRemoval > distanceOff || (nextRow.className.indexOf("dgrid-row") < 0 && nextRow.className.indexOf("dgrid-loading") < 0)){
						// we have reclaimed enough rows or we have gone beyond grid rows, let's call it good
						break;
					}
					var nextRow = row[traversal]; // have to do this before removing it
					reclaimedHeight += rowHeight;
					count += row.count || 1;
					// we just do cleanup here, as we will do a more efficient node destruction in the setTimeout below
					grid.removeRow(row, true);
					toDelete.push(row);
				}
				// now adjust the preloadNode based on the reclaimed space
				preload.count += count;
				if(below){
					preloadNode.rowIndex -= count;
					adjustHeight(preload);
				}else{
					// if it is above, we can calculate the change in exact row changes, which we must do to not mess with the scrolling
					preloadNode.style.height = (preloadNode.offsetHeight + reclaimedHeight) + "px";
				}
				// we remove the elements after expanding the preload node so that the contraction doesn't alter the scroll position
				var trashBin = put("div", toDelete);
				setTimeout(function(){
					// we can defer the destruction until later
					put(trashBin, "!");
				},1);
			}
		}
		
		function adjustHeight(preload, noMax){
			preload.node.style.height = Math.min(preload.count * grid.rowHeight, noMax ? Infinity : grid.maxEmptySpace) + "px";
		}
		function traversePreload(preload, moveNext){
			do{
				preload = moveNext ? preload.next : preload.previous;
			}while(preload && !preload.node.offsetWidth);// skip past preloads that are not currently connected
			return preload;
		}
		while(preload && !preload.node.offsetWidth){
			// skip past preloads that are not currently connected
			preload = preload.previous;
		}
		// there can be multiple preloadNodes (if they split, or multiple queries are created),
		//	so we can traverse them until we find whatever is in the current viewport, making
		//	sure we don't backtrack
		while(preload && preload != priorPreload){
			priorPreload = grid.preload;
			grid.preload = preload;
			preloadNode = preload.node;
			var preloadTop = preloadNode.offsetTop;
			var preloadHeight;
			
			if(visibleBottom + mungeAmount + searchBuffer < preloadTop){
				// the preload is below the line of sight
				preload = traversePreload(preload, (preloadSearchNext = false));
			}else if(visibleTop - mungeAmount - searchBuffer > (preloadTop + (preloadHeight = preloadNode.offsetHeight))){
				// the preload is above the line of sight
				preload = traversePreload(preload, (preloadSearchNext = true));
			}else{
				// the preload node is visible, or close to visible, better show it
				var offset = ((preloadNode.rowIndex ? visibleTop - requestBuffer : visibleBottom) - preloadTop) / grid.rowHeight;
				var count = (visibleBottom - visibleTop + 2 * requestBuffer) / grid.rowHeight;
				// utilize momentum for predictions
				var momentum = Math.max(Math.min((visibleTop - lastScrollTop) * grid.rowHeight, grid.maxRowsPerPage/2), grid.maxRowsPerPage/-2);
				count += Math.min(Math.abs(momentum), 10);
				if(preloadNode.rowIndex == 0){
					// at the top, adjust from bottom to top
					offset -= count;
				}
				offset = Math.max(offset, 0);
				if(offset < 10 && offset > 0 && count + offset < grid.maxRowsPerPage){
					// connect to the top of the preloadNode if possible to avoid excessive adjustments
					count += Math.max(0, offset);
					offset = 0;
				}
				count = Math.min(Math.max(count, grid.minRowsPerPage),
									grid.maxRowsPerPage, preload.count);
				
				if(count == 0){
					preload = traversePreload(preload, preloadSearchNext);
					continue;
				}
				
				count = Math.ceil(count);
				offset = Math.min(Math.floor(offset), preload.count - count);
				var options = lang.mixin(grid.get("queryOptions"), preload.options);
				preload.count -= count;
				var beforeNode = preloadNode,
					keepScrollTo, queryRowsOverlap = grid.queryRowsOverlap,
					below = preloadNode.rowIndex > 0 && preload; 
				if(below){
					// add new rows below
					var previous = preload.previous;
					if(previous){
						removeDistantNodes(previous, visibleTop - (previous.node.offsetTop + previous.node.offsetHeight), 'nextSibling');
						if(offset > 0 && previous.node == preloadNode.previousSibling){
							// all of the nodes above were removed
							offset = Math.min(preload.count, offset);
							preload.previous.count += offset;
							adjustHeight(preload.previous, true);
							preloadNode.rowIndex += offset;
							queryRowsOverlap = 0;
						}else{
							count += offset;
						}
						preload.count -= offset;
					}
					options.start = preloadNode.rowIndex - queryRowsOverlap;
					options.count = Math.min(count + queryRowsOverlap, grid.maxRowsPerPage);
					preloadNode.rowIndex = options.start + options.count;
				}else{
					// add new rows above
					if(preload.next){
						// remove out of sight nodes first
						removeDistantNodes(preload.next, preload.next.node.offsetTop - visibleBottom, 'previousSibling', true);
						var beforeNode = preloadNode.nextSibling;
						if(beforeNode == preload.next.node){
							// all of the nodes were removed, can position wherever we want
							preload.next.count += preload.count - offset;
							preload.next.node.rowIndex = offset + count;
							adjustHeight(preload.next);
							preload.count = offset;
							queryRowsOverlap = 0;
						}else{
							keepScrollTo = true;
						}
						
					}
					options.start = preload.count;
					options.count = Math.min(count + queryRowsOverlap, grid.maxRowsPerPage);
				}
				if(keepScrollTo && beforeNode && beforeNode.offsetWidth){
					keepScrollTo = beforeNode.offsetTop;
				}

				adjustHeight(preload);
				
				// use the query associated with the preload node to get the next "page"
				if("level" in preload.query){
					options.queryLevel = preload.query.level;
				}
				
				// Avoid spurious queries (ideally this should be unnecessary...)
				if(!("queryLevel" in options) && (options.start > grid._total || options.count < 0)){
					continue;
				}
				
				// create a loading node as a placeholder while the data is loaded
				var loadingNode = put(beforeNode, "-div.dgrid-loading[style=height:" + count * grid.rowHeight + "px]"),
					innerNode = put(loadingNode, "div.dgrid-" + (below ? "below" : "above"));
				innerNode.innerHTML = grid.loadingMessage;
				loadingNode.count = count;
				
				// Query now to fill in these rows.
				// Keep _trackError-wrapped results separate, since if results is a
				// promise, it will lose QueryResults functions when chained by `when`
				var results = preload.query(options),
					trackedResults = grid._trackError(function(){ return results; });
				
				if(trackedResults === undefined){
					// Sync query failed
					put(loadingNode, "!");
					return;
				}

				// Isolate the variables in case we make multiple requests
				// (which can happen if we need to render on both sides of an island of already-rendered rows)
				(function(loadingNode, below, keepScrollTo, results){
					lastRows = Deferred.when(grid.renderArray(results, loadingNode, options), function(rows){
						lastResults = results;
						
						// can remove the loading node now
						beforeNode = loadingNode.nextSibling;
						put(loadingNode, "!");
						if(keepScrollTo && beforeNode && beforeNode.offsetWidth){ // beforeNode may have been removed if the query results loading node was a removed as a distant node before rendering 
							// if the preload area above the nodes is approximated based on average
							// row height, we may need to adjust the scroll once they are filled in
							// so we don't "jump" in the scrolling position
							var pos = grid.getScrollPosition();
							grid.scrollTo({
								// Since we already had to query the scroll position,
								// include x to avoid TouchScroll querying it again on its end.
								x: pos.x,
								y: pos.y + beforeNode.offsetTop - keepScrollTo,
								// Don't kill momentum mid-scroll (for TouchScroll only).
								preserveMomentum: true
							});
						}
						
						Deferred.when(results.total || results.length, function(total){
							if(!("queryLevel" in options)){
								grid._total = total;
							}
							if(below){
								// if it is below, we will use the total from the results to update
								// the count of the last preload in case the total changes as later pages are retrieved
								// (not uncommon when total counts are estimated for db perf reasons)
								
								// recalculate the count
								below.count = total - below.node.rowIndex;
								// check to see if we are on the last page
								if(below.count === 0){
									// This is a hack to get Observable to recognize that this is the
									// last page; if the count doesn't match results.length, Observable
									// will think this is the last page and properly handle additions to the bottom
									options.count++;
								}
								// readjust the height
								adjustHeight(below);
							}
						});
						
						// make sure we have covered the visible area
						grid._processScroll();
						return rows;
					}, function (e) {
						put(loadingNode, "!");
						throw e;
					});
				}).call(this, loadingNode, below, keepScrollTo, results);
				preload = preload.previous;
			}
		}
		
		// After iterating, if additional requests have been made mid-refresh,
		// resolve the refresh promise based on the latest results obtained
		if (lastRows && (refreshDfd = this._refreshDeferred)) {
			delete this._refreshDeferred;
			Deferred.when(lastRows, function() {
				refreshDfd.resolve(lastResults);
			});
		}
	},

	removeRow: function(rowElement, justCleanup){
		function chooseIndex(index1, index2){
			return index1 != null ? index1 : index2;
		}

		if(rowElement){
			// Clean up observers that need to be cleaned up.
			var previousNode = rowElement.previousSibling,
				nextNode = rowElement.nextSibling,
				prevIndex = previousNode && chooseIndex(previousNode.observerIndex, previousNode.previousObserverIndex),
				nextIndex = nextNode && chooseIndex(nextNode.observerIndex, nextNode.nextObserverIndex),
				thisIndex = rowElement.observerIndex;

			// Clear the observerIndex on the node being removed so it will not be considered any longer.
			rowElement.observerIndex = undefined;
			if(justCleanup){
				// Save the indexes from the siblings for future calls to removeRow.
				rowElement.nextObserverIndex = nextIndex;
				rowElement.previousObserverIndex = prevIndex;
			}

			// Is this row's observer index different than those on either side?
			if(this.cleanEmptyObservers && thisIndex > -1 && thisIndex !== prevIndex && thisIndex !== nextIndex){
				// This is the last row that references the observer index.  Cancel the observer.
				var observers = this.observers;
				var observer = observers[thisIndex];
				if(observer){
					// justCleanup is set to true when the list is being cleaned out.  The rows are left in the DOM
					// and later they are removed altogether.  Skip the check for overlapping rows because
					// in the end, all of the rows will be removed and all of the observers need to be canceled.
					if(!justCleanup){
					// We need to verify that all the rows really have been removed. If there
					// are overlapping rows, it is possible another element exists
						var rows = observer.rows;
						for(var i = 0; i < rows.length; i++){
							if(rows[i] != rowElement && dom.isDescendant(rows[i], this.domNode)){
								// still rows in this list, abandon
								return this.inherited(arguments);
							}
						}
					}
					observer.cancel();
					this._numObservers--;
					observers[thisIndex] = 0; // remove it so we don't call cancel twice
				}
			}
		}
		// Finish the row removal.
		this.inherited(arguments);
	}
});

});

},
'dgrid/Keyboard':function(){
define("dgrid/Keyboard", [
	"dojo/_base/declare",
	"dojo/aspect",
	"dojo/on",
	"dojo/_base/lang",
	"dojo/has",
	"put-selector/put",
	"./util/misc",
	"dojo/_base/Deferred",
	"dojo/_base/sniff"
], function(declare, aspect, on, lang, has, put, miscUtil, Deferred){

var delegatingInputTypes = {
		checkbox: 1,
		radio: 1,
		button: 1
	},
	hasGridCellClass = /\bdgrid-cell\b/,
	hasGridRowClass = /\bdgrid-row\b/;

var Keyboard = declare(null, {
	// summary:
	//		Adds keyboard navigation capability to a list or grid.
	
	// pageSkip: Number
	//		Number of rows to jump by when page up or page down is pressed.
	pageSkip: 10,
	
	tabIndex: 0,
	
	// keyMap: Object
	//		Hash which maps key codes to functions to be executed (in the context
	//		of the instance) for key events within the grid's body.
	keyMap: null,
	
	// headerKeyMap: Object
	//		Hash which maps key codes to functions to be executed (in the context
	//		of the instance) for key events within the grid's header row.
	headerKeyMap: null,
	
	postMixInProperties: function(){
		this.inherited(arguments);
		
		if(!this.keyMap){
			this.keyMap = lang.mixin({}, Keyboard.defaultKeyMap);
		}
		if(!this.headerKeyMap){
			this.headerKeyMap = lang.mixin({}, Keyboard.defaultHeaderKeyMap);
		}
	},
	
	postCreate: function(){
		this.inherited(arguments);
		var grid = this;
		
		function handledEvent(event){
			// text boxes and other inputs that can use direction keys should be ignored and not affect cell/row navigation
			var target = event.target;
			return target.type && (!delegatingInputTypes[target.type] || event.keyCode == 32);
		}
		
		function enableNavigation(areaNode){
			var cellNavigation = grid.cellNavigation,
				isFocusableClass = cellNavigation ? hasGridCellClass : hasGridRowClass,
				isHeader = areaNode === grid.headerNode,
				initialNode = areaNode;
			
			function initHeader(){
				if(grid._focusedHeaderNode){
					// Remove the tab index for the node that previously had it.
					grid._focusedHeaderNode.tabIndex = -1;
				}
				if(grid.showHeader){
					// Set the tab index only if the header is visible.
					grid._focusedHeaderNode = initialNode =
						cellNavigation ? grid.headerNode.getElementsByTagName("th")[0] : grid.headerNode;
					if(initialNode){ initialNode.tabIndex = grid.tabIndex; }
				}
			}
			
			if(isHeader){
				// Initialize header now (since it's already been rendered),
				// and aspect after future renderHeader calls to reset focus.
				initHeader();
				aspect.after(grid, "renderHeader", initHeader, true);
			}else{
				aspect.after(grid, "renderArray", function(ret){
					// summary:
					//		Ensures the first element of a grid is always keyboard selectable after data has been
					//		retrieved if there is not already a valid focused element.
					
					return Deferred.when(ret, function(ret){
						var focusedNode = grid._focusedNode || initialNode;
						
						// do not update the focused element if we already have a valid one
						if(isFocusableClass.test(focusedNode.className) && miscUtil.contains(areaNode, focusedNode)){
							return ret;
						}
						
						// ensure that the focused element is actually a grid cell, not a
						// dgrid-preload or dgrid-content element, which should not be focusable,
						// even when data is loaded asynchronously
						for(var i = 0, elements = areaNode.getElementsByTagName("*"), element; (element = elements[i]); ++i){
							if(isFocusableClass.test(element.className)){
								focusedNode = grid._focusedNode = element;
								break;
							}
						}
						
						focusedNode.tabIndex = grid.tabIndex;
						return ret;
					});
				});
			}
			
			grid._listeners.push(on(areaNode, "mousedown", function(event){
				if(!handledEvent(event)){
					grid._focusOnNode(event.target, isHeader, event);
				}
			}));
			
			grid._listeners.push(on(areaNode, "keydown", function(event){
				// For now, don't squash browser-specific functionalities by letting
				// ALT and META function as they would natively
				if(event.metaKey || event.altKey) {
					return;
				}
				
				var handler = grid[isHeader ? "headerKeyMap" : "keyMap"][event.keyCode];
				
				// Text boxes and other inputs that can use direction keys should be ignored and not affect cell/row navigation
				if(handler && !handledEvent(event)){
					handler.call(grid, event);
				}
			}));
		}
		
		if(this.tabableHeader){
			enableNavigation(this.headerNode);
			on(this.headerNode, "dgrid-cellfocusin", function(){
				grid.scrollTo({ x: this.scrollLeft });
			});
		}
		enableNavigation(this.contentNode);
	},
	
	removeRow: function(rowElement){
		if(!this._focusedNode){
			// Nothing special to do if we have no record of anything focused
			return this.inherited(arguments);
		}
		
		var self = this,
			isActive = document.activeElement === this._focusedNode,
			focusedTarget = this[this.cellNavigation ? "cell" : "row"](this._focusedNode),
			focusedRow = focusedTarget.row || focusedTarget,
			sibling;
		rowElement = rowElement.element || rowElement;
		
		// If removed row previously had focus, temporarily store information
		// to be handled in an immediately-following insertRow call, or next turn
		if(rowElement === focusedRow.element){
			sibling = this.down(focusedRow, true);
			
			// Check whether down call returned the same row, or failed to return
			// any (e.g. during a partial unrendering)
			if (!sibling || sibling.element === rowElement) {
				sibling = this.up(focusedRow, true);
			}
			
			this._removedFocus = {
				active: isActive,
				rowId: focusedRow.id,
				columnId: focusedTarget.column && focusedTarget.column.id,
				siblingId: !sibling || sibling.element === rowElement ? undefined : sibling.id
			};
			
			// Call _restoreFocus on next turn, to restore focus to sibling
			// if no replacement row was immediately inserted.
			// Pass original row's id in case it was re-inserted in a renderArray
			// call (and thus was found, but couldn't be focused immediately)
			setTimeout(function() {
				if(self._removedFocus){
					self._restoreFocus(focusedRow.id);
				}
			}, 0);
			
			// Clear _focusedNode until _restoreFocus is called, to avoid
			// needlessly re-running this logic
			this._focusedNode = null;
		}
		
		this.inherited(arguments);
	},
	
	insertRow: function(object){
		var rowElement = this.inherited(arguments);
		if(this._removedFocus && !this._removedFocus.wait){
			this._restoreFocus(rowElement);
		}
		return rowElement;
	},
	
	_restoreFocus: function(row) {
		// summary:
		//		Restores focus to the newly inserted row if it matches the
		//		previously removed row, or to the nearest sibling otherwise.
		
		var focusInfo = this._removedFocus,
			newTarget,
			cell;
		
		row = row && this.row(row);
		newTarget = row && row.element && row.id === focusInfo.rowId ? row :
			typeof focusInfo.siblingId !== "undefined" && this.row(focusInfo.siblingId);
		
		if(newTarget && newTarget.element){
			if(!newTarget.element.parentNode.parentNode){
				// This was called from renderArray, so the row hasn't
				// actually been placed in the DOM yet; handle it on the next
				// turn (called from removeRow).
				focusInfo.wait = true;
				return;
			}
			// Should focus be on a cell?
			if(typeof focusInfo.columnId !== "undefined"){
				cell = this.cell(newTarget, focusInfo.columnId);
				if(cell && cell.element){
					newTarget = cell;
				}
			}
			if(focusInfo.active && newTarget.element.offsetHeight !== 0){
				// Row/cell was previously focused and is visible, so focus the new one immediately
				this.focus(newTarget);
			}else{
				// Row/cell was not focused or is not visible, but we still need to update tabIndex
				// and the element's class to be consistent with the old one
				put(newTarget.element, ".dgrid-focus");
				newTarget.element.tabIndex = this.tabIndex;
			}
		}
		
		delete this._removedFocus;
	},
	
	addKeyHandler: function(key, callback, isHeader){
		// summary:
		//		Adds a handler to the keyMap on the instance.
		//		Supports binding additional handlers to already-mapped keys.
		// key: Number
		//		Key code representing the key to be handled.
		// callback: Function
		//		Callback to be executed (in instance context) when the key is pressed.
		// isHeader: Boolean
		//		Whether the handler is to be added for the grid body (false, default)
		//		or the header (true).
		
		// Aspects may be about 10% slower than using an array-based appraoch,
		// but there is significantly less code involved (here and above).
		return aspect.after( // Handle
			this[isHeader ? "headerKeyMap" : "keyMap"], key, callback, true);
	},
	
	_focusOnNode: function(element, isHeader, event){
		var focusedNodeProperty = "_focused" + (isHeader ? "Header" : "") + "Node",
			focusedNode = this[focusedNodeProperty],
			cellOrRowType = this.cellNavigation ? "cell" : "row",
			cell = this[cellOrRowType](element),
			inputs,
			input,
			numInputs,
			inputFocused,
			i;
		
		element = cell && cell.element;
		if(!element){ return; }
		
		if(this.cellNavigation){
			inputs = element.getElementsByTagName("input");
			for(i = 0, numInputs = inputs.length; i < numInputs; i++){
				input = inputs[i];
				if((input.tabIndex != -1 || "lastValue" in input) && !input.disabled){
					// Employ workaround for focus rectangle in IE < 8
					if(has("ie") < 8){ input.style.position = "relative"; }
					input.focus();
					if(has("ie") < 8){ input.style.position = ""; }
					inputFocused = true;
					break;
				}
			}
		}
		
		event = lang.mixin({ grid: this }, event);
		if(event.type){
			event.parentType = event.type;
		}
		if(!event.bubbles){
			// IE doesn't always have a bubbles property already true.
			// Opera throws if you try to set it to true if it is already true.
			event.bubbles = true;
		}
		if(focusedNode){
			// Clean up previously-focused element
			// Remove the class name and the tabIndex attribute
			put(focusedNode, "!dgrid-focus[!tabIndex]");
			if(has("ie") < 8){
				// Clean up after workaround below (for non-input cases)
				focusedNode.style.position = "";
			}
			
			// Expose object representing focused cell or row losing focus, via
			// event.cell or event.row; which is set depends on cellNavigation.
			event[cellOrRowType] = this[cellOrRowType](focusedNode);
			on.emit(element, "dgrid-cellfocusout", event);
		}
		focusedNode = this[focusedNodeProperty] = element;
		
		// Expose object representing focused cell or row gaining focus, via
		// event.cell or event.row; which is set depends on cellNavigation.
		// Note that yes, the same event object is being reused; on.emit
		// performs a shallow copy of properties into a new event object.
		event[cellOrRowType] = cell;
		
		var isFocusableClass = this.cellNavigation ? hasGridCellClass : hasGridRowClass;
		if(!inputFocused && isFocusableClass.test(element.className)){
			if(has("ie") < 8){
				// setting the position to relative magically makes the outline
				// work properly for focusing later on with old IE.
				// (can't be done a priori with CSS or screws up the entire table)
				element.style.position = "relative";
			}
			element.tabIndex = this.tabIndex;
			element.focus();
		}
		put(element, ".dgrid-focus");
		on.emit(focusedNode, "dgrid-cellfocusin", event);
	},
	
	focusHeader: function(element){
		this._focusOnNode(element || this._focusedHeaderNode, true);
	},
	
	focus: function(element){
		this._focusOnNode(element || this._focusedNode, false);
	}
});

// Common functions used in default keyMap (called in instance context)

var moveFocusVertical = Keyboard.moveFocusVertical = function(event, steps){
	var cellNavigation = this.cellNavigation,
		target = this[cellNavigation ? "cell" : "row"](event),
		columnId = cellNavigation && target.column.id,
		next = this.down(this._focusedNode, steps, true);
	
	// Navigate within same column if cell navigation is enabled
	if(cellNavigation){ next = this.cell(next, columnId); }
	this._focusOnNode(next, false, event);
	
	event.preventDefault();
};

var moveFocusUp = Keyboard.moveFocusUp = function(event){
	moveFocusVertical.call(this, event, -1);
};

var moveFocusDown = Keyboard.moveFocusDown = function(event){
	moveFocusVertical.call(this, event, 1);
};

var moveFocusPageUp = Keyboard.moveFocusPageUp = function(event){
	moveFocusVertical.call(this, event, -this.pageSkip);
};

var moveFocusPageDown = Keyboard.moveFocusPageDown = function(event){
	moveFocusVertical.call(this, event, this.pageSkip);
};

var moveFocusHorizontal = Keyboard.moveFocusHorizontal = function(event, steps){
	if(!this.cellNavigation){ return; }
	var isHeader = !this.row(event), // header reports row as undefined
		currentNode = this["_focused" + (isHeader ? "Header" : "") + "Node"];
	
	this._focusOnNode(this.right(currentNode, steps), isHeader, event);
	event.preventDefault();
};

var moveFocusLeft = Keyboard.moveFocusLeft = function(event){
	moveFocusHorizontal.call(this, event, -1);
};

var moveFocusRight = Keyboard.moveFocusRight = function(event){
	moveFocusHorizontal.call(this, event, 1);
};

var moveHeaderFocusEnd = Keyboard.moveHeaderFocusEnd = function(event, scrollToBeginning){
	// Header case is always simple, since all rows/cells are present
	var nodes;
	if(this.cellNavigation){
		nodes = this.headerNode.getElementsByTagName("th");
		this._focusOnNode(nodes[scrollToBeginning ? 0 : nodes.length - 1], true, event);
	}
	// In row-navigation mode, there's nothing to do - only one row in header
	
	// Prevent browser from scrolling entire page
	event.preventDefault();
};

var moveHeaderFocusHome = Keyboard.moveHeaderFocusHome = function(event){
	moveHeaderFocusEnd.call(this, event, true);
};

var moveFocusEnd = Keyboard.moveFocusEnd = function(event, scrollToTop){
	// summary:
	//		Handles requests to scroll to the beginning or end of the grid.
	
	// Assume scrolling to top unless event is specifically for End key
	var self = this,
		cellNavigation = this.cellNavigation,
		contentNode = this.contentNode,
		contentPos = scrollToTop ? 0 : contentNode.scrollHeight,
		scrollPos = contentNode.scrollTop + contentPos,
		endChild = contentNode[scrollToTop ? "firstChild" : "lastChild"],
		hasPreload = endChild.className.indexOf("dgrid-preload") > -1,
		endTarget = hasPreload ? endChild[(scrollToTop ? "next" : "previous") + "Sibling"] : endChild,
		endPos = endTarget.offsetTop + (scrollToTop ? 0 : endTarget.offsetHeight),
		handle;
	
	if(hasPreload){
		// Find the nearest dgrid-row to the relevant end of the grid
		while(endTarget && endTarget.className.indexOf("dgrid-row") < 0){
			endTarget = endTarget[(scrollToTop ? "next" : "previous") + "Sibling"];
		}
		// If none is found, there are no rows, and nothing to navigate
		if(!endTarget){ return; }
	}
	
	// Grid content may be lazy-loaded, so check if content needs to be
	// loaded first
	if(!hasPreload || endChild.offsetHeight < 1){
		// End row is loaded; focus the first/last row/cell now
		if(cellNavigation){
			// Preserve column that was currently focused
			endTarget = this.cell(endTarget, this.cell(event).column.id);
		}
		this._focusOnNode(endTarget, false, event);
	}else{
		// In IE < 9, the event member references will become invalid by the time
		// _focusOnNode is called, so make a (shallow) copy up-front
		if(!has("dom-addeventlistener")){
			event = lang.mixin({}, event);
		}
		
		// If the topmost/bottommost row rendered doesn't reach the top/bottom of
		// the contentNode, we are using OnDemandList and need to wait for more
		// data to render, then focus the first/last row in the new content.
		handle = aspect.after(this, "renderArray", function(rows){
			handle.remove();
			return Deferred.when(rows, function(rows){
				var target = rows[scrollToTop ? 0 : rows.length - 1];
				if(cellNavigation){
					// Preserve column that was currently focused
					target = self.cell(target, self.cell(event).column.id);
				}
				self._focusOnNode(target, false, event);
			});
		});
	}
	
	if(scrollPos === endPos){
		// Grid body is already scrolled to end; prevent browser from scrolling
		// entire page instead
		event.preventDefault();
	}
};

var moveFocusHome = Keyboard.moveFocusHome = function(event){
	moveFocusEnd.call(this, event, true);
};

function preventDefault(event){
	event.preventDefault();
}

Keyboard.defaultKeyMap = {
	32: preventDefault, // space
	33: moveFocusPageUp, // page up
	34: moveFocusPageDown, // page down
	35: moveFocusEnd, // end
	36: moveFocusHome, // home
	37: moveFocusLeft, // left
	38: moveFocusUp, // up
	39: moveFocusRight, // right
	40: moveFocusDown // down
};

// Header needs fewer default bindings (no vertical), so bind it separately
Keyboard.defaultHeaderKeyMap = {
	32: preventDefault, // space
	35: moveHeaderFocusEnd, // end
	36: moveHeaderFocusHome, // home
	37: moveFocusLeft, // left
	39: moveFocusRight // right
};

return Keyboard;
});
},
'dgrid/List':function(){
define("dgrid/List", ["dojo/_base/kernel", "dojo/_base/declare", "dojo/dom", "dojo/on", "dojo/has", "./util/misc", "dojo/has!touch?./TouchScroll", "xstyle/has-class", "put-selector/put", "dojo/_base/sniff", "xstyle/css!./css/dgrid.css"],
function(kernel, declare, dom, listen, has, miscUtil, TouchScroll, hasClass, put){
	// Add user agent/feature CSS classes 
	hasClass("mozilla", "opera", "webkit", "ie", "ie-6", "ie-6-7", "quirks", "no-quirks", "touch");
	
	var oddClass = "dgrid-row-odd",
		evenClass = "dgrid-row-even",
		scrollbarWidth, scrollbarHeight;
	
	function byId(id){
		return document.getElementById(id);
	}
	
	function cleanupTestElement(element){
		element.className = "";
		document.body.removeChild(element);
	}
	
	function getScrollbarSize(element, dimension){
		// Used by has tests for scrollbar width/height
		put(document.body, element, ".dgrid-scrollbar-measure");
		var size = element["offset" + dimension] - element["client" + dimension];
		cleanupTestElement(element);
		return size;
	}
	has.add("dom-scrollbar-width", function(global, doc, element){
		return getScrollbarSize(element, "Width");
	});
	has.add("dom-scrollbar-height", function(global, doc, element){
		return getScrollbarSize(element, "Height");
	});
	
	has.add("dom-rtl-scrollbar-left", function(global, doc, element){
		var div = put("div"),
			isLeft;
		
		put(document.body, element, ".dgrid-scrollbar-measure[dir=rtl]");
		put(element, div);
		
		// position: absolute makes IE always report child's offsetLeft as 0,
		// but it conveniently makes other browsers reset to 0 as base, and all
		// versions of IE are known to move the scrollbar to the left side for rtl
		isLeft = !!has("ie") || !!has("trident") || div.offsetLeft >= has("dom-scrollbar-width");
		cleanupTestElement(element);
		put(div, "!");
		element.removeAttribute("dir");
		return isLeft;
	});
	
	// var and function for autogenerating ID when one isn't provided
	var autogen = 0;
	function generateId(){
		return "dgrid_" + autogen++;
	}
	
	// common functions for class and className setters/getters
	// (these are run in instance context)
	var spaceRx = / +/g;
	function setClass(cls){
		// Format input appropriately for use with put...
		var putClass = cls ? "." + cls.replace(spaceRx, ".") : "";
		
		// Remove any old classes, and add new ones.
		if(this._class){
			putClass = "!" + this._class.replace(spaceRx, "!") + putClass;
		}
		put(this.domNode, putClass);
		
		// Store for later retrieval/removal.
		this._class = cls;
	}
	function getClass(){
		return this._class;
	}
	
	// window resize event handler, run in context of List instance
	var winResizeHandler = has("ie") < 7 && !has("quirks") ? function(){
		// IE6 triggers window.resize on any element resize;
		// avoid useless calls (and infinite loop if height: auto).
		// The measurement logic here is based on dojo/window logic.
		var root, w, h, dims;
		
		if(!this._started){ return; } // no sense calling resize yet
		
		root = document.documentElement;
		w = root.clientWidth;
		h = root.clientHeight;
		dims = this._prevWinDims || [];
		if(dims[0] !== w || dims[1] !== h){
			this.resize();
			this._prevWinDims = [w, h];
		}
	} :
	function(){
		if(this._started){ this.resize(); }
	};
	
	// Desktop versions of functions, deferred to when there is no touch support,
	// or when the useTouchScroll instance property is set to false
	
	function desktopGetScrollPosition(){
		return {
			x: this.bodyNode.scrollLeft,
			y: this.bodyNode.scrollTop
		};
	}
	
	function desktopScrollTo(options){
		if(typeof options.x !== "undefined"){
			this.bodyNode.scrollLeft = options.x;
		}
		if(typeof options.y !== "undefined"){
			this.bodyNode.scrollTop = options.y;
		}
	}
	
	return declare(has("touch") ? TouchScroll : null, {
		tabableHeader: false,
		// showHeader: Boolean
		//		Whether to render header (sub)rows.
		showHeader: false,
		
		// showFooter: Boolean
		//		Whether to render footer area.  Extensions which display content
		//		in the footer area should set this to true.
		showFooter: false,
		
		// maintainOddEven: Boolean
		//		Whether to maintain the odd/even classes when new rows are inserted.
		//		This can be disabled to improve insertion performance if odd/even styling is not employed.
		maintainOddEven: true,
		
		// cleanAddedRules: Boolean
		//		Whether to track rules added via the addCssRule method to be removed
		//		when the list is destroyed.  Note this is effective at the time of
		//		the call to addCssRule, not at the time of destruction.
		cleanAddedRules: true,
		
		// useTouchScroll: Boolean
		//		If touch support is available, this determines whether to
		//		incorporate logic from the TouchScroll module (at the expense of
		//		normal desktop/mouse or native mobile scrolling functionality).
		useTouchScroll: null,
		
		// addUiClasses: Boolean
		//		Whether to add jQuery UI classes to various elements in dgrid's DOM.
		addUiClasses: true,

		// cleanEmptyObservers: Boolean
		//		Whether to clean up observers for empty result sets.
		cleanEmptyObservers: true,

		// highlightDuration: Integer
		//		The amount of time (in milliseconds) that a row should remain
		//		highlighted after it has been updated.
		highlightDuration: 250,
		
		postscript: function(params, srcNodeRef){
			// perform setup and invoke create in postScript to allow descendants to
			// perform logic before create/postCreate happen (a la dijit/_WidgetBase)
			var grid = this;
			
			(this._Row = function(id, object, element){
				this.id = id;
				this.data = object;
				this.element = element;
			}).prototype.remove = function(){
				grid.removeRow(this.element);
			};
			
			if(srcNodeRef){
				// normalize srcNodeRef and store on instance during create process.
				// Doing this in postscript is a bit earlier than dijit would do it,
				// but allows subclasses to access it pre-normalized during create.
				this.srcNodeRef = srcNodeRef =
					srcNodeRef.nodeType ? srcNodeRef : byId(srcNodeRef);
			}
			this.create(params, srcNodeRef);
		},
		listType: "list",
		
		create: function(params, srcNodeRef){
			var domNode = this.domNode = srcNodeRef || put("div"),
				cls;
			
			if(params){
				this.params = params;
				declare.safeMixin(this, params);
				
				// Check for initial class or className in params or on domNode
				cls = params["class"] || params.className || domNode.className;
				
				// handle sort param - TODO: revise @ 0.4 when _sort -> sort
				this._sort = params.sort || [];
				delete this.sort; // ensure back-compat method isn't shadowed
			}else{
				this._sort = [];
			}
			
			// ensure arrays and hashes are initialized
			this.observers = [];
			this._numObservers = 0;
			this._listeners = [];
			this._rowIdToObject = {};
			
			this.postMixInProperties && this.postMixInProperties();
			
			// Apply id to widget and domNode,
			// from incoming node, widget params, or autogenerated.
			this.id = domNode.id = domNode.id || this.id || generateId();
			
			// If useTouchScroll wasn't explicitly set on the instance, set it
			// now during creation (not up-front, in case document isn't ready)
			if(this.useTouchScroll === null){
				this.useTouchScroll = !has("dom-scrollbar-width");
			}
			
			// Perform initial rendering, and apply classes if any were specified.
			this.buildRendering();
			if(cls){ setClass.call(this, cls); }
			
			this.postCreate();
			
			// remove srcNodeRef instance property post-create
			delete this.srcNodeRef;
			// to preserve "it just works" behavior, call startup if we're visible
			if(this.domNode.offsetHeight){
				this.startup();
			}
		},
		buildRendering: function(){
			var domNode = this.domNode,
				addUiClasses = this.addUiClasses,
				self = this,
				headerNode, spacerNode, bodyNode, footerNode, isRTL;
			
			// Detect RTL on html/body nodes; taken from dojo/dom-geometry
			isRTL = this.isRTL = (document.body.dir || document.documentElement.dir ||
				document.body.style.direction).toLowerCase() == "rtl";
			
			// Clear out className (any pre-applied classes will be re-applied via the
			// class / className setter), then apply standard classes/attributes
			domNode.className = "";
			
			put(domNode, "[role=grid].dgrid.dgrid-" + this.listType +
				(addUiClasses ? ".ui-widget" : ""));
			
			// Place header node (initially hidden if showHeader is false).
			headerNode = this.headerNode = put(domNode, 
				"div.dgrid-header.dgrid-header-row" +
				(addUiClasses ? ".ui-widget-header" : "") +
				(this.showHeader ? "" : ".dgrid-header-hidden"));
			if(has("quirks") || has("ie") < 8){
				spacerNode = put(domNode, "div.dgrid-spacer");
			}
			bodyNode = this.bodyNode = put(domNode, "div.dgrid-scroller");
			
			// Firefox 4+ adds overflow: auto elements to the tab index by default;
			// force them to not be tabbable, but restrict this to Firefox,
			// since it breaks accessibility support in other browsers
			if(has("ff")){
				bodyNode.tabIndex = -1;
			}
			
			this.headerScrollNode = put(domNode, "div.dgrid-header.dgrid-header-scroll.dgrid-scrollbar-width" +
				(addUiClasses ? ".ui-widget-header" : ""));
			
			// Place footer node (initially hidden if showFooter is false).
			footerNode = this.footerNode = put("div.dgrid-footer" +
				(this.showFooter ? "" : ".dgrid-footer-hidden"));
			put(domNode, footerNode);
			
			if(isRTL){
				domNode.className += " dgrid-rtl" +
					(has("dom-rtl-scrollbar-left") ? " dgrid-rtl-swap" : "");
			}
			
			listen(bodyNode, "scroll", function(event){
				if(self.showHeader){
					// keep the header aligned with the body
					headerNode.scrollLeft = event.scrollLeft || bodyNode.scrollLeft;
				}
				// re-fire, since browsers are not consistent about propagation here
				event.stopPropagation();
				listen.emit(domNode, "scroll", {scrollTarget: bodyNode});
			});
			this.configStructure();
			this.renderHeader();
			
			this.contentNode = this.touchNode = put(this.bodyNode,
				"div.dgrid-content" + (addUiClasses ? ".ui-widget-content" : ""));
			// add window resize handler, with reference for later removal if needed
			this._listeners.push(this._resizeHandle = listen(window, "resize",
				miscUtil.throttleDelayed(winResizeHandler, this)));
		},
		
		postCreate: has("touch") ? function(){
			if(this.useTouchScroll){
				this.inherited(arguments);
			}
		} : function(){},
		
		startup: function(){
			// summary:
			//		Called automatically after postCreate if the component is already
			//		visible; otherwise, should be called manually once placed.
			
			if(this._started){ return; } // prevent double-triggering
			this.inherited(arguments);
			this._started = true;
			this.resize();
			// apply sort (and refresh) now that we're ready to render
			this.set("sort", this._sort);
		},
		
		configStructure: function(){
			// does nothing in List, this is more of a hook for the Grid
		},
		resize: function(){
			var
				bodyNode = this.bodyNode,
				headerNode = this.headerNode,
				footerNode = this.footerNode,
				headerHeight = headerNode.offsetHeight,
				footerHeight = this.showFooter ? footerNode.offsetHeight : 0,
				quirks = has("quirks") || has("ie") < 7;
			
			this.headerScrollNode.style.height = bodyNode.style.marginTop = headerHeight + "px";
			bodyNode.style.marginBottom = footerHeight + "px";
			
			if(quirks){
				// in IE6 and quirks mode, the "bottom" CSS property is ignored.
				// We guard against negative values in case of issues with external CSS.
				bodyNode.style.height = ""; // reset first
				bodyNode.style.height =
					Math.max((this.domNode.offsetHeight - headerHeight - footerHeight), 0) + "px";
				if (footerHeight) {
					// Work around additional glitch where IE 6 / quirks fails to update
					// the position of the bottom-aligned footer; this jogs its memory.
					footerNode.style.bottom = '1px';
					setTimeout(function(){ footerNode.style.bottom = ''; }, 0);
				}
			}
			
			if(!scrollbarWidth){
				// Measure the browser's scrollbar width using a DIV we'll delete right away
				scrollbarWidth = has("dom-scrollbar-width");
				scrollbarHeight = has("dom-scrollbar-height");
				
				// Avoid issues with certain widgets inside in IE7, and
				// ColumnSet scroll issues with all supported IE versions
				if(has("ie")){
					scrollbarWidth++;
					scrollbarHeight++;
				}
				
				// add rules that can be used where scrollbar width/height is needed
				miscUtil.addCssRule(".dgrid-scrollbar-width", "width: " + scrollbarWidth + "px");
				miscUtil.addCssRule(".dgrid-scrollbar-height", "height: " + scrollbarHeight + "px");
				
				if(scrollbarWidth != 17 && !quirks){
					// for modern browsers, we can perform a one-time operation which adds
					// a rule to account for scrollbar width in all grid headers.
					miscUtil.addCssRule(".dgrid-header-row", "right: " + scrollbarWidth + "px");
					// add another for RTL grids
					miscUtil.addCssRule(".dgrid-rtl-swap .dgrid-header-row", "left: " + scrollbarWidth + "px");
				}
			}
			
			if(quirks){
				// old IE doesn't support left + right + width:auto; set width directly
				headerNode.style.width = bodyNode.clientWidth + "px";
				setTimeout(function(){
					// sync up (after the browser catches up with the new width)
					headerNode.scrollLeft = bodyNode.scrollLeft;
				}, 0);
			}
		},
		
		addCssRule: function(selector, css){
			// summary:
			//		Version of util/misc.addCssRule which tracks added rules and removes
			//		them when the List is destroyed.
			
			var rule = miscUtil.addCssRule(selector, css);
			if(this.cleanAddedRules){
				// Although this isn't a listener, it shares the same remove contract
				this._listeners.push(rule);
			}
			return rule;
		},
		
		on: function(eventType, listener){
			// delegate events to the domNode
			var signal = listen(this.domNode, eventType, listener);
			if(!has("dom-addeventlistener")){
				this._listeners.push(signal);
			}
			return signal;
		},
		
		cleanup: function(){
			// summary:
			//		Clears out all rows currently in the list.
			
			var observers = this.observers,
				i;
			for(i in this._rowIdToObject){
				if(this._rowIdToObject[i] != this.columns){
					var rowElement = byId(i);
					if(rowElement){
						this.removeRow(rowElement, true);
					}
				}
			}
			// remove any store observers
			for(i = 0;i < observers.length; i++){
				var observer = observers[i];
				observer && observer.cancel();
			}
			this.observers = [];
			this._numObservers = 0;
			this.preload = null;
		},
		destroy: function(){
			// summary:
			//		Destroys this grid
			
			// Remove any event listeners and other such removables
			if(this._listeners){ // Guard against accidental subsequent calls to destroy
				for(var i = this._listeners.length; i--;){
					this._listeners[i].remove();
				}
				delete this._listeners;
			}
			
			this._started = false;
			this.cleanup();
			// destroy DOM
			put(this.domNode, "!");
			
			if(this.useTouchScroll){
				// Only call TouchScroll#destroy if we also initialized it
				this.inherited(arguments);
			}
		},
		refresh: function(){
			// summary:
			//		refreshes the contents of the grid
			this.cleanup();
			this._rowIdToObject = {};
			this._autoId = 0;
			
			// make sure all the content has been removed so it can be recreated
			this.contentNode.innerHTML = "";
			// Ensure scroll position always resets (especially for TouchScroll).
			this.scrollTo({ x: 0, y: 0 });
		},
		
		newRow: function(object, parentNode, beforeNode, i, options){
			if(parentNode){
				var row = this.insertRow(object, parentNode, beforeNode, i, options);
				put(row, ".dgrid-highlight" +
					(this.addUiClasses ? ".ui-state-highlight" : ""));
				setTimeout(function(){
					put(row, "!dgrid-highlight!ui-state-highlight");
				}, this.highlightDuration);
				return row;
			}
		},
		adjustRowIndices: function(firstRow){
			// this traverses through rows to maintain odd/even classes on the rows when indexes shift;
			var next = firstRow;
			var rowIndex = next.rowIndex;
			if(rowIndex > -1){ // make sure we have a real number in case this is called on a non-row
				do{
					// Skip non-numeric, non-rows
					if(next.rowIndex > -1){
						if(this.maintainOddEven){
							if((next.className + ' ').indexOf("dgrid-row ") > -1){
								put(next, '.' + (rowIndex % 2 == 1 ? oddClass : evenClass) + '!' + (rowIndex % 2 == 0 ? oddClass : evenClass));
							}
						}
						next.rowIndex = rowIndex++;
					}
				}while((next = next.nextSibling) && next.rowIndex != rowIndex);
			}
		},
		renderArray: function(results, beforeNode, options){
			// summary:
			//		This renders an array or collection of objects as rows in the grid, before the
			//		given node. This will listen for changes in the collection if an observe method
			//		is available (as it should be if it comes from an Observable data store).
			options = options || {};
			var self = this,
				start = options.start || 0,
				observers = this.observers,
				rows, container, observerIndex;
			
			if(!beforeNode){
				this._lastCollection = results;
			}
			if(results.observe){
				// observe the results for changes
				self._numObservers++;
				var observer = results.observe(function(object, from, to){
					var row, firstRow, nextNode, parentNode;
					
					function advanceNext() {
						nextNode = (nextNode.connected || nextNode).nextSibling;
					}
					
					// a change in the data took place
					if(from > -1 && rows[from]){
						// remove from old slot
						row = rows.splice(from, 1)[0];
						// check to make sure the node is still there before we try to remove it
						// (in case it was moved to a different place in the DOM)
						if(row.parentNode == container){
							firstRow = row.nextSibling;
							if(firstRow){ // it's possible for this to have been already removed if it is in overlapping query results
								if(from != to){ // if from and to are identical, it is an in-place update and we don't want to alter the rowIndex at all
									firstRow.rowIndex--; // adjust the rowIndex so adjustRowIndices has the right starting point
								}
							}
							self.removeRow(row);
						}
						// Update count to reflect that we lost one row
						options.count--;
						// The removal of rows could cause us to need to page in more items
						if(self._processScroll){
							self._processScroll();
						}
					}
					if(to > -1){
						// Add to new slot (either before an existing row, or at the end)
						// First determine the DOM node that this should be placed before.
						if(rows.length){
							if(to === 0){ // if it is the first row, we can safely get the next item
								nextNode = rows[to];
								// Re-retrieve the element in case we are referring to an orphan
								nextNode = nextNode && correctElement(nextNode);
							}else{
								// If we are near the end of the page, we may not be able to retrieve the 
								// result from our own array, so go from the previous row and advance one
								nextNode = rows[to - 1];
								if(nextNode){
									nextNode = correctElement(nextNode);
									// Make sure to skip connected nodes, so we don't accidentally
									// insert a row in between a parent and its children.
									advanceNext();
								}
							}
						}else{
							// There are no rows.  Allow for subclasses to insert new rows somewhere other than
							// at the end of the parent node.
							nextNode = self._getFirstRowSibling && self._getFirstRowSibling(container);
						}
						// Make sure we don't trip over a stale reference to a
						// node that was removed, or try to place a node before
						// itself (due to overlapped queries)
						if(row && nextNode && row.id === nextNode.id){
							advanceNext();
						}
						if(nextNode && !nextNode.parentNode){
							nextNode = byId(nextNode.id);
						}
						parentNode = (beforeNode && beforeNode.parentNode) ||
							(nextNode && nextNode.parentNode) || self.contentNode;
						row = self.newRow(object, parentNode, nextNode, options.start + to, options);
						
						if(row){
							row.observerIndex = observerIndex;
							rows.splice(to, 0, row);
							if(!firstRow || to < from){
								// the inserted row is first, so we update firstRow to point to it
								var previous = row.previousSibling;
								// if we are not in sync with the previous row, roll the firstRow back one so adjustRowIndices can sync everything back up.
								firstRow = !previous || previous.rowIndex + 1 == row.rowIndex || row.rowIndex == 0 ?
									row : previous;
							}
						}
						options.count++;
					}
					
					if(from === 0){
						overlapRows(1, 1);
					}else if(from === results.length - (to === -1 ? 0 : 1)){
						// It was (re)moved from the end
						// (which was the previous length if it was a removal)
						overlapRows(0, 0);
					}
					
					from != to && firstRow && self.adjustRowIndices(firstRow);
					self._onNotification(rows, object, from, to);
				}, true);
				observerIndex = observers.push(observer) - 1;
			}
			var rowsFragment = document.createDocumentFragment(),
				lastRow;

			function overlapRows(){
				// This is responsible for setting row overlaps in result sets to
				// ensure that observable can always properly determine which page
				// an object belongs to.
				// This function uses kind of an esoteric argument, optimized for
				// performance and size, since it is called quite frequently.
				// `sides` is an array of overlapping operations, with a falsy item indicating
				// to add an overlap to the top, and a truthy item means to add an overlap
				// to the bottom (so [0, 1] adds one overlap to the top and the bottom)
				
				var sides = arguments;
				// Only perform row overlap in the case of observable results
				if(observerIndex > -1){
					// Iterate through the sides operations
					for(var i = 0; i < sides.length; i++){
						var top = sides[i];
						var lastRow = rows[top ? 0 : rows.length-1];
						lastRow = lastRow && correctElement(lastRow);
						// check to make sure we have a row, we won't if we don't have any rows
						if(lastRow){
							// Make sure we have the correct row element
							// (not one that was previously removed)
							var row = lastRow[top ? "previousSibling" : "nextSibling"];
							if(row){
								row = self.row(row);
							}
							if(row && row.element != lastRow){
								var method = top ? "unshift" : "push";
								// Take the row and data from the adjacent page and unshift to the
								// top or push to the bottom of our array of rows and results,
								// and adjust the count
								results[method](row.data);
								rows[method](row.element);
								options.count++;
							}
						}
					}
				}
			}
			function correctElement(row){
				// If a node has been orphaned, try to retrieve the correct in-document element
				// (use isDescendant since offsetParent is faulty in IE<9)
				if(!dom.isDescendant(row, self.domNode) && byId(row.id)){
					return self.row(row.id.slice(self.id.length + 5)).element;
				}
				// Fall back to the originally-specified element
				return row;
			}
			
			function mapEach(object){
				lastRow = self.insertRow(object, rowsFragment, null, start++, options);
				lastRow.observerIndex = observerIndex;
				return lastRow;
			}
			function whenError(error){
				if(typeof observerIndex !== "undefined"){
					observers[observerIndex].cancel();
					observers[observerIndex] = 0;
					self._numObservers--;
				}
				if(error){
					throw error;
				}
			}
			var originalRows;
			function whenDone(resolvedRows){
				// Save the original rows, before the overlapping is performed
				originalRows = resolvedRows.slice(0);
				container = beforeNode ? beforeNode.parentNode : self.contentNode;
				if(container && container.parentNode &&
						(container !== self.contentNode || resolvedRows.length)){
					container.insertBefore(rowsFragment, beforeNode || null);
					lastRow = resolvedRows[resolvedRows.length - 1];
					lastRow && self.adjustRowIndices(lastRow);
				}else if(observers[observerIndex] && self.cleanEmptyObservers){
					// Remove the observer and don't bother inserting;
					// rows are already out of view or there were none to track
					whenError();
				}
				rows = resolvedRows;
				if(observer){
					observer.rows = rows;
				}
			}
			
			// Now render the results
			if(results.map){
				rows = results.map(mapEach, console.error);
				if(rows.then){
					return results.then(function(resultsArray){
						results = resultsArray;
						return rows.then(function(resolvedRows){
							whenDone(resolvedRows);
							// Overlap rows in the results array when using observable
							// so that we can determine page boundary changes
							// (but return the original set)
							overlapRows(1, 1, 0, 0);
							return originalRows;
						});
					});
				}
			}else{
				rows = [];
				for(var i = 0, l = results.length; i < l; i++){
					rows[i] = mapEach(results[i]);
				}
			}
			
			whenDone(rows);
			overlapRows(1, 1, 0, 0);
			// Return the original rows, not the overlapped set
			return originalRows;
		},

		_onNotification: function(rows, object, from, to){
			// summary:
			//		Protected method called whenever a store notification is observed.
			//		Intended to be extended as necessary by mixins/extensions.
		},

		renderHeader: function(){
			// no-op in a plain list
		},
		
		_autoId: 0,
		insertRow: function(object, parent, beforeNode, i, options){
			// summary:
			//		Creates a single row in the grid.
			
			// Include parentId within row identifier if one was specified in options.
			// (This is used by tree to allow the same object to appear under
			// multiple parents.)
			var parentId = options.parentId,
				id = this.id + "-row-" + (parentId ? parentId + "-" : "") + 
					((this.store && this.store.getIdentity) ? 
						this.store.getIdentity(object) : this._autoId++),
				row = byId(id),
				previousRow = row && row.previousSibling;
			
			if(row){// if it existed elsewhere in the DOM, we will remove it, so we can recreate it
				if(row === beforeNode){
					beforeNode = (beforeNode.connected || beforeNode).nextSibling;
				}
				this.removeRow(row);
			}
			row = this.renderRow(object, options);
			row.className = (row.className || "") + " dgrid-row " +
				(i % 2 == 1 ? oddClass : evenClass) +
				(this.addUiClasses ? " ui-state-default" : "");
			// get the row id for easy retrieval
			this._rowIdToObject[row.id = id] = object;
			parent.insertBefore(row, beforeNode || null);
			if(previousRow){
				// in this case, we are pulling the row from another location in the grid, and we need to readjust the rowIndices from the point it was removed
				this.adjustRowIndices(previousRow);
			}
			row.rowIndex = i;
			return row;
		},
		renderRow: function(value, options){
			// summary:
			//		Responsible for returning the DOM for a single row in the grid.
			
			return put("div", "" + value);
		},
		removeRow: function(rowElement, justCleanup){
			// summary:
			//		Simply deletes the node in a plain List.
			//		Column plugins may aspect this to implement their own cleanup routines.
			// rowElement: Object|DOMNode
			//		Object or element representing the row to be removed.
			// justCleanup: Boolean
			//		If true, the row element will not be removed from the DOM; this can
			//		be used by extensions/plugins in cases where the DOM will be
			//		massively cleaned up at a later point in time.
			
			rowElement = rowElement.element || rowElement;
			delete this._rowIdToObject[rowElement.id];
			if(!justCleanup){
				put(rowElement, "!");
			}
		},
		
		row: function(target){
			// summary:
			//		Get the row object by id, object, node, or event
			var id;
			
			if(target instanceof this._Row){ return target; } // no-op; already a row
			
			if(target.target && target.target.nodeType){
				// event
				target = target.target;
			}
			if(target.nodeType){
				var object;
				do{
					var rowId = target.id;
					if((object = this._rowIdToObject[rowId])){
						return new this._Row(rowId.substring(this.id.length + 5), object, target); 
					}
					target = target.parentNode;
				}while(target && target != this.domNode);
				return;
			}
			if(typeof target == "object"){
				// assume target represents a store item
				id = this.store.getIdentity(target);
			}else{
				// assume target is a row ID
				id = target;
				target = this._rowIdToObject[this.id + "-row-" + id];
			}
			return new this._Row(id, target, byId(this.id + "-row-" + id));
		},
		cell: function(target){
			// this doesn't do much in a plain list
			return {
				row: this.row(target)
			};
		},
		
		_move: function(item, steps, targetClass, visible){
			var nextSibling, current, element;
			// Start at the element indicated by the provided row or cell object.
			element = current = item.element;
			steps = steps || 1;
			
			do{
				// Outer loop: move in the appropriate direction.
				if((nextSibling = current[steps < 0 ? "previousSibling" : "nextSibling"])){
					do{
						// Inner loop: advance, and dig into children if applicable.
						current = nextSibling;
						if(current && (current.className + " ").indexOf(targetClass + " ") > -1){
							// Element with the appropriate class name; count step, stop digging.
							element = current;
							steps += steps < 0 ? 1 : -1;
							break;
						}
						// If the next sibling isn't a match, drill down to search, unless
						// visible is true and children are hidden.
					}while((nextSibling = (!visible || !current.hidden) && current[steps < 0 ? "lastChild" : "firstChild"]));
				}else{
					current = current.parentNode;
					if(!current || current === this.bodyNode || current === this.headerNode){
						// Break out if we step out of the navigation area entirely.
						break;
					}
				}
			}while(steps);
			// Return the final element we arrived at, which might still be the
			// starting element if we couldn't navigate further in that direction.
			return element;
		},
		
		up: function(row, steps, visible){
			// summary:
			//		Returns the row that is the given number of steps (1 by default)
			//		above the row represented by the given object.
			// row:
			//		The row to navigate upward from.
			// steps:
			//		Number of steps to navigate up from the given row; default is 1.
			// visible:
			//		If true, rows that are currently hidden (i.e. children of
			//		collapsed tree rows) will not be counted in the traversal.
			// returns:
			//		A row object representing the appropriate row.  If the top of the
			//		list is reached before the given number of steps, the first row will
			//		be returned.
			if(!row.element){ row = this.row(row); }
			return this.row(this._move(row, -(steps || 1), "dgrid-row", visible));
		},
		down: function(row, steps, visible){
			// summary:
			//		Returns the row that is the given number of steps (1 by default)
			//		below the row represented by the given object.
			// row:
			//		The row to navigate downward from.
			// steps:
			//		Number of steps to navigate down from the given row; default is 1.
			// visible:
			//		If true, rows that are currently hidden (i.e. children of
			//		collapsed tree rows) will not be counted in the traversal.
			// returns:
			//		A row object representing the appropriate row.  If the bottom of the
			//		list is reached before the given number of steps, the last row will
			//		be returned.
			if(!row.element){ row = this.row(row); }
			return this.row(this._move(row, steps || 1, "dgrid-row", visible));
		},
		
		scrollTo: has("touch") ? function(options){
			// If TouchScroll is the superclass, defer to its implementation.
			return this.useTouchScroll ? this.inherited(arguments) :
				desktopScrollTo.call(this, options);
		} : desktopScrollTo,
		
		getScrollPosition: has("touch") ? function(){
			// If TouchScroll is the superclass, defer to its implementation.
			return this.useTouchScroll ? this.inherited(arguments) :
				desktopGetScrollPosition.call(this);
		} : desktopGetScrollPosition,
		
		get: function(/*String*/ name /*, ... */){
			// summary:
			//		Get a property on a List instance.
			//	name:
			//		The property to get.
			//	returns:
			//		The property value on this List instance.
			// description:
			//		Get a named property on a List object. The property may
			//		potentially be retrieved via a getter method in subclasses. In the base class
			//		this just retrieves the object's property.
			
			var fn = "_get" + name.charAt(0).toUpperCase() + name.slice(1);
			
			if(typeof this[fn] === "function"){
				return this[fn].apply(this, [].slice.call(arguments, 1));
			}
			
			// Alert users that try to use Dijit-style getter/setters so they don’t get confused
			// if they try to use them and it does not work
			if(!1 && typeof this[fn + "Attr"] === "function"){
				console.warn("dgrid: Use " + fn + " instead of " + fn + "Attr for getting " + name);
			}
			
			return this[name];
		},
		
		set: function(/*String*/ name, /*Object*/ value /*, ... */){
			//	summary:
			//		Set a property on a List instance
			//	name:
			//		The property to set.
			//	value:
			//		The value to set in the property.
			//	returns:
			//		The function returns this List instance.
			//	description:
			//		Sets named properties on a List object.
			//		A programmatic setter may be defined in subclasses.
			//
			//		set() may also be called with a hash of name/value pairs, ex:
			//	|	myObj.set({
			//	|		foo: "Howdy",
			//	|		bar: 3
			//	|	})
			//		This is equivalent to calling set(foo, "Howdy") and set(bar, 3)
			
			if(typeof name === "object"){
				for(var k in name){
					this.set(k, name[k]);
				}
			}else{
				var fn = "_set" + name.charAt(0).toUpperCase() + name.slice(1);
				
				if(typeof this[fn] === "function"){
					this[fn].apply(this, [].slice.call(arguments, 1));
				}else{
					// Alert users that try to use Dijit-style getter/setters so they don’t get confused
					// if they try to use them and it does not work
					if(!1 && typeof this[fn + "Attr"] === "function"){
						console.warn("dgrid: Use " + fn + " instead of " + fn + "Attr for setting " + name);
					}
					
					this[name] = value;
				}
			}
			
			return this;
		},
		
		// Accept both class and className programmatically to set domNode class.
		_getClass: getClass,
		_setClass: setClass,
		_getClassName: getClass,
		_setClassName: setClass,
		
		_setSort: function(property, descending){
			// summary:
			//		Sort the content
			// property: String|Array
			//		String specifying field to sort by, or actual array of objects
			//		with attribute and descending properties
			// descending: boolean
			//		In the case where property is a string, this argument
			//		specifies whether to sort ascending (false) or descending (true)
			
			this._sort = typeof property != "string" ? property :
				[{attribute: property, descending: descending}];
			
			this.refresh();
			
			if(this._lastCollection){
				if(property.length){
					// if an array was passed in, flatten to just first sort attribute
					// for default array sort logic
					if(typeof property != "string"){
						descending = property[0].descending;
						property = property[0].attribute;
					}
					
					this._lastCollection.sort(function(a,b){
						var aVal = a[property], bVal = b[property];
						// fall back undefined values to "" for more consistent behavior
						if(aVal === undefined){ aVal = ""; }
						if(bVal === undefined){ bVal = ""; }
						return aVal == bVal ? 0 : (aVal > bVal == !descending ? 1 : -1);
					});
				}
				this.renderArray(this._lastCollection);
			}
		},
		// TODO: remove the following two (and rename _sort to sort) in 0.4
		sort: function(property, descending){
			kernel.deprecated("sort(...)", 'use set("sort", ...) instead', "dgrid 0.4");
			this.set("sort", property, descending);
		},
		_getSort: function(){
			return this._sort;
		},
		
		_setShowHeader: function(show){
			// this is in List rather than just in Grid, primarily for two reasons:
			// (1) just in case someone *does* want to show a header in a List
			// (2) helps address IE < 8 header display issue in List
			
			var headerNode = this.headerNode;
			
			this.showHeader = show;
			
			// add/remove class which has styles for "hiding" header
			put(headerNode, (show ? "!" : ".") + "dgrid-header-hidden");
			
			this.renderHeader();
			this.resize(); // resize to account for (dis)appearance of header
			
			if(show){
				// Update scroll position of header to make sure it's in sync.
				headerNode.scrollLeft = this.getScrollPosition().x;
			}
		},
		setShowHeader: function(show){
			kernel.deprecated("setShowHeader(...)", 'use set("showHeader", ...) instead', "dgrid 0.4");
			this.set("showHeader", show);
		},
		
		_setShowFooter: function(show){
			this.showFooter = show;
			
			// add/remove class which has styles for hiding footer
			put(this.footerNode, (show ? "!" : ".") + "dgrid-footer-hidden");
			
			this.resize(); // to account for (dis)appearance of footer
		}
	});
});

},
'dgrid/util/misc':function(){
define("dgrid/util/misc", [
	"dojo/has",
	"put-selector/put"
], function(has, put){
	// summary:
	//		This module defines miscellaneous utility methods for purposes of
	//		adding styles, and throttling/debouncing function calls.
	
	has.add("dom-contains", function(global, doc, element){
		return !!element.contains; // not supported by FF < 9
	});
	
	// establish an extra stylesheet which addCssRule calls will use,
	// plus an array to track actual indices in stylesheet for removal
	var extraRules = [],
		extraSheet,
		removeMethod,
		rulesProperty,
		invalidCssChars = /([^A-Za-z0-9_\u00A0-\uFFFF-])/g;
	
	function removeRule(index){
		// Function called by the remove method on objects returned by addCssRule.
		var realIndex = extraRules[index],
			i, l;
		if (realIndex === undefined) { return; } // already removed
		
		// remove rule indicated in internal array at index
		extraSheet[removeMethod](realIndex);
		
		// Clear internal array item representing rule that was just deleted.
		// NOTE: we do NOT splice, since the point of this array is specifically
		// to negotiate the splicing that occurs in the stylesheet itself!
		extraRules[index] = undefined;
		
		// Then update array items as necessary to downshift remaining rule indices.
		// Can start at index + 1, since array is sparse but strictly increasing.
		for(i = index + 1, l = extraRules.length; i < l; i++){
			if(extraRules[i] > realIndex){ extraRules[i]--; }
		}
	}
	
	var util = {
		// Throttle/debounce functions
		
		defaultDelay: 15,
		throttle: function(cb, context, delay){
			// summary:
			//		Returns a function which calls the given callback at most once per
			//		delay milliseconds.  (Inspired by plugd)
			var ran = false;
			delay = delay || util.defaultDelay;
			return function(){
				if(ran){ return; }
				ran = true;
				cb.apply(context, arguments);
				setTimeout(function(){ ran = false; }, delay);
			};
		},
		throttleDelayed: function(cb, context, delay){
			// summary:
			//		Like throttle, except that the callback runs after the delay,
			//		rather than before it.
			var ran = false;
			delay = delay || util.defaultDelay;
			return function(){
				if(ran){ return; }
				ran = true;
				var a = arguments;
				setTimeout(function(){
					ran = false;
					cb.apply(context, a);
				}, delay);
			};
		},
		debounce: function(cb, context, delay){
			// summary:
			//		Returns a function which calls the given callback only after a
			//		certain time has passed without successive calls.  (Inspired by plugd)
			var timer;
			delay = delay || util.defaultDelay;
			return function(){
				if(timer){
					clearTimeout(timer);
					timer = null;
				}
				var a = arguments;
				timer = setTimeout(function(){
					cb.apply(context, a);
				}, delay);
			};
		},
		
		// Iterative functions
		
		each: function(arrayOrObject, callback, context){
			// summary:
			//		Given an array or object, iterates through its keys.
			//		Does not use hasOwnProperty (since even Dojo does not
			//		consistently use it), but will iterate using a for or for-in
			//		loop as appropriate.
			
			var i, len;
			
			if(!arrayOrObject){
				return;
			}
			
			if(typeof arrayOrObject.length === "number"){
				for(i = 0, len = arrayOrObject.length; i < len; i++){
					callback.call(context, arrayOrObject[i], i, arrayOrObject);
				}
			}else{
				for(i in arrayOrObject){
					callback.call(context, arrayOrObject[i], i, arrayOrObject);
				}
			}
		},
		
		// DOM-related functions
		
		contains: function(parent, node){
			// summary:
			//		Checks to see if an element is contained in another element.
			
			if(has("dom-contains")){
				return parent.contains(node);
			}else{
				return parent.compareDocumentPosition(node) & 8 /* DOCUMENT_POSITION_CONTAINS */;
			}
		},
		
		// CSS-related functions
		
		addCssRule: function(selector, css){
			// summary:
			//		Dynamically adds a style rule to the document.  Returns an object
			//		with a remove method which can be called to later remove the rule.
			
			if(!extraSheet){
				// First time, create an extra stylesheet for adding rules
				extraSheet = put(document.getElementsByTagName("head")[0], "style");
				// Keep reference to actual StyleSheet object (`styleSheet` for IE < 9)
				extraSheet = extraSheet.sheet || extraSheet.styleSheet;
				// Store name of method used to remove rules (`removeRule` for IE < 9)
				removeMethod = extraSheet.deleteRule ? "deleteRule" : "removeRule";
				// Store name of property used to access rules (`rules` for IE < 9)
				rulesProperty = extraSheet.cssRules ? "cssRules" : "rules";
			}
			
			var index = extraRules.length;
			extraRules[index] = (extraSheet.cssRules || extraSheet.rules).length;
			extraSheet.addRule ?
				extraSheet.addRule(selector, css) :
				extraSheet.insertRule(selector + '{' + css + '}', extraRules[index]);
			
			return {
				get: function(prop) {
					return extraSheet[rulesProperty][extraRules[index]].style[prop];
				},
				set: function(prop, value) {
					if (typeof extraRules[index] !== "undefined") {
						extraSheet[rulesProperty][extraRules[index]].style[prop] = value;
					}
				},
				remove: function(){
					removeRule(index);
				}
			};
		},
		
		escapeCssIdentifier: function(id, replace){
			// summary:
			//		Escapes normally-invalid characters in a CSS identifier (such as . or :);
			//		see http://www.w3.org/TR/CSS2/syndata.html#value-def-identifier
			// id: String
			//		CSS identifier (e.g. tag name, class, or id) to be escaped
			// replace: String?
			//		If specified, indicates that invalid characters should be
			//		replaced by the given string rather than being escaped
			
			return id.replace(invalidCssChars, replace || "\\$1");
		}
	};
	return util;
});
},
'xstyle/css':function(){
define("xstyle/css", ["require"], function(moduleRequire){
"use strict";
/*
 * AMD css! plugin
 * This plugin will load and wait for css files.  This could be handy when
 * loading css files as part of a layer or as a way to apply a run-time theme. This
 * module checks to see if the CSS is already loaded before incurring the cost
 * of loading the full CSS loader codebase
 */
 	function testElementStyle(tag, id, property){
 		// test an element's style
		var docElement = document.documentElement;
		var testDiv = docElement.insertBefore(document.createElement(tag), docElement.firstChild);
		testDiv.id = id;
		var styleValue = (testDiv.currentStyle || getComputedStyle(testDiv, null))[property];
		docElement.removeChild(testDiv);
 		return styleValue;
 	} 
 	return {
		load: function(resourceDef, require, callback, config) {
			var url = require.toUrl(resourceDef);
			var cachedCss = require.cache && require.cache['url:' + url];
			if(cachedCss){
				// we have CSS cached inline in the build
				if(cachedCss.xCss){
					var parser = cachedCss.parser;
					var xCss =cachedCss.xCss;
					cachedCss = cachedCss.cssText;
				}
				moduleRequire(['./util/createStyleSheet'],function(createStyleSheet){
					checkForParser(createStyleSheet(cachedCss));
				});
				if(xCss){
					//require([parsed], callback);
				}
				return;
			}
			function checkForParser(styleSheet){
				var parser = testElementStyle('x-parse', null, 'content');
				if(parser && parser != 'none'){
					// TODO: wait for parser to load
					require([eval(parser)], function(parser){
						if(styleSheet){
							parser.process({sheet: styleSheet}, callback);
						}else{
							parser.processAll();
							callback(styleSheet);
						}
					});
				}else{
					callback(styleSheet);
				}
			}
			
			// if there is an id test available, see if the referenced rule is already loaded,
			// and if so we can completely avoid any dynamic CSS loading. If it is
			// not present, we need to use the dynamic CSS loader.
			var displayStyle = testElementStyle('div', resourceDef.replace(/\//g,'-').replace(/\..*/,'') + "-loaded", 'display');
			if(displayStyle == "none"){
				return checkForParser();
			}
			// use dynamic loader
			moduleRequire(["./core/load-css"], function(load){
				load(url, checkForParser);
			});
		}
	};
});

}}});

require(["dojo/i18n"], function(i18n){
i18n._preloadLocalizations("dgrid/nls/dgrid", []);
});
define("dgrid/dgrid", [], 1);
