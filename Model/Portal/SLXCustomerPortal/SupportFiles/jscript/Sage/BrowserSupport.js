/*globals Sage, window, define, sessionStorage */
define([
    'dojo/_base/declare'
],
function (declare) {
    var browserSupport = declare('Sage.BrowserSupport', [], {
        /*********************
        Returns a browserInfo object that has the label of the browser
        and arrays of Optimal versions and Supported yet not Optimal versions
        of the browser. Please note that values within the arrays should be in
        ascending order [1,2,3,...,n] and are only numbers
        *********************/
        getBrowserCompatibilityInfo: function(browserCode) {
            var browserInfo = {};
            
            // For each browser, add 
            switch(browserCode) {
                case 'ie':
                    browserInfo.browserLabel = 'Internet Explorer';
                    browserInfo.notFullyFunctional = []; 
                    browserInfo.notOptimalVersion = [8,9]; // 8, 9 do not perform well
                    browserInfo.supportedlVersion = [8];

                    break;
                case 'ff':
                    browserInfo.browserLabel = 'FireFox';
                    browserInfo.notFullyFunctional = [-1]; // -1 means all versions
                    browserInfo.notOptimalVersion = [];
                    browserInfo.supportedlVersion = [24];

                    break;
                case 'chrome':
                    browserInfo.browserLabel = 'Chrome';
                    browserInfo.notFullyFunctional = [-1];
                    browserInfo.notOptimalVersion = [];
                    browserInfo.supportedlVersion = [23];

                    break;
                case 'opera':
                    browserInfo.browserLabel = 'Opera';
                    browserInfo.notFullyFunctional = [];
                    browserInfo.notOptimalVersion = [];
                    browserInfo.supportedlVersion = [];

                    break;
                case 'safari':
                    browserInfo.browserLabel = 'Safari';
                    browserInfo.notFullyFunctional = [-1];
                    browserInfo.notOptimalVersion = [];
                    browserInfo.supportedlVersion = [6];

                    break;
            }
            browserInfo.osInfo = this.getOSInfo();
            return browserInfo;
        },
        getOSInfo: function() {
            var osInfo = {};
            // This script sets OSName variable as follows:
            // "Windows"    for all versions of Windows
            // "MacOS"      for all versions of Macintosh OS
            // "Linux"      for all versions of Linux
            // "UNIX"       for all other UNIX flavors 
            // "Unknown OS" indicates failure to detect the OS

            var OSName = "Unknown OS";
            if (navigator.appVersion.indexOf("Win") != -1) OSName = "Windows";
            if (navigator.appVersion.indexOf("Mac") != -1) OSName = "MacOS";
            if (navigator.appVersion.indexOf("X11") != -1) OSName = "UNIX";
            if (navigator.appVersion.indexOf("Linux") != -1) OSName = "Linux";

            osInfo.OSName = OSName;
            return osInfo;
        }
    });

    return browserSupport;
});