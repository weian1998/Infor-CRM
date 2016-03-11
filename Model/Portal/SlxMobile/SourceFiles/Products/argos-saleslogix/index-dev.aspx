﻿<%@ Page AutoEventWireup="true" Language="c#" Culture="auto" UICulture="auto" %>
<%@ Import Namespace="System.IO" %>
<%@ Import Namespace="System.Linq" %>
<%@ Import Namespace="System.Globalization" %>
<%@ Import Namespace="System.Collections.Generic" %>
<%@ Import Namespace="System.Web.Script.Serialization" %>

<!DOCTYPE html>
<!--[if IE 9 ]>    <html lang="en" class="ie9"> <![endif]-->
<!--[if (gt IE 9)|!(IE)]><!-->
<html lang="en" class="gtie9 modern">
<!--<![endif]-->
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black" />
    <meta name="format-detection" content="telephone=no,email=no,address=no" />
    <meta name="msapplication-tap-highlight" content="no" />

    <title>Infor CRM</title>

    <link rel="icon" type="image/png" href="content/images/icon.png" />
    <link rel="apple-touch-icon" href="content/images/touch-icon-iphone.png" />
    <link rel="apple-touch-icon" sizes="72x72" href="content/images/72x72.png" />
    <link rel="apple-touch-icon" sizes="76x76" href="content/images/touch-icon-ipad.png" />
    <link rel="apple-touch-icon" sizes="114x114" href="content/images/114x114.png" />
    <link rel="apple-touch-icon" sizes="120x120" href="content/images/touch-icon-iphone-retina.png" />
    <link rel="apple-touch-icon" sizes="144x144" href="content/images/144x144.png" />
    <link rel="apple-touch-icon" sizes="152x152" href="content/images/touch-icon-ipad-retina.png" />
    <!-- Startup images -->

    <!-- iOS 6 & 7 iPad (retina, portrait) -->
    <link href="content/images/apple-touch-startup-image-1536x2008.png"
          media="(device-width: 768px) and (device-height: 1024px)
             and (orientation: portrait)
             and (-webkit-device-pixel-ratio: 2)"
          rel="apple-touch-startup-image">

    <!-- iOS 6 & 7 iPad (retina, landscape) -->
    <link href="content/images/apple-touch-startup-image-1496x2048.png"
          media="(device-width: 768px) and (device-height: 1024px)
             and (orientation: landscape)
             and (-webkit-device-pixel-ratio: 2)"
          rel="apple-touch-startup-image">

    <!-- iOS 6 iPad (portrait) -->
    <link href="content/images/apple-touch-startup-image-768x1004.png"
          media="(device-width: 768px) and (device-height: 1024px)
             and (orientation: portrait)
             and (-webkit-device-pixel-ratio: 1)"
          rel="apple-touch-startup-image">

    <!-- iOS 6 iPad (landscape) -->
    <link href="content/images/apple-touch-startup-image-748x1024.png"
          media="(device-width: 768px) and (device-height: 1024px)
             and (orientation: landscape)
             and (-webkit-device-pixel-ratio: 1)"
          rel="apple-touch-startup-image">

    <!-- iOS 6 & 7 iPhone 5 -->
    <link href="content/images/apple-touch-startup-image-640x1096.png"
          media="(device-width: 320px) and (device-height: 568px)
             and (-webkit-device-pixel-ratio: 2)"
          rel="apple-touch-startup-image">

    <!-- iOS 6 & 7 iPhone (retina) -->
    <link href="content/images/apple-touch-startup-image-640x920.png"
          media="(device-width: 320px) and (device-height: 480px)
             and (-webkit-device-pixel-ratio: 2)"
          rel="apple-touch-startup-image">

    <!-- iOS 6 iPhone -->
    <link href="content/images/apple-touch-startup-image-320x480.png"
          media="(device-width: 320px) and (device-height: 480px)
             and (-webkit-device-pixel-ratio: 1)"
          rel="apple-touch-startup-image">

    <!-- less files -->
    <link rel="stylesheet/less" type="text/css" href="../../argos-sdk/content/css/themes/crm.less" />
    <link rel="stylesheet/less" type="text/css" href="content/css/app.less" />

    <!-- less -->
    <script type="text/javascript">
        less = {
            env: "development", // or "production"
            async: false,       // load imports async
            fileAsync: false,   // load imports async when in a page under
                                // a file protocol
            poll: 1000,         // when in watch mode, time in ms between polls
            functions: {},      // user functions, keyed by name
            dumpLineNumbers: "all", // or "mediaQuery" or "all"
            relativeUrls: true,// whether to adjust url's to be relative
                                // if false, url's are already relative to the
                                // entry less file
            rootpath: ""// a path to add on to the start of every url
                                //resource
        };
    </script>
    <script type="text/javascript" src="../../argos-sdk/libraries/less/less-1.7.0.min.js"></script>

    <!-- JSON -->
    <script type="text/javascript" src="../../argos-sdk/libraries/json2.js"></script>

    <!-- SData Client Library -->
    <script type="text/javascript" src="../../argos-sdk/libraries/sdata/sdata-client-dependencies-debug.js"></script>
    <script type="text/javascript" src="../../argos-sdk/libraries/sdata/sdata-client-debug.js"></script>

    <!-- Simplate -->
    <script type="text/javascript" src="../../argos-sdk/libraries/Simplate.js"></script>

    <!-- canvas2image for when HTMLCanvasElement.prototype.toDataURL isn't available -->
    <script type="text/javascript" src="../../argos-sdk/libraries/canvas2image.js"></script>

    <!-- Deep Diff -->
    <script type="text/javascript" src="../../argos-sdk/libraries/deep-diff/deep-diff-0.2.0.min.js"></script>

    <!-- Chart.js -->
    <script type="text/javascript" src="../../argos-sdk/libraries/Chart.min.js"></script>

    <!-- Dojo -->
    <script type="text/javascript" src="../../argos-sdk/libraries/dojo/dojo/dojo.js" data-dojo-config="parseOnLoad:false, async:true, blankGif:'content/images/blank.gif'"></script>
    <script type="text/javascript">
    require({
        baseUrl: "./",
        packages: [
            { name: 'dojo', location: '../../argos-sdk/libraries/dojo/dojo' },
            { name: 'dijit', location: '../../argos-sdk/libraries/dojo/dijit' },
            { name: 'snap', location: '../../argos-sdk/libraries/snap', main: 'snap' },
            { name: 'moment', location: '../../argos-sdk/libraries/moment', main: 'moment-with-langs.min' },
            { name: 'argos', location: '../../argos-sdk/src' },
            { name: 'crm', location: 'src' },
            { name: 'configuration', location: 'configuration' },
            { name: 'localization', location: 'localization' }
        ],
        map: {
            '*': {
                'Sage/Platform/Mobile': 'argos',
                'Mobile/SalesLogix': 'crm'
            }
        }
    });
    </script>

    <script type="text/javascript">
    (function() {
        var application = 'Mobile/SalesLogix/Application',
            configuration = [
                'configuration/development'
            ];
        require(['moment', application].concat(configuration), function(moment, application, configuration) {
            var localization, bootstrap, fallBackLocalization, completed = false;
            bootstrap = function(requires) {
                require(requires.concat('dojo/domReady!'), function() {
                    if (completed) {
                        return;
                    }

                    var culture = '<%= System.Globalization.CultureInfo.CurrentCulture.Parent.Name.ToLower() %>';
                    moment.lang(culture);
                    configuration.currentCulture = culture;
                    window.moment = moment;

                    var instance = new application(configuration);

                    instance.activate();
                    instance.init();
                    instance.run();
                    completed = true;
                });
            };

            localization = <%= Serialize(
                EnumerateLocalizations("localization")
                    .Select(item => item.Path.Substring(0, item.Path.Length - 3))
            ) %>;

            require.on('error', function(error) {
                console.log('Error loading localization, falling back to "en"');
                bootstrap(fallBackLocalization);
            });

            if (localization.length === 0) {
                fallBackLocalization = <%= Serialize(
                        EnumerateLocalizations(string.Empty, "localization", "en")
                            .Select(item => item.Path.Substring(0, item.Path.Length - 3))
                    ) %>;
                bootstrap(fallBackLocalization);
            } else {
                bootstrap(localization);
            }
        });
    })();
    </script>
