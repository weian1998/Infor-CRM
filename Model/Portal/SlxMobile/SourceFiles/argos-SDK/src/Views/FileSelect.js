/* Copyright (c) 2010, Sage Software, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @class argos.Views.FileSelect
 * File Select View is a view for selection files capabilities.
 *
 * @alternateClassName FileSelect
 * @extends argos.View
 */
define('argos/Views/FileSelect', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/window',
    'dojo/has',
    'dojo/dom-construct',
    'dojo/dom-attr',
    'dojo/dom-class',
    'dojo/dom',
    '../Fields/TextField',
    '../View'
], function(
    declare,
    lang,
    win,
    has,
    domConstruct,
    domAttr,
    domClass,
    dom,
    TextField,
    View
) {

    var __class = declare('argos.Views.FileSelect', [View], {
        // Localization
        titleText: 'File Select',
        addFileText: 'Click or Tap here to add a file.',
        uploadText: 'Upload',
        cancelText: 'Cancel',
        selectFileText:'Select file',
        loadingText: 'Uploading...',
        descriptionText: 'description',
        bytesText: 'bytes',
        notSupportedText: 'Adding attachments is not supported by your device.',

        /**
         * @property {Simplate}
         * The template used to render the loading message when the view is requesting more data.
         *
         * The default template uses the following properties:
         *
         *      name                description
         *      ----------------------------------------------------------------
         *      loadingText         The text to display while loading.
         */
        loadingTemplate: new Simplate([
            '<li class="list-loading-indicator"><div id="fileselect-upload-progress">{%= $.loadingText %}</div></li>'
            //'</li>'
        ]),

        /**
         * @property {Simplate}
         * The template that displays when HTML5 file api is not supported.
         */
        notSupportedTemplate: new Simplate([
            '<h2>{%= $$.notSupportedText %}</h2>'
        ]),

        /**
         * @property {Simplate}
         * Simplate that defines the HTML Markup
         *
         * * `$` => File Select view instance
         *
         */
        widgetTemplate: new Simplate([
            '<div title="{%: $.titleText %}" class="panel {%= $.cls %}">',
                '<div  data-dojo-attach-point="fileArea" class="file-area">',
                    '<div class="file-wrapper">',
                        '<div class="file-wrap" data-dojo-attach-point="fileWrapper">',
                            '<input type="file" data-dojo-attach-point="btnFileSelect" size="71" accept="*/*">',
                        '</div>',
                        '{%: $.addFileText %}',
                    '</div>',
                '</div>',
                '<ul class="list-content"  data-dojo-attach-point="contentNode"></ul>',
                '<div class="buttons">',
                    '<div><button id="fileSelect-btn-upload" data-dojo-attach-point="btnUploadFiles" class="button inline" data-action="onUploadFiles"><span>{%: $.uploadText %}</span></button>',
                    '<button id="fileSelect-btn-cancel" class="button inline" data-action="cancelSelect"><span>{%: $.cancelText %}</span></button><div>',
                '</div>',
            '</div>'
        ]),
        /**
         * @property {Simplate} fileTemplate
         */
        fileTemplate: new Simplate([
            '<li class="row {%= $.cls %}" data-property="{%= $.property || $.name %}">',
               '<div class="file-name">{%: $.fileName %}</div>',
               '<div class="file-label"><label>{%: $$.descriptionText %}</label></div>',
               '<div class="file-text">',
                   '<input id="{%=  $.name %}" type="text" value="{%=  $.description %}">',
               '</div>',
            '</li>'
        ]),

        signatureNode: null,
        id: 'fileSelect_edit',
        btnFileSelect: null,
        _files:null,
        _formParts: [],

        /**
         * @constructor
         */
        constructor: function() {
        },
        postCreate: function() {
            this.inherited(arguments);
            domClass.remove(this.domNode, 'list-loading');
        },
        /**
         * Extends the @{link Sage.Platlform.Mobile.View} show to clear out the onchange event of the file input.
         * The onchange event will only fire once per file, so we must re-insert the dom node and re-attach the event.
         * @extends show
         */
        show: function(options) {
            var node;

            this.inherited(arguments);

            if (!has('html5-file-api')) {
                domConstruct.place(this.notSupportedTemplate.apply({}, this), this.domNode, 'only');
                return;
            }

            this._files = [];

            // Reset the input or the onchange will not fire if the same file is uploaded multiple times.
            // Unfortunately IE does not allow you to reset the value of a file input, so we have to clone the node and re-insert it.
            node = this.btnFileSelect.cloneNode();

            domConstruct.destroy(this.btnFileSelect);
            this.fileWrapper.appendChild(node);
            this.btnFileSelect = node;

            this.btnFileSelect.onchange = function(e) {
                this._onSelectFile(e);
            }.bind(this);

            this.contentNode.innerHTML = '';
            domClass.remove(this.fileArea, 'display-none');
            domClass.remove(this.btnUploadFiles, 'display-none');
            this.onUpdateProgress('');
        },
        _browesForFiles: function(file) {
            this.btnFileSelect.click();
        },
        removeFile: function(fileId) {
        },
        /**
         * Returns an array of objects with the properties of: file, fileName, and description.
         * @returns {Array}
         */
        getFileItems: function() {
            var fileItems, files, description, i;
            fileItems = [];
            files = this._files;
            description = '';
            for (i = 0; i < files.length; i++) {
                description = this._getFileDescription(i);
                fileItems.push({
                    file: files[i],
                    fileName: files[i].name,
                    description: description
                });
            }
            return fileItems;
        },
        _getFileDescription: function(fileIndex) {
            var n, desc;
            n = dom.byId('File_' + fileIndex);
            if (n) {
                desc = n.value;
            }
            return desc;
        },
        _onSelectFile: function(e) {
            var files, i;

            files = this.btnFileSelect.files;
            if (files && files.length > 0) {
                for (i = 0; i < files.length; i++) {
                    this._files.push(files[i]);
                }
                this._buildForm(files);
            }
            domClass.remove(this.btnUploadFiles, 'display-none');
            domClass.add(this.fileArea, 'display-none');

        },
        _addFile: function(file, index) {
            var filelength, data, rowNode;

            filelength = this._getFileLength(file);
            data = {
                name: 'File_' + index,
                fileName: file.name + '  (' + filelength + ')',
                description: this._getDefaultDescription(file.name)
            };
            rowNode = domConstruct.place(this.fileTemplate.apply(data, this), this.contentNode, 'last');
        },
        _getFileLength: function(file) {
            var filelength;

            filelength = 0;
            if (file.size === 0) {
                filelength = 0;
            }
            else {
                filelength = file.size || file.blob.length;
            }
            if (filelength === 0) {
                filelength += '0 ' + this.bytesTextBytes;
            }
            else {
                if (filelength) {
                    if (filelength > 1024) {
                        if (filelength > 1048576) {
                            filelength = Math.round(filelength / 1048576) + ' MB';
                        } else {
                            filelength = Math.round(filelength / 1024) + ' KB';
                        }
                    } else {
                        filelength += ' ' + this.bytesTextBytesBytes;
                    }
                }
            }
            return filelength;
        },
        _buildForm: function(files) {
            var file, i;
            for (i = 0; i < files.length; i++) {
                file = files[i];
                this._addFile(file, i);
            }
        },
        _getDefaultDescription: function(filename) {
            return filename.replace(/\.[\w]*/, '');
        },
        /**
         * Handles the display when the user clicks upload.
         */
        onUploadFiles: function() {
            var tpl;
            domClass.add(this.btnUploadFiles, 'display-none');
            tpl = this.loadingTemplate.apply(this);
            domClass.add(this.domNode, 'list-loading');
            domConstruct.place(tpl, this.contentNode, 'first');
        },
        cancelSelect: function() {
        },
        /**
         * Handles the display when progress events are recieved.
         */
        onUpdateProgress: function(msg) {
            var n = dom.byId('fileselect-upload-progress');
            if (n) {
                n.innerHTML = this.loadingText + ' ' + msg;
            }
        },
        /**
         * Handles the display when the upload fails.
         */
        onUpdateFailed: function(msg) {
            this.onUpdateProgress(msg);
            domClass.remove(this.domNode, 'list-loading');
        }
    });

    lang.setObject('Sage.Platform.Mobile.Views.FileSelect', __class);
    return __class;
});

