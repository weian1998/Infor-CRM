/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define, sessionStorage */
define([
    'dojo/_base/declare',
    'Sage/_Templated',
    'dijit/_Widget',
    'Sage/Utility',
    'dojo/string',
    'Sage/Data/SDataStore',
    'dijit/form/ComboButton',
    'dojo/i18n!./nls/JobNotificationButton',
    'dojo/_base/event',
    'dojo/_base/lang',
    'dojo/dom-class',
    'Sage/UI/Alarms/JobNotificationPopup',
    'Sage/UI/ImageButton',
    'Sage/Services/UserOptions'
],
function (
    declare,
    _Templated,
    _Widget,
    utility,
    dString,
    SDataStore,
    ComboButton,
    notificationBtnStrings,
    event,
    lang,
    domClass) {
    var jobNotificationButton = declare('Sage.UI.Alarms.JobNotificationButton', [_Widget, _Templated], {
        options: {
            displayJobNotificationsInToolbar: true,
            pollInterval: 5
        },
        widgetsInTemplate: true,
        pollInterval: 5,
        _notificationsCountKey: 'NotificationsCount',
        _started: false,
        _notificationBtnVisible: false,
        widgetTemplate: new Simplate([
            '<span id="jobNotification" data-dojo-attach-point="_jobNotification" class="alarm-button-container alarm-button notification-buttonIcon display-none">',
            '<i class="fa fa-info-circle"></i>',
                '<button data-dojo-type="dijit.form.ComboButton" data-dojo-attach-point="_button" data-dojo-attach-event="onClick:_cboClick" class="" >',
                    '<div data-dojo-type="Sage.UI.Alarms.JobNotificationPopup" id="notificationPopup" data-dojo-attach-point="_popup" data-dojo-attach-event="onClose:_popupClosed"></div>',
                '</button>',
            '</span>'
        ]),
        _setPollIntervalAttr: function (val) {
            this.pollInterval = val;
        },
        _getPollIntervalAttr: function () {
            return this.pollInterval;
        },
        startup: function () {
            if (this._started) {
                return;
            }
            var jobService = Sage.Services.getService('JobService');
            var sdataService = jobService.getSchedulingSDataService();
            this._service = sdataService;
            this.inherited(arguments);
            dojo.subscribe('/job/execution/changed', this, this._notificationChanged);
            dojo.subscribe('/job/execution/setNotificationCount', this, this._setNotificationCount);

            var optionsSvc = Sage.Services.getService('UserOptions');
            if (optionsSvc) {
                //TODO - should probably create a new user option for job notifications
                optionsSvc.getByCategory('ActivityAlarm', this._receivedOptions, this);
            }

            //The ComboButton click causes a weird postback in IE8 in our environment, stopping the event in the button's valueNode stops that...
            if (this._button.valueNode) {
                this.connect(this._button.valueNode, 'click', function (e) {
                    event.stop(e);
                });
            }
        },
        _receivedOptions: function () {
            this._popup.set('options', this.options);
            if (this.options.displayJobNotificationsInToolbar && this.pollInterval > 0) {
                var self = this;
                window.setTimeout(function () {
                    self._poll();
                },
                15000);
            }
            this._started = true;
        },
        _poll: function () {
            if (this._service) {
                this._notificationStore = new SDataStore({
                    id: 'Executions',
                    service: this._service,
                    resourceKind: 'executions',
                    include: ["$descriptors"],
                    select: ['$key', 'user']
                });
                this._notificationStore.fetch({
                    start: 0,
                    onComplete: this._onReceiveCounts,
                    onError: this._countsFailed,
                    scope: this
                });
            }
        },
        _onReceiveCounts: function (data) {
            this._saveToSessionStorage(this._notificationsCountKey, data ? data.length : 0);
            this._initializeButton();
            var self = this;
            window.setTimeout(function () {
                self._poll();
            },
            this.pollInterval * 60000);
        },
        _countsFailed: function (req) {
            this._button.set('label', ' ?');
            this._button.set('title', notificationBtnStrings.notificationErrorToolTip);
            this._button.disabled = true;
            this._showNotificationButton();
            console.warn('could not acquire notification counts... %o', req);
            try {
                Sage.Utility.ErrorHandler._configuration.preemption.showUnhandledMessagingServiceExceptionMsg = false;
            }
            catch (e) { }
        },
        _initializeButton: function () {
            var notificationCount = this._getFromSessionStorage(this._notificationsCountKey) || 0;
            if (notificationCount > 0) {
                this._button.set('label', ' ' + notificationCount + ' ');
                this._button.set('title', dString.substitute(notificationBtnStrings.notificationToolTip, [notificationCount]));
                this._showNotificationButton();
            } else {
                this._hideNotificationButton();
            }
        },
        _setNotificationCount: function (notificationCount) {
            this._saveToSessionStorage(this._notificationsCountKey, notificationCount);
            this._initializeButton();
        },
        _showNotificationButton: function () {
            if (!this._notificationBtnVisible) {
                domClass.remove(this._jobNotification, 'display-none');
                this._notificationBtnVisible = true;
            }
        },
        _hideNotificationButton: function () {
            if (this._notificationBtnVisible) {
                domClass.add(this._jobNotification, 'display-none');
                this._notificationBtnVisible = false;
            }
        },
        _cboClick: function (e) {
            if (this._popup.isOpen) {
                this._button.closeDropDown();
            } else {
                this._button.openDropDown();
            }

            return false;
        },
        _popupClosed: function () {
        },
        _notificationChanged: function () {
            this._poll();
        },
        _saveToSessionStorage: function (key, value) {
            sessionStorage.setItem(key, value);
        },
        _getFromSessionStorage: function (key) {
            return sessionStorage.getItem(key);
        }
    });
    return jobNotificationButton;
});