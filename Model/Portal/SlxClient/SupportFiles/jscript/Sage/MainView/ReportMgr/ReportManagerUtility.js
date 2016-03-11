/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/xhr',
    'dojo/i18n!./nls/ReportManagerUtility',
    'Sage/Reporting/Enumerations'
],
function (
    dojoXhr,
    nlsResources,
    Enumerations) {
    Sage.namespace('Sage.MainView.ReportMgr.ReportManagerUtility');
    dojo.mixin(Sage.MainView.ReportMgr.ReportManagerUtility, {
        _nlsResources: nlsResources,
        getOperators: function (fieldDataType) {
            switch (String(fieldDataType)) {
                case String(Enumerations.FieldDataTypes.Numeric):
                    return [
                        {
                            operator: Enumerations.ReportConditionOperator.Is,
                            caption: Enumerations.nlsResources.txtIs
                        },
                        {
                            operator: Enumerations.ReportConditionOperator.IsNot,
                            caption: Enumerations.nlsResources.txtIsNot
                        },
                        {
                            operator: Enumerations.ReportConditionOperator.IsGreaterThan,
                            caption: Enumerations.nlsResources.txtIsGreaterThan
                        },
                        {
                            operator: Enumerations.ReportConditionOperator.IsLessThan,
                            caption: Enumerations.nlsResources.txtIsLessThan
                        },
                        {
                            operator: Enumerations.ReportConditionOperator.IsInTheRange,
                            caption: Enumerations.nlsResources.txtIsInTheRange
                        }
                    ];
                case String(Enumerations.FieldDataTypes.DateTime):
                    return [
                        {
                            operator: Enumerations.ReportConditionOperator.Is,
                            caption: Enumerations.nlsResources.txtIs
                        },
                        {
                            operator: Enumerations.ReportConditionOperator.IsNot,
                            caption: Enumerations.nlsResources.txtIsNot
                        },
                        {
                            operator: Enumerations.ReportConditionOperator.IsAfter,
                            caption: Enumerations.nlsResources.txtIsAfter
                        },
                        {
                            operator: Enumerations.ReportConditionOperator.IsBefore,
                            caption: Enumerations.nlsResources.txtIsBefore
                        },
                        {
                            operator: Enumerations.ReportConditionOperator.IsInTheRange,
                            caption: Enumerations.nlsResources.txtIsInTheRange
                        }
                    ];
                case String(Enumerations.FieldDataTypes.String):
                    return [
                        {
                            operator: Enumerations.ReportConditionOperator.Is,
                            caption: Enumerations.nlsResources.txtIs
                        },
                        {
                            operator: Enumerations.ReportConditionOperator.IsNot,
                            caption: Enumerations.nlsResources.txtIsNot
                        },
                        {
                            operator: Enumerations.ReportConditionOperator.Contains,
                            caption: Enumerations.nlsResources.txtContains
                        },
                        {
                            operator: Enumerations.ReportConditionOperator.StartsWith,
                            caption: Enumerations.nlsResources.txtStartsWith
                        },
                        {
                            operator: Enumerations.ReportConditionOperator.EndsWith,
                            caption: Enumerations.nlsResources.txtEndsWith
                        }
                    ];
                default:
                    console.error("Unsupported field type: " + fieldDataType);
            }
            return '';
        },
        getUser: function (userId) {
            var user = null;
            //Make a synchronous call to get the user
            dojoXhr('GET', {
                url: "slxdata.ashx/slx/dynamic/-/users('" + userId + "')?format=json",
                handleAs: "json",
                sync: true
            }).then(function (data) {
                user = data;
            });
            return user;
        },
        getGroup: function (groupId) {
            var group = null;
            var url = "slxdata.ashx/slx/system/-/groups";
            if (groupId.indexOf(':') !== -1) {
                //The groupId is in the form family:name
                var family = groupId.split(':')[0];
                var name = groupId.split(':')[1];
                url = url + "?format=json&where=family eq '" + family + "' and name eq '" + name + "'";
            }
            else {
                //The groupId is a standard saleslogix id
                url = url + "('" + groupId + "')?format=json";
            }

            //Make a synchronous call to get the group
            dojoXhr('GET', {
                url: url,
                handleAs: "json",
                sync: true
            }).then(function (data) {
                if (data.$resources && data.$resources.length === 1) {
                    data = data.$resources[0]; //this is necessary for the case where we bring the group based on a where clause
                }
                group = data;
            });
            return group;
        },
        getEntityHistory: function (entityName) {
            var entityHistory = {
                items: []
            };
            //Make a synchronous call to get the most recently used list
            dojoXhr('GET', {
                url: "slxdata.ashx/slxdata.ashx/slx/crm/-/entityhistory",
                handleAs: "json",
                sync: true
            }).then(function (data) {
                entityHistory = data;
            });
        },
        getOutputFormats: function (reportType) {
            switch (reportType) {
                case Enumerations.ReportTypes.CrystalReport:
                    return [
                        {
                            outputFormat: Enumerations.ReportExportFormat.Pdf,
                            caption: Enumerations.nlsResources.txtPdf
                        },
                        {
                            outputFormat: Enumerations.ReportExportFormat.Word,
                            caption: Enumerations.nlsResources.txtWord
                        },
                        {
                            outputFormat: Enumerations.ReportExportFormat.Excel,
                            caption: Enumerations.nlsResources.txtExcel
                        },
                        {
                            outputFormat: Enumerations.ReportExportFormat.ExcelDataOnly,
                            caption: Enumerations.nlsResources.txtExcelDataOnly
                        },
                        {
                            outputFormat: Enumerations.ReportExportFormat.Csv,
                            caption: Enumerations.nlsResources.txtCsv
                        },
                        {
                            outputFormat: Enumerations.ReportExportFormat.Xml,
                            caption: Enumerations.nlsResources.txtXml
                        }
                    ];
                default:
                    console.error("Unsupported report type: " + reportType);
                    return [];
            }
        },
        getCurrentEntityContext: function () {
            if (Sage.Services.hasService("ClientEntityContext")) {
                var clientEntityContextSvc = Sage.Services.getService("ClientEntityContext");
                if (clientEntityContextSvc) {
                    return clientEntityContextSvc.getContext();
                }
            }
            return null;
        },
        getCurrentUser: function () {
            var clientContextSvc = Sage.Services.getService('ClientContextService');
            var user = null;
            if (clientContextSvc) {
                user = {
                    userID: clientContextSvc.getValue('userID'),
                    userPrettyName: clientContextSvc.getValue('userPrettyName')
                };
            }
            return user;
        },
        /**
        * Shows/Hides a dom node.
        * @param {Object} domNode - The DOM node to be shown/hidden.
        * @param {Boolean} visible - Whether the object is visible or not.
        */
        setDomNodeVisible: function (domNode, visible) {
            if (domNode && visible) {
                dojo.removeClass(domNode, "display-none");
            }
            else if (domNode) {
                dojo.addClass(domNode, "display-none");
            }
        },
        refreshList: function (tabId) {
            try {
                var panel = dijit.byId('list');
                if (panel) {
                    var grpContextSvc = Sage.Services.getService('ClientGroupContext');
                    if (grpContextSvc) {
                        var ctx = grpContextSvc.getContext();
                        if (tabId === ctx.CurrentGroupID) {
                            panel.refreshView(tabId);
                        }
                    }
                }
            }
            catch (e) {
            }
        }
    });
    return Sage.MainView.ReportMgr.ReportManagerUtility;
});
