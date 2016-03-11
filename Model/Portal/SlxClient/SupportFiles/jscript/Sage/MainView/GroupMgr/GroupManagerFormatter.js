/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
        'Sage/Utility',
        'dojo/date/locale',
        'dojo/i18n!./nls/GroupManagerFormatter'
    ],
    function(
        slxUtility,
        locale,
        nlsResources
    ) {
        Sage.namespace('Sage.MainView.GroupMgr.GroupManagerFormatter');
        dojo.mixin(Sage.MainView.GroupMgr.GroupManagerFormatter, {
            _isNumeric: function(value) {
                return !isNaN(parseFloat(value)) && isFinite(value);
            },
            formatLegacyType: function(value) {
                if (value && Sage.MainView.GroupMgr.GroupManagerFormatter._isNumeric(value)) {
                    switch (value) {
                    case 8:
                        return nlsResources.ACOGroup;
                    case 23:
                        return nlsResources.Group;
                    }
                }
                return nlsResources.Unknown;
            },
            formatDate: function (value) {
                if (slxUtility.Convert.isDateString(value)) {
                    var date = slxUtility.Convert.toDateFromString(value);
                    return locale.format(date, { selector: 'datetime', fullYear: true });
                }
                return '';
            },
            formatBoolean: function(value) {
                return (value && (value === true || value === 'True')) ? nlsResources.Yes : nlsResources.No;
            },
            formatGetUserById: function(item) {
                if (!item) {
                    return '';
                } else {
                    return slxUtility.getUserName(item);
                }
            },
            formatProperCase: function(value) {
                if (typeof value === 'string') {
                    return value.replace(/\w\S*/g, function(txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
                } else {
                    return '';
                }
            },
            formatOwnerName: function(value) {
                if (value) {
                    var owner = slxUtility.getOwnerName(value);
                    if (owner !== value) return slxUtility.htmlEncode(owner);
                    // The Plugin table can include either a UserId or a SecCodeId for the Plugin.UserId value.
                    var user = slxUtility.getUserName(value);
                    return user ? slxUtility.htmlEncode(user) : value;
                }
                return value;
            },
            formatInteger: function(value) {
                if (!value || isNaN(value)) return 0;
                return value;
            }
        });
        return Sage.MainView.GroupMgr.GroupManagerFormatter;
    });