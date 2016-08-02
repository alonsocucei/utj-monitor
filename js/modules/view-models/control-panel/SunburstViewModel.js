define(['jquery', 'knockout', 'view-models/GeneralViewModel',
    'view-models/events/EventTypes',
    'models/control-panel/PlanElementTypes',
    'ojs/ojcore', 'ojs/ojknockout', 'ojs/ojsunburst'],
        function ($, ko, GeneralViewModel, EventTypes, PlanElementTypes) {
            var theKey = {};
            function SunburstViewModel(prefix, controlPanelModel) {
                var self = this;
                var privateData = {
                    controlPanelModel: controlPanelModel,
                    planElementsMap: undefined,
                    selectedPlanElementId: undefined
                };

                privateData.planElementsMap =
                        parsePlanElementsArray(controlPanelModel.getPlanElementsArray());

                this.SunburstViewModel_ = function (key) {
                    if (theKey === key) {
                        return privateData;
                    }
                };

                self.id = prefix + "_sunburst";
                self.nodeValues = ko.observableArray([self.getMainNode()]);
                self.selection = ko.observableArray();

                self.clickHandler = function (ui, data) {
                    if (data.option === "selection") {
                        if (data.value.length > 0) {
                            var id = data.value[0];
                            self.onClick(self.getControlPanelModel().getPlanElementsArray()[id]);
                        }
                    }
                };
            }

            SunburstViewModel.prototype = Object.create(GeneralViewModel);
            var prototype = SunburstViewModel.prototype;

            prototype.getControlPanelModel = function () {
                return this.SunburstViewModel_(theKey).controlPanelModel;
            };

            prototype.addClickListener = function (listener) {
                this.addListener(listener, EventTypes.CLICK_EVENT);
            };

            prototype.onClick = function (planElement) {
                this.callListeners(EventTypes.CLICK_EVENT, planElement);
                updateSiblingsNodes.call(this, planElement, this.getPlanElementsMap(), this.getControlPanelModel());
                this.selection([]);
            };

            prototype.getPlanElementsArray = function () {
                return this.SunburstViewModel_(theKey).planElementsArray;
            };

            prototype.getPlanElementsMap = function () {
                return this.SunburstViewModel_(theKey).planElementsMap;
            };

            prototype.setSelectedItem = function (selectedPlanElement) {
                var planElementsArray = this.getControlPanelModel().getPlanElementsArray();
                var id = planElementsArray.indexOf(selectedPlanElement);
                this.selection([id]);
            };

            prototype.getMainNode = function () {
                return this.SunburstViewModel_(theKey).planElementsMap[0];
            };

            function updateSiblingsNodes(planElement, planElementsMap, controlPanelModel) {
                var planElementParent = planElement.getParent();
                
                
                if (planElementParent) {
                    if (planElementParent.getType() === PlanElementTypes.THEME) {
                        planElementParent = planElementParent.getParent();
                    }
                    
                    var planElementIndex = controlPanelModel.getPlanElementsArray().indexOf(planElement);
                    var planElementNodeToKeep = planElementsMap[planElementIndex];
                    var parentElementIndex = controlPanelModel.getPlanElementsArray().indexOf(planElementParent);
                    var planElementParentNode = planElementsMap[parentElementIndex];

                    updateChildrenNodes(planElementParentNode, planElementNodeToKeep);
                } else {
                    for (var nodeId in planElementsMap) {
                        showChildrenNodes(planElementsMap[nodeId]);
                    }
                }

                $("#" + this.id).ojSunburst("refresh");
            }

            function updateChildrenNodes(planElementParentNode, planElementNodeToKeep) {
                if (planElementParentNode.hiddenNodes.length > 0) {
                    showChildrenNodes(planElementParentNode);
                } else {
                    hideChildrenNodes(planElementParentNode, planElementNodeToKeep);
                }
            }

            function showChildrenNodes(planElementNode) {
                if (planElementNode.hiddenNodes.length > 0) {
                    var nodes = planElementNode.nodes;
                    planElementNode.hiddenNodes.push(nodes[0]);
                    planElementNode.nodes = planElementNode.hiddenNodes;

                    nodes.splice(0, 1);
                    planElementNode.hiddenNodes = nodes;
                }
            }

            function hideChildrenNodes(planElementNode, planElementNodeToKeep) {
                var nodes = planElementNode.nodes;
                var indexToKeep = nodes.indexOf(planElementNodeToKeep);
                planElementNode.hiddenNodes = nodes;

                planElementNode.nodes = planElementNode.hiddenNodes.splice(indexToKeep, 1);
            }

            function parsePlanElementsArray(planElementsArray) {
                var id = 0;
                var nodesMap = {};
                var visionObject = planElementsArray[0];

                var textId = id.toString();
                nodesMap[textId] = createNode(textId, visionObject, 360);
                id++;

                for (var i = 1; i < planElementsArray.length; i++, id++) {
                    var planElement = planElementsArray[i];
                    var parentElement = planElement.getParent();
                    var sibilings = parentElement.getChildren().length;
                    textId = id.toString();

                    if (planElement.getType() !== PlanElementTypes.THEME) {
                        nodesMap[textId] = createNode(textId, planElement, sibilings);
                    }
                }

                for (var id in nodesMap) {
                    addChildNodes(id, planElementsArray, nodesMap);
                }

                return nodesMap;
            }

            function createNode(id, planElement, length) {

                var progress = planElement.getProgress();
                var shortDesc = "&lt;b&gt;" + planElement.getName() + "&lt;/b&gt;";

                if (planElement.getType() === PlanElementTypes.INDICATOR) {
                    var goalPlusAchieve = "&lt;br/&gt;" + "Meta: " + planElement.getGoal() +
                            "&lt;br/&gt;" + "Avance: " + planElement.getAchieve();
                    shortDesc += goalPlusAchieve;
                }

                progress *= 100;
                progress = Math.round(progress);

                var color = getColor(progress);
                var progressDesc = "&lt;br/&gt;Progreso: " + progress + "%";
                shortDesc += progressDesc;

                return {
                    id: id,
                    label: planElement.getLabel(),
                    value: 360 / length,
                    color: color,
                    borderWidth: 2,
                    shortDesc: shortDesc
                };
            }

            /**
             * 
             * @param {type} id
             * @param {type} planElementsArray
             * @param {type} nodesMap
             * @returns {undefined}
             */
            function addChildNodes(id, planElementsArray, nodesMap) {
                var planElement = planElementsArray[id];
                var children = planElement.getChildren();

                if (planElement.getType() === PlanElementTypes.AXE) {
                    var objectives = [];

                    for (var i = 0; i < children.length; i++) {
                        children[i].getChildren().forEach(
                                function (objective) {
                                    objectives.push(objective);
                                }
                        );
                    }
                    
                    children = objectives;
                }

                var node = nodesMap[id];

                node.nodes = [];
                node.hiddenNodes = [];

                if (children) {
                    var nodes = node.nodes;
                    var childrenLength = children.length;

                    for (var i = 0; i < childrenLength; i++) {
                        nodes.push(nodesMap[planElementsArray.indexOf(children[i])]);
                    }
                }
            }

            /**
             * 
             * @param {type} achieve
             * @returns {String}
             */
            function getColor(progress) {
                if (progress >= 90) {
                    return "#31B404";
                } else if (progress >= 60) {
                    return "#D7DF01";
                } else if (progress >= 40) {
                    return "#FE9A2E";
                } else {
                    return "#DF0101";
                }
            }
            return SunburstViewModel;
        }
);