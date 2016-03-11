/*
 * Copyright (c) 1997-2013, SalesLogix, NA., LLC. All rights reserved.
 */

/**
 * @class crm.Views.Opportunity.Detail
 *
 * @extends argos.Detail
 *
 * @requires crm.Format
 */
define('crm/Views/Opportunity/Detail', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/dom-construct',
    'dojo/query',
    'dojo/string',
    'argos/Detail',
    '../../Format'
], function(
    declare,
    lang,
    domConstruct,
    query,
    string,
    Detail,
    format
) {

    var __class = declare('crm.Views.Opportunity.Detail', [Detail], {
        //Localization
        accountText: 'acct',
        acctMgrText: 'acct mgr',
        estCloseText: 'est close',
        detailsText: 'Details',
        fbarHomeTitleText: 'home',
        fbarScheduleTitleText: 'schedule',
        importSourceText: 'lead source',
        opportunityText: 'opportunity',
        ownerText: 'owner',
        actionsText: 'Quick Actions',
        potentialText: 'sales potential',
        potentialBaseText: 'sales potential (base rate)',
        potentialOpportunityText: 'sales potential (opp. rate)',
        potentialMyRateText: 'sales potential (my rate)',
        probabilityText: 'close prob',
        relatedActivitiesText: 'Activities',
        relatedContactsText: 'Opportunity Contacts',
        relatedHistoriesText: 'Notes/History',
        relatedItemsText: 'Related Items',
        relatedNotesText: 'Notes',
        relatedProductsText: 'Products',
        relatedAttachmentText: 'Attachments',
        relatedAttachmentTitleText: 'Opportunity Attachments',
        resellerText: 'reseller',
        statusText: 'status',
        titleText: 'Opportunity',
        typeText: 'type',
        scheduleActivityText: 'Schedule activity',
        addNoteText: 'Add note',
        moreDetailsText: 'More Details',
        multiCurrencyText: 'Multi Currency',
        multiCurrencyRateText: 'exchange rate',
        multiCurrencyCodeText: 'code',
        multiCurrencyDateText: 'rate date',
        multiCurrencyLockedText: 'rate locked',
        exchangeRateDateFormatText: 'M/D/YYYY h:mm A',

        //View Properties
        id: 'opportunity_detail',
        editView: 'opportunity_edit',
        noteEditView: 'history_edit',
        security: 'Entities/Opportunity/View',
        querySelect: [
            'Account/AccountName',
            'Account/WebAddress',
            'Account/MainPhone',
            'Account/Fax',
            'Account/Address/*',
            'AccountManager/UserInfo/FirstName',
            'AccountManager/UserInfo/LastName',
            'CloseProbability',
            'Description',
            'EstimatedClose',
            'ExchangeRate',
            'ExchangeRateCode',
            'ExchangeRateDate',
            'ExchangeRateLocked',
            'LeadSource/Description',
            'Owner/OwnerDescription',
            'Reseller/AccountName',
            'SalesPotential',
            'Stage',
            'Status',
            'Type',
            'Weighted'
        ],
        resourceKind: 'opportunities',

        scheduleActivity: function() {
            App.navigateToActivityInsertView();
        },
        addNote: function() {
            var view = App.getView(this.noteEditView);
            if (view) {
                view.show({
                    template: {},
                    insert: true
                });
            }
        },
        processEntry: function() {
            this.inherited(arguments);

            if (App.hasMultiCurrency() && this.options && this.entry && this.entry.ExchangeRate) {
                this.options.ExchangeRate = this.entry.ExchangeRate;
                this.options.ExchangeRateCode = this.entry.ExchangeRateCode;
            }
        },
        getValues: function() {
            var values = this.inherited(arguments),
                estimatedCloseDate = this.fields['EstimatedClose'].getValue(),
                timelessStartDate = estimatedCloseDate.clone()
                    .clearTime()
                    .add({minutes: -1 * estimatedCloseDate.getTimezoneOffset(), seconds: 5});

            values = values || {};
            values['EstimatedClose'] = timelessStartDate;

            return values;
        },
        formatAccountRelatedQuery: function(fmt) {
            return string.substitute(fmt, [this.entry['Account']['$key']]);
        },
        createLayout: function() {
            var layout, quickActions, details, moreDetails, multiCurrency, relatedItems;

            quickActions = {
                list: true,
                title: this.actionsText,
                cls: 'action-list',
                name: 'QuickActionsSection',
                children: [{
                        name: 'ScheduleActivityAction',
                        property: 'Description',
                        label: this.scheduleActivityText,
                        iconClass: 'fa fa-calendar fa-lg',
                        action: 'scheduleActivity'
                    }, {
                        name: 'AddNoteAction',
                        property: 'Description',
                        label: this.addNoteText,
                        iconClass: 'fa fa-edit fa-lg',
                        action: 'addNote'
                    }]
            };

            details = {
                title: this.detailsText,
                name: 'DetailsSection',
                children: [{
                        label: this.opportunityText,
                        name: 'Description',
                        property: 'Description'
                    }, {
                        label: this.accountText,
                        key: 'Account.$key',
                        name: 'Account.AccountName',
                        property: 'Account.AccountName',
                        view: 'account_detail'
                    }, {
                        label: this.statusText,
                        name: 'Status',
                        property: 'Status'
                    }, {
                        label: this.estCloseText,
                        name: 'EstimatedClose',
                        property: 'EstimatedClose',
                        renderer: format.date.bindDelegate(this, null, true)
                    }, {
                        label: App.hasMultiCurrency() ? this.potentialBaseText : this.potentialText,
                        name: 'SalesPotential',
                        property: 'SalesPotential',
                        renderer: (function(val) {
                            var exhangeRate, convertedValue;
                            if (App.hasMultiCurrency()) {
                                exhangeRate = App.getBaseExchangeRate();
                                convertedValue = val * exhangeRate.rate;
                                return format.multiCurrency.call(null, convertedValue, exhangeRate.code);
                            }
                            return format.currency.call(null, val);
                        }).bindDelegate(this)
                    }]
            };

            multiCurrency = {
                title: this.multiCurrencyText,
                name: 'MultiCurrencySection',
                children: [{
                        label: this.multiCurrencyRateText,
                        name: 'ExchangeRate',
                        property: 'ExchangeRate'
                    }, {
                        label: this.multiCurrencyCodeText,
                        name: 'ExchangeRateCode',
                        property: 'ExchangeRateCode'
                    }, {
                        label: this.multiCurrencyDateText,
                        name: 'ExchangeRateDate',
                        property: 'ExchangeRateDate',
                        renderer: format.date.bindDelegate(this, this.exchangeRateDateFormatText, false)
                    }, {
                        label: this.multiCurrencyLockedText,
                        name: 'ExchangeRateLocked',
                        property: 'ExchangeRateLocked'
                    }]
            };

            moreDetails = {
                title: this.moreDetailsText,
                name: 'MoreDetailsSection',
                collapsed: true,
                children: [{
                        label: this.typeText,
                        name: 'Type',
                        property: 'Type'
                    }, {
                        label: this.resellerText,
                        key: 'Reseller.$key',
                        name: 'Reseller.AccountName',
                        property: 'Reseller.AccountName',
                        view: 'account_detail'
                    }, {
                        label: this.probabilityText,
                        name: 'CloseProbability',
                        property: 'CloseProbability'
                    }, {
                        label: this.acctMgrText,
                        name: 'AccountManager.UserInfo',
                        property: 'AccountManager.UserInfo',
                        renderer: format.nameLF
                    }, {
                        label: this.importSourceText,
                        name: 'LeadSource.Description',
                        property: 'LeadSource.Description'
                    }]
            };

            relatedItems = {
                list: true,
                title: this.relatedItemsText,
                name: 'RelatedItemsSection',
                children: [{
                        name: 'OpportunityRelated',
                        label: this.relatedProductsText,
                        view: 'opportunityproduct_related',
                        where: this.formatRelatedQuery.bindDelegate(this, 'Opportunity.Id eq "${0}"')
                    }, {
                        name: 'ActivityRelated',
                        label: this.relatedActivitiesText,
                        view: 'activity_related',
                        where: this.formatRelatedQuery.bindDelegate(this, 'OpportunityId eq "${0}"')
                    }, {
                        name: 'ContactRelated',
                        label: this.relatedContactsText,
                        options: {
                            prefilter: this.formatAccountRelatedQuery.bindDelegate(this, 'Account.Id eq "${0}"')
                        },
                        view: 'opportunitycontact_related',
                        where: this.formatRelatedQuery.bindDelegate(this, 'Opportunity.Id eq "${0}"')
                    }, {
                        name: 'HistoryRelated',
                        label: this.relatedHistoriesText,
                        where: this.formatRelatedQuery.bindDelegate(this, 'OpportunityId eq "${0}" and Type ne "atDatabaseChange"'),
                        view: 'history_related'
                    }, {
                        name: 'AttachmentRelated',
                        label: this.relatedAttachmentText,
                        where: this.formatRelatedQuery.bindDelegate(this, 'opportunityId eq "${0}"'),// must be lower case because of feed
                        view: 'opportunity_attachment_related',
                        title: this.relatedAttachmentTitleText
                    }]
            };

            layout = this.layout || (this.layout = []);

            if (layout.length > 0) {
                return layout;
            }

            layout.push(quickActions);
            layout.push(details);

            if (App.hasMultiCurrency()) {
                details.children.push({
                        label: this.potentialMyRateText,
                        name: 'SalesPotentialMine',
                        property: 'SalesPotential',
                        renderer: (function(val) {
                            var exhangeRate, convertedValue;
                            if (App.hasMultiCurrency()) {
                                exhangeRate = App.getMyExchangeRate();
                                convertedValue = val * exhangeRate.rate;
                                return format.multiCurrency.call(null, convertedValue, exhangeRate.code);
                            }

                            return '-';
                        }).bindDelegate(this)
                    }, {
                        label: this.potentialOpportunityText,
                        name: 'SalesPotentialOpportunity',
                        property: 'SalesPotentialOpportunity',
                        renderer: function(val) {
                            if (App.hasMultiCurrency()) {
                                return format.multiCurrency.call(null, (val.SalesPotential * val.ExchangeRate), val.ExchangeRateCode);
                            }

                            return '-';
                        }
                    });

                layout.push(multiCurrency);
            }

            layout.push(moreDetails);
            layout.push(relatedItems);
            return layout;
        }
    });

    lang.setObject('Mobile.SalesLogix.Views.Opportunity.Detail', __class);
    return __class;
});

