/*globals Sage, define, FileReader, FormData, window, VBArray */
define([
    'Sage/UI/Dialogs',
    'dojo/number',
    'dojo/_base/lang',
    'dojo/i18n!./nls/File'
],
function (dialogs, dNumber, lang, nlsStrings) {
    Sage.namespace('Utility.File');
    Sage.Utility.File = {
        fileType: {
            ftAttachment: 0,
            ftLibraryDocs: 1
        },
        
        supportsHTML5File: (window.File && window.FileReader && window.FileList && window.Blob),

        fileUploadOptions: { maxFileSize: 4000000 },
        init: function (options) {
            if (options) {
                this.fileUploadOptions = options;
            }
        },
        isFileSizeAllowed: function (files) {
            var l = 0;
            var maxfileSize = Sage.Utility.File.fileUploadOptions.maxFileSize;
            var title = nlsStrings.largeFileWarningTitle;
            var msg = nlsStrings.largeFileWarningText;
            for (var i = 0; i < files.length; i++) {
                if (files[i].size === 0) {
                    // do nothing.
                } else {

                    l += files[i].size || files[i].blob.length;
                }
            }
            if (l > (maxfileSize)) {
                dialogs.showError(msg, title);
                return false;

            }
            return true;
        },
        uploadFile: function (file, url, progress, complete, error, scope, asPut) {
            if (!Sage.Utility.File.isFileSizeAllowed([file])) {
                return;
            }
            if (Sage.gears) {
                this._uploadFileGears(file, url, progress, complete, error, scope, asPut);
            } else if (this.supportsHTML5File) {
                if ((window.FileReader.prototype.readAsBinaryString) || (window.FileReader.prototype.readAsArrayBuffer)) {

                    this._uploadFileHTML5_asBinary(file, url, progress, complete, error, scope, asPut);

                 } else {

                    this._uploadFileHTML5(file, url, progress, complete, error, scope, asPut);
                }
            } else {
                this._showUnableToUploadError();
            }
        },
        uploadFileHTML5: function (file, url, progress, complete, error, scope, asPut) {
            if (!Sage.Utility.File.isFileSizeAllowed([file])) {
                return;
            }
            if (this.supportsHTML5File) {
                if ((window.FileReader.prototype.readAsBinaryString) || (window.FileReader.prototype.readAsArrayBuffer)) {
                    this._uploadFileHTML5_asBinary(file, url, progress, complete, error, scope, asPut);
                } else {
                    this._uploadFileHTML5(file, url, progress, complete, error, scope, asPut);
                }
            } else {
                this._showUnableToUploadError();
            }
        },
        _uploadFileGears: function (file, url, progress, complete, error, scope, asPut) {
            if (!window.Sage && !Sage.gears) {
                this._showUnableToUploadError();
                return;
            }

            if (progress) {
                progress.call(scope,null);
            }

            if (!url) {
                //assume Attachment SData url
                url = 'slxdata.ashx/slx/system/-/attachments/file?format=json';
            }
            var request = Sage.gears.factory.create('beta.httprequest');
            request.open((asPut) ? 'PUT' : 'POST', url);

            //var boundary = '------multipartformboundary' + (new Date()).getTime();
            var boundary = "---------------------------" + (new Date()).getTime();
            var dashdash = '--';
            var crlf = '\r\n';

            var builder = Sage.gears.factory.create('beta.blobbuilder');
            //for (var i = 0; i < files.length; i++) {
            /* Write boundary. */
            builder.append(dashdash);
            builder.append(boundary);
            builder.append(crlf);
            //var file = files[i];
            /* Generate headers. */
            //builder.append('Content-Disposition: form-data; name="file_"'); // + i + '"'); // will not work for raw binary
            builder.append('Content-Disposition: attachment; name="file_"'); // + i + '"');

            if (file.name) {
                builder.append('; filename*="' + encodeURI(file.name) + '"');
            }
            builder.append(crlf);

            builder.append('Content-Type: application/octet-stream');
            builder.append(crlf);
            builder.append(crlf);

            /* Append binary data. */
            builder.append(file.blob);
            builder.append(crlf);
            //}
            /* Mark end of the request. */
            builder.append(dashdash);
            builder.append(boundary);
            builder.append(dashdash);
            builder.append(crlf);

            if (typeof (complete) === 'function') {
                request.onreadystatechange = function () {
                    if (request.readyState === 4) {
                        //console.log(JSON.parse(xhr.responseText.replace(/^\{\}&&/, '')));
                        if (Math.floor(request.status / 100) !== 2) {
                            if (typeof (error) === 'function') {
                                error.call(scope || this, request);
                            }
                        } else {
                            complete.call(scope || this, request);
                        }
                    }
                };
            }

            if (typeof (progress) === 'function') {
                request.upload.onprogress = function (prog) {
                    // { total : 500, loaded : 250, lengthComputable : true };  <-- example progress object
                    progress.call(scope || this, prog);
                };
            }
            request.setRequestHeader('Content-Type', 'multipart/attachment; boundary=' + boundary);
            // request.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + boundary); //will not work for raw binary
            var blob = builder.getAsBlob();
            request.send(blob);
        },
        _uploadFileHTML5: function (file, url, progress, complete, error, scope, asPut) {            
            if (!this.supportsHTML5File || !window.FormData) {
                this._showUnableToUploadError();
                return;
            }

            if (progress) {
                progress.call(scope, null);
            }


            if (!url) {
                //assume Attachment SData url
                url = 'slxdata.ashx/slx/system/-/attachments/file';
            }
            var fd = new FormData();
            //fd.append('filename*', encodeURI(file.name)); //Does not work
            // This 'file.name' doesn't need encoding, as it is handled when the form is posted for us
            // (if we do this, it assumes the encoded characters are actually a part of the name,
            //  and this breaks the logic for pulling the attachments again)
            fd.append('file_', file, file.name);
            //fd.name = encodeURI(file.name)
            var request = new XMLHttpRequest();

            request.open((asPut) ? 'PUT' : 'POST', url);
            request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

            if (complete) {
                request.onreadystatechange = function () {
                    if (request.readyState === 4) {
                        //console.log(JSON.parse(xhr.responseText.replace(/^\{\}&&/, '')));
                        if (Math.floor(request.status / 100) !== 2) {
                            if (error) {
                                error.call(scope || this, request);
                            }
                        } else {
                            complete.call(scope || this, request);
                        }
                    }
                };
            }
            if (progress) {
                request.upload.addEventListener('progress', function (e) {
                    progress.call(scope || this, e);
                });
            }
            request.send(fd);
        },
        _uploadFileHTML5_asBinary: function (file, url, progress, complete, error, scope, asPut) {
            if (!this.supportsHTML5File) {
                this._showUnableToUploadError();
                return;
            }

            if (progress) {
                progress.call(scope, null);
            }
            window.BlobBuilder = window.BlobBuilder ||
                         window.WebKitBlobBuilder ||
                         window.MozBlobBuilder ||
                         window.MSBlobBuilder;


            if (!url) {
                //assume Attachment SData url
                url = 'slxdata.ashx/slx/system/-/attachments/file';
            }
            var request = new XMLHttpRequest();
            request.open((asPut) ? 'PUT' : 'POST', url);
            request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            var reader = new FileReader();
            reader.onload = lang.hitch(this, function(evt) {
                var binary, boundary, dashdash, crlf, bb, usingBlobBuilder, blobReader, blobData;

                blobReader = new FileReader();

                try {
                    new Blob();// This will throw an exception if it is no supported 
                    bb = [];
                } catch (e) {
                    bb = new window.BlobBuilder();
                    usingBlobBuilder = true;
                }
                

                binary = evt.target.result;
                boundary = "---------------------------" + (new Date()).getTime();
                dashdash = '--';
                crlf = '\r\n';
                this._append(bb, dashdash + boundary + crlf);
                this._append(bb, 'Content-Disposition: attachment; ');
                this._append(bb, 'name="file_"; ');
                this._append(bb, 'filename*="' + encodeURI(file.name) + '" ');
                this._append(bb, crlf);
                this._append(bb, 'Content-Type: ' + file.type);
                this._append(bb, crlf + crlf);
                this._append(bb, binary);
                this._append(bb, crlf);
                this._append(bb, dashdash + boundary + dashdash + crlf);

                if (complete) {
                    request.onreadystatechange = function () {
                        if (request.readyState === 4) {
                            console.log('responseText: ' + request.responseText);

                            if (Math.floor(request.status / 100) !== 2) {
                                if (error) {
                                    error.call(scope || this, request);
                                }
                            } else {
                                complete.call(scope || this, request);
                            }
                        }
                    };
                }
                if (progress) {
                    request.upload.addEventListener('progress', function(e) {
                        progress.call(scope || this, e);
                    });
                }
                request.setRequestHeader('Content-Type', 'multipart/attachment; boundary=' + boundary);
                if (usingBlobBuilder) {
                    blobData = bb.getBlob(file.type);
                } else {
                    blobData = new Blob(bb);
                }
                blobReader.onload = function(e) {
                        request.send(e.target.result);

                };
                try {
                    request.send(blobData); //Send asTyped Array
                } catch (e) {
                    console.log('Error uploading file as typed array: ' + e);
                    blobReader.readAsArrayBuffer(blobData); //Send as Array Buffer
                }
            });
            try {
                reader.readAsArrayBuffer(file); //Send asTyped Array
            } catch (e) {
                //is this our XGears file object coming from an Outlook message?
                if ((typeof file.blob != "undefined") && (typeof VBArray != "undefined")) {
                    var blob = file.blob;
                    var fileArray = new VBArray(blob.getAsArray()).toArray();
                    var data = new Blob([new Uint8Array(fileArray)], { type: 'application/binary' });
                    reader.readAsArrayBuffer(data);
                }
            }
            
        },
        _append: function(arrayOrBlobBuilder, data) {
            if (arrayOrBlobBuilder && arrayOrBlobBuilder.constructor === Array) {
                arrayOrBlobBuilder.push(data);
            } else {
                arrayOrBlobBuilder.append(data);
            }
        },
        _showUnableToUploadError: function () {
            dialogs.showError(nlsStrings.unableToUploadText);
        },
        formatFileSize: function (size) {
            size = parseInt(size, 10);
            if (size === 0) {
                return '0 KB';
            }
            if (!size || size < 0) {
                return nlsStrings.unknownSizeText;
            }
            if (size < 1024) {
                return '1 KB';
            }
            return dNumber.format(Math.round(size / 1024)) + ' KB';
        }
    };

    return Sage.Utility.File;
});