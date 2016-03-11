/*
 * Copyright (c) 1997-2013, SalesLogix, NA., LLC. All rights reserved.
 */

/**
 * @class crm.Views.Contact.Detail
 *
 * @extends argos.Detail
 *
 * @requires crm.Format
 * @requires crm.Template
 */
define('crm/Views/Contact/Detail', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/string',
    '../../Format',
    '../../Template',
    'argos/Detail'
], function(
    declare,
    lang,
    string,
    format,
    template,
    Detail
) {

    var __class = declare('crm.Views.Contact.Detail', [Detail], {
        //Localization
        activityTypeText: {
            'atPhoneCall': 'Phone Call',
            'atEMail': 'E-mail'
        },
        accountText: 'account',
        acctMgrText: 'acct mgr',
        addressText: 'address',
        contactTitleText: 'title',
        createDateText: 'create date',
        createUserText: 'create user',
        emailText: 'email',
        faxText: 'fax',
        homeText: 'home phone',
        nameText: 'contact',
        ownerText: 'owner',
        actionsText: 'Quick Actions',
        relatedAccountsText: 'Accounts',
        relatedActivitiesText: 'Activities',
        relatedHistoriesText: 'Notes/History',
        relatedItemsText: 'Related Items',
        relatedNotesText: 'Notes',
        relatedOpportunitiesText: 'Opportunities',
        relatedTicketsText: 'Tickets',
        relatedAddressesText: 'Addresses',
        relatedAttachmentText: 'Attachments',
        relatedAttachmentTitleText: 'Contact Attachments',
        titleText: 'Contact',
        webText: 'web',
        workText: 'work phone',
        cuisinePreferenceText: 'cuisine',
        callMobileNumberText: 'Call mobile',
        callWorkNumberText: 'Call work',
        calledText: 'Called',
        scheduleActivityText: 'Schedule activity',
        addNoteText: 'Add note',
        sendEmailText: 'Send email',
        viewAddressText: 'View address',
        moreDetailsText: 'More Details',

        //View Properties
        id: 'contact_detail',
        editView: 'contact_edit',
        historyEditView: 'history_edit',
        noteEditView: 'history_edit',
        security: 'Entities/Contact/View',
        querySelect: [
            'Account/AccountName',
            'AccountManager/UserInfo/FirstName',
            'AccountManager/UserInfo/LastName',
            'AccountName',
            'Address/*',
            'CuisinePreference',
            'CreateDate',
            'CreateUser',
            'Email',
            'Fax',
            'FirstName',
            'HomePhone',
            'LastName',
            'MiddleName',
            'Mobile',
            'Name',
            'NameLF',
            'Owner/OwnerDescription',
            'Prefix',
            'Suffix',
            'Title',
            'WebAddress',
            'WorkPhone'
        ],
        resourceKind: 'contacts',

        navigateToHistoryInsert: function(type, entry, complete) {
            var view = App.getView(this.historyEditView);
            if (view) {
                this.refreshRequired = true;

                view.show({
                        title: this.activityTypeText[type],
                        template: {},
                        entry: entry,
                        insert: true
                    }, {
                        complete: complete
                    });
            }
        },
        recordCallToHistory: function(complete) {
            var entry = {
                '$name': 'History',
                'Type': 'atPhoneCall',
                'ContactName': this.entry['NameLF'],
                'ContactId': this.entry['$key'],
                'AccountName': this.entry['AccountName'],
                'AccountId': this.entry['Account']['$key'],
                'Description': string.substitute('${0} ${1}', [this.calledText, this.entry['NameLF']]),
                'UserId': App.context && App.context.user['$key'],
                'UserName': App.context && App.context.user['UserName'],
                'Duration': 15,
                'CompletedDate': (new Date())
            };

            this.navigateToHistoryInsert('atPhoneCall', entry, complete);
        },
        recordEmailToHistory: function(complete) {
            var entry = {
                '$name': 'History',
                'Type': 'atEMail',
                'ContactName': this.entry['NameLF'],
                'ContactId': this.entry['$key'],
                'AccountName': this.entry['AccountName'],
                'AccountId': this.entry['Account']['$key'],
                'Description': string.substitute('Emailed ${0}', [this.entry['NameLF']]),
                'UserId': App.context && App.context.user['$key'],
                'UserName': App.context && App.context.user['UserName'],
                'Duration': 15,
                'CompletedDate': (new Date())
            };

            this.navigateToHistoryInsert('atEMail', entry, complete);
        },
        callWorkPhone: function() {
            this.recordCallToHistory(function() {
                App.initiateCall(this.entry['WorkPhone']);
            }.bindDelegate(this));
        },
        callMobilePhone: function() {
            this.recordCallToHistory(function() {
                App.initiateCall(this.entry['Mobile']);
            }.bindDelegate(this));
        },
        sendEmail: function() {
            this.recordEmailToHistory(function() {
                App.initiateEmail(this.entry['Email']);
            }.bindDelegate(this));
        },
        checkValueExists: function(entry, value) {
            return !value;
        },
        viewAddress: function() {
            App.showMapForAddress(format.address(this.entry['Address'], true, ' '));
        },
        checkAddress: function(entry, value) {
            return !format.address(value, true, '');
        },
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
        createLayout: function() {
            return this.layout || (this.layout = [{
                    list: true,
                    title: this.actionsText,
                    cls: 'action-list',
                    name: 'QuickActionsSection',
                    children: [{
                            name: 'CallWorkPhoneAction',
                            property: 'WorkPhone',
                            label: this.callWorkNumberText,
                            action: 'callWorkPhone',
                            iconClass: 'fa fa-phone-square fa-lg',
                            disabled: this.checkValueExists,
                            renderer: format.phone.bindDelegate(this, false)
                        }, {
                            name: 'CallMobilePhoneAction',
                            property: 'Mobile',
                            label: this.callMobileNumberText,
                            action: 'callMobilePhone',
                            iconClass: 'fa fa-mobile fa-lg',
                            disabled: this.checkValueExists,
                            renderer: format.phone.bindDelegate(this, false)
                        }, {
                            name: 'ScheduleActivityAction',
                            label: this.scheduleActivityText,
                            action: 'scheduleActivity',
                            iconClass: 'fa fa-calendar fa-lg',
                            tpl: new Simplate([
                                '{%: $.AccountName %} / {%: $.NameLF %}'
                            ])
                        }, {
                            name: 'AddNoteAction',
                            property: 'NameLF',
                            label: this.addNoteText,
                            action: 'addNote',
                            iconClass: 'fa fa-edit fa-lg'
                        }, {
                            name: 'SendEmailAction',
                            property: 'Email',
                            label: this.sendEmailText,
                            action: 'sendEmail',
                            iconClass: 'fa fa-envelope fa-lg',
                            disabled: this.checkValueExists
                        }, {
                            name: 'ViewAddressAction',
                            property: 'Address',
                            label: this.viewAddressText,
                            action: 'viewAddress',
                            iconClass: 'fa fa-map-marker fa-lg',
                            disabled: this.checkAddress,
                            renderer: format.address.bindDelegate(this, true, ' ')
                        }]
                }, {
                    title: this.detailsText,
                    name: 'DetailsSection',
                    children: [{
                            name: 'NameLF',
                            property: 'NameLF',
                            label: this.nameText
                        }, {
                            name: 'AccountName',
                            property: 'AccountName',
                            descriptor: 'AccountName',
                            label: this.accountText,
                            view: 'account_detail',
                            key: 'Account.$key'
                        }, {
                            name: 'WorkPhone',
                            property: 'WorkPhone',
                            label: this.workText,
                            renderer: format.phone
                        }, {
                            name: 'AccountManager.UserInfo',
                            property: 'AccountManager.UserInfo',
                            label: this.acctMgrText,
                            tpl: template.nameLF
                        }]
                }, {
                    title: this.moreDetailsText,
                    name: 'MoreDetailsSection',
                    collapsed: true,
                    children: [{
                            name: 'HomePhone',
                            property: 'HomePhone',
                            label: this.homeText,
                            renderer: format.phone
                        }, {
                            name: 'WebAddress',
                            property: 'WebAddress',
                            label: this.webText,
                            renderer: format.link
                        }, {
                            name: 'Title',
                            property: 'Title',
                            label: this.contactTitleText
                        }, {
                            name: 'Fax',
                            property: 'Fax',
                            label: this.faxText,
                            renderer: format.phone
                        }, {
                            name: 'Owner.OwnerDescription',
                            property: 'Owner.OwnerDescription',
                            label: this.ownerText
                        }, {
                            name: 'CuisinePreference',
                            property: 'CuisinePreference',
                            label: this.cuisinePreferenceText
                        }]
                }, {
                    title: this.relatedItemsText,
                    name: 'RelatedItemsSection',
                    list: true,
                    children: [{
                            name: 'ActivityRelated',
                            label: this.relatedActivitiesText,
                            view: 'activity_related',
                            where: this.formatRelatedQuery.bindDelegate(this, 'ContactId eq "${0}"')
                        }, {
                            name: 'OpportunityRelated',
                            label: this.relatedOpportunitiesText,
                            view: 'opportunity_related',
                            where: this.formatRelatedQuery.bindDelegate(this, 'Contacts.Contact.Id eq "${0}"')
                        }, {
                            name: 'TicketRelated',
                            label: this.relatedTicketsText,
                            view: 'ticket_related',
                            where: this.formatRelatedQuery.bindDelegate(this, 'Contact.Id eq "${0}"')
                        }, {
                            name: 'HistoryRelated',
                            label: this.relatedHistoriesText,
                            where: this.formatRelatedQuery.bindDelegate(this, 'ContactId eq "${0}" and Type ne "atDatabaseChange"'),
                            view: 'history_related'
                        }, {
                            name: 'AddressesRelated',
                            label: this.relatedAddressesText,
                            where: this.formatRelatedQuery.bindDelegate(this, 'EntityId eq "${0}"', 'Address.EntityId'),
                            view: 'address_related'
                        }, {
                            name: 'AttachmentRelated',
                            label: this.relatedAttachmentText,
                            where: this.formatRelatedQuery.bindDelegate(this, 'contactId eq "${0}"'),// must be lower case because of feed
                            view: 'contact_attachment_related',
                            title: this.relatedAttachmentTitleText
                        }]
                }]);
        }
    });

    lang.setObject('Mobile.SalesLogix.Views.Contact.Detail', __class);
    return __class;
});