</head>
<body>
    <!-- Run "grunt watch" to enable this script
    <script src="http://localhost:35729/livereload.js"></script>-->
</body>
</html>

<script type="text/C#" runat="server">

    protected override void OnPreInit(EventArgs e)
    {
        base.OnPreInit(e);
        Session.Abandon();
        Response.Cookies.Add(new HttpCookie("ASP.NET_SessionId") {Expires = DateTime.Now.AddDays(-1d)});
        Response.Cookies.Add(new HttpCookie("SlxStickySessionId") {Expires = DateTime.Now.AddDays(-1d)});
    }

    protected class FileItem
    {
        public string Path { get; set; }
        public FileInfo File { get; set; }
    }

    protected string Serialize(object item)
    {
        var serializer = new JavaScriptSerializer();
        return serializer.Serialize(item);
    }

    protected string ToRelativeUrlPath(DirectoryInfo rootDirectory, FileInfo file)
    {
        var rootPath = rootDirectory.FullName;
        var filePath = file.FullName;
        
        if (filePath.StartsWith(rootPath)) 
        {           
            var relativePath = filePath.Substring(rootPath.Length + 1);
            return relativePath.Replace('\\', '/');
        }

        throw new ApplicationException("Invalid root path specified.");
    }              
                
    protected IEnumerable<FileItem> Enumerate(string path, Predicate<FileInfo> predicate)
    {
        var rootDirectory = new DirectoryInfo(Path.GetDirectoryName(Request.PhysicalPath));
        var includeDirectory = new DirectoryInfo(Path.Combine(rootDirectory.FullName, path));

        if (includeDirectory.Exists)
        {
            var files = includeDirectory.GetFiles("*", SearchOption.AllDirectories).AsEnumerable();

            if (predicate != null) files = files.Where(file => predicate(file));

            foreach (var file in files)            
                yield return new FileItem
                {
                    Path = ToRelativeUrlPath(rootDirectory, file),
                    File = file
                };            
        }
    }

    protected IEnumerable<FileItem> Enumerate(string path)
    {
        return Enumerate(path, (file) => true);
    }

    protected IEnumerable<FileItem> Enumerate(string path, Regex include)
    {
        return Enumerate(path, (file) => include.IsMatch(file.Name));
    }

    protected IEnumerable<FileItem> EnumerateLocalizations(string path)
    {
        return EnumerateLocalizations(String.Empty, path, null);
    }

    protected IEnumerable<FileItem> EnumerateLocalizations(string root, string path, string culture)
    {
        var currentCulture = System.Globalization.CultureInfo.CurrentCulture;
        var rootDirectory = new DirectoryInfo(Path.Combine(Path.GetDirectoryName(Request.PhysicalPath), root));
        var includeDirectory = new DirectoryInfo(Path.Combine(rootDirectory.FullName, path));
        
        if (includeDirectory.Exists)
        {
            var parentFileName = String.Format(@"{0}.js", culture ?? currentCulture.Parent.Name);
            var parentFile = new FileInfo(Path.Combine(includeDirectory.FullName, parentFileName));
            var targetFileName = String.Format(@"{0}.js", culture ?? currentCulture.Name);
            var targetFile = new FileInfo(Path.Combine(includeDirectory.FullName, targetFileName)); 
                                  
            if (targetFile.Exists)            
                yield return new FileItem
                {
                    Path = ToRelativeUrlPath(rootDirectory, targetFile),
                    File = targetFile
                };    
            else if (parentFile.Exists)
                yield return new FileItem
                {
                    Path = ToRelativeUrlPath(rootDirectory, parentFile),
                    File = targetFile
                };  
            
            foreach (var moduleDirectory in includeDirectory.GetDirectories())
            {
                parentFile = new FileInfo(Path.Combine(moduleDirectory.FullName, parentFileName));
                targetFile = new FileInfo(Path.Combine(moduleDirectory.FullName, targetFileName));
                
                if (targetFile.Exists)            
                    yield return new FileItem
                    {
                        Path = ToRelativeUrlPath(rootDirectory, targetFile),
                        File = targetFile
                    };    
                else if (parentFile.Exists)
                    yield return new FileItem
                    {
                        Path = ToRelativeUrlPath(rootDirectory, parentFile),
                        File = targetFile
                    };   
            }    
        }
    }
     
</script>
