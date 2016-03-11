/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */

define([
    'Sage/MainView/_BaseListPanelConfig',
    'Sage/MainView/EntityMgr/EntitySDataSummaryFormatterScope',
    'dojo/_base/declare',
    'dojo/i18n!./nls/EntityListPanelConfig',
    'Sage/Data/SDataServiceRegistry',
    'Sage/UI/Columns/DateTime',
    'dojo/_base/lang',
    'dojo/i18n!./templates/nls/EntityListSummary',
    'dojo/i18n!./templates/nls/EntityDetailSummary',
    'Sage/MainView/EntityMgr/EntityManagerFormatter'

],
function (
    _BaseListPanelConfig,
	EntitySDataSummaryFormatterScope,
    declare,
    nlsResources,
    sDataServiceRegistry,
    dateTimeColumn,
    dojoLang,
    EntityListSummary,
    EntityDetailSummary,
    EntityManagerFormatter
)
{
    var entityListPanelConfig = declare('Sage.MainView.EntityMgr.EntityListPanelConfig', [_BaseListPanelConfig], {
        keyField: "$key",
        _listId: 'Entity', //groupId
        _resourceKind: 'entities',
        _contextMenu: 'EntityManagerListContextMenu',
        _currentListContextSubMenu: 'EntityListContextMenu',
        constructor: function () {
            dojoLang.mixin(this, nlsResources);
            
            this._service = '';
            var svc = Sage.Services.getService('RoleSecurityService');
            if (svc) {
                if (svc.hasAccess('Administration/EntityManager/Entities/View')) {
                    this._service = sDataServiceRegistry.getSDataService('metadata');
                }
                else {
                    return;
                }
            }
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
            this.list.selectionMode = 'single';

            dojo.subscribe('/sage/ui/grid/gridLoadComplete', function () {
                var listpanel = dijit.byId('list');
                if (listpanel) {
                    var _selectedRows = listpanel._listGrid.selection.getSelected();
                    if (_selectedRows.length === 0) {
                        listpanel._onSelectedInList(0);
                        listpanel._listGrid.selection.setSelected(0, true);
                    }
                }

            });

        },
        _getStructure: function () {
            return [
                { field: '$descriptor', name: this.colNameEntityDisplayName, width: '100px' },
                { field: 'name', name: this.colNameEntityName, width: '100px' },
                { field: 'tableName', name: this.colNameEntityTableName, width: '100px', formatter: Sage.MainView.EntityMgr.EntityManagerFormatter.formatProperCaseValue },
                { field: '$updated', name: this.colNameModifyDate, width: '100px', type: dateTimeColumn },
                { field: 'properties', name: this.colNamePropertyCount, width: '50px', formatter: Sage.MainView.EntityMgr.EntityManagerFormatter.formatCountProps, nosort: true },
                { field: 'filters', name: this.colNameFilterCount, width: '50px', formatter: Sage.MainView.EntityMgr.EntityManagerFormatter.formatCountFilter, nosort: true },
                { field: 'filters', name: this.colNameMetricCount, width: '50px', formatter: Sage.MainView.EntityMgr.EntityManagerFormatter.formatCountMetric, nosort: true },
                { field: 'package', name: this.colNamePackage, width: '100px', formatter: Sage.MainView.EntityMgr.EntityManagerFormatter.GetKey, nosort: true }
            ];
        },
        _getSelect: function () {
            return ['$descriptor', 'name', 'tableName', 'properties', 'filters', 'package', 'filters/filterType'];
        },
        _getWhere: function () {
            return "";
        },
        _getSort: function () {
            var sort = [{ attribute: '$descriptor', descending: false }];
            return sort;
        },
        _getInclude: function () {
            var includes = [];
            return includes;
        },
        _getSummaryListRequestConfig: function () {
            var requestConfig = {
                resourceKind: this._resourceKind,
                serviceName: 'metadata',
                keyField: '$key',
                //select: ['$descriptor'],
                include: [],
                sort: this._getSort(),
                useBatchRequest: false
            };
            return requestConfig;
        },
		_getFormatterScope: function () {
            var requestConfig = this._getSummaryListRequestConfig();
            var formatScope = new EntitySDataSummaryFormatterScope({
                templateLocation: 'MainView/EntityMgr/templates/EntityListSummary.html',
                resetDataManager: true,
                requestConfiguration: requestConfig
            });
            return formatScope;
        },
        _getSummaryDetailRequestConfig: function () {
            var requestConfig = {
                resourceKind: this._resourceKind,
                serviceName: 'metadata',
                keyField: '$key',
                select: ['$key', 'filterName', 'displayName', 'propertyName', 'filterType', 'analyticsAvailable', '$updated', 'details'],
                sort: [{ attribute: 'filterName', descending: true }],
                include: [],
                useBatchRequest: false
            };
            return requestConfig;
        },
        _getDetailConfig: function () {
            var formatScope = this._getFormatterScope();
            var requestConfig = this._getSummaryDetailRequestConfig();
            var detailConfig = {
                resourceKind: this._resourceKind,
                requestConfiguration: requestConfig//,
                
            };
            return detailConfig;
        },
        _getToolBars: function () {
            var toolBars = { items: [] };
            return toolBars;
        }
    });
    return entityListPanelConfig;
});