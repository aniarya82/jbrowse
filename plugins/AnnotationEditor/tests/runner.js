require({
    packages: [{
        name: 'jasmine',
        location: '../jslib/jasmine/lib/jasmine-core'
    },
        {
        name:     'dojo',
        location: '../../../src/dojo'
    },
    {
        name:     'dijit',
        location: '../../../src/dijit'
    },
    {
        name:     'dojox',
        location: '../../../src/dojox'
    },
    {
        name:     'jszlib',
        location: '../../../src/jszlib'
    },
    {
        name:     'dgrid',
        location: '../jslib/dgrid'
    },
    {
        name:      'dstore',
        location: '../../../src/dstore'
    },
    {
        name:     'xstyle',
        location: '../jslib/xstyle'
    },
    {
        name:     'put-selector',
        location: '../jslib/put-selector'
    },
    {
        name:     'FileSaver',
        location: '../../../src/FileSaver'
    },
    {
        name:     'jDataView',
        location: '../../../src/jDataView/src',
        main:     'jdataview'
    },
    {
        name:      'lazyload',
        location:  '../../../src/lazyload',
        main:      'lazyload'
    },
    {
        location: '../jslib/underscore',
        name: 'underscore', main: 'underscore'
    },
    {
        location: '../jslib/jquery',
        name: 'jquery', main: 'jquery'
    },
    {
        location: '../jslib/jqueryui',
        name: 'jqueryui',
    },
    {
        location: '../jslib/genevalidator',
        name: 'genevalidator', main: 'gvapi'
    },
    {
        location: '../../../src/JBrowse',
        name: 'JBrowse'
    },
    {
        location: '../js/',
        name: 'AnnotationEditor'
    },
    {
        name:     'jqueryui',
        location: '../jslib/jquery.ui/ui'
    }],},
    [],
    function() {

require(['jasmine/jasmine']
, function () {

    require(['jasmine/jasmine-html']
    , function () {

        /*******************************
         * copied from jasmine/boot.js *
         *******************************/

        /**
         * ## Require &amp; Instantiate
         *
         * Require Jasmine's core files. Specifically, this requires and attaches all of Jasmine's code to the `jasmine` reference.
         */
        window.jasmine = jasmineRequire.core(jasmineRequire);

        /**
         * Since this is being run in a browser and the results should populate to an HTML page, require the HTML-specific Jasmine code, injecting the same reference.
         */
        jasmineRequire.html(jasmine);

        /**
         * Create the Jasmine environment. This is used to run all specs in a project.
         */
        var env = jasmine.getEnv();

        /**
         * ## The Global Interface
         *
         * Build up the functions that will be exposed as the Jasmine public interface. A project can customize, rename or alias any of these functions as desired, provided the implementation remains unchanged.
         */
        var jasmineInterface = jasmineRequire.interface(jasmine, env);

        /**
         * Add all of the Jasmine global/public interface to the proper global, so a project can use the public interface directly. For example, calling `describe` in specs instead of `jasmine.getEnv().describe`.
         */
        if (typeof window == "undefined" && typeof exports == "object") {
            extend(exports, jasmineInterface);
        } else {
            extend(window, jasmineInterface);
        }

        /**
         * ## Runner Parameters
         *
         * More browser specific code - wrap the query string in an object and to allow for getting/setting parameters from the runner user interface.
         */

        var queryString = new jasmine.QueryString({
            getWindowLocation: function() { return window.location; }
        });

        var catchingExceptions = queryString.getParam("catch");
        env.catchExceptions(typeof catchingExceptions === "undefined" ? true : catchingExceptions);

        /**
         * ## Reporters
         * The `HtmlReporter` builds all of the HTML UI for the runner page. This reporter paints the dots, stars, and x's for specs, as well as all spec names and all failures (if any).
         */
        var htmlReporter = new jasmine.HtmlReporter({
            env: env,
            onRaiseExceptionsClick: function() { queryString.setParam("catch", !env.catchingExceptions()); },
            getContainer: function() { return document.body; },
            createElement: function() { return document.createElement.apply(document, arguments); },
            createTextNode: function() { return document.createTextNode.apply(document, arguments); },
            timer: new jasmine.Timer()
        });

        /**
         * Extend jsApiReporter for console output via Capybara.
         */
        jasmineInterface.jsApiReporter.consoleOutput = function () {
            var errors = [];
            var output = [];
            this.passed = true;
            for (var i in this.specs()) {
                var spec = this.specs()[i];
                var name = spec.fullName;
                if (spec.status === 'failed') {
                    for (var j in spec.failedExpectations) {
                        var item = spec.failedExpectations[j];
                        if (!item.passed) {
                            this.passed = false;
                            errors.push("Failed: " + name + "\n" + item.message);
                            output.push("F");
                        }
                    }
                } else {
                    output.push(".");
                }
            }
            output = output.join("")
            if (errors.length > 0) {
                output += "\n\n" + errors.join("\n\n") + "\n";
            }
            return output;
        };

        /**
         * The `jsApiReporter` also receives spec results, and is used by any environment that needs to extract the results  from JavaScript.
         */
        env.addReporter(jasmineInterface.jsApiReporter);
        env.addReporter(htmlReporter);

        /**
         * Filter which specs will be run by matching the start of the full name against the `spec` query param.
         */
        var specFilter = new jasmine.HtmlSpecFilter({
            filterString: function() { return queryString.getParam("spec"); }
        });

        env.specFilter = function(spec) {
            return specFilter.matches(spec.getFullName());
        };

        /**
         * Setting up timing functions to be able to be overridden. Certain browsers (Safari, IE 8, phantomjs) require this hack.
         */
        window.setTimeout = window.setTimeout;
        window.setInterval = window.setInterval;
        window.clearTimeout = window.clearTimeout;
        window.clearInterval = window.clearInterval;

        /**
         * Helper function for readability above.
         */
        function extend(destination, source) {
            for (var property in source) destination[property] = source[property];
            return destination;
        }

        require([
            "EditTrack.spec.js"
        ]
        , function () {
            htmlReporter.initialize();
            env.execute();
        });
    });
});
});
