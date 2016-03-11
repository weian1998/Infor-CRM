/*globals Sage, dojo, define, window, slx, slx_installDesktopFeatures */
define('Sage/Utility/File/DragDropWatcher', [
    'Sage/UI/Dialogs',
    'Sage/Utility/File',
    'dojo/string',
    'dojo/i18n!./nls/DragDropWatcher',
    'dojo/has',
    'dojo/_base/sniff'
],
function (Dialogs, FileUtil, dString, dragDropWatcherStrings, has, _sniff) {
    Sage.namespace('Utility.File.DragDropWatcher');
    Sage.Utility.File.DragDropWatcher = {
        gearsDesktop: false,
        allowdDetailDrop: false,
        allowdListDrop: false,
        init: function (options) {
            Sage.Utility.File.DragDropWatcher.allowdDetailDrop = options.allowDetailDragDrop;
            Sage.Utility.File.DragDropWatcher.allowdListDrop = options.allowListDragDrop;
            /*
            if (slx && slx.desktop) {
                this.desktop = slx.desktop;
                if (has('ie') < 11) {
                    dojo.connect(dojo.body(), 'ondragenter', this.handleGearsDragEnter);
                    dojo.connect(dojo.body(), 'ondragover', this.handleGearsDragOver);
                    dojo.connect(dojo.body(), 'ondragleave', this.handleGearsDragLeave);
                    if (has('ie') < 9) {
                        dojo.connect(dojo.body(), 'ondrop', this.handleGearsFileDrop);
                    } else {
                        // Cannot use dojo.connect()
                        dojo.body().attachEvent('ondrop', this.handleGearsFileDrop);
                    }
                }
                else {
                    dojo.connect(dojo.body(), 'dragenter', this.handleGearsDragEnter);
                    dojo.connect(dojo.body(), 'dragover', this.handleGearsDragOver);
                    dojo.connect(dojo.body(), 'dragleave', this.handleGearsDragLeave);
                    dojo.connect(dojo.body(), 'drop', this.handleGearsFileDrop);
                }
            } else */{
                if (FileUtil.supportsHTML5File) {
                    dojo.connect(dojo.body(), 'dragenter', this.handleDragEnter);
                    dojo.connect(dojo.body(), 'dragover', this.handleDragOver);
                    dojo.connect(dojo.body(), 'dragleave', this.handleDragLeave);
                    dojo.connect(dojo.body(), 'drop', this.handleFileDrop);
                }
                else {
                    if (has('ie') < 11) {
                        dojo.connect(dojo.body(), 'ondragenter', this.handleGearsDragEnter);
                        dojo.connect(dojo.body(), 'ondragover', this.handleGearsDragOver);
                        dojo.connect(dojo.body(), 'ondragleave', this.handleGearsDragLeave);
                        if (has('ie') < 9) {
                            dojo.connect(dojo.body(), 'ondrop', this.handleFileDropNotSupported);
                        } else {
                            // Cannot use dojo.connect()
                            dojo.body().attachEvent('ondrop', this.handleFileDropNotSupported);
                        }
                    } else {

                        dojo.connect(dojo.body(), 'dragenter', this.handleDragEnter);
                        dojo.connect(dojo.body(), 'dragover', this.handleDragOver);
                        dojo.connect(dojo.body(), 'dragleave', this.handleDragLeave);
                        dojo.connect(dojo.body(), 'drop', this.handleFileDropNotSupported);
                    }
                }
            }
        },
        handleDragEnter: function (e) {
            Sage.Utility.File.DragDropWatcher.finishDrag(e, false);
        },
        handleDragLeave: function (e) {
            Sage.Utility.File.DragDropWatcher.finishDrag(e, false);
        },
        handleDragOver: function (e) {
            Sage.Utility.File.DragDropWatcher.finishDrag(e, false);
        },
        handleFileDrop: function (e) {
            Sage.Utility.File.DragDropWatcher.finishDrag(e, true);
            var allow = Sage.Utility.File.DragDropWatcher._AllowDragDrop();
            if (!allow) {
                return;
            }
            var files = e.dataTransfer.files;
            if (files && files.length > 0) {
                if (FileUtil.isFileSizeAllowed(files)) {
                    Sage.Utility.File.DragDropWatcher.onFilesDropped(files, e.target);
                    Sage.Utility.File.DragDropWatcher.finishDrag(e, false); //call this to make sure drop progigation is stopped;
                }
            } else {
                //maybe they came from Outlook, see if gears can help...
                if (typeof slx !== 'undefined' && slx && slx.desktop) {
                    var desktop = slx.desktop;
                    var data = desktop.getDragData();
                    files = data && data.files;
                    if (files && files.length > 0) {
                        if (FileUtil.isFileSizeAllowed(files)) {
                            Sage.Utility.File.DragDropWatcher.onFilesDropped(files, e.target);
                            Sage.Utility.File.DragDropWatcher.finishDrag(e, false); //call this to make sure drop progigation is stopped;
                        }
                    }
                }
            }
        },
        finishDrag: function (e, isDrop) {
            var evt = e || window.event;
            if (!evt || typeof evt === 'undefined') {
                console.warn('The event parameter is invalid in finishDrag().');
                return;
            }
            if (typeof (this.desktop) !== 'undefined') {
                this.desktop.setDropEffect(evt, 'copy');
            }
            if (dojo.isFF) {
                if (isDrop || FileUtil.supportsHTML5File) {
                    evt.stopPropagation();
                    evt.preventDefault();
                }
            } else if (Sage.Utility.isIE || dojo.isSafari || dojo.isChrome) {
                if (!isDrop) {
                    if (typeof evt.stopPropagation === 'function') {
                        evt.stopPropagation();
                    }
                    if (typeof evt.preventDefault === 'function') {
                        evt.preventDefault();
                    }
                    else {
                        evt.returnValue = false;
                    }
                }
            }
        },
        handleGearsDragEnter: function (e) {
            Sage.Utility.File.DragDropWatcher.finishDrag(e, false);
        },
        handleGearsDragLeave: function (e) {
            Sage.Utility.File.DragDropWatcher.finishDrag(e, false);
        },
        handleGearsDragOver: function (e) {
            Sage.Utility.File.DragDropWatcher.finishDrag(e, false);
        },
        handleGearsFileDrop: function (e) {
            if (typeof slx !== 'undefined' && slx && slx.desktop) {
                Sage.Utility.File.DragDropWatcher.finishDrag(e, true);
                var allow = Sage.Utility.File.DragDropWatcher._AllowDragDrop();
                if (!allow) {
                    return;
                }
                var data = slx.desktop.getDragData();
                var target = e.target;
                if (!target) {
                    target = e.srcElement;
                }
                var files = data && data.files;
                if (files && files.length > 0) {
                    if (Sage.Utility.File.isFileSizeAllowed(files)) {
                        Sage.Utility.File.DragDropWatcher.onFilesDropped(files, target);
                    }
                }
            }
        },
        onFilesDropped: function (files, dropTarget) { },
        _AllowDragDrop: function () {
            var currentViewName = Sage.Utility.getPageName();
            var currentMode = Sage.Utility.getModeId();
            if (currentMode !== 'detail') {
                var contextSvc = Sage.Services.getService('ClientEntityContext');
                if (contextSvc) {
                    var context = contextSvc.getContext();
                    if (context) {
                        if (context.EntityType === "Sage.Entity.Interfaces.IActivity") {
                            return true;
                        }
                        if (context.EntityType === "Sage.Entity.Interfaces.IHistory") {
                            return true;
                        }
                    }
                }
                currentViewName = currentViewName.substring(0, currentViewName.indexOf('.'));
                if (currentViewName === "Library") {
                    return true;
                }
                if (Sage.Utility.File.DragDropWatcher.allowdListDrop) {
                    return true;
                }
                return false;
            } else {
                if (Sage.Utility.File.DragDropWatcher.allowdDetailDrop) {
                    return true;
                }
                return false;
            }
        },
        handleFileDropNotSupported: function (e) {
            var query0 = dragDropWatcherStrings.query0 || 'The feature you are requesting requires the Saleslogix Desktop <br> Integration Module.';
            var query1 = dragDropWatcherStrings.query1 || 'Find out more...';
            var query2 = dragDropWatcherStrings.query2 || 'Would you like to install this feature now?';
            var query3 = dragDropWatcherStrings.query3 || 'Note: This module can be installed at any time from the logon or options pages.';
            var url = Sage.Link.getHelpUrl('desktopintegration');
            var html = dString.substitute('<table><tr><td><span> ${0} <a href="${1}">${2}</a><br><br>${3}<br><br><font style="font-style:italic">${4}<font></span></td></tr></table>', [query0, url, query1, query2, query3]);
            var queryOptions = {
                title: 'Infor CRM',
                query: html,
                callbackFn: function (result) {
                    if (result) {
                        slx_installDesktopFeatures();
                    }
                },
                yesText: null,
                noText: null,
                icon: 'infoIcon',
                showNoButton: true
            };
            Dialogs.raiseQueryDialogExt(queryOptions);
        }
    };

    return Sage.Utility.File.DragDropWatcher;
});