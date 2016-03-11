/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'Sage/MainView/JobMgr/BaseListPanelConfig',
    'Sage/MainView/JobMgr/SDataSummaryFormatterScope',
    'dojo/_base/declare',
    'dojo/i18n!./nls/JobDefinitionsListPanelConfig',
    'dojo/i18n!./templates/nls/JobDefinitionsListSummary',
    'dojo/i18n!./templates/nls/JobDefinitionDetailSummary'
],
function (
   baseListPanelConfig,
   sDataSummaryFormatterScope,
   declare,
   nlsResources
) {
    var jobDefinitionsListPanelConfig = declare('Sage.MainView.JobMgr.JobDefinitionsListPanelConfig', [baseListPanelConfig], {
        constructor: function () {
            this._nlsResources = nlsResources;
            this._listId = 'JobDefinitions';
            this._resourceKind = 'jobs';
            this.entityName = 'Job';
            this._contextMenu = 'JobManagerListContextMenu';
            this._currentListContextSubMenu = 'JobDefinitionsListContextMenu';

            //Set up query parameters
            this._structure = this._getStructure();
            this._select = this._getSelect();
            this._sort = this._getSort();
            this._where = this._getWhere();
            this._include = this._getInclude();
            this._store = this._getStore();
            this.list = this._getListConfig();
            this.detail = this._getDetailConfig();
            this.toolBar = this._getToolBars();
            this.keyField = "$key";
        },
        _getStructure: function () {
            var colNameJobName = this._nlsResources.colNameJobName || 'Job Name';
            var colNameDescription = this._nlsResources.colNameDescription || 'Description';
            var colNameType = this._nlsResources.colNameType || 'Type';
            var structure = [
                { field: '$descriptor', name: colNameJobName, width: '100px' },
                { field: 'description', name: colNameDescription, width: '100px' },
                { field: 'type', name: colNameType, width: '50px' }
            ];
            return structure;
        },
        _getSelect: function () {
            var select = ['$key', 'description', 'type'];
            return select;
        },
        _getWhere: function () {
            return "";
        },
        _getSort: function () {
            var sort = [{ attribute: 'description' }];
            return sort;
        },
        _getInclude: function () {
            var includes = [];
            return includes;
        },
        _getSummaryListRequestConfig: function () {
            var requestConfig = {
                resourceKind: this._resourceKind,
                serviceName: 'scheduling',
                keyField: '$key',
                select: ['$key', 'description'],
                include: [],
                useBatchRequest: false
            };
            return requestConfig;
        },
        _getFormatterScope: function () {
            var requestConfig = this._getSummaryListRequestConfig();
            var formatScope = new sDataSummaryFormatterScope({
                templateLocation: 'MainView/JobMgr/templates/JobDefinitionsListSummary.html',
                resetDataManager: true,
                requestConfiguration: requestConfig
            });
            return formatScope;
        },
        _getSummaryDetailRequestConfig: function () {
            var requestConfig = {
                resourceKind: this._resourceKind,
                serviceName: 'scheduling',
                keyField: '$key',
                select: ['$key', 'description'],
                include: ['$descriptors'],
                useBatchRequest: false
            };
            return requestConfig;
        },
        _getDetailConfig: function () {
            var formatScope = this._getFormatterScope();
            var requestConfig = this._getSummaryDetailRequestConfig();
            var detailConfig = {
                resourceKind: this._resourceKind,
                requestConfiguration: requestConfig,
                templateLocation: 'MainView/JobMgr/templates/JobDefinitionDetailSummary.html'
            };
            return detailConfig;
        },
        _getToolBars: function () {
            var toolBars = { items: [] };
            return toolBars;
        }
    });
    return jobDefinitionsListPanelConfig;
});