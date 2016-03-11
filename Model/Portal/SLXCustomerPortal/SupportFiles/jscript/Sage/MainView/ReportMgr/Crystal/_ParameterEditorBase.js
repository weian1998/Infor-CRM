/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/number',
    'dijit/_Widget',
    'Sage/_Templated',
    'Sage/Utility',
    'Sage/Reporting/Enumerations',
    'dojo/i18n!./nls/_ParameterEditorBase',
    'Sage/UI/TransferBoxWidget',
    'Sage/UI/TransferBoxWidgetEnumerations',
    'dojo/store/Memory',
    'dojo/store/Observable',
    'dojo/date/locale',
    'Sage/MainView/ReportMgr/Crystal/CrystalReportsUtility',
    'dojo/string'
],
function (
    declare,
    dojoArray,
    dojoNumber,
    _Widget,
    _Templated,
    utility,
    enumerations,
    resources,
    TransferBoxWidget,
    transferBoxEnumerations,
    Memory,
    Observable,
    locale,
    crystalReportsUtility,
    dojoString
) {
    /**
    * Declare the _ParameterEditorBase class.
    * @constructor
    */
    var _parameterEditorBase = declare('Sage.MainView.ReportMgr.Crystal._ParameterEditorBase', [_Widget, _Templated], {
        widgetsInTemplate: true,
        _promptParameter: null,
        _values: null,
        _initialValues: null,
        _initialCustomValues: null,
        _initialIds: null,
        _allowCustomValues: false,
        _minimum: null,
        _maximum: null,
        _paramDiscreteType: false, //Indicates that the parameter accepts only discrete values
        _paramDiscreteAndRangeType: false, //Indicates that the parameter accepts both discrete and range values (works in conjuction with multi select)
        _paramRangeType: false, //Indicates that the parameter accepts only range values
        _showDescriptionAndValue: false,
        paramId: null,
        mode: null,
        /**
        * BooleanParameterEditor class constructor.
        * @constructor
        * @param {Object} promptParameter - Parameter to be edited
        */
        constructor: function (promptParameter) {
            //Note that non-scalar properties need to be initialized in the constructor, 
            //otherwise they are shared among class instances.
            //http://dojotoolkit.org/reference-guide/1.9/dojo/_base/declare.html - see Arrays and Objects as Member Variables
            dojo.mixin(this, resources);
            this._values = [];
            this._initialValues = [];
            this._initialCustomValues = [];
            this._initialIds = [];
            this._promptParameter = promptParameter;
            this._initializeParameterProperties();
            this._getParameterDataTypes();
        },
        /**
        * This is a last method in the initialization process. 
        * It is called after all the child widgets are rendered so it's good for a container widget to finish it's post rendering here. 
        * This is where the container widgets could for example set sizes of their children relative to it's own size.
        */
        /*startup: function () {
            this.inherited(arguments);
        },*/
        isValid: function () {
            return true;
        },
        valueWithinMinMaxRange: function (value) {
            if (this._minimum && (value < this._minimum)) {
                return false;
            }
            if (this._maximum && (value > this._maximum)) {
                return false;
            }
            return true;
        },
        ensureNewSelectedValue: function (items, matchValue) {
            var isNew = true;
            dojo.some(items, function (option) {
                if (option.label === matchValue) {
                    isNew = false;
                    return isNew;
                }
            });
            return isNew;
        },
        initializeTransferBoxWidget: function (container, initializeList) {
            var data = [];
            var self = this;
            if (initializeList) {
                dojoArray.forEach(this._values, function (entry, i) {
                    data[i] = {
                        id: entry._id,
                        value: entry.value ? entry.value : entry.description,
                        displayValue: entry.description,
                        __selected: false
                    };
                });
            }

            var store = Observable(new Memory({
                identifier: "id",
                data: data
            }));

            this.transferBox = new TransferBoxWidget({
                store: store,
                sortAttribute: "id",
                filterProperty: "value",
                useFilterTypeAhead: true,
                selectionMode: this.allowMultiValue ? transferBoxEnumerations.SelectionMode.Extended : transferBoxEnumerations.SelectionMode.Single
            }, "transferBox");

            // given a list of initial ids 
            dojoArray.forEach(self._initialIds, function (defaultEntry, i) {
                // go through the data store of the transfer box
                dojoArray.forEach(self.transferBox.store.data, function (storeEntry, i) {
                    // mark the matched ids as selected.
                    if (defaultEntry == storeEntry.id || defaultEntry.id == storeEntry.id) {
                        storeEntry.__selected = true;
                    }
                });
            });

            //check to see if there are any custom values that should be added by default
            dojoArray.forEach(this._initialCustomValues, function (entry, i) {
                var item = {
                    id: entry.parameterClass === "Range" ? entry.description : entry._id,
                    value: entry.value ? entry.value : entry.description,
                    displayValue: entry.description ? entry.description : entry.value,
                    __selected: true,
                    destroyOnRemove: false
                };
                self.transferBox.addNewItem(item);
            });
            this.transferBox.placeAt(container);
        },
        getOriginalParameterValue: function (_id) {
            var originalValue = null;
            dojoArray.some(this._promptParameter.defaultValues, function (entry, i) {
                if (entry._id == _id) {
                    originalValue = dojo.clone(entry);
                    delete originalValue._id; //get rid of the temporary "_id" attribute
                    return true;
                }
            });
            return originalValue;
        },
        getMinMaxValidationMessage: function (value) {
            switch (this.parameterValueKind) {
                case enumerations.SlxParameterValueKind.NumberParameter:
                    if (this._minimum && (value < this._minimum)) {
                        return dojo.replace(this.txtPleaseSpecifyNumberGreater, [this._minimum]);
                    }
                    if (this._maximum && (value > this._maximum)) {
                        return dojo.replace(this.txtPleaseSpecifyNumberLesser, [this._maximum]);
                    }
                    break;
                case enumerations.SlxParameterValueKind.CurrencyParameter:
                    break;
                case enumerations.SlxParameterValueKind.DateParameter:
                case enumerations.SlxParameterValueKind.DateTimeParameter:
                    if (this._minimum && (value < this._minimum)) {
                        this._validationMsg = dojo.replace(this.txtPleaseSpecifyDateGreater, [crystalReportsUtility.getDateOnlyFormattedDate(this._minimum)]);
                    }
                    if (this._maximum && (value > this._maximum)) {
                        this._validationMsg = dojo.replace(this.txtPleaseSpecifyDateLesser, [crystalReportsUtility.getDateOnlyFormattedDate(this._maximum)]);
                    }
                    break;
                case enumerations.SlxParameterValueKind.BooleanParameter:
                    break;
                default: //handle it as though it is a string
                    if (this._minimum && (value.length < this._minimum)) {
                        return dojo.replace(this.txtTheMinimumLengthForThisField, [this._minimum]);
                    }
                    if (this._maximum && (value.length > this._maximum)) {
                        return dojo.replace(this.txtTheMaximumLengthForThisField, [this._maximum]);
                    }
            }
            return "";
        },
        getMinMaxInitializationMessage: function () {
            var minMaxMessage = "";
            switch (this.parameterValueKind) {
                case enumerations.SlxParameterValueKind.NumberParameter:
                    if (this._minimum && !this._maximum) {
                        minMaxMessage = dojo.replace(this.txtPleaseSpecifyNumberGreater, [this._minimum]);
                    }
                    if (!this._minimum && this._maximum) {
                        minMaxMessage = dojo.replace(this.txtPleaseSpecifyNumberLesser, [this._maximum]);
                    }
                    if (this._minimum && this._maximum) {
                        minMaxMessage = dojo.replace(this.txtPleaseSpecifyNumberBetween, [this._minimum, this._maximum]);
                    }
                    break;
                case enumerations.SlxParameterValueKind.CurrencyParameter:
                    break;
                case enumerations.SlxParameterValueKind.DateParameter:
                case enumerations.SlxParameterValueKind.DateTimeParameter:
                    if (this._minimum && !this._maximum) {
                        minMaxMessage = dojo.replace(this.txtPleaseSpecifyDateLesser, [crystalReportsUtility.getDateOnlyFormattedDate(this._minimum)]);
                    }
                    if (!this._minimum && this._maximum) {
                        minMaxMessage = dojo.replace(this.txtPleaseSpecifyDateGreater, [crystalReportsUtility.getDateOnlyFormattedDate(this._maximum)]);
                    }
                    if (this._minimum && this._maximum) {
                        minMaxMessage = dojo.replace(this.txtPleaseSpecifyDateBetween, [crystalReportsUtility.getDateOnlyFormattedDate(this._minimum), crystalReportsUtility.getDateOnlyFormattedDate(this._maximum)]);
                    }
                    break;
                case enumerations.SlxParameterValueKind.BooleanParameter:
                    break;
                default: //handle it as though it is a string
                    if (this._minimum && !this._maximum) {
                        minMaxMessage = dojo.replace(this.txtTheMinimumLengthForThisField, [this._minimum]);
                    }
                    if (!this._minimum && this._maximum) {
                        minMaxMessage = dojo.replace(this.txtTheMaximumLengthForThisField, [this._maximum]);
                    }
                    if (this._minimum && this._maximum) {
                        minMaxMessage = dojo.replace(this.txtTheValueMustBeBetween, [this._minimum, this._maximum]);
                    }
            }
            return minMaxMessage;
        },
        _initializeParameterProperties: function () {
            //Nomenclature:
            //this._promptParameter.defaultValues: 
            //The collection of values that should be displayed by the widget.
            //this._promptParameter.initialValues:
            //The collection of values that should be selected/displayed by default by the widget.
            //this._promptParameter.currentValues:
            //The collection of values actually selected/entered by the user. When editing an existing schedule, 
            //we use this collection as the point of reference for values that should be selected/displayed by default.

            var self = this;
            this._allowCustomValues = this._promptParameter.allowCustomCurrentValues;
            this._showDescriptionAndValue = (this._promptParameter.defaultValueDisplayType == 'DescriptionAndValue');
            var parameterValueKind = this._promptParameter.parameterValueKind;
            this._paramDiscreteType = this._promptParameter.valueRangeKind === enumerations.SlxParameterValueRangeKind.Discrete;
            this._paramDiscreteAndRangeType = this._promptParameter.valueRangeKind === enumerations.SlxParameterValueRangeKind.DiscreteAndRange;
            this._paramRangeType = this._promptParameter.valueRangeKind === enumerations.SlxParameterValueRangeKind.Range;

            //Preprocess defaultValues to get a cleaner collection.
            //Note we create a temporary "_id" property to help us correlate elements 
            //in the original defaultValues collection to elements in the new _values collection.
            var _id = 0;
            if (this._promptParameter.defaultValues) {
                dojoArray.forEach(this._promptParameter.defaultValues, function (entry, i) {
                    var strId = self._getZeroPrefixedId(_id); //Note we convert to string, as otherwise dojo datastores misbehave. The value is also prefixed with zeros for sorting purposes.
                    entry._id = strId;
                    var parameterValue = (entry.className === enumerations.ParameterClassName.DiscreteValue) ? entry.discreteValue.actualValue : entry.rangeValue;
                    var description = entry.description;
                    if (self._showDescriptionAndValue && dojo.isString(description)) {
                        description = dojoString.substitute("${0} - ${1}", [parameterValue, description]);
                    }
                    if (!dojo.isString(description)) {
                        description = parameterValue;
                    }
                    var formatDateDescription = parameterValueKind === enumerations.SlxParameterValueKind.DateParameter || parameterValueKind === enumerations.SlxParameterValueKind.DateTimeParameter;
                    var value = {
                        _id: strId,
                        value: parameterValue,
                        description: formatDateDescription ? self._formatDateTimeDescription(description) : description,
                        parameterClass: entry.className === enumerations.ParameterClassName.DiscreteValue ? enumerations.SlxParameterValueRangeKind.Discrete : enumerations.SlxParameterValueRangeKind.Range
                    };
                    self._values.push(value);
                    _id++;
                });
            }

            //If the parameter has the currentvalues collection populated, it means we are editing
            //an existing schedule. If that is the case, we use those values as the initial values.
            //Otherwise, we use the values from the initialValues collection, which comes from the report metadata.
            var initialValues = this._promptParameter.currentValues.length > 0 ? this._promptParameter.currentValues : this._promptParameter.initialValues;

            //Preprocess initialValues to get a cleaner collection.
            if (initialValues) {
                dojoArray.forEach(initialValues, function (entry, i) {
                    var parameterValue = (entry.className === enumerations.ParameterClassName.DiscreteValue) ? entry.discreteValue.actualValue : entry.rangeValue;
                    var description = entry.description;
                    var parts = null;

                    //job request formates the dates as json dates, we need to convert them back to iso dates
                    //so that the values can be found in the lists
                    if (entry.rangeDateValue) {
                        parts = entry.rangeDateValue.split(";");
                        parameterValue.beginValue = parts[0];
                        parameterValue.endValue = parts[1];
                    }
                    if (entry.discreteDateValue) {
                        parts = entry.discreteDateValue.split(";");
                        parameterValue = parts[0];
                    }
                    var value = {
                        value: parameterValue,
                        description: entry.description ? entry.description : parameterValue,
                        parameterClass: entry.className === enumerations.ParameterClassName.DiscreteValue ? enumerations.SlxParameterValueRangeKind.Discrete : enumerations.SlxParameterValueRangeKind.Range
                    };
                    self._initialValues.push(value);
                });
            }

            //Calculate list of ids for "initial values", which should be pre-selected 
            //when the parameter is displayed to the user.
            if (this._initialValues.length > 0) {
                dojoArray.forEach(this._initialValues, function (initialValue, i) {
                    //Look for a corresponding item with same value in the _values collection.
                    var found = false;
                    dojoArray.some(self._values, function (entry, i) {
                        if (entry.value === initialValue.value) {
                            self._initialIds.push(entry._id);
                            found = true;
                            return true;
                        }
                    });
                    if (!found) {
                        //If the current initial value is not in the list of default values, that means it is a custom value
                        //So we add the value to the _initialCustomValues collection.
                        self._initialCustomValues.push(initialValue);
                    }

                });
            }
            switch (parameterValueKind) {
                case enumerations.SlxParameterValueKind.DateParameter:
                case enumerations.SlxParameterValueKind.DateTimeParameter:
                    //Note: We get rid of the time part and offset of dates, even when setting useOffset argument as false.
                    //This is because otherwise, the Convert returns a date with offset applied.
                    //For example, "2013-01-01T00:00:00-05:00" is interpreted as "12/31/2012", which is not what we require here.
                    //This is a hack, there should be a better way to implement this.

                    if (this._promptParameter.minimumValue && this._promptParameter.minimumValue.discreteValue) {
                        this._minimum = utility.Convert.toDateFromString(this._getDateOnlyIsoString(this._promptParameter.minimumValue.discreteValue.actualValue));
                    }
                    if (this._promptParameter.maximumValue && this._promptParameter.maximumValue.discreteValue) {
                        this._maximum = utility.Convert.toDateFromString(this._getDateOnlyIsoString(this._promptParameter.maximumValue.discreteValue.actualValue));
                    }
                    break;
                case enumerations.SlxParameterValueKind.NumberParameter:
                case enumerations.SlxParameterValueKind.StringParameter:
                    if (this._promptParameter.minimumValue && this._promptParameter.minimumValue.discreteValue) {
                        this._minimum = dojoNumber.parse(this._promptParameter.minimumValue.discreteValue.actualValue);
                    }
                    if (this._promptParameter.maximumValue && this._promptParameter.maximumValue.discreteValue) {
                        this._maximum = dojoNumber.parse(this._promptParameter.maximumValue.discreteValue.actualValue);
                    }
                    break;
            }
        },
        _formatDateTimeDescription: function (dateTime) {
            if (this._promptParameter.parameterValueKind === enumerations.SlxParameterValueKind.DateTimeParameter) {
                return locale.format(utility.Convert.toDateFromString(dateTime, false), { fullYear: true });
            } else {
                return locale.format(utility.Convert.toDateFromString(dateTime, false), { fullYear: true, selector: this.displayTime ? null : 'date' });
            }
        },
        _getParameterDataTypes: function () {
            var defaultValues = this._promptParameter.defaultValues;
            if (defaultValues && defaultValues[0].discreteValue) {
                this._promptParameter.actualValueType = defaultValues[0].discreteValue.actualValueType;
                this._promptParameter.valueType = defaultValues[0].discreteValue.valueType;
            } else {
                this._promptParameter.actualValueType = this._getDataType(this._promptParameter.parameterValueKind);
                this._promptParameter.valueType = this._promptParameter.actualValueType;
            }
            if (defaultValues && defaultValues[0].rangeValue) {
                this._promptParameter.beginValueType = defaultValues[0].rangeValue.beginValueType;
                this._promptParameter.endValueType = defaultValues[0].rangeValue.endValueType;
            } else {
                this._promptParameter.beginValueType = this._getDataType(this._promptParameter.parameterValueKind);
                this._promptParameter.endValueType = this._promptParameter.beginValueType;
            }
        },
        _getDataType: function (parameterValueKind) {
            switch (parameterValueKind) {
                case enumerations.SlxParameterValueKind.BooleanParameter:
                    return "Boolean";
                case enumerations.SlxParameterValueKind.CurrencyParameter:
                case enumerations.SlxParameterValueKind.NumberParameter:
                    return "Double";
                case enumerations.SlxParameterValueKind.DateParameter:
                case enumerations.SlxParameterValueKind.DateTimeParameter:
                case enumerations.SlxParameterValueKind.TimeParameter:
                    return "DateTime";
                case enumerations.SlxParameterValueKind.StringParameter:
                    return "String";
                default:
                    return "String";
            }
        },
        _getStringOfZeros: function (length) {
            return Array(length + 1).join("0");
        },
        _getZeroPrefixedId: function (numericId) {
            if (isNaN(numericId)) {
                throw "A non-numeric value was passed to _getZeroPrefixedId";
            } else {
                var id = numericId.toString();
                // Return a zero prefixed string for sorting purposes (e.g. 00001..99999).
                if (id.length < 5) {
                    return this._getStringOfZeros(5 - id.length) + id;
                }
                return id;
            }
        },
        _getValue: function (_id) {
            var value = null;
            dojoArray.some(this._values, function (entry, i) {
                if (entry._id == _id) {
                    value = dojo.clone(entry);
                    return true;
                }
            });
            return value;
        },
        _getSelectionMode: function () {
            var selectionMode = "";
            if (this._promptParameter.allowMultiValue) {
                selectionMode = "MultiSelect";
            } else {
                selectionMode = "SingleSelect";
            }

            if (this._allowCustomValues) {
                selectionMode = selectionMode + "WithCustom";
            }
            else {
                selectionMode = selectionMode + "NoCustom";
            }
            return selectionMode;
        },
        _getDateOnlyIsoString: function (isoDate) {
            //The iso date comes in form "2013-01-01T00:00:00-05:00".
            //We get rid of the substring after the "T" to take out time part and offset.
            var dateOnlyIsoString = null;
            if (isoDate.indexOf('T') !== -1) {
                dateOnlyIsoString = isoDate.split('T')[0];
            }
            return dateOnlyIsoString;
        }
    });
    return _parameterEditorBase;
});