    define(
        [
            'jquery',
            'ojs/ojcore',
            'knockout',
            'view-models/GeneralViewModel',
            'ojs/ojbutton',
            'hammerjs',
            'ojs/ojjquery-hammer',
            'ojs/ojdatetimepicker',
            'ojs/ojchart',
            'ojs/ojlegend'
        ],
        function ($, oj, ko, GeneralViewModel) {
            var theKey = {};
            
            function GraphicViewModel(params) {
                var self = this;
                var cloneFunction = params.clone;
                var removalFunction = params.removal;
                var startEditingFunction = params.startEditing;
                var stopEditingFunction = params.stopEditing;
                var getGraphic = params.getGraphic;
                var index = params.index;
                
                var privateData = {
                    clonable: params.clone != null,
                    editable: params.startEditing != null,
                    removable: params.removal != null,
                    colorHandler: new oj.ColorAttributeGroupHandler(),
                    markerHandler: new oj.ShapeAttributeGroupHandler(),
                    series: [],
                    monthlySeries: [],
                    yearlySeries: [],
                    groups: [],
                    yaxes: [],
                    model: params.model,
//                    modelPE: params.modelPE,
                    ids: params.ids,
//                    idsPE: params.idsPE,
                    graphicType: self.graphicType.BAR
                };
                
                this.GraphicViewModel_ = function(key) {
                    if (theKey === key) {
                        return privateData;
                    }
                };
                
                self.dateConverter = GeneralViewModel.converters.date;
                self.graphicId = params.idPrefix + index.toString();
                self.graphicMenuId = "graphic-menu-" + index.toString();
                self.graphicName = ko.observable(params.graphicName || "Grafica " + index);
                self.chartType = ko.observable("combo");
                self.graphicOptions = ko.observableArray([this.elementType.PROGRESS, this.elementType.GOAL]);
                self.editing = ko.observable(false);
                self.displayGraphicNameInputText = ko.observable(false);
                self.yAxis = ko.observable();
                self.y2Axis = ko.observable();
                self.seriesValues = ko.observableArray([]);
                self.groupsValues = ko.observableArray([]);
                self.zoom = ko.observable("off");
                self.zoomIconClass = ko.observable("fa-search-plus");
                self.minDate = oj.IntlConverterUtils.dateToLocalIso(new Date(2010, 0, 01));
                self.maxDate = oj.IntlConverterUtils.dateToLocalIso(new Date());
                self.rangeOverflowSummary = "La fecha es mayor a la máxima permitida";
                self.rangeOverflowDetail = "La fecha debe ser menor o igual a " + self.dateConverter.format(self.maxDate);
                self.rangeUnderflowSummary = "La fecha es menor a la mínima permitida";
                self.rangeUnderflowDetail = "La fecha debe ser mayor o igual a " + self.dateConverter.format(self.minDate);
                self.fromDateValue = ko.observable(params.startDate);
                self.toDateValue = ko.observable(params.endDate);
                self.xAxis = ko.observable(this.xAxisFormats["yearly"]);
                self.xAxisType = ko.observable();
                self.legendSections = ko.observableArray([{items: []}]);
                self.hiddenCategories = ko.observableArray();
                self.highlightedCategories = ko.observableArray();
                
                self.cloneClickHandler = function() {
                    cloneFunction(index);
                };
                
                self.fromValidator = {
                    validate: function(value) {
                        if(value > self.toDateValue()) {
                            throw new Error('La fecha debe ser menor o igual a la del campo \'Hasta\'');
                        }
                        
                        return true;
                    }
                };
                
                self.toValidator = {
                    validate: function(value) {
                        if(value < self.fromDateValue()) {
                            throw new Error('La fecha debe ser igual o mayor a la del campo \'Desde\'');
                        }
                        
                        return true;
                    }
                };
                
                self.dateSelectionHandler = function(event, ui) {
                    if (ui.option === "value") {
                        var target = $("#" + event.target.id);
                        
                        if (target.ojInputDate("isValid")) {
                            self.refreshSeriesByDate.call(self);
                        }
                    }
                };
                
                self.zoomClickHandler = function() {
                    var mode = self.zoom() === "live" ? "yearly" : "monthly";
                    
                    self.zoom(mode === "yearly" ? "off" : "live");
                    self.zoomIconClass(mode === "yearly" ? "fa-search-plus" : "fa-search-minus");
                    self.setXAxisFormat(theKey, mode);
                    
                    var newSeries = mode === "yearly" ? this.getYearlySeries() : this.getMonthlySeries();
                    self.setSeries(theKey, newSeries);
                    
                    var progressSeries = self.getSeries().filter(filterProgress);

                    progressSeries.forEach(
                        function(element) {
                            element.type = self.getGraphicType();
                        }
                    );
            
                    self.seriesValues(self.filterSeriesByOptions(theKey, self.graphicOptions()));
                    self.xAxisType(mode === "yearly" ? "auto" : "mixedFrequency");
                };
                
                self.graphicNameClickHandler = function(event, ui) {
                    if (ui.option === "value") {
                        self.displayGraphicNameInputText(false);
                    }
                };
                
                self.graphicNameLabelClickHandler = function() {
                    self.displayGraphicNameInputText(true);
                };
                
                self.startEditHandler = function() {
                    self.editing(true);
                    startEditingFunction(self);
                };
                
                self.stopEditHandler = function() {
                    self.editing(false);
                    stopEditingFunction();
                };
                
                self.graphicTypeSelectHandler = function(event, ui) {
                    var value = ui.value;
                    
                    if (ui.option === "checked") {
                        if (value.includes(self.graphicType.COMBO)) {
                            self.chartType(self.graphicType.COMBO);
                            self.setGraphicType(theKey, self.graphicType.BAR);
                        } else if (value.includes(self.graphicType.LINE)) {
                            self.chartType(self.graphicType.LINE);
                            self.setGraphicType(theKey, self.graphicType.LINE);
                        }

                        var series = self.seriesValues();

                        var progressSeries = series.filter(filterProgress);

                        progressSeries.forEach(
                                function(element) {
                                    element.type = self.getGraphicType();
                                }
                        );

                        $("#" + self.graphicId).ojChart("refresh");
                    }
                };
                
                self.trashClickHandler = function() {
                    removalFunction(index);
                };
                
                self.graphicOptionsHandler = function(event, ui) {
                    if (ui.option === "value") {
                        var options = ui.value;
                        var newSeries = [];

                        newSeries = self.filterSeriesByOptions(theKey, options);
                        
                        var progressSeries = newSeries.filter(filterProgress);

                        progressSeries.forEach(
                                function(element) {
                                    element.type = self.getGraphicType();
                                }
                        );
                
                        self.seriesValues(newSeries);
                    }
                };
                
                getGraphic.call(params, self);
//                self.refreshLegendsPE();
                self.refreshSeriesByDate();
            }
            
            GraphicViewModel.prototype = Object.create(GeneralViewModel);
            var prototype = GraphicViewModel.prototype;
            
            prototype.isClonable = function() {
                return this.GraphicViewModel_(theKey).clonable;
            };
            
            prototype.isEditable = function() {
                return this.GraphicViewModel_(theKey).editable;
            };
            
            prototype.isRemovable = function() {
                return this.GraphicViewModel_(theKey).removable;
            };
            
            prototype.graphicType = {
                BAR: "bar",
                LINE: "line",
                COMBO: "combo"
            };
            
            prototype.elementType = {
                GOAL: "goal",
                PROGRESS: "progress"
            };
            
            prototype.convertersMap = {
                percentage: GeneralViewModel.converters.percent,
                number: GeneralViewModel.converters.decimal,
                rate: GeneralViewModel.converters.percent
            };
            
            prototype.xAxisFormats = {
                monthly: {tickLabel: {}},
                yearly: {tickLabel: {converter: GeneralViewModel.converters.year}}
            };
            
            prototype.getConverterByUnitType = function(key, unitType) {
                if (theKey === key) {
                    return this.convertersMap[unitType];
                }
            };
            
            prototype.getColorHandler = function(key) {
                if (theKey === key) {
                    return this.GraphicViewModel_(theKey).colorHandler;
                }
            };
            
            prototype.getMarkerHandler = function(key) {
                if (theKey === key) {
                    return this.GraphicViewModel_(theKey).markerHandler;
                }
            };
            
            prototype.refreshLegendsPE = function() {
//                var self = this;
                var idsPE = this.getIds(true);
//                var modelPE = this.getModel(true);
                var legendItems = [];
                var colorHandler = this.getColorHandler(theKey);
                
                if (idsPE.length > 0) {
                    idsPE.forEach(
                        function(id) {
                            var pe = modelPE[id];
                            legendItems.push(
                                {
                                    categories: [id],
                                    color: colorHandler.getValue(pe.attr.id),
                                    markerShape: 'square',
                                    text: pe.title
                                }
                            );
                        }
                    );
                } else {
                    this.setIds(theKey, ['todos'], true);
                    
                    legendItems.push(
                        {
                            text: 'Todos',
                            markerShape: 'square',
                            color: colorHandler.getValue('todos')
                        }
                    );
                }
        
                this.legendSections([{title: 'Programas Educativos', titleStyle: 'color: black;font-weight:bold;', items: legendItems}]);
            };
            
            prototype.refreshSeriesByDate = function() {
                if (this.toDateValue() && this.fromDateValue()) {
                    this.setSeries(theKey, []);
                    this.setGroups(theKey, []);
                    this.setMonthlySeries(theKey, []);
                    this.setYearlySeries(theKey, []);
                    
                    this.createSeries();
                    this.refreshSeries();
                    this.refreshAxes();
                }
            };
            
            prototype.createSeries = function() {
                this.getIds()
                        .forEach(
                            id => {
                                this.createSerieByPIDE(id);
                            }
                        );
            };
            
            prototype.createSeriesByPE = function(idPE) {
                this.getIds().forEach(
                        function(id) {
                            this.createSerie(id, idPE);
                        },
                        this
                );
            };
            
            prototype.createSerieByPIDE = function(id) {
                this.getIds().forEach(
                        function(idPE) {
                            this.createSerie(id, idPE);
                        },
                        this
                );
            };
            
                    
            prototype.filterSeriesByOptions = function(key, options) {
                if (theKey === key) {
                    var optionsLength = options.length;
                    
                    if (optionsLength === 0) {
                        return [];
                    }
                    
                    var newSeries = this.getSeries();

                    if (optionsLength === 1) {
                        newSeries = 
                            this.getSeries().filter(
                                options.includes(this.elementType.PROGRESS) ?
                                filterProgress : filterGoals
                        );
                    }            

                    var displayLegends = options.indexOf(this.elementType.GOAL) < 0;
                    this.setGoalsLegendsEnabled(key, displayLegends, newSeries);
                    
                    return newSeries;
                }
            };
            
            prototype.setGoalsLegendsEnabled = function(key, enable, series) {
                if (theKey === key) {

                    series.forEach(
                        function(serie) {
                            if (serie.elementType === this.elementType.PROGRESS) {
                                serie.displayInLegend = enable ? "on" : "off";
                            }
                        }, this
                    );
                }
            };
            
            prototype.refreshSeries = function(seriesValues) {
                if (!seriesValues) {
                    this.setSeries(theKey, this.getCurrentSeries(theKey));
                    seriesValues = this.getSeries();
                }
                
                this.seriesValues(seriesValues);

                if (this.seriesValues().length > 0) {
                    this.groupsValues(this.getGroups(theKey));
                }
            };
            
            prototype.getCurrentSeries = function(key) {
                if (theKey === key) {
                        return this.xAxis() === this.xAxisFormats.yearly 
                        ? this.getYearlySeries()
                        : this.getMonthlySeries();
                }
            };
            
            prototype.refreshAxes = function() {
                var yAxes = this.getYAxes();
                
                if (yAxes.length > 0) {
                    this.yAxis(
                            {
                                title: GeneralViewModel.nls("graphics.unit-types." + yAxes[0]),
                                tickLabel: {
                                    converter: this.getConverterByUnitType(theKey, yAxes[0]),
                                    scaling: "none"
                                }
                            }
                    );
                    
                    this.y2Axis({});

                    if (yAxes.length > 1) {
                        this.y2Axis(
                                {
                                    title: GeneralViewModel.nls("graphics.unit-types." + yAxes[1]),
                                    tickLabel: {
                                        converter: this.getConverterByUnitType(theKey, yAxes[1]),
                                        scaling: "none"
                                    }
                                }
                        );
                    }
                }
            };
            
            prototype.getGraphicType = function() {
                return this.GraphicViewModel_(theKey).graphicType;
            };
            
            prototype.setGraphicType = function(key, graphicType) {
                if (theKey === key) {
                    this.GraphicViewModel_(theKey).graphicType = graphicType;
                }
            };
            
            prototype.getIds = function(isPE) {
                if (isPE) {
                    return this.GraphicViewModel_(theKey).idsPE;
                } else {
                    return this.GraphicViewModel_(theKey).ids;
                }
                
            };
            
            prototype.setIds = function(key, ids, isPE) {
                if (theKey === key) {
                    if (isPE) {
                        this.GraphicViewModel_(theKey).idsPE = ids;
                    } else {
                        this.GraphicViewModel_(theKey).ids = ids;
                    }
                    
                }
            };
            
            prototype.addId = function(key, id, isPE) {
                if (theKey === key) {
                    let ids = this.getIds(isPE);
                    
                    if (isPE && ids.length === 1 && ids.includes('todos')) {
                        this.removeId(key, id, isPE);
                    }
                    
                    ids.push(id);
                }
            };
            
            prototype.removeId = function(key, id, isPE) {
                if (theKey === key) {
                    var ids = this.getIds(isPE);
                    var index = ids.indexOf(id);
                    
                    ids.splice(index, 1);
                }
            };
            
            prototype.getModel = function(isPE) {
                if (isPE) {
                    return this.GraphicViewModel_(theKey).modelPE;
                } else {
                    return this.GraphicViewModel_(theKey).model;
                }
            };
            
            prototype.getSeries = function() {
                return this.GraphicViewModel_(theKey).series;
            };
            
            prototype.getMonthlySeries = function() {
                return this.GraphicViewModel_(theKey).monthlySeries;
            };
            
            prototype.setMonthlySeries = function(key, monthlySeries) {
                if (theKey === key) {
                    this.GraphicViewModel_(theKey).monthlySeries = monthlySeries;
                }
            };
            
            prototype.getYearlySeries = function() {
                return this.GraphicViewModel_(theKey).yearlySeries;
            };
            
            prototype.setYearlySeries = function(key, yearlySeries) {
                if (theKey === key) {
                    this.GraphicViewModel_(theKey).yearlySeries = yearlySeries;
                }
            };
            
            prototype.setSeries = function(key, series) {
                if (theKey === key) {
                    this.GraphicViewModel_(theKey).series = series;
                }
            };
            
            prototype.getGroups = function(key) {
                if (theKey === key) {
                    return this.GraphicViewModel_(theKey).groups;
                }
            };
            
            prototype.setGroups = function(key, groups) {
                if (theKey === key) {
                    this.GraphicViewModel_(theKey).groups = groups;
                }
            };
            
            prototype.addGroup = function(key, group) {
                if (theKey === key) {
                    if (!this.getGroups(key).includes(group)) {
                        this.GraphicViewModel_(theKey).groups.push(group);
                    }
                }
            };
            
            prototype.getYAxes = function() {
                return this.GraphicViewModel_(theKey).yaxes;
            };
            
            prototype.addIndicator = function(id, isPE) {
                if (isPE) {
                    this.removeYearlyAndMonthlySeries(theKey, 'todos', isPE);
                    this.createSeriesByPE(id);
                } else {
                    this.createSerieByPIDE(id);
                }
                
                this.addId(theKey, id, isPE);
                this.refreshAxes();
                var seriesValues = this.filterSeriesByOptions(theKey, this.graphicOptions());
                this.refreshSeries(seriesValues);
                
//                if (isPE) {
//                    this.refreshLegendsPE();
//                }
            };
            
            prototype.removeIndicator = function(id, isPE) {
                this.removeYearlyAndMonthlySeries(theKey, id, isPE);
                
                let series = this.getSeries();
                this.setSeries(series);

                this.removeId(theKey, id, isPE);
                this.refreshAxes();
                
//                if (isPE) {
//                    this.refreshLegendsPE();
//                    
//                    if (series.length === 0) {
//                        this.createSeriesByPE('todos'); //all
//                        this.refreshAxes();
//                        var seriesValues = this.filterSeriesByOptions(theKey, this.graphicOptions());
//                        this.refreshSeries(seriesValues);
//                    }
//                }
            };
            
            prototype.removeYearlyAndMonthlySeries = function(key, id, isPE) {
                if (theKey === key) {
                    let pideFilter = (serie) => {
                        return !serie.id.endsWith(id);
                    };

                    let peFilter = (serie) => {
                        return !serie.id.startsWith(id);
                    };
                
                    let filter = isPE ? peFilter : pideFilter;
                    this.setYearlySeries(key, this.getYearlySeries().filter(filter));
                    this.setMonthlySeries(key, this.getMonthlySeries().filter(filter));
                    this.setSeries(key, this.getCurrentSeries(key));
                    
                    this.seriesValues.remove(
                        function(serie) {
                            return !filter(serie);
                        }
                    );
                }
            };
            
            prototype.setXAxisFormat = function(key, format) {
                if (theKey === key) {
                    var newFormat = this.xAxisFormats[format];
                    
                    if (newFormat) {
                        this.xAxis(newFormat);
                    }
                }
            };
            
            prototype.createSerie = function(id, idPE) {
                var model = this.getModel();
                var yearlySeries = this.getYearlySeries();
                var monthlySeries = this.getMonthlySeries();
                var yaxes = this.getYAxes();
                var item = model[id];
                var unitType = item["unit-type"];
                var displayLegends = this.graphicOptions().indexOf(this.elementType.GOAL) < 0;
                var colorHandler = this.getColorHandler(theKey);
                var markerHandler = this.getMarkerHandler(theKey);
                var name = item.title + '(' + idPE + ')';
                var newId = idPE + item.attr.id;
                var markerShape = markerHandler.getValue(name);
                var color = colorHandler.getValue(idPE);
                var categories = [name, idPE];
                
                if (yaxes.indexOf(unitType) < 0) {
                    yaxes.push(unitType);
                }

                var monthlyProgressElement = {
                    id: newId,
                    elementType: this.elementType.PROGRESS,
                    name: name,
                    categories: categories,
                    color: color,
                    items: [],
                    displayInLegend: displayLegends ? "on" : "off",
                    type: this.getGraphicType(),
                    markerShape: markerShape,
                    markerDisplayed: "on",
                    assignedToY2: yaxes.indexOf(unitType) > 0 ? "on" : "off"
                };

                var monthlyGoalElement = {
                    id: newId,
                    elementType: this.elementType.GOAL,
                    name: name,
                    categories: categories,
                    color: color,
                    items: [],
                    displayInLegend: "on",
                    type: this.graphicType.LINE,
                    lineStyle: "dotted",
                    markerShape: markerShape,
                    markerDisplayed: "on",
                    assignedToY2: yaxes.indexOf(unitType) > 0 ? "on" : "off"
                };

                var yearlyProgressElement = {
                    id: newId,
                    elementType: this.elementType.PROGRESS,
                    name: name,
                    categories: categories,
                    color: color,
                    items: [],
                    displayInLegend: displayLegends ? "on" : "off",
                    type: this.getGraphicType(),
                    markerShape: markerShape,
                    markerDisplayed: "on",
                    assignedToY2: yaxes.indexOf(unitType) > 0 ? "on" : "off"
                };

                var yearlyGoalElement = {
                    id: newId,
                    elementType: this.elementType.GOAL,
                    name: name,
                    categories: categories,
                    color: color,
                    items: [],
                    displayInLegend: "on",
                    type: this.graphicType.LINE,
                    lineStyle: "dotted",
                    markerShape: markerShape,
                    markerDisplayed: "on",
                    assignedToY2: yaxes.indexOf(unitType) > 0 ? "on" : "off"
                };
                
                var highestAllowed = item["values-range"].highest;
                var lowestAllowed = item["values-range"].lowest;
                
                var startDate = oj.IntlConverterUtils.isoToDate(this.fromDateValue());
                var endDate = oj.IntlConverterUtils.isoToDate(this.toDateValue());
                
                if (endDate > startDate) {
                    var startYear = startDate.getFullYear();
                    var endYear = endDate.getFullYear();
                    var currentYear = startYear;
                    var tempDate = new Date(startDate.getTime());

                    do {
                        var monthsNumber = currentYear === endYear
                                ? endDate.getMonth() - tempDate.getMonth()
                                : endYear > currentYear
                                ? 12 - startDate.getMonth()
                                : 1;
                        
                        var randomGoalsNumber = Math.round(Math.random() * Math.floor(monthsNumber / 4)) + 1;
                        var goals = [];
                        
                        for (var i = 0; i < randomGoalsNumber; i ++) {
                            goals[i] = Math.random() * ((highestAllowed - lowestAllowed) / randomGoalsNumber);
                            
                            if (i > 0) {
                                goals[i] += goals[i - 1];
                            }
                            
                            if (goals[i] > highestAllowed) {
                                goals[i] = highestAllowed;
                            }
                        }
                        
                        if (randomGoalsNumber < monthsNumber) {
                            var currentMonth = 1;
                            var newGoals = [];
                            var currentGoal = 0;
                            var delta = monthsNumber - randomGoalsNumber;
                            
                            for (var i = 0; i < goals.length; i ++) {
                                var month = Math.floor(Math.random() * delta) + currentMonth;
                                
                                if (month === currentMonth) {
                                    newGoals.push(goals[i]);
                                    currentGoal = goals[i];
                                } else {
                                    var goalDelta = (goals[i] - currentGoal) / (month - currentMonth);
                                    
                                    while(currentMonth < month) {
                                        newGoals.push(currentGoal + goalDelta);
                                        currentGoal += goalDelta;
                                        currentMonth ++;
                                    }
                                }
                                
                                delta = (monthsNumber - currentMonth ++) - (randomGoalsNumber - (i + 1));
                            }
                            
                            var delta = monthsNumber - newGoals.length;
                            
                            if (delta > 0) {
                                var lastGoal = newGoals[newGoals.length - 1];
                                var beforeLastGoal = newGoals[newGoals.length - 1] ? newGoals[newGoals.length - 1] : 0;
                                var deltaValue = (lastGoal - beforeLastGoal) / delta;
                                
                                for (var i = delta; i >= 1; i --) {
                                    newGoals.splice(newGoals.length - 1, 0, lastGoal - (deltaValue * i));
                                }
                            }
                            
                            goals = newGoals;
                        }
                        
                        for (var i = 0, month = tempDate.getMonth(); i < goals.length; i ++, month ++) {
                            var isoDate = oj.IntlConverterUtils.dateToLocalIso(new Date(tempDate.getFullYear(), month, 15));
                            monthlyGoalElement.items.push({x: isoDate, y: goals[i]});
                        }
                        
                        var yearlyGoalItem = monthlyGoalElement.items[monthlyGoalElement.items.length - 1];
                        yearlyGoalElement.items.push({x: oj.IntlConverterUtils.dateToLocalIso(new Date(currentYear, 0, 1)), y: yearlyGoalItem.y});
                        
                        var progress = 0;
                        var randomDaysInMilliseconds;

                        do {
                            randomDaysInMilliseconds = Math.ceil(Math.random() * 31);
                            randomDaysInMilliseconds *= 24 * 60 * 60 * 1000;

                            var newTime = tempDate.getTime() + randomDaysInMilliseconds;
                            var newDate = new Date(newTime);
                            var newTimeMonth = newDate.getMonth();
                            
                            if (newTime < endDate.getTime() && newTimeMonth > tempDate.getMonth()) {
                                progress +=  Math.random() * (highestAllowed - lowestAllowed) / monthsNumber;
                                
                                if (progress > highestAllowed) {
                                    progress = highestAllowed;
                                }
                                
                                var isoDate = oj.IntlConverterUtils.dateToLocalIso(newDate);

                                monthlyProgressElement.items.push({x: isoDate, y: progress});
                            }
                            
                            tempDate.setTime(newTime);
                        } while (tempDate.getFullYear() === currentYear);
                        
                        var yearlyProgressItem = monthlyProgressElement.items[monthlyProgressElement.items.length - 1];
                        yearlyProgressElement.items.push({x: oj.IntlConverterUtils.dateToLocalIso(new Date(currentYear, 0, 1)), y: yearlyProgressItem.y});
                        
                        this.addGroup(theKey, currentYear);
                        tempDate = new Date(++ currentYear, 0, 1);
                    } while(currentYear <= endYear);
                    
                    monthlySeries.push(monthlyGoalElement);
                    monthlySeries.push(monthlyProgressElement);
                    
                    yearlySeries.push(yearlyGoalElement);
                    yearlySeries.push(yearlyProgressElement);
                }
            };
            
            function filterProgress(element) {
                return element.elementType === prototype.elementType.PROGRESS;
            }
            
            function filterGoals(element) {
                return element.elementType === prototype.elementType.GOAL;
            }
                    
            return GraphicViewModel;
        }
);