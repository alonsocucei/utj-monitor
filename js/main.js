/**
 * This is the file where the app starts running.
 * It contains path configurations and the call to require function which starts
 * loading all other files.
 */
var libs = "../libs";

requirejs.config({
    // Path mappings for the logical module names
    paths: {
        'knockout': libs + '/knockout/knockout',
        'jquery': libs + '/jquery/jquery',
        'jqueryui-amd': libs + '/jquery-ui/ui',
        'promise': libs + '/es6-promise/es6-promise',
        'hammerjs': libs + '/hammerjs/hammer',
        'ojdnd': libs + '/oraclejet/js/libs/dnd-polyfill/dnd-polyfill-1.0.0',
        'ojs': libs + '/oraclejet/js/libs/oj/debug',
        'ojL10n': libs + '/oraclejet/js/libs/oj/ojL10n',
        'ojtranslations': libs + '/oraclejet/js/libs/oj/resources',
        'text': libs + '/text/text',
        'signals': libs + '/js-signals/signals',
        'customElements': libs + '/webcomponentsjs/CustomElements',
        'proj4': libs + '/proj4js/proj4-src',
        'css': libs + '/require-css/css',
        'google': libs + '/google/maps/maps',
        'views': '../views'
    },
    // Shim configurations for modules that do not expose AMD
    shim: {
        'jquery': {
            exports: ['jQuery', '$']
        },
        'crossroads': {
            deps: ['signals'],
            exports: 'crossroads'
        }
    },
    // This section configures the i18n plugin. It is merging the Oracle JET built-in translation 
    // resources with a custom translation file.
    // Any resource file added, must be placed under a directory named "nls". You can use a path mapping or you can define
    // a path that is relative to the location of this main.js file.
    config: {
        ojL10n: {
            merge: {
                'ojtranslations/nls/ojtranslations': 'resources/nls/translations'
            }
        }
    }
});




/**
 * A top-level require call executed by the Application.
 * Although 'ojcore' and 'knockout' would be loaded in any case (they are specified as dependencies
 * by the modules themselves), we are listing them explicitly to get the references to the 'oj' and 'ko'
 * objects in the callback
 */
require(
        [
            'ojs/ojcore',
            'knockout',
            'jquery',
            'ojs/ojrouter',
            'ojs/ojknockout',
            'ojs/ojbutton',
            'ojs/ojtoolbar',
            'ojs/ojmenu',
            'ojs/ojmodule',
            'templates/templateManager'
        ],
        /**
         * 
         * @param {type} oj
         * @param {type} ko
         * @param {type} $
         */
        function (oj, ko, $) { // this callback gets executed when all required modules are loaded
            oj.ModuleBinding.defaults.modelPath = 'modules/';
            oj.ModuleBinding.defaults.viewPath = 'text!../views/';
            oj.ModuleBinding.defaults.viewSuffix = '.html';
//
//            var router = oj.Router.rootInstance;
//            router.configure({
//                'home': {label: 'Inicio', isDefault: true},
//                'login': {label: 'Login'},
//                'membership': {label: 'Membresías'},
//                'crew': {label: 'Equipo'},
//                'register': {label: 'Registro'},
//                'login': {label: 'Login'}
//            });
//
//
            function RootViewModel() {
                var self = this;
//                self.router = router;
//
//                self.optionChangeHandler = function (event, ui) {
//                    if (ui.option === "selection") {
//                        $('html, body').animate({scrollTop: $('#' + ui.value).offset().top - $('header').height()}, 'slow');
//                    }
//                };
            }
            var vm = new RootViewModel();
//
//            oj.Router.sync().then(
//                    function () {
//                        //bind your ViewModel for the content of the whole page body.
//                        ko.applyBindings(new RootViewModel(), document.getElementById('globalBody'));
            $(document).ready(
                    function () {
                        $('#globalBody').show();
                        ko.applyBindings(vm, document.getElementById('globalBody'));
                    }
            );
//                    },
//                    function (error) {
//                        oj.Logger.error('Error in root start: ' + error.message);
//                    });
//
        }
);


