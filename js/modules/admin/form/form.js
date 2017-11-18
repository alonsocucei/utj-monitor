define([
    'ojs/ojcore',
    'jquery',
    'knockout',
    'view-models/GeneralViewModel',
    "modules/admin/form/model/StrategicItem",
    'ojs/ojknockout',
    'ojs/ojradioset',
    'ojs/ojswitch',
    'ojs/ojcollapsible',
    'ojs/ojinputtext',
    'ojs/ojselectcombobox',
    'ojs/ojdatetimepicker',
    'ojs/ojinputnumber',
    'ojs/ojchart',
    'ojs/ojtable',
    'ojs/ojarraytabledatasource',
    'promise'
], function (oj, $, ko, GeneralViewModel, StrategicItem) {

    function FormViewModel() {
        var self = this;

        /*
         * Main section.
         */
        // Type option
        self.typeLabel = GeneralViewModel.nls("admin.indicators.form.sections.main.type");
        self.typeValue = ko.observable('PIDE');

        // Active/Inactive option
        self.activeLabel = GeneralViewModel.nls("admin.indicators.form.sections.main.active");
        self.activeValue = ko.observable(true);

        // Date converter
        var dateOptions = { formatStyle: 'date', pattern: 'dd/MM/yyyy' };
        self.dateConverter = oj.Validation.converterFactory("datetime").createConverter(dateOptions);

        /*
         * General section.
         */
        self.generalTitle = GeneralViewModel.nls("admin.indicators.form.sections.general.title");

        // Update option
        self.updateLabel = GeneralViewModel.nls("admin.indicators.form.sections.general.update");
        self.updateValue = ko.observable('Manual');

        // Name field
        self.nameLabel = GeneralViewModel.nls("admin.indicators.form.sections.general.name.label");
        self.namePlaceholder = GeneralViewModel.nls("admin.indicators.form.sections.general.name.placeholder");
        self.nameValue = ko.observable("");

        // Description field
        self.descriptionLabel = GeneralViewModel.nls("admin.indicators.form.sections.general.description.label");
        self.descriptionPlaceholder = GeneralViewModel.nls("admin.indicators.form.sections.general.description.placeholder");
        self.descriptionValue = ko.observable("");

        // Sense option
        self.senseLabel = GeneralViewModel.nls("admin.indicators.form.sections.general.sense");
        self.senseOptions = ko.observableArray([
            { value: 'Positivo', label: 'Positivo' },
            { value: 'Negativo', label: 'Negativo' }
        ]);
        self.senseValue = ko.observable('Positivo');

        // Unit of measurement field
        self.measureLabel = GeneralViewModel.nls("admin.indicators.form.sections.general.measure.label");
        self.measurePlaceholder = GeneralViewModel.nls("admin.indicators.form.sections.general.measure.placeholder");
        self.measureValue = ko.observable("");

        // Base year field
        self.baseYearLabel = GeneralViewModel.nls("admin.indicators.form.sections.general.baseYear.label");
        self.baseYearPlaceholder = GeneralViewModel.nls("admin.indicators.form.sections.general.baseYear.placeholder");
        self.baseYearValue = ko.observable("");

        // Periodicity option
        self.periodicityLabel = GeneralViewModel.nls("admin.indicators.form.sections.general.periodicity");
        self.periodicityOptions = ko.observableArray([
            { value: 'Mensual', label: 'Mensual' },
            { value: 'Trimestral', label: 'Trimestral' },
            { value: 'Cuatrimestral', label: 'Cuatrimestral' },
            { value: 'Semestral', label: 'Semestral' },
            { value: 'Anual', label: 'Anual' }
        ]);
        self.periodicityValue = ko.observable('Mensual');

        // Reboot option
        self.rebootLabel = GeneralViewModel.nls("admin.indicators.form.sections.general.reboot");
        self.rebootOptions = ko.observableArray([
            { value: 'Continuo', label: 'Continuo' },
            { value: 'Cuatrimestral', label: 'Cuatrimestral' },
            { value: 'Anual', label: 'Anual' }
        ]);
        self.rebootValue = ko.observable('Continuo');

        // Reboot date field
        self.rebootDateLabel = GeneralViewModel.nls("admin.indicators.form.sections.general.rebootDates");
        self.rebootDateValue1 = ko.observable(oj.IntlConverterUtils.dateToLocalIso(new Date()));
        self.rebootDateValue2 = ko.observable(oj.IntlConverterUtils.dateToLocalIso(new Date()));
        self.rebootDateValue3 = ko.observable(oj.IntlConverterUtils.dateToLocalIso(new Date()));

        /*
         * Alignment section
         */
        self.alignmentTitle = GeneralViewModel.nls("admin.indicators.form.sections.alignment.title");

        // PIDE table
        self.pideTableLabel = GeneralViewModel.nls("admin.indicators.form.sections.alignment.pide.title");
        self.pideId = Math.floor(Math.random() * 100) + 1;
        self.pideColumns = [
            {
                "headerText": "Eje",
                "headerStyle": 'max-width: 5em;',
                "style": 'min-width: 30%; width: 30%;',
                "sortable": "auto"
            },
            {
                "headerText": "Tema",
                "headerStyle": 'max-width: 5em;',
                "style": 'min-width: 30%; width: 30%;',
                "sortable": "auto"
            },
            {
                "headerText": "Objetivo",
                "headerStyle": 'max-width: 5em;',
                "style": 'min-width: 30%; width: 30%;',
                "sortable": "auto"
            },
            {
                "headerText": 'Acciones',
                "headerStyle": 'max-width: 5em;',
                "style": 'max-width: 10%; width: auto',
                "sortable": "disabled"
            }
        ];
        self.pideObservableArray = ko.observableArray([]);
        self.pideDataSource = new oj.ArrayTableDataSource(self.pideObservableArray, { idAttribute: 'Id' });

        // Row template for PIDE table
        self.getPIDERowTemplate = function (data, context) {
            var mode = context.$rowContext['mode'];
            return mode === 'edit' ? 'pideEditRowTemplate' : 'pideEditRowTemplate';
        };

        // Full strategic items
        self.strategicItems = [];

        // Filtered strategic items
        self.strategicArray = [];

        // Axe options
        self.axesOptions = ko.observableArray([]);

        // Topics options
        self.topicsOptions = ko.observableArray([]);

        // Objectives options
        self.objectivesOptions = ko.observableArray([]);

        // Axes change validations
        self.axeChanged = false;

        // Get strategic items data
        $.getJSON("data/strategic-items.json")
            .done(function (data) {
                // Get all strategic items
                self.strategicItems = data.map(function (element) {
                    return new StrategicItem(element.id, element.name, element.strategicType.name, element.children);
                });

                // Get axes
                self.strategicArray = self.strategicItems.filter(function (element) {
                    return element.type === "axe";
                });

                self.strategicArray.forEach(function (axe) {
                    // Get topics
                    axe.children = axe.children.map(function (topic) {
                        return self.strategicItems.filter(function (element) {
                            return element.id === topic && element.type === "topic";
                        })[0];
                    });

                    axe.children.forEach(function (topic) {
                        // Get objectives
                        topic.children = topic.children.map(function (objective) {
                            return self.strategicItems.filter(function (element) {
                                return element.id === objective && element.type === "objective";
                            })[0];
                        });

                        topic.children = topic.children.filter(function (element) {
                            return typeof element !== "undefined";
                        });
                    });
                });

                // Get axes options
                self.axesOptions(self.getAxes());

                // Get topics options
                self.getTopics(self.strategicArray[0].name);

                // New PIDE observable row
                self.pideAddRow();
            })
            .fail(function (data) {
                console.log("Mal", data);
            });

        /**
         * Get axes options.
         * @returns {array}
         */
        self.getAxes = function () {
            let axes = self.strategicArray.map(function (axe) {
                return { value: axe.name, label: axe.name };
            });

            return axes;
        };

        /**
         * Get Topic array.
         * @param {string} search
         * @returns {array}
         */
        self.getTopics = function (search) {
            // In case the value comes in [] or {} format
            search = typeof search === 'object' ? search[0] : search;

            // Search axe
            let searchAxe = self.strategicArray.filter(function (axe) {
                return axe.name === search;
            })[0];

            // Get topics
            let topics = searchAxe.children.map(function (topic) {
                return { value: topic.name, label: topic.name };
            });

            return topics;
        };

        /**
         * Get Objectives array;
         * @param {any} searchAxe 
         * @param {any} searchTopic 
         */
        self.getObjectives = function (searchAxe, searchTopic) {
            // In case the value comes in [] or {} format
            searchAxe = typeof searchAxe === 'object' ? searchAxe[0] : searchAxe;
            searchTopic = typeof searchTopic === 'object' ? searchTopic[0] : searchTopic;

            let axeArray = self.strategicArray.filter(function (axe) {
                return axe.name === searchAxe;
            })[0];

            let topicArray = axeArray.children.filter(function (topic) {
                return topic.name === searchTopic;
            })[0];

            let objectives = topicArray.children.map(function (topic) {
                return { value: topic.name, label: topic.name };
            });

            return objectives;
        };

        /**
         * Axes change event.
         * @param {type} id
         * @param {type} axe
         */
        self.axesChange = function (id, axe) {
            // Set new topic options
            self.setTopicOptions(id, axe());

            // Set topic changes disabled
            self.axesChanged = true;
        };

        /**
         * Topics change event.
         * @param {type} id
         * @param {type} axe
         * @param {type} topic
         */
        self.topicsChange = function (id, axe, topic) {
            if (self.axesChanged !== true) {
                // Set new objective options
                self.setObjectiveOptions(id, axe(), topic());
            }

            // Enable topic changes
            self.axesChanged = false;
        };

        /**
         * Set topics options.
         * @param {int} id
         * @param {string} search
         */
        self.setTopicOptions = function (id, search) {
            self.topicsOptions().forEach(function (element) {
                if (element.id === id) {
                    element.options(self.getTopics(search));
                }
            });
        };

        /**
         * Get Topic Options.
         * @param {int} id
         * @returns {array}
         */
        self.getTopicOptions = function (id) {
            let options = [];

            self.topicsOptions().forEach(function (element) {
                if (element.id === id) {
                    options = element.options;
                }
            });

            return options;
        };

        /**
         * Set Objective options.
         * @param {number} id
         * @param {string} searchAxe
         * @param {string} searchTopic
         */
        self.setObjectiveOptions = function (id, searchAxe, searchTopic) {
            self.objectivesOptions().forEach(function (element) {
                if (element.id === id) {
                    element.options(self.getObjectives(searchAxe, searchTopic));
                }
            });
        };

        /**
         * Get Objective options.
         * @param {number} id
         * @returns {Array}
         */
        self.getObjectiveOptions = function (id) {
            let options = [];

            self.objectivesOptions().forEach(function (element) {
                if (element.id === id) {
                    options = element.options;
                }
            });

            return options;
        };

        /**
         * Add row to PIDE's table
         */
        self.pideAddRow = function () {
            // New row
            var row = {
                'Id': self.pideId++,
                'Axe': ko.observable(self.strategicArray[0].name),
                'Topic': ko.observable(self.strategicArray[0].children[0].name),
                'Objective': ko.observable(self.strategicArray[0].children[0].children[0].name)
            };

            // Add row to PIDE table
            self.pideObservableArray.push(row);

            // Add new map to Topics Options
            self.topicsOptions.push({
                id: row.Id,
                options: ko.observableArray(self.getTopics(row.Axe()))
            });

            // Add new map to Objectives Options
            self.objectivesOptions.push({
                id: row.Id,
                options: ko.observableArray(self.getObjectives(row.Axe(), row.Topic()))
            });
        };

        /**
         * Clone PIDE's table row.
         * @param {ko.Observable} Axe 
         * @param {ko.Observable} Topic 
         * @param {ko.Observable} Objective 
         */
        self.pideCloneRow = function (Axe, Topic, Objective) {
            // New row
            var row = {
                'Id': self.pideId++,
                'Axe': ko.observable(Axe()),
                'Topic': ko.observable(Topic()),
                'Objective': ko.observable(Objective())
            };

            // Add row to PIDE table
            self.pideObservableArray.push(row);

            // Add new map to Topics Option
            self.topicsOptions.push({
                id: row.Id,
                options: ko.observableArray(self.getTopics(row.Axe()))
            });

            // Add new map to Objective options
            self.objectivesOptions.push({
                id: row.Id,
                options: ko.observableArray(self.getObjectives(row.Axe(), row.Topic()))
            });
        };

        /**
         * Remove PIDE's table row.
         * @param {number} id 
         */
        self.pideRemoveRow = function (id) {
            self.pideObservableArray.remove(function (item) {
                return item.Id === id;
            });

            self.topicsOptions.remove(function (item) {
                return item.Id === id;
            });

            self.objectivesOptions.remove(function (item) {
                return item.Id === id;
            });
        };

        // POA section
        self.poaSectionLabel = GeneralViewModel.nls("admin.indicators.form.sections.alignment.poa.title");

        // Process table
        self.processTableLabel = GeneralViewModel.nls("admin.indicators.form.sections.alignment.poa.process.title");
        self.processId = Math.floor(Math.random() * 100) + 1;
        self.processColumns = [
            { "headerText": "Procesos", "sortable": "auto" }
        ];
        self.processObservableArray = ko.observableArray([]);
        self.processDataSource = new oj.ArrayTableDataSource(self.processObservableArray, { idAttribute: 'Id' });

        // Projects table
        self.projectsTableLabel = GeneralViewModel.nls("admin.indicators.form.sections.alignment.poa.projects.title");
        self.projectsId = Math.floor(Math.random() * 100) + 1;
        self.projectsColumns = [
            { "headerText": "Proyectos", "sortable": "auto" }
        ];
        self.projectsObservableArray = ko.observableArray([]);
        self.projectsDataSource = new oj.ArrayTableDataSource(self.projectsObservableArray, { idAttribute: 'Id' });

        // Get data
        $.getJSON("data/pide-alignment.json")
            .done(function (data) {
                // PIDE data
                let pide = data.alignment.pide;

                // POA data
                let poa = data.alignment.poa;

                // Fill Process Table
                $.each(poa.process, function (key, value) {
                    self.processObservableArray.push({
                        'Id': self.processId++,
                        'Process': value.process
                    });
                });

                // Fill Projects Table
                $.each(poa.projects, function (key, value) {
                    self.projectsObservableArray.push({
                        'Id': self.projectsId++,
                        'Project': value.project
                    });
                });
            });

        /*
         * Responsible section
         */
        self.responsibleTitle = GeneralViewModel.nls("admin.indicators.form.sections.responsible.title");

        // Secretary option
        self.secretaryLabel = GeneralViewModel.nls("admin.indicators.form.sections.responsible.secretary");
        self.secretaryOptions = ko.observableArray([
            { value: 'Académica', label: 'Académica' },
            { value: 'Administrativa', label: 'Administrativa' },
            { value: 'Vinculación', label: 'Vinculación' },
            { value: 'Rectoría', label: 'Rectoría' }
        ]);
        self.secretaryValue = ko.observable('Administrativa');

        // Address option
        self.addressLabel = GeneralViewModel.nls("admin.indicators.form.sections.responsible.address");
        self.addressValue = ko.observable("Dirección 1");

        // Department head option
        self.departmentHeadLabel = GeneralViewModel.nls("admin.indicators.form.sections.responsible.departmentHead");
        self.departmentHeadValue = ko.observable('Jefe de departamento');

        // Responsible option
        self.responsibleLabel = GeneralViewModel.nls("admin.indicators.form.sections.responsible.responsible");
        self.responsibleValue = ko.observable('Persona responsable de la información');

        // Responsible charge field
        self.responsibleChargeLabel = GeneralViewModel.nls("admin.indicators.form.sections.responsible.responsibleCharge.label");
        self.responsibleChargePlaceholder = GeneralViewModel.nls("admin.indicators.form.sections.responsible.responsibleCharge.placeholder");
        self.responsibleChargeValue = ko.observable("");

        // Email field
        self.emailLabel = GeneralViewModel.nls("admin.indicators.form.sections.responsible.email.label");
        self.emailPlaceholder = GeneralViewModel.nls("admin.indicators.form.sections.responsible.email.placeholder");
        self.emailValue = ko.observable("");

        // Phone field
        self.phoneLabel = GeneralViewModel.nls("admin.indicators.form.sections.responsible.phone.label");
        self.phonePlaceholder = GeneralViewModel.nls("admin.indicators.form.sections.responsible.phone.placeholder");
        self.phoneValue = ko.observable("");

        // Extension field
        self.extensionLabel = GeneralViewModel.nls("admin.indicators.form.sections.responsible.extension.label");
        self.extensionPlaceholder = GeneralViewModel.nls("admin.indicators.form.sections.responsible.extension.placeholder");
        self.extensionValue = ko.observable("");

        // Observations field
        self.observationsRLabel = GeneralViewModel.nls("admin.indicators.form.sections.responsible.observations");
        self.observationsRValue = ko.observable("");

        /*
         * Metadata section 
         */
        self.metadataTitle = GeneralViewModel.nls("admin.indicators.form.sections.metadata.title");

        // Source field
        self.sourceLabel = GeneralViewModel.nls("admin.indicators.form.sections.metadata.source.label");
        self.sourcePlaceholder = GeneralViewModel.nls("admin.indicators.form.sections.metadata.source.placeholder");
        self.sourceValue = ko.observable("");

        // Link field
        self.linkLabel = GeneralViewModel.nls("admin.indicators.form.sections.metadata.link.label");
        self.linkPlaceholder = GeneralViewModel.nls("admin.indicators.form.sections.metadata.link.placeholder");
        self.linkValue = ko.observable("");

        // Formula field
        self.formulaLabel = GeneralViewModel.nls("admin.indicators.form.sections.metadata.formula.label");
        self.formulaPlaceholder = GeneralViewModel.nls("admin.indicators.form.sections.metadata.formula.placeholder");
        self.formulaValue = ko.observable("");

        // Variables field
        self.variablesLabel = GeneralViewModel.nls("admin.indicators.form.sections.metadata.variables.label");
        self.variablesPlaceholder = GeneralViewModel.nls("admin.indicators.form.sections.metadata.variables.placeholder");
        self.variablesValue = ko.observable("");

        // Method field
        self.methodLabel = GeneralViewModel.nls("admin.indicators.form.sections.metadata.method.label");
        self.methodPlaceholder = GeneralViewModel.nls("admin.indicators.form.sections.metadata.method.placeholder");
        self.methodValue = ko.observable("");

        // Observations field
        self.observationsMLabel = GeneralViewModel.nls("admin.indicators.form.sections.metadata.observations.label");
        self.observationsMPlaceholder = GeneralViewModel.nls("admin.indicators.form.sections.metadata.observations.placeholder");
        self.observationsMValue = ko.observable("");

        // Score
        self.scoreLabel = GeneralViewModel.nls("admin.indicators.form.sections.metadata.score.label");

        // Score to percent converter
        self.scoreConverter = GeneralViewModel.converters.percent;

        // Red score field
        self.redLabel = GeneralViewModel.nls("admin.indicators.form.sections.metadata.score.red");
        self.redValue = ko.observable(0.35);

        // Orange score field
        self.orangeLabel = GeneralViewModel.nls("admin.indicators.form.sections.metadata.score.orange");
        self.orangeValue = ko.observable(0.6);

        // Yello score field
        self.yellowLabel = GeneralViewModel.nls("admin.indicators.form.sections.metadata.score.yellow");
        self.yellowValue = ko.observable(0.8);

        // Green score field
        self.greenLabel = GeneralViewModel.nls("admin.indicators.form.sections.metadata.score.green");
        self.greenValue = ko.observable(1);

        /*
         * Goals and progress section
         */
        self.goalsTitle = GeneralViewModel.nls("admin.indicators.form.sections.goals.title");

        // Chart series
        self.chartSeriesValue = ko.observableArray([]);

        // Goal/Progress ID
        self.goalId = Math.floor(Math.random() * 100) + 1;

        // Table headers
        self.goalsColumns = [
            {
                "headerText": "Valor",
                "headerStyle": 'max-width: 5em;',
                "style": 'min-width: 45%; width: 45%;',
                "sortable": "disabled"
            },
            {
                "headerText": "Fecha",
                "headerStyle": 'max-width: 5em;',
                "style": 'min-width: 45%; width: 45%;',
                "sortable": "auto"
            },
            {
                "headerText": 'Acciones',
                "headerStyle": 'max-width: 5em;',
                "style": 'min-width: 10%; width: 10%;',
                "sortable": "disabled"
            }
        ];

        // Goals table
        self.goalsLabel = GeneralViewModel.nls("admin.indicators.form.sections.goals.table.goals");
        self.goalObservableArray = ko.observableArray([]);
        self.goalDataSource = new oj.ArrayTableDataSource(self.goalObservableArray, { idAttribute: 'Id' });

        // Row template for Goals' table
        self.getGoalRowTemplate = function (data, context) {
            var mode = context.$rowContext['mode'];
            return mode === 'edit' ? 'goalEditRowTemplate' : 'goalRowTemplate';
        };

        // Progress table
        self.progressLabel = GeneralViewModel.nls("admin.indicators.form.sections.goals.table.progress");
        self.progressObservableArray = ko.observableArray([]);
        self.progressDataSource = new oj.ArrayTableDataSource(self.progressObservableArray, { idAttribute: 'Id' });

        // Row template for Progress' table
        self.getProgressRowTemplate = function (data, context) {
            var mode = context.$rowContext['mode'];
            return mode === 'edit' ? 'progressEditRowTemplate' : 'progressRowTemplate';
        };

        /** 
         * Update chart values. 
         */
        self.updateChart = function () {
            // New chart series
            var chartSeries = [
                { name: 'Metas', items: [] },
                { name: 'Avances', items: [] }
            ];

            // For each goal in Goals' table
            self.goalObservableArray().forEach(function (goal) {
                // Add new item to Chart series
                chartSeries[0].items.push({
                    x: goal.Date, // Goal date
                    value: goal.Value // Goal value
                });
            });

            // For each progress in Progress' table
            self.progressObservableArray().forEach(function (progress) {
                // Add new item to Chart Series
                chartSeries[1].items.push({
                    x: progress.Date, // Progress date
                    value: progress.Value // Progress value
                });
            });

            // Sort arrays by date
            chartSeries[0].items.sort(self.orderChartByDate);
            chartSeries[1].items.sort(self.orderChartByDate);

            // Set chart values
            self.chartSeriesValue(chartSeries);
        };

        /**
         * Order chart by date.
         * 
         * @param elem1
         * @param elem2
         * @returns {int}
         */
        self.orderChartByDate = function (elem1, elem2) {
            if (elem1.x > elem2.x)
                return 1;
            else if (elem1.x < elem2.x)
                return -1;
            else if (elem1.x === elem2.x)
                return 0;
        };

        /**
         * Add new row table.
         * 
         * @param {String} table
         * @returns {void}
         */
        self.addRow = function (table) {
            // New row
            var row = {
                'Id': self.goalId++,
                'Value': 0,
                'Date': oj.IntlConverterUtils.dateToLocalIso(new Date())
            };

            // Pick table
            if (table === 'Goals') {
                self.goalObservableArray.push(row);
            } else if (table === 'Progress') {
                self.progressObservableArray.push(row);
            }

            // Update chart values
            self.updateChart();
        };

        /**
         * Remove selected row.
         * 
         * @param {String} table Table source.
         * @param {Object} row Goal/Progress object with ID, Value and Date.
         * @returns {void}
         */
        self.removeRow = function (table, row) {
            if (table === 'Goals') {
                // Remove from Goals table
                self.goalObservableArray.remove(function (item) {
                    return item.Id === row.Id && item.Value === row.Value && item.Date === row.Date;
                });
            } else if (table === 'Progress') {
                // Remove from Progress table
                self.progressObservableArray.remove(function (item) {
                    return item.Id === row.Id && item.Value === row.Value && item.Date === row.Date;
                });
            }

            // Update chart values
            self.updateChart();
        };

        /**
         * Before Row Edit End event.
         * 
         * @param {any} event
         * @param {any} ui
         * @returns {void}
         */
        self.beforeRowEditEnd = function (event, ui) {
            // Update chart values
            self.updateChart();
        };

        // Potential risk field
        self.riskLabel = GeneralViewModel.nls("admin.indicators.form.sections.goals.risk.label");
        self.riskPlaceholder = GeneralViewModel.nls("admin.indicators.form.sections.goals.risk.placeholder");
        self.riskValue = ko.observable("");

        // Implemented actions
        self.actionsLabel = GeneralViewModel.nls("admin.indicators.form.sections.goals.actions.label");
        self.actionsPlaceholder = GeneralViewModel.nls("admin.indicators.form.sections.goals.actions.placeholder");
        self.actionsValue = ko.observable("");
    }

    return new FormViewModel();
});