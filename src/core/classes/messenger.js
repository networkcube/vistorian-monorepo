/// <reference path="./dynamicgraph.ts" />
/// <reference path="./utils.ts" />
/// <reference path="./search.ts" />
/// <reference path="../scripts/jquery.d.ts" />
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var networkcube;
(function (networkcube) {
    networkcube.MESSAGE_HIGHLIGHT = 'highlight';
    networkcube.MESSAGE_SELECTION = 'selection';
    networkcube.MESSAGE_TIME_RANGE = 'timeRange';
    networkcube.MESSAGE_SELECTION_CREATE = 'createSelection';
    networkcube.MESSAGE_SELECTION_DELETE = 'deleteSelection';
    networkcube.MESSAGE_SELECTION_SET_CURRENT = 'setCurrentSelectionId';
    networkcube.MESSAGE_SELECTION_COLORING = 'setSelectionColor';
    networkcube.MESSAGE_SELECTION_SET_COLORING_VISIBILITY = 'selectionColoring';
    networkcube.MESSAGE_SELECTION_FILTER = 'selectionFilter';
    networkcube.MESSAGE_SELECTION_PRIORITY = 'selectionPriority';
    networkcube.MESSAGE_SEARCH_RESULT = 'searchResult';
    var MESSENGER_PROPAGATE = true;
    var MESSAGE_HANDLERS = [
        networkcube.MESSAGE_HIGHLIGHT,
        networkcube.MESSAGE_SELECTION,
        networkcube.MESSAGE_TIME_RANGE,
        networkcube.MESSAGE_SELECTION_CREATE,
        networkcube.MESSAGE_SELECTION_DELETE,
        networkcube.MESSAGE_SELECTION_SET_CURRENT,
        networkcube.MESSAGE_SELECTION_SET_COLORING_VISIBILITY,
        networkcube.MESSAGE_SELECTION_FILTER,
        networkcube.MESSAGE_SELECTION_PRIORITY,
        networkcube.MESSAGE_SEARCH_RESULT,
        networkcube.MESSAGE_SELECTION_COLORING
    ];
    var messageHandlers = [];
    // contains handlers for passing messages to the
    // visualization.
    var MessageHandler = /** @class */ (function () {
        function MessageHandler() {
        }
        return MessageHandler;
    }());
    var messageHandler = new MessageHandler();
    var previousMessageId = -1;
    // register an event handler
    function addEventListener(messageType, handler) {
        console.log('>>> addEventListener', messageType);
        messageHandler[messageType] = handler;
    }
    networkcube.addEventListener = addEventListener;
    function setDefaultEventListener(handler) {
        for (var i = 0; i < MESSAGE_HANDLERS.length; i++) {
            messageHandler[MESSAGE_HANDLERS[i]] = handler;
        }
    }
    networkcube.setDefaultEventListener = setDefaultEventListener;
    // create internal listener to storage events
    window.addEventListener('storage', receiveMessage, false);
    var Message = /** @class */ (function () {
        function Message(type) {
            this.id = Math.random();
            this.type = type;
        }
        return Message;
    }());
    networkcube.Message = Message;
    /////////////////////////////
    /// NON-SPECIFIC MESSAGES ///
    /////////////////////////////
    function sendMessage(type, body) {
        var m = new Message(type);
        m.body = body;
        distributeMessage(m, true);
    }
    networkcube.sendMessage = sendMessage;
    /////////////////////////
    /// SPECIFIC MESSAGES ///
    /////////////////////////
    // HIGHLIGHT
    function highlight(action, elementCompound) {
        var g = networkcube.getDynamicGraph();
        var idCompound = makeIdCompound(elementCompound);
        if (!elementCompound == undefined)
            action = 'reset';
        // create message
        var m;
        m = new HighlightMessage(action, idCompound);
        distributeMessage(m);
        if (elementCompound && g.currentSelection_id > 0) {
            $('body').css('cursor', 'url(/networkcube/icons/brush.png),auto');
        }
        else {
            $('body').css('cursor', 'auto');
        }
        // if(elements && elements.length > 0 && g.currentSelection_id > 0){
        //     $('body').css('cursor', 'url(../../networkcube/icons/brush.png),auto')
        // }else{
        //     $('body').css('cursor', 'auto')
        // }
    }
    networkcube.highlight = highlight;
    var HighlightMessage = /** @class */ (function (_super) {
        __extends(HighlightMessage, _super);
        function HighlightMessage(action, idCompound) {
            var _this = _super.call(this, networkcube.MESSAGE_HIGHLIGHT) || this;
            _this.action = action;
            _this.idCompound = idCompound;
            return _this;
        }
        return HighlightMessage;
    }(Message));
    networkcube.HighlightMessage = HighlightMessage;
    // SELECTION MESSAGES
    function selection(action, compound, selectionId) {
        var g = networkcube.getDynamicGraph();
        if (!selectionId)
            selectionId = g.currentSelection_id;
        var selection = g.getSelection(selectionId);
        var idCompound = makeIdCompound(compound);
        var m = new SelectionMessage(action, idCompound, selectionId);
        distributeMessage(m);
    }
    networkcube.selection = selection;
    var SelectionMessage = /** @class */ (function (_super) {
        __extends(SelectionMessage, _super);
        function SelectionMessage(action, idCompound, selectionId) {
            var _this = _super.call(this, networkcube.MESSAGE_SELECTION) || this;
            _this.action = action;
            _this.idCompound = idCompound;
            _this.selectionId = selectionId;
            return _this;
        }
        return SelectionMessage;
    }(Message));
    networkcube.SelectionMessage = SelectionMessage;
    // TIME CHANGE MESSAGES
    function timeRange(startUnix, endUnix, single, propagate) {
        var m = new TimeRangeMessage(startUnix, endUnix);
        if (propagate == undefined)
            propagate = false;
        if (propagate)
            distributeMessage(m); // notifies all views, including this
        else
            processMessage(m);
    }
    networkcube.timeRange = timeRange;
    var TimeRangeMessage = /** @class */ (function (_super) {
        __extends(TimeRangeMessage, _super);
        function TimeRangeMessage(start, end) {
            var _this = _super.call(this, networkcube.MESSAGE_TIME_RANGE) || this;
            _this.startUnix = start;
            _this.endUnix = end;
            return _this;
        }
        return TimeRangeMessage;
    }(Message));
    networkcube.TimeRangeMessage = TimeRangeMessage;
    /// CREATE NEW SELECTION
    function createSelection(type, name) {
        var g = networkcube.getDynamicGraph();
        var b = g.createSelection(type);
        b.name = name;
        var m = new CreateSelectionMessage(b);
        // callHandler(m);
        distributeMessage(m, false);
        return b;
    }
    networkcube.createSelection = createSelection;
    var CreateSelectionMessage = /** @class */ (function (_super) {
        __extends(CreateSelectionMessage, _super);
        function CreateSelectionMessage(b) {
            var _this = _super.call(this, networkcube.MESSAGE_SELECTION_CREATE) || this;
            _this.selection = b;
            return _this;
        }
        return CreateSelectionMessage;
    }(Message));
    networkcube.CreateSelectionMessage = CreateSelectionMessage;
    // SET CURRENT SELECTION
    function setCurrentSelection(b) {
        var g = networkcube.getDynamicGraph();
        // g.setCurrentSelection(b.id);
        var m = new SetCurrentSelectionIdMessage(b);
        // callHandler(m);
        distributeMessage(m);
    }
    networkcube.setCurrentSelection = setCurrentSelection;
    var SetCurrentSelectionIdMessage = /** @class */ (function (_super) {
        __extends(SetCurrentSelectionIdMessage, _super);
        function SetCurrentSelectionIdMessage(b) {
            var _this = _super.call(this, networkcube.MESSAGE_SELECTION_SET_CURRENT) || this;
            _this.selectionId = b.id;
            return _this;
        }
        return SetCurrentSelectionIdMessage;
    }(Message));
    networkcube.SetCurrentSelectionIdMessage = SetCurrentSelectionIdMessage;
    // CHANGE SELECTION COLOR
    function showSelectionColor(selection, showColor) {
        var m = new ShowSelectionColorMessage(selection, showColor);
        distributeMessage(m);
    }
    networkcube.showSelectionColor = showSelectionColor;
    var ShowSelectionColorMessage = /** @class */ (function (_super) {
        __extends(ShowSelectionColorMessage, _super);
        function ShowSelectionColorMessage(selection, showColor) {
            var _this = _super.call(this, networkcube.MESSAGE_SELECTION_SET_COLORING_VISIBILITY) || this;
            _this.selectionId = selection.id;
            _this.showColor = showColor;
            return _this;
        }
        return ShowSelectionColorMessage;
    }(Message));
    networkcube.ShowSelectionColorMessage = ShowSelectionColorMessage;
    // export function filter(compound:Selection, filter:boolean){
    //     var m = new Filter(makeIdCompound(compound), filter)
    //     sendMessage(m);
    // }
    //
    // export class Filter extends Message{
    //     idCompound:number;
    //     filter:string
    //     constructor(idCompond:Selection, filter:boolean){
    //         super(MESSAGE_FILTER)
    //         this.idCompound = idCompound;
    //         this.filter = filter;
    //     }
    // }
    /// FILTER SELECTION
    function filterSelection(selection, filter) {
        var m = new FilterSelectionMessage(selection, filter);
        distributeMessage(m);
    }
    networkcube.filterSelection = filterSelection;
    var FilterSelectionMessage = /** @class */ (function (_super) {
        __extends(FilterSelectionMessage, _super);
        function FilterSelectionMessage(selection, filter) {
            var _this = _super.call(this, networkcube.MESSAGE_SELECTION_FILTER) || this;
            _this.selectionId = selection.id;
            _this.filter = filter;
            return _this;
        }
        return FilterSelectionMessage;
    }(Message));
    networkcube.FilterSelectionMessage = FilterSelectionMessage;
    /// SWAP PRIORITY
    function swapPriority(s1, s2) {
        var m = new SelectionPriorityMessage(s1, s2, s2.priority, s1.priority);
        distributeMessage(m);
    }
    networkcube.swapPriority = swapPriority;
    var SelectionPriorityMessage = /** @class */ (function (_super) {
        __extends(SelectionPriorityMessage, _super);
        function SelectionPriorityMessage(s1, s2, p1, p2) {
            var _this = _super.call(this, networkcube.MESSAGE_SELECTION_PRIORITY) || this;
            _this.selectionId1 = s1.id;
            _this.selectionId2 = s2.id;
            _this.priority1 = p1;
            _this.priority2 = p2;
            return _this;
        }
        return SelectionPriorityMessage;
    }(Message));
    networkcube.SelectionPriorityMessage = SelectionPriorityMessage;
    /// DELETE SELECTION
    function deleteSelection(selection) {
        var m = new DeleteSelectionMessage(selection);
        distributeMessage(m);
    }
    networkcube.deleteSelection = deleteSelection;
    var DeleteSelectionMessage = /** @class */ (function (_super) {
        __extends(DeleteSelectionMessage, _super);
        function DeleteSelectionMessage(selection) {
            var _this = _super.call(this, networkcube.MESSAGE_SELECTION_DELETE) || this;
            _this.selectionId = selection.id;
            return _this;
        }
        return DeleteSelectionMessage;
    }(Message));
    networkcube.DeleteSelectionMessage = DeleteSelectionMessage;
    /// SET SELECTION COLOR
    function setSelectionColor(s, color) {
        distributeMessage(new SelectionColorMessage(s, color));
    }
    networkcube.setSelectionColor = setSelectionColor;
    var SelectionColorMessage = /** @class */ (function (_super) {
        __extends(SelectionColorMessage, _super);
        function SelectionColorMessage(selection, color) {
            var _this = _super.call(this, networkcube.MESSAGE_SELECTION_COLORING) || this;
            _this.selectionId = selection.id;
            _this.color = color;
            return _this;
        }
        return SelectionColorMessage;
    }(Message));
    /// SEARCH SELECTION
    function search(term, type) {
        var idCompound = networkcube.searchForTerm(term, networkcube.getDynamicGraph(), type);
        distributeMessage(new SearchResultMessage(term, idCompound));
    }
    networkcube.search = search;
    var SearchResultMessage = /** @class */ (function (_super) {
        __extends(SearchResultMessage, _super);
        function SearchResultMessage(searchTerm, idCompound) {
            var _this = _super.call(this, networkcube.MESSAGE_SEARCH_RESULT) || this;
            _this.idCompound = idCompound;
            _this.searchTerm = searchTerm;
            return _this;
        }
        return SearchResultMessage;
    }(Message));
    networkcube.SearchResultMessage = SearchResultMessage;
    // INTERNAL FUNCTIONS ////////////////////////
    var MESSAGE_KEY = 'networkcube_message';
    localStorage[MESSAGE_KEY] = undefined;
    function distributeMessage(message, ownView) {
        if (ownView == undefined || ownView)
            processMessage(message);
        // other views
        if (MESSENGER_PROPAGATE) {
            localStorage[MESSAGE_KEY] = JSON.stringify(message, function (k, v) { return networkcube.dgraphReplacer(k, v); });
        }
    }
    networkcube.distributeMessage = distributeMessage;
    function receiveMessage() {
        // read message from local storage
        var s = localStorage[MESSAGE_KEY];
        if (s == undefined || s == 'undefined')
            return;
        var dgraph = getDynamicGraph();
        var m = JSON.parse(s, function (k, v) { return networkcube.dgraphReviver(dgraph, k, v); });
        // console.log('\tMessage type', m.type, m.id)
        if (!m || m.id == previousMessageId) {
            return;
        }
        previousMessageId = m.id;
        processMessage(m);
    }
    function processMessage(m) {
        var graph = networkcube.getDynamicGraph();
        // console.log('[Messenger] process message', m)
        if (messageHandler[m.type]) {
            // for messages with handlers
            if (m.type == networkcube.MESSAGE_HIGHLIGHT) {
                var m2 = m;
                graph.highlight(m2.action, m2.idCompound);
                // } else
                //     if (m.type == MESSAGE_SELECTION) {
                //         var m3: SelectionMessage = <SelectionMessage>m;
                //         var compound = cloneCompound(m3.idCompound)
                //         graph.selection(m3.action, compound, m3.selectionId);
                //     } else
                //         if (m.type == MESSAGE_TIME_RANGE) {
                //             // this type is a view message. no adjustments on the graph necessary.
                //         } else
                //             if (m.type == MESSAGE_SELECTION_SET_COLORING_VISIBILITY) {
                //                 var m4: ShowSelectionColorMessage = <ShowSelectionColorMessage>m;
                //                 graph.getSelection(m4.selectionId).showColor = m4.showColor;
                //             } else
                //                 if (m.type == MESSAGE_SELECTION_PRIORITY) {
                //                     var m5: SelectionPriorityMessage = <SelectionPriorityMessage>m;
                //                     graph.getSelection(m5.selectionId1).priority = m5.priority1;
                //                     graph.getSelection(m5.selectionId2).priority = m5.priority2;
                //                     var linkElements = graph.getLinks().selected().elements;
                //                     for (var i = 0; i < linkElements.length; i++) {
                //                         linkElements[i].getSelections().sort(sortByPriority)
                //                     }
                //                     var nodeElements = graph.getNodes().selected().elements;
                //                     for (var i = 0; i < nodeElements.length; i++) {
                //                         nodeElements[i].getSelections().sort(sortByPriority)
                //                     }
                //                     // elements = graph.getTimes().selected().elements;
                //                     // for(var i=0 ; i<elements.length ; i++){
                //                     //     elements[i].getSelections().sort(sortByPriority)
                //                     // }
                //                     var nodePairElements = graph.getNodePairs().selected().elements;
                //                     for (var i = 0; i < nodePairElements.length; i++) {
                //                         nodePairElements[i].getSelections().sort(sortByPriority)
                //                     }
                //                 } else
                //                     // if(m.type == MESSAGE_FILTER){
                //                     //     var m6:FilterM = <SelectionPriorityMessage>m;
                //                     //     graph.filter(m.idCompound, filter)
                //                     // }else
                //                     if (m.type == MESSAGE_SELECTION_FILTER) {
                //                         var m6: FilterSelectionMessage = <FilterSelectionMessage>m;
                //                         graph.filterSelection(m6.selectionId, m6.filter);
                //                     } else
                //                         // test messages that don't require a message handler
                //                         if (m.type == MESSAGE_SELECTION_CREATE) {
                //                             var m7: CreateSelectionMessage = <CreateSelectionMessage>m;
                //                             graph.addSelection(m7.selection.id, m7.selection.color, m7.selection.acceptedType, m7.selection.priority);
                //                         } else
                //                             if (m.type == MESSAGE_SELECTION_SET_CURRENT) {
                //                                 var m8: SetCurrentSelectionIdMessage = <SetCurrentSelectionIdMessage>m;
                //                                 graph.setCurrentSelection(m8.selectionId);
                //                             } else
                //                                 if (m.type == MESSAGE_SELECTION_DELETE) {
                //                                     var m10: DeleteSelectionMessage = <DeleteSelectionMessage>m;
                //                                     graph.deleteSelection(m10.selectionId);
                //                                 } else
                //                                     if (m.type == MESSAGE_SEARCH_RESULT) {
                //                                         var m11: SearchResultMessage = <SearchResultMessage>m;
                //                                         graph.highlight('set', m11.idCompound);
                //                                     } else
                //                                         if (m.type == MESSAGE_SELECTION_COLORING) {
                //                                             var m12: SelectionColorMessage = <SelectionColorMessage>m;
                //                                             graph.getSelection(m12.selectionId).color = m12.color;
                //                                         }
                // 
                // 
            }
            else if (m.type == networkcube.MESSAGE_SELECTION) {
                var m3 = m;
                graph.selection(m3.action, m3.idCompound, m3.selectionId);
            }
            else if (m.type == networkcube.MESSAGE_TIME_RANGE) {
                // this type is a view message. no adjustments on the graph necessary.
            }
            else if (m.type == networkcube.MESSAGE_SELECTION_SET_COLORING_VISIBILITY) {
                var m4 = m;
                graph.getSelection(m4.selectionId).showColor = m4.showColor;
            }
            else if (m.type == networkcube.MESSAGE_SELECTION_PRIORITY) {
                var m5 = m;
                graph.getSelection(m5.selectionId1).priority = m5.priority1;
                graph.getSelection(m5.selectionId2).priority = m5.priority2;
                var linkElements = graph.links().selected().toArray();
                for (var i = 0; i < linkElements.length; i++) {
                    linkElements[i].getSelections().sort(sortByPriority);
                }
                var nodeElements = graph.nodes().selected().toArray();
                for (var i = 0; i < nodeElements.length; i++) {
                    nodeElements[i].getSelections().sort(sortByPriority);
                }
                // elements = graph.getTimes().selected().elements;
                // for(var i=0 ; i<elements.length ; i++){
                //     elements[i].getSelections().sort(sortByPriority)
                // }
                var nodePairElements = graph.nodePairs().selected().toArray();
                for (var i = 0; i < nodePairElements.length; i++) {
                    nodePairElements[i].getSelections().sort(sortByPriority);
                }
            }
            else 
            // if(m.type == MESSAGE_FILTER){
            //     var m6:FilterM = <SelectionPriorityMessage>m;
            //     graph.filter(m.idCompound, filter)
            // }else
            if (m.type == networkcube.MESSAGE_SELECTION_FILTER) {
                var m6 = m;
                graph.filterSelection(m6.selectionId, m6.filter);
            }
            else 
            // test messages that don't require a message handler
            if (m.type == networkcube.MESSAGE_SELECTION_CREATE) {
                var m7 = m;
                graph.addSelection(m7.selection.id, m7.selection.color, m7.selection.acceptedType, m7.selection.priority);
            }
            else if (m.type == networkcube.MESSAGE_SELECTION_SET_CURRENT) {
                var m8 = m;
                graph.setCurrentSelection(m8.selectionId);
            }
            else if (m.type == networkcube.MESSAGE_SELECTION_DELETE) {
                var m10 = m;
                graph.deleteSelection(m10.selectionId);
            }
            else if (m.type == networkcube.MESSAGE_SEARCH_RESULT) {
                var m11 = m;
                graph.highlight('set', m11.idCompound);
            }
            else if (m.type == networkcube.MESSAGE_SELECTION_COLORING) {
                var m12 = m;
                graph.getSelection(m12.selectionId).color = m12.color;
            }
            callHandler(m);
        }
    }
    // calls the handler for the passed message
    function callHandler(message) {
        if (messageHandler[message.type] && messageHandler[message.type] != undefined) {
            messageHandler[message.type](message);
        }
    }
})(networkcube || (networkcube = {}));
