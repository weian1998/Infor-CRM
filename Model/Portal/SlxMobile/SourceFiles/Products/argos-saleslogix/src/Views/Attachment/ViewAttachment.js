/*
 * Copyright (c) 1997-2013, SalesLogix, NA., LLC. All rights reserved.
 */

/**
 * @class crm.Views.Attachment.ViewAttachment
 *
 *
 * @extends argos.Detail
 * @mixins argos.Detail
 * @mixins argos._LegacySDataDetailMixin
 *
 * @requires argos.Detail
 * @requires argos._LegacySDataDetailMixin
 *
 * @requires crm.Format
 * @requires crm.AttachmentManager
 * @requires crm.Utility
 *
 */
define('crm/Views/Attachment/ViewAttachment', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/string',
    'dojo/_base/connect',
    'dojo/_base/array',
    '../../Format',
    'dojo/dom-construct',
    'dojo/dom-attr',
    'dojo/dom-class',
    'dojo/has',
    'dojo/dom',
    'dojo/dom-geometry',
    '../../AttachmentManager',
    '../../Utility',
    'argos/Detail',
    'argos/_LegacySDataDetailMixin'
], function(
    declare,
    lang,
    string,
    connect,
    array,
    format,
    domConstruct,
    domAttr,
    domClass,
    has,
    dom,
    domGeom,
    AttachmentManager,
    Utility,
    Detail,
    _LegacySDataDetailMixin
) {

    var __class = declare('crm.Views.Attachment.ViewAttachment', [Detail, _LegacySDataDetailMixin], {
        //Localization
        detailsText: 'Attachment Details',
        descriptionText: 'description',
        fileNameText: 'file name',
        attachDateText: 'attachment date',
        fileSizeText: 'file size',
        userText: 'user',
        attachmentNotSupportedText: 'The attachment type is not supported for viewing.',
        attachmentDateFormatText: 'ddd M/D/YYYY h:mm a',
        downloadingText:'Downloading attachment ...',
        notSupportedText: 'Viewing attachments is not supported by your device.',

        //View Properties
        id: 'view_attachment',
        editView: '',
        security: null,
        querySelect: ['description', 'user', 'attachDate', 'fileSize', 'fileName', 'url', 'fileExists', 'remoteStatus', 'dataType'],
        resourceKind: 'attachments',
        contractName: 'system',
        orginalImageSize: { width: 0, height: 0 },
        queryInclude: ['$descriptors'],
        dataURL: null,
        notSupportedTemplate: new Simplate([
            '<h2>{%= $$.notSupportedText %}</h2>'
        ]),
        widgetTemplate: new Simplate([
            '<div id="{%= $.id %}" title="{%= $.titleText %}" class="overthrow detail panel {%= $.cls %}" {% if ($.resourceKind) { %}data-resource-kind="{%= $.resourceKind %}"{% } %}>',
            '{%! $.loadingTemplate %}',
            '<div class="panel-content" data-dojo-attach-point="contentNode"></div>',
            '<div class="attachment-viewer-content" data-dojo-attach-point="attachmentViewerNode"></div>',
            '</div>'
        ]),
        attachmentLoadingTemplate: new Simplate([
            '<div class="list-loading-indicator">{%= $.loadingText %}</div>'
        ]),
        attachmentViewTemplate: new Simplate([
            '<div class="attachment-viewer-label" style="white-space:nowrap;">',
               '<label>{%= $.description + " (" + $.fileType + ")"  %}</label>',
            '</div>',
            '<div class="attachment-viewer-area">',
                   '<iframe id="attachment-Iframe" src="{%= $.url %}"></iframe>',
            '</div>'
        ]),
        attachmentViewImageTemplate: new Simplate([
           '<div class="attachment-viewer-label" style="white-space:nowrap;">',
               '<label>{%= $.description + " (" + $.fileType + ")"  %}</label>',
           '</div>',
           '<div class="attachment-viewer-area">',
               '<table>',
                   '<tr valign="middle">',
                       '<td id="imagePlaceholder" align="center">',
                       '</td>',
                   '</tr>',
               '</table>',
           '</div>'
        ]),
        attachmentViewNotSupportedTemplate: new Simplate([
                '<div class="attachment-viewer-label">',
                '<label>{%= $$.attachmentNotSupportedText %}</label>',
                '</div>',
                '<div class="attachment-viewer-not-supported">',
                '<h3><span>{%: $.description %}&nbsp;</span></h3>',
                '<h4><span>({%: crm.Format.date($.attachDate, $$.attachmentDateFormatText) %})&nbsp;</span>',
                '<span>{%: crm.Format.fileSize($.fileSize) %} </span></h4>',
                '<h4><span>{%: crm.Utility.getFileExtension($.fileName) %} </span></h4>',
                '{% if($.user) { %}',
                    '<h4><span>{%: $.user.$descriptor  %}</span></h4>',
               '{% } %}',
               '</div>'
        ]),

        downloadingTemplate: new Simplate([
            '<li class="list-loading-indicator"><div>{%= $.downloadingText %}</div></li>'
        ]),
        show: function(options) {
            this.inherited(arguments);
            this.attachmentViewerNode.innerHTML = '';
            if (!has('html5-file-api')) {
                domConstruct.place(this.notSupportedTemplate.apply({}, this), this.domNode, 'only');
                return;
            }

            //If this opened the second time we need to check to see if it is the same attachmnent and let the Process Entry function load the view.
            if (this.entry) {
                if (options.key === this.entry.$key) {
                    this._loadAttachmentView(this.entry);
                }
            }
        },
        processEntry: function(entry) {
            this.inherited(arguments);
            this._loadAttachmentView(entry);
        },
        createRequest: function() {
            var request = this.inherited(arguments);
            request.setQueryArg('_includeFile', 'false');
            return request;
        },
        createEntryForDelete: function(e) {
            var entry = {
                '$key': e['$key'],
                '$etag': e['$etag'],
                '$name': e['$name']
            };
            return entry;
        },
        createToolLayout: function() {
            return this.tools;
        },
        createLayout: function() {
            return this.tools || (this.tools = []);
        },
        _loadAttachmentView: function(entry) {
            var data, am, isFile, url, viewNode, tpl, dl, description, attachmentid, fileType, self, iframe;

            am = new AttachmentManager();

            if (!entry.url) {
                description = entry.description;
                fileType = Utility.getFileExtension(entry.fileName);
                isFile = true;
            } else {
                isFile = false;
                description = entry.description + ' (' + entry.url + ')';
                fileType = 'url';
            }

            data = {
                fileName: entry.fileName,
                fileSize: entry.fileSize,
                fileType: fileType,
                url: '',
                description: description
            };

            if (isFile) {
                fileType = Utility.getFileExtension(entry.fileName);
                if (this._isfileTypeAllowed(fileType)) {
                    if (this._isfileTypeImage(fileType)) {
                        viewNode = domConstruct.place(this.attachmentViewImageTemplate.apply(data, this), this.attachmentViewerNode, 'last');
                        tpl = this.downloadingTemplate.apply(this);
                        dl = domConstruct.place(tpl, this.attachmentViewerNode, 'first');
                        domClass.add(this.domNode, 'list-loading');
                        self = this;
                        attachmentid = entry.$key;
                        //dataurl
                        am.getAttachmentFile(attachmentid, 'arraybuffer', function(responseInfo) {
                            var rData, image, loadHandler, loaded;

                            rData = Utility.base64ArrayBuffer(responseInfo.response);
                            self.dataURL = 'data:' + responseInfo.contentType + ';base64,' + rData;

                            image = new Image();

                            loadHandler = function() {
                                if (loaded) {
                                    return;
                                }

                                self._orginalImageSize = { width: image.width, height: image.height };
                                self._sizeImage(self.domNode, image);
                                domConstruct.place(image, 'imagePlaceholder', 'only');
                                loaded = true;
                            };

                            image.onload = loadHandler;
                            image.src = self.dataURL;

                            if (image.complete) {
                                loadHandler();
                            }

                            // Set download text to hidden
                            domClass.add(dl, 'display-none');
                        });
                    } else { //View file type in Iframe
                        if (this._viewImageOnly() === false) {
                            viewNode = domConstruct.place(this.attachmentViewTemplate.apply(data, this), this.attachmentViewerNode, 'last');
                            tpl = this.downloadingTemplate.apply(this);
                            dl = domConstruct.place(tpl, this.attachmentViewerNode, 'first');
                            domClass.add(this.domNode, 'list-loading');
                            self = this;
                            attachmentid = entry.$key;
                            am.getAttachmentFile(attachmentid, 'arraybuffer', function(responseInfo) {
                                var rData, dataUrl, iframe;

                                rData = Utility.base64ArrayBuffer(responseInfo.response);
                                dataUrl = 'data:' + responseInfo.contentType + ';base64,' + rData;
                                domClass.add(dl, 'display-none');
                                iframe = dom.byId('attachment-Iframe');
                                iframe.onload = function() {
                                    domClass.add(dl, 'display-none');
                                };
                                domClass.add(dl, 'display-none');
                                domAttr.set(iframe, 'src', dataUrl);
                            });
                        } else { //Only view images
                            viewNode = domConstruct.place(this.attachmentViewNotSupportedTemplate.apply(entry, this), this.attachmentViewerNode, 'last');
                        }
                    }
                } else { //File type not allowed
                    viewNode = domConstruct.place(this.attachmentViewNotSupportedTemplate.apply(entry, this), this.attachmentViewerNode, 'last');
                }

            } else { // url Attachment
                viewNode = domConstruct.place(this.attachmentViewTemplate.apply(data, this), this.attachmentViewerNode, 'last');
                url = am.getAttachmenturlByEntity(entry);
                domClass.add(this.domNode, 'list-loading');
                tpl = this.downloadingTemplate.apply(this);
                dl = domConstruct.place(tpl, this.attachmentViewerNode, 'first');
                iframe = dom.byId('attachment-Iframe');
                iframe.onload = function() {
                    domClass.add(dl, 'display-none');
                };
                domAttr.set(iframe, 'src', url);
                domClass.add(dl, 'display-none');
            }

        },
        _isfileTypeImage: function(fileType) {
            var imageTypes;

            fileType = fileType.substr(fileType.lastIndexOf('.') + 1).toLowerCase();
            if (App.imageFileTypes) {
                imageTypes = App.imageFileTypes;
            } else {
                imageTypes = { jpg: true, gif: true, png: true, bmp: true, tif: true };
            }

            if (imageTypes[fileType]) {
                return true;
            }

            return false;
        },
        _isfileTypeAllowed: function(fileType) {
            var fileTypes;

            fileType = fileType.substr(fileType.lastIndexOf('.') + 1).toLowerCase();
            if (App.nonViewableFileTypes) {
                fileTypes = App.nonViewableFileTypes;
            } else {
                fileTypes = { exe: true, dll: true };
            }

            if (fileTypes[fileType]) {
                return false;
            }
            return true;
        },
        _viewImageOnly: function() {
            return false;
        },
        _sizeImage: function(containerNode, image) {
            var wH, wW, iH, iW, contentBox, scale;

            contentBox = domGeom.getContentBox(containerNode);
            wH = contentBox.h;
            wW = contentBox.w;
            iH = image.height;
            iW = image.width;
            scale = 1;

            if (wH > 200) {
                wH = wH - 50;
            }

            if (wW > 200) {
                wW = wW - 50;
            }

            if (wH < 50) {
                wH = 100;
            }

            if (wW < 50) {
                wW = 100;
            }

            // if the image is larger than the window
            if (iW > wW && iH > wH) {
                // if the window height is lager than the width
                if (wH < wW) {
                    scale = 1 - ((iH - wH) / iH);
                } else { // if the window width is lager than the height
                    scale = 1 - ((iW - wW) / iW);
                }
            } else if (iW > wW) {// if the image  width is lager than the height
                scale = 1 - ((iW - wW) / iW);
            } else if (iH > wH) {// if the image  height is lager than the width
                scale = 1 - ((iH - wH) / iH);
            } else {
               //Image is samller than view
                if (wH / iH > wW / iW) {
                    scale = 1 + ((wH - iH) / wH);
                } else {
                    scale = 1 + ((wW - iW) / wW);
                }
            }
            image.height = 0.90 * scale * iH;
            image.width = 0.90 * scale * iW;

        }
    });

    lang.setObject('Mobile.SalesLogix.Views.Attachment.ViewAttachment', __class);
    return __class;
});

