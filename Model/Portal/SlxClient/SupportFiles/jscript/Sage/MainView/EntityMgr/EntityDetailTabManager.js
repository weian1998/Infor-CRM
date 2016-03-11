/*globals dojo, define, Sage, dijit, Simplate, $ */
define([
   
    'dijit/_Widget',
    'Sage/_Templated',
    'dojo/text!./templates/EntityDetailTabManager.html',
    'dojo/_base/declare',
    'Sage/MainView/EntityMgr/EntityDetailContentFilterGrid',
    'dojo/dom-style',
    'dojo/i18n!./nls/_BaseEntityDetailContent',
    'Sage/MainView/EntityMgr/EntityFilterUtility',
    'dijit/Tooltip',
    "dijit/popup",
    "dojo/on",
    "dojo/dom",
    "dojo/mouse"
],
function 
    (
    
    _Widget,
    _Templated,  
    template,
    declare,
    EntityDetailContentFilterGrid,
    domStyle,
    nlsResearch,
    fUtility,
    toolTip,
    popup,
    on,
    dom,
    mouse
    ){
    var entityDetailTabManager = declare('Sage.MainView.EntityMgr.EntityDetailTabManager', [_Widget, _Templated], {
       
        workspace: 'TabWorkspace',
        widgetsInTemplate: true,
        
        widgetTemplate: new Simplate(eval(template)),

        filterGrid: false,
        metricGrid: false,
        propertiesGrid: false,
        calculatedFieldsGrid: false,
        entityGrid: false,

        mainListItemSelected: '',

        edtmdataStore: false,
        filterUtility: false,

        constructor: function (selectedData) {

            if (dijit.byId("tabContainer_tablist_menuBtn") && dijit.byId("tabContainer_tablist_menuBtn").destroy) {
                dijit.byId("tabContainer_tablist_menuBtn").destroy();
            }
            if (dijit.byId("tabContainer_tablist_leftBtn") && dijit.byId("tabContainer_tablist_leftBtn").destroy) {
                dijit.byId("tabContainer_tablist_leftBtn").destroy();
            } 
            if (dijit.byId("tabContainer_tablist_filterDetailGridPane") && dijit.byId("tabContainer_tablist_filterDetailGridPane").destroy) {
                dijit.byId("tabContainer_tablist_filterDetailGridPane").destroy();
            } 
            if (dijit.byId("tabContainer_tablist_metricDetailGridPane") && dijit.byId("tabContainer_tablist_metricDetailGridPane").destroy) {
                dijit.byId("tabContainer_tablist_metricDetailGridPane").destroy();
            } 
            if (dijit.byId("tabContainer_tablist_rightBtn") && dijit.byId("tabContainer_tablist_rightBtn").destroy) {
                dijit.byId("tabContainer_tablist_rightBtn").destroy();
            } 
            if (dijit.byId("filterGrid_Account_addFilter") && dijit.byId("filterGrid_Account_addFilter").destroy) {
                dijit.byId("filterGrid_Account_addFilter").destroy();
            } 
            if (dijit.byId("filterGrid_Account_editFilter") && dijit.byId("filterGrid_Account_editFilter").destroy) {
                dijit.byId("filterGrid_Account_editFilter").destroy();
            }
            if (dijit.byId("filterGrid_Account_removeFilter") && dijit.byId("filterGrid_Account_removeFilter").destroy) {
                dijit.byId("filterGrid_Account_removeFilter").destroy();
            } 
            if (dijit.byId("filterGrid_Account_helpFilter") && dijit.byId("filterGrid_Account_helpFilter").destroy) {
                dijit.byId("filterGrid_Account_helpFilter").destroy();
            } 
            if (dijit.byId("filters_Account") && dijit.byId("filters_Account").destroy) {
                dijit.byId("filters_Account").destroy();
            } 
            if (dijit.byId("filters_Account_HeaderBar") && dijit.byId("filters_Account_HeaderBar").destroy) {
                dijit.byId("filters_Account_HeaderBar").destroy();
            }
            if (dijit.byId("filters_Account_HeaderBar_splitter") && dijit.byId("filters_Account_HeaderBar_splitter").destroy) {
                dijit.byId("filters_Account_HeaderBar_splitter").destroy();
            }
            if (dijit.byId("tp1f") && dijit.byId("tp1f").destroy) {
                dijit.byId("tp1f").destroy();
            }
            if (dijit.byId("tp2m") && dijit.byId("tp2m").destroy) {
                dijit.byId("tp2m").destroy();
            }
            ///////////////////////////////////
            if (dijit.byId("tabContainer") && dijit.byId("tabContainer").destroy) {
                dijit.byId("tabContainer").destroy();
            }
            if (dijit.byId("filterDetailGridPane") && dijit.byId("filterDetailGridPane").destroy) {
                dijit.byId("filterDetailGridPane").destroy();
            }
            if (dijit.byId("metricDetailGridPane") && dijit.byId("metricDetailGridPane").destroy) {
                dijit.byId("metricDetailGridPane").destroy();
            }
            ///////////////////////////////
            if (dijit.byId("filters") && dijit.byId("filters").destroy) {
                dijit.byId("filters").destroy();
            }
            if (dijit.byId("Metrics") && dijit.byId("Metrics").destroy) {
                dijit.byId("Metrics").destroy();
            }

            this.mainListItemSelected = selectedData;

            this.filterUtility = new fUtility();
            this.filterUtility.getSchemasInformationFromSData();
            this.filterUtility.getPropertiesAssociatedWithFilters(selectedData);
            this.filterUtility.getSpecialValues();

            this.filterGrid = new EntityDetailContentFilterGrid({ id: "filterGrid", entityName: selectedData.name });
            this.metricGrid = new EntityDetailContentFilterGrid({ id: "metricGrid", entityName: selectedData.name });
              
        },
        postCreate: function () {

            var entityName = this.$descriptor;
            if (this.filterGrid) // if there are filters to display, then lets set up our filterGrid to resize with the tab's contentPane.
            {
                dijit.byId("filterDetailGridPane").set("title", nlsResearch.FilterTabTitle); // translatable tab title
                dojo.connect(dijit.byId("filterDetailGridPane"), "onShow", dojo.partial(this.loadfilters, this));

                window.setTimeout(function () {
                        dijit.byId("tabContainer_tablist_filterDetailGridPane").set("title", nlsResearch.filtersFor + " " + entityName);
                });
            }
            if (this.metricGrid) // if there are filters to display, then lets set up our filterGrid to resize with the tab's contentPane.
            {
                dijit.byId("metricDetailGridPane").set("title", nlsResearch.MetricTabTitle); // translatable tab title
                dojo.connect(dijit.byId("metricDetailGridPane"), "onShow", dojo.partial(this.loadmetrics, this));

                window.setTimeout(function () {
                    dijit.byId("tabContainer_tablist_metricDetailGridPane").set("title", nlsResearch.metricsFor + " " + entityName);
                });
            }
            if (this.propertiesGrid)// if there are properties to display, then lets set up our propertiesGrid to resize with the tab's contentPane.
            {
                dijit.byId("entitiesDetailGridPane").set("title", nlsResearch.PropertyTabTitle); // translatable tab title
                dojo.connect(dijit.byId("entitiesDetailGridPane"), "onShow", dojo.partial(this.loadentity, this.mainListItemSelected));
            }

            if (this.calculatedFieldsGrid)// if there are calculated fields to display, then lets set up our calculatedFieldsGrid to resize with the tab's contentPane.
            {
                dijit.byId("calcFieldsDetailGridPane").set("title", nlsResearch.CalcFieldTabTitle); // translatable tab title
                dojo.connect(dijit.byId("calcFieldsDetailGridPane"), "onShow", dojo.partial(this.loadcalculatedFields, this.mainListItemSelected));
            }

            if (this.entityGrid)// if there are entities to display, then lets set up our entityGrid to resize with the tab's contentPane.
            {
                dijit.byId("propertiesDetailGridPane").set("title", nlsResearch.EntityTabTitle); // translatable tab title
                dojo.connect(dijit.byId("propertiesDetailGridPane"), "onShow", dojo.partial(this.loadproperties, this.mainListItemSelected));
            }

        },
       


        loadfilters: function (context) {
            context.filterGrid.setUtility(context.filterUtility);
            context.filterGrid.placeAt(this.containerNode);
            context.filterGrid._where = "filterType ne 'analyticsMetric'";
            context.filterGrid.onOpen(this.id, "filters", context.mainListItemSelected);
            context.filterGrid.startup();
            //dojo.connect(context.filterGrid.domNode, "hide", context.filterGrid.domNode.destroyRecursive());
        },
        loadmetrics: function (context) {
            context.metricGrid.setUtility(context.filterUtility);
            context.metricGrid.placeAt(this.containerNode);
            context.metricGrid._where = "filterType eq 'analyticsMetric'";
            context.metricGrid.onOpen(this.id, "metrics", context.mainListItemSelected);
            context.metricGrid.startup();
        },



        //To be implemented later.
        loadproperties: function (selectedMainListItem) {
            this.propertiesGrid.onOpen(this.parentListName, this.currentTabName);
            dojo.place(this.propertiesGrid.domNode, this.detailproperties_Grid, "only");
        },
        loadcalculatedFields: function (selectedMainListItem) {
            this.calcFieldsGrid.onOpen(this.parentListName, this.currentTabName);
            dojo.place(this.calcFieldsGrid.domNode, this.detailCalcFields_Grid, "only");
        },
        loadentity: function (selectedMainListItem) {
            this.entityGrid.onOpen(this.parentListName, this.currentTabName);
            dojo.place(this.entityGrid.domNode, this.detailsEntities_Grid, "only");
        }
    });
    return entityDetailTabManager;
});