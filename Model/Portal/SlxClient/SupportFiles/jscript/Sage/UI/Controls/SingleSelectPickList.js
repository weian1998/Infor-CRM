/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */

/**
* @class Sage.UI.Controls.SingleSelectPickList
* Class for single select picklists.
*/
define([
       'dijit/_Widget',
       'dijit/_TemplatedMixin',
       'dijit/_WidgetsInTemplateMixin',
       'dijit/form/ComboBox',
       'dojo/data/ItemFileReadStore',
       'dojo/data/ObjectStore',
       'dojo/store/Memory',
       'Sage/UI/ComboBox',
       'Sage/UI/Controls/PickList',
       'dojo/text!./templates/SingleSelectPickList.html',
       'dojo/string',
       'dojo/_base/declare'
],
function (_Widget, _TemplatedMixin, _WidgetsInTemplateMixin, _comboBox, itemFileReadStore, objectStore, memory, sageComboBox, pickList, template, string, declare) {
    var widget = declare('Sage.UI.Controls.SingleSelectPickList', [pickList, _Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {

        /**
        * Takes the following options object: 
        * {
        *  pickListName: 'PickListName', // Required
        *  storeOptions: {}, // Optional
        *  dataStore: {}, // Option
        *  canEditText: false,
        *  itemMustExist: true,
        *  maxLength: -1,
        *  storeMode: 'text', // text, id, code
        *  sort: true,
        *  displayMode: 'AsControl',
        *  clientId: 'ASP.NET Control ClientID Here',
        *  required: false,
        *  tabIndex: 0
        * }
        *
        * @constructor
        */
        store: null,
        constructor: function (options) {
            if (options.clientId) {
                this.id = options.clientId + '-SingleSelectPickList';
            }

            this.inherited(arguments);
        },
        postCreate: function () {
            this._setupTooltips(this.comboBox._buttonNode, this.comboBox.textbox);
            this._setupRenderAsHyperlink();
            this._setupTooltips();            
            this.inherited(arguments);
            var existingText = dojo.byId(this._textId);
            if (existingText && existingText.value && (this.comboBox.value !== existingText.value)) {
                this.comboBox.set('value', existingText.value);
            }
        },
        _setupTooltips: function () {
            if (this.controlTooltip && this.controlTooltip !== '') {
                this.comboBox.set('title', this.controlTooltip);
            }

            if (this.buttonTooltip && this.buttonTooltip !== '') {
                if (this.comboBox._buttonNode) {
                    this.comboBox._buttonNode.title = this.buttonTooltip;
                }
            }
        },
        _setupRenderAsHyperlink: function () {
            if (!this.renderAsHyperlink) {
                return;
            }

            dojo.addClass(this.comboBox.domNode, 'comboAsHyperlink');
            dojo.connect(this.comboBox.domNode, 'onclick', this, function () {
                this.comboBox.loadDropDown();
            });
        },
        _loadData: function () {
            var def = new dojo.Deferred();
            this.getPickListData(def);

            def.then(dojo.hitch(this, function (data) {
                if (typeof data === 'string') {
                    this.comboBox.set('value', data);
                }

                var items = [];
                var storeItem;
                for (var i = 0; i < data.items.$resources.length; i++) {
                    var item = data.items.$resources[i];
                    items.push({
                        id: item.$key,
                        code: item.code,
                        number: item.number,
                        text: item.text
                    });
                }

                this.storeData = {
                    identifier: 'id',
                    label: 'text',
                    items: items
                };

                //this.store = new itemFileReadStore();
                this.store = new itemFileReadStore({ data: this.storeData });
                this.comboBox.set('store', this.store);
                this.comboBox.set('searchAttr', 'text');
                this.store._forceLoad();

                var existingText = dojo.byId(this._textId);
                var existingId = dojo.byId(this._picklistId);
                var existingCode = dojo.byId(this._codeId);
                if (existingText && existingText.value) {
                    //this is here when the server control added it to the dom with a value in it
                    this.lastValidValue = existingText.value;
                    this.initialValue = this.lastValidValue;
                    this.comboBox.set('value', this.lastValidValue);
                }

                else if (existingId && existingId.value) {
                    storeItem = this.getStoreItemById(existingId.value);
                    if (storeItem) {
                        this.lastValidValue = this.store.getValue(storeItem, 'text'); 
                        this.initialValue = this.lastValidValue;
                        this.comboBox.set('value', this.lastValidValue);
                    }
                }
                else if(existingCode && existingCode.value) {
                    storeItem = this.getStoreItemByCode(existingCode.value);
                    if(storeItem) {
                        this.lastValidValue = this.store.getValue(storeItem, 'text');
                        this.initialValue = this.lastValidValue;
                        this.comboBox.set('value', this.lastValidValue);
                    }
                }
                else {
                    //this is when it is used as a strictly client-side control and the value may have already been set.
                    var val = this.comboBox.get('value');
                    if (val || val === '') {
                        this.lastValidValue = val;
                    } else {
                        this.lastValidValue = items[0].text;
                        this.comboBox.set('value', this.lastValidValue);
                    }
                }
            }), function (e) {
                // errback
                console.error(e);
            });

            // Adjust control according to properties set in AA

            // Disable textbox to prevent edit
            if (this.get('canEditText') === false) {
                this.comboBox.textbox.disabled = true;
            }

            var len = this.get('maxLength');
            if (len > 0) {
                this.comboBox.set('maxLength', len);
            }
        },
        uninitialize: function () {
            this.inherited(arguments);
        },
        getStoreItemById: function (id) {
            var results = null, tempId;
            if (this.store) {
                if (this.storeData) {
                    dojo.forEach(this.storeData.items, function(item, index, array) {
                        if (item.id) {
                            tempId = this.store.getValue(item, 'id');
                            if (tempId === id) {
                                results = item;
                                return results;
                            }
                        }
                    }, this);
                }
            }
            return results;
        },
        getStoreItemByCode: function(code) {
            var results = null, tempCode;
            if (this.store) {
                if (this.storeData) {
                    dojo.forEach(this.storeData.items, function(item, index, array) {
                        if (item.code) {
                            tempCode = this.store.getValue(item, 'code');
                            tempCode = string.trim(tempCode);
                            tempCode = tempCode.toUpperCase();
                            code = string.trim(code);
                            code = code.toUpperCase();
                            if (tempCode === code) {
                                results = item;
                                return results;
                            }
                        }
                    }, this);
                }
            }
            return results;
        },
        getStoreItemByValue: function(value) {
            var results = null, text;
            if (value) {
                if (this.store) {
                    dojo.forEach(this.storeData.items, function(item, index, array) {
                        if (item.text) {
                            text = this.store.getValue(item, 'text'); // we must go through store to get value since it could change from a string to an array
                            text = string.trim(text);
                            text = text.toUpperCase();
                            value = string.trim(value);
                            value = value.toUpperCase();
                            if (text === value) {
                                results = item;
                                return results;
                            }
                        }
                    }, this);
                }
            }

            return results;
        },
        _onChange: function (newVal) {
            this.onChange(newVal);
        },
        _setPickListNameAttr: function (value) {
            this.inherited(arguments);
            this._loadData();
        },
        _setValueAttr: function (value) {
            this.inherited(arguments);
            this.comboBox.set('value', value);
        },
        _getValueAttr: function () {
            return this.comboBox.get('value');
        },
        _getCodeAttr: function() {
            var item, code, value, result;
            code = '';
            value = this._getValueAttr();
            item = this.getStoreItemByValue(value);
            if (item) {
                code = this.store.getValue(item, 'code');
            }
            return code;
        },
        // Display properties
        templateString: template,
        widgetsInTemplate: true,

        /**
        * @property {object} storeData Data fetched from SData stored here.
        */
        storeData: null,

        /**
        * @property {string} lastValidValue Last valid value entered into the control.
        */
        lastValidValue: '',

        /**
        * @property {string} initialValue Initial value set to the control, if any.
        */
        initialValue: '',

        /**
        * @property {bool} disabled.
        */
        disabled: false,

        _setDisabledAttr: function (disabled) {
            this.disabled = disabled;


            this.comboBox.set('disabled', disabled);
        },
        _getDisabledAttr: function () {
            this.disabled = this.comboBox.get('disabled');
            return this.disabled;
        },
        focus: function () {
            this.comboBox.focus();
        },
        onChange: function (newVal) {
            // Send the values to the hidden ASP.NET fields if we are valid, and the value actually changed.
            if (this.storeData) {
                var val = this.comboBox.get('value');
                if (val != this.initialValue) {
                    if (this.get('itemMustExist')) {
                        // Check if what we have entered is valid or not
                        var valid = dojo.some(this.storeData.items, function (item) {
                            // There is no guarantee the types will match so evaluate the type as well
                            // (i.e. do not use === for comparison). This can happen if a custom store is
                            // used to store the data, etc.

                            if (item.text == newVal || newVal == '') { // jshint ignore:line
                                return true;
                            } else {
                                return false;
                            }
                        }, this);
                        if (valid) {
                            this.lastValidValue = newVal;
                        }
                        if (!valid) {
                            // Attempt to restore last valid value.
                            if (this.lastValidValue !== 'undefined' && this.lastValidValue !== null) {
                                this.comboBox.set('value', this.lastValidValue);
                                return;
                            }
                        }
                    }
                    if(this.comboBox.isValid()) {
                        var code = '',
                           id = '';
                        dojo.forEach(this.storeData.items, function (item, index, array) {
                            if (item.text == val) {
                                code = item.code;
                                id = item.id;
                            }
                        }, this);
                        this.setASPNETInputs(val, code, id);
                    }
                }
            }
        }
    });

    return widget;
});

