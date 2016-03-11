/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/xhr',
    'dojo/string',
    'dojo/date/locale',
    'Sage/Data/SDataServiceRegistry',
    'Sage/Utility'
],
function (
    dojoXhr,
    dString,
    locale,
    sDataServiceRegistry,
    utility
) {
    Sage.namespace('Sage.MainView.Import.ImportManagerUtility');
    dojo.mixin(Sage.MainView.Import.ImportManagerUtility, {
        importWizardStep: {
            SelectFile: 0,
            DefineDelimiter: 1,
            ManageImportOptions: 2,
            MapFields: 3,
            AddActions: 4,
            Review: 5
        },
        getUserName: function (userId) {
            var user = null;
            //Make a synchronous call to get the user
            dojoXhr('GET', {
                url: "slxdata.ashx/slx/dynamic/-/users('" + userId + "')?format=json&select=$key,$descriptor",
                handleAs: "json",
                sync: true
            }).then(function (data) {
                user = data;
            });
            return user;
        },
        getOwner: function (secCodeId, lookup) {
            if (secCodeId) {
                var request = new Sage.SData.Client.SDataSingleResourceRequest(sDataServiceRegistry.getSDataService('dynamic'));
                request.setResourceKind('owners');
                request.setResourceSelector(dString.substitute("'${0}'", [secCodeId]));
                request.setQueryArg('select', '$key,$description');
                request.read({
                    success: function (owner) {
                        lookup.set('selectedObject', owner);
                    },
                    scope: this,
                    failure: function () { }
                });
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
        requestImportTemplates: function (requestOptions) {
            var request = new Sage.SData.Client.SDataResourceCollectionRequest(sDataServiceRegistry.getSDataService('dynamic'));
            request.setResourceKind("importTemplates");
            request.setQueryArg('select', 'TemplateName,EntityName,IsSystemTemplate,CreateUser,CreateDate,ModifyUser,ModifyDate');
            if (requestOptions.where) {
                request.setQueryArg('where', requestOptions.where);
            }
            request.read({
                preventCache: true,
                scope: this,
                success: function (response) {
                    if (requestOptions.onSuccess) {
                        requestOptions.onSuccess(response.$resources);
                    }
                },
                failure: function (error) {
                    console.log(error);
                    if (requestOptions.onFailure) {
                        requestOptions.onFailure(error);
                    }
                }
            });
        },
        importRuleRequest: function (requestOptions, resourceKind) {
            var service = sDataServiceRegistry.getSDataService('dynamic');
            var request = new Sage.SData.Client.SDataServiceOperationRequest(service)
                .setResourceKind(resourceKind)
                .setOperationName(requestOptions.businessRuleMethod);

            request.execute(requestOptions.entry, {
                success: function (result) {
                    if (requestOptions.onSuccess) {
                        requestOptions.onSuccess(Sys.Serialization.JavaScriptSerializer.deserialize(result.response.Result));
                    }
                },
                failure: function (result) {
                    if (requestOptions.onFailure) {
                        requestOptions.onFailure(result);
                    }
                    console.log(result);
                }
            });
        },
        formatDate: function (value) {
            if (utility.Convert.isDateString(value)) {
                var date = utility.Convert.toDateFromString(value);
                return locale.format(date, { selector: 'date', fullYear: true });
            }
            return "";
        }
    });
    return Sage.MainView.Import.ImportManagerUtility;
});