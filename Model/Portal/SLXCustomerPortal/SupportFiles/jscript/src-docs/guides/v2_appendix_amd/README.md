#AMD - Define and Declare
Infor CRM uses Dojo's AMD loader system for defining modules, declaring "classes" and loading said modules.

AMD stands for Asynchronous Module Definition which means that you define all your parts into separate files and when your page loads it loads asynchronously only the modules it needs to display that page.

Concretely you get:

* Automatic dependent components being loaded first, no more "Oh, you need to include this script before that script...";
* Faster loading as the loader runs asynch and handles all the tricky queuing and waiting;
* Away from giant objects like `dojo` or `$` that contain a myriad of functions; and
* Easier to locate usage, with explicit dependencies you can quickly call up what modules are in use.

##Define
All modules will be wrapped in a `define()` statement.

    define(
    ['Array of dependencies to require'], function(
    /*the returned object of each dependency*/
    ) {
    return {}; // the object that this module defines, to then be required in other modules
    });

An example:
    define([
        'dojo/_base/lang',
        'dojo/string'
    ], function(
        lang,
        string,
    ) {
        return lang.setObject('Sage.Format', { ... });
    });

At first glance the paths don't quite look like paths, you can setup shortcuts to your folder structure in your `base.master` file to point to libraries or setup a namespace etc. 

Breaking this down, this file should will be loaded from: `Sage/Format.js'.
It see's that it requires the two files: 'lang.js' and 'string.js' from the dojo library so it goes and loads those, and their dependencies (and so on), once `lang` and `string` are loaded and initialized then our `Format` module is started and is passed in the result of those two files into the function.

Now we are within the `{ }` which can be considered "private". Things defined here are only ran once during the loading process and if the return object does not expose them they are no longer accessible.

In this case we are returning a global object with some various properties. So if another module adds this `Format` module as a dependency the object that is passed to their function will be the object `Sage.Format`.

It is important to note that the loader only initializes each module once and it passes the references to any module that needs it.
