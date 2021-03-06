import { makeIdCompound, sortByPriority, ElementCompound } from "./utils";
import { Selection } from "./dynamicgraphutils";
import {
  Time,
  DynamicGraph,
  dgraphReplacer,
  dgraphReviver,
  IDCompound,
} from "./dynamicgraph";
import { getDynamicGraph } from "./main";
import { searchForTerm } from "./search";

export const MESSAGE_HIGHLIGHT = "highlight";
export const MESSAGE_SELECTION = "selection";
export const MESSAGE_TIME_RANGE = "timeRange";
export const MESSAGE_SELECTION_CREATE = "createSelection";
export const MESSAGE_SELECTION_DELETE = "deleteSelection";
export const MESSAGE_SELECTION_SET_CURRENT = "setCurrentSelectionId";
export const MESSAGE_SELECTION_COLORING = "setSelectionColor";
export const MESSAGE_SELECTION_SET_COLORING_VISIBILITY = "selectionColoring";
export const MESSAGE_SELECTION_FILTER = "selectionFilter";
export const MESSAGE_SELECTION_PRIORITY = "selectionPriority";
export const MESSAGE_SEARCH_RESULT = "searchResult";
export const MESSAGE_SET_STATE = "SET_STATE";
export const MESSAGE_GET_STATE = "GET_STATE";
export const MESSAGE_STATE_CREATED = "STATE_CREATED";
export const MESSAGE_ZOOM_INTERACTION = "ZOOM_INTERACTION";
export const MESSAGE_CENTER_VIEW_ON_SELECTION = "CENTER_VIEW";

const MESSENGER_PROPAGATE = true;

const MESSAGE_HANDLERS: string[] = [
  MESSAGE_HIGHLIGHT,
  MESSAGE_SELECTION,
  MESSAGE_TIME_RANGE,
  MESSAGE_SELECTION_CREATE,
  MESSAGE_SELECTION_DELETE,
  MESSAGE_SELECTION_SET_CURRENT,
  MESSAGE_SELECTION_SET_COLORING_VISIBILITY,
  MESSAGE_SELECTION_FILTER,
  MESSAGE_SELECTION_PRIORITY,
  MESSAGE_SEARCH_RESULT,
  MESSAGE_SELECTION_COLORING,
  MESSAGE_SET_STATE,
  MESSAGE_GET_STATE,
  MESSAGE_STATE_CREATED,
  MESSAGE_ZOOM_INTERACTION,
];

// contains handlers for passing messages to the
// visualization.
class MessageHandler {}

const messageHandler: MessageHandler = new MessageHandler();

let previousMessageId = -1;

// register an event handler
export function addEventListener(
  messageType: string,
  handler: (m: any) => any
): void {
  (messageHandler as any)[messageType] = handler;
}

export function setDefaultEventListener(handler: (m: any) => any): void {
  for (let i = 0; i < MESSAGE_HANDLERS.length; i++) {
    (messageHandler as any)[MESSAGE_HANDLERS[i]] = handler;
  }
}

// create internal listener to storage events
window.addEventListener("storage", receiveMessage, false);

export class Message {
  id: number;
  type: string;
  body: any;

  constructor(type: string) {
    this.id = Math.random();
    this.type = type;
    this.body = null;
  }
}

/////////////////////////////
/// NON-SPECIFIC MESSAGES ///
/////////////////////////////

export function sendMessage(type: string, body: any): void {
  const m = new Message(type);
  m.body = body;
  distributeMessage(m, true);
}

/////////////////////////
/// SPECIFIC MESSAGES ///
/////////////////////////

function isEmpty(obj: any) {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) return false;
  }
  return true;
}

// HIGHLIGHT
export function highlight(
  action: string,
  elementCompound?: ElementCompound,
  msg?: string
): void {
  const g: DynamicGraph = getDynamicGraph();
  const idCompound: IDCompound = makeIdCompound(elementCompound);

  let highlightAnyElement = false;
  if (elementCompound != null && !isEmpty(elementCompound)) {
    highlightAnyElement = true;
  }

  if (!elementCompound == undefined) action = "reset";

  // create message
  const m: HighlightMessage = new HighlightMessage(action, idCompound, msg);
  distributeMessage(m);

  let cursor = "auto";
  if (elementCompound && g.currentSelection_id > 0) {
    cursor = "url(/networkcube/icons/brush.png),auto";
  }
  const body = document.querySelector("body");
  if (body) {
    body.style.cursor = cursor;
  }
}

export class HighlightMessage extends Message {
  action: string;
  idCompound: IDCompound;
  msg: string;

  constructor(action: string, idCompound?: IDCompound, msg?: string) {
    super(MESSAGE_HIGHLIGHT);
    this.action = action;
    this.idCompound = idCompound != undefined ? idCompound : new IDCompound(); // WHAT HAPPEND IF IT IS UNDEFINED??
    this.msg = msg ?? "";
  }
}

// SELECTION MESSAGES

export function selection(
  action: string,
  compound: ElementCompound,
  selectionId?: number
): void {
  const g: DynamicGraph = getDynamicGraph();
  if (!selectionId) selectionId = g.currentSelection_id;

  const idCompound: IDCompound = makeIdCompound(compound);

  const m: SelectionMessage = new SelectionMessage(
    action,
    idCompound,
    selectionId
  );

  distributeMessage(m);
}

export class SelectionMessage extends Message {
  action: string;
  selectionId: number;
  idCompound: IDCompound;

  constructor(action: string, idCompound: IDCompound, selectionId?: number) {
    super(MESSAGE_SELECTION);
    this.action = action;
    this.idCompound = idCompound;
    this.selectionId = selectionId != undefined ? selectionId : 0; // WHAT HAPPEND IF IT IS UNDEFINED?
  }
}

// TIME CHANGE MESSAGES

export function timeRange(
  startUnix: number,
  endUnix: number,
  single: Time,
  propagate?: boolean
): void {
  const m: TimeRangeMessage = new TimeRangeMessage(startUnix, endUnix);
  if (propagate == undefined) propagate = false;

  if (propagate) distributeMessage(m);
  // notifies all views, including this
  else processMessage(m);
}

export class TimeRangeMessage extends Message {
  startUnix: number;
  endUnix: number;

  constructor(start: number, end: number) {
    super(MESSAGE_TIME_RANGE);
    this.startUnix = start;
    this.endUnix = end;
  }
}

/// CREATE NEW SELECTION

export function createSelection(type: string, name: string): Selection {
  const g: DynamicGraph = getDynamicGraph();
  const b = g.createSelection(type);
  b.name = name;
  const m = new CreateSelectionMessage(b);
  distributeMessage(m, false);

  return b;
}

export class CreateSelectionMessage extends Message {
  selection: Selection;

  constructor(b: Selection) {
    super(MESSAGE_SELECTION_CREATE);
    this.selection = b;
  }
}

// SET CURRENT SELECTION

export function setCurrentSelection(b: Selection): void {
  getDynamicGraph(); // TODO: check if this has necessary side-effects or can  be removed
  const m = new SetCurrentSelectionIdMessage(b);
  distributeMessage(m);
}

export class SetCurrentSelectionIdMessage extends Message {
  selectionId: number;

  constructor(b: Selection) {
    super(MESSAGE_SELECTION_SET_CURRENT);
    this.selectionId = b.id;
  }
}

// CHANGE SELECTION COLOR

export function showSelectionColor(
  selection: Selection,
  showColor: boolean
): void {
  const m = new ShowSelectionColorMessage(selection, showColor);
  distributeMessage(m);
}

export class ShowSelectionColorMessage extends Message {
  selectionId: number;
  showColor: boolean;

  constructor(selection: Selection, showColor: boolean) {
    super(MESSAGE_SELECTION_SET_COLORING_VISIBILITY);
    this.selectionId = selection.id;
    this.showColor = showColor;
  }
}

/// FILTER SELECTION

export function filterSelection(selection: Selection, filter: boolean): void {
  const m = new FilterSelectionMessage(selection, filter);
  distributeMessage(m);
}

export class FilterSelectionMessage extends Message {
  selectionId: number;
  filter: boolean;

  constructor(selection: Selection, filter: boolean) {
    super(MESSAGE_SELECTION_FILTER);
    this.selectionId = selection.id;
    this.filter = filter;
  }
}

/// SWAP PRIORITY

export function swapPriority(s1: Selection, s2: Selection): void {
  const m = new SelectionPriorityMessage(s1, s2, s2.priority, s1.priority);
  distributeMessage(m);
}

export class SelectionPriorityMessage extends Message {
  selectionId1: number;
  selectionId2: number;
  priority1: number;
  priority2: number;

  constructor(s1: Selection, s2: Selection, p1: number, p2: number) {
    super(MESSAGE_SELECTION_PRIORITY);
    this.selectionId1 = s1.id;
    this.selectionId2 = s2.id;
    this.priority1 = p1;
    this.priority2 = p2;
  }
}

/// DELETE SELECTION

export function deleteSelection(selection: Selection): void {
  const m = new DeleteSelectionMessage(selection);
  distributeMessage(m);
}

export class DeleteSelectionMessage extends Message {
  selectionId: number;

  constructor(selection: Selection) {
    super(MESSAGE_SELECTION_DELETE);
    this.selectionId = selection.id;
  }
}

/// SET SELECTION COLOR

export function setSelectionColor(s: Selection, color: string): void {
  distributeMessage(new SelectionColorMessage(s, color));
}

class SelectionColorMessage extends Message {
  selectionId: number;
  color: string;

  constructor(selection: Selection, color: string) {
    super(MESSAGE_SELECTION_COLORING);
    this.selectionId = selection.id;
    this.color = color;
  }
}

export function centerViewOnSelection(selection: Selection): void {
  distributeMessage(new CenterViewMessage(selection));
}
export class CenterViewMessage extends Message {
  selectionId: number;

  constructor(selection: Selection) {
    super(MESSAGE_CENTER_VIEW_ON_SELECTION);
    this.selectionId = selection.id;
  }
}

/// SEARCH SELECTION

export function search(term: string, type?: string): void {
  const idCompound: IDCompound = searchForTerm(term, getDynamicGraph(), type);
  distributeMessage(new SearchResultMessage(term, idCompound));
}

export class SearchResultMessage extends Message {
  idCompound: IDCompound;
  searchTerm: string;

  constructor(searchTerm: string, idCompound: IDCompound) {
    super(MESSAGE_SEARCH_RESULT);
    this.idCompound = idCompound;
    this.searchTerm = searchTerm;
  }
}

export class NetworkControls {
  networkType: string;
  timeSliderStart: number;
  timeSliderEnd: number;

  constructor(networkType: string, startTime: number, endTime: number) {
    this.networkType = networkType;
    this.timeSliderStart = startTime;
    this.timeSliderEnd = endTime;
  }
}

export class NodeLinkControls extends NetworkControls {
  globalZoom: number;
  panOffsetLocal: number[];
  panOffsetGlobal: number[];
  linkOpacity: number;
  nodeOpacity: number;
  nodeSize: number;
  edgeGap: number;
  linkWidth: number;
  labellingType: number;

  constructor(
    networkType: string,
    startTime: number,
    endTime: number,
    globalZoom: number,
    panOffsetLocal: number[],
    panOffsetGlobal: number[],
    linkOpacity: number,
    nodeOpacity: number,
    nodeSize: number,
    edgeGap: number,
    linkWidth: number,
    labellingType: number
  ) {
    super(networkType, startTime, endTime);
    this.globalZoom = globalZoom;
    this.panOffsetGlobal = panOffsetGlobal;
    this.panOffsetLocal = panOffsetLocal;
    this.linkOpacity = linkOpacity;
    this.nodeOpacity = nodeOpacity;
    this.nodeSize = nodeSize;
    this.edgeGap = edgeGap;
    this.linkWidth = linkWidth;
    this.labellingType = labellingType;
  }
}

export class MatrixControls extends NetworkControls {
  labellingType: string;
  zoom: number;

  constructor(
    networkType: string,
    startTime: number,
    endTime: number,
    zoom: number,
    labellingType: string
  ) {
    super(networkType, startTime, endTime);
    this.zoom = zoom;
    this.labellingType = labellingType;
  }
}

export class TimeArchsControls extends NetworkControls {
  labellingType: string;

  /* webglState:any;
      camera_position_x:number;
      camera_position_y:number;
      camera_position_z:number; */

  constructor(
    networkType: string,
    startTime: number,
    endTime: number,
    labellingType: string
  ) {
    //,webglState:any,camera_position_x:number,camera_position_y:number,camera_position_z:number){
    super(networkType, startTime, endTime);
    this.labellingType = labellingType;
    /*  this.webglState=webglState;
            this.camera_position_x=camera_position_x;
            this.camera_position_y=camera_position_z;
            this.camera_position_z=camera_position_z;
     */
  }
}

export class MapControls extends NetworkControls {
  nodeOverlap: number;
  linkOpacity: number;
  opacityOfPositionlessNodes: number;

  constructor(
    networkType: string,
    startTime: number,
    endTime: number,
    nodeOverlap: number,
    linkOpacity: number,
    opacityOfPositionlessNodes: number
  ) {
    super(networkType, startTime, endTime);
    this.nodeOverlap = nodeOverlap;
    this.linkOpacity = linkOpacity;
    this.opacityOfPositionlessNodes = opacityOfPositionlessNodes;
  }
}

// SET STATE MESSAGE

export class SetStateMessage extends Message {
  state: NetworkControls; // this is the state with all the parameters to set the view to.
  viewType: string;

  constructor(state: NetworkControls, viewType: string) {
    super(MESSAGE_SET_STATE);
    this.state = state;
    this.viewType = viewType;
  }
}

export function setState(state: NetworkControls, viewType: string): void {
  // is called from anywhere in vistorian by calling
  // window.vc.messenger.setState(myState);
  distributeMessage(new SetStateMessage(state, viewType), true);
}

// GET STATE MESSAGE

export class GetStateMessage extends Message {
  bookmarkIndex: number;
  viewType: string;
  isNewBookmark: boolean;
  typeOfMultiView: string;

  constructor(
    bookmarkIndex: number,
    viewType: string,
    isNewBookmark: boolean,
    typeOfMultiView: string
  ) {
    super(MESSAGE_GET_STATE);
    this.bookmarkIndex = bookmarkIndex;
    this.viewType = viewType;
    this.isNewBookmark = isNewBookmark;
    this.typeOfMultiView = typeOfMultiView;
  }
}

export function getState(
  bookmarkIndex: number,
  viewType: string,
  isNewBookmark: boolean,
  typeOfMultiView: string
): void {
  // is called from anywhere in vistorian by calling
  // window.vc.messenger.getState(bookmarkIndex);

  distributeMessage(
    new GetStateMessage(
      bookmarkIndex,
      viewType,
      isNewBookmark,
      typeOfMultiView
    ),
    true
  );
}

export class StateCreatedMessage extends Message {
  state: NetworkControls;
  bookmarkIndex: number;
  viewType: string;
  isNewBookmark: boolean;
  typeOfMultiView: string;

  constructor(
    state: NetworkControls,
    bookmarkIndex: number,
    viewType: string,
    isNewBookmark: boolean,
    typeOfMultiView: string
  ) {
    super(MESSAGE_STATE_CREATED);
    this.state = state;
    this.bookmarkIndex = bookmarkIndex;
    this.viewType = viewType;
    this.isNewBookmark = isNewBookmark;
    this.typeOfMultiView = typeOfMultiView;
  }
}

export function stateCreated(
  state: NetworkControls,
  bookmarkIndex: number,
  viewType: string,
  isNewBookmark: boolean,
  typeOfMultiView: string
): void {
  // State created : to set the state after getting it from the selected network

  distributeMessage(
    new StateCreatedMessage(
      state,
      bookmarkIndex,
      viewType,
      isNewBookmark,
      typeOfMultiView
    ),
    true
  );
}

export class ZoomInteractionMessage extends Message {
  visType: string;
  ineractionType: string;

  constructor(visType: string, ineractionType: string) {
    super(MESSAGE_ZOOM_INTERACTION);
    this.visType = visType;
    this.ineractionType = ineractionType;
  }
}

export function zoomInteraction(visType: string, ineractionType: string): void {
  // log zoom interactions
  distributeMessage(new ZoomInteractionMessage(visType, ineractionType), true);
}

////////////////////////
// INTERNAL FUNCTIONS //
////////////////////////

const MESSAGE_KEY = "networkcube_message";
localStorage[MESSAGE_KEY] = undefined;

export function distributeMessage(message: Message, ownView?: boolean): void {
  //VS: Link Function Use
  // trace.event(null, 'LinkFunctionUse', message.type, );

  if (ownView == undefined || ownView) processMessage(message);

  // other views
  if (MESSENGER_PROPAGATE) {
    localStorage[MESSAGE_KEY] = JSON.stringify(message, function (k, v) {
      return dgraphReplacer(k, v);
    });
  }
}

function receiveMessage() {
  // read message from local storage
  const s = localStorage[MESSAGE_KEY];
  if (s == undefined || s == "undefined") return;
  const dgraph: DynamicGraph = getDynamicGraph();
  const m: Message = <Message>JSON.parse(s, function (k, v) {
    return dgraphReviver(dgraph, k, v);
  });

  if (!m || m.id == previousMessageId) {
    return;
  }
  previousMessageId = m.id;
  processMessage(m);
}

function processMessage(m: Message) {
  const graph = getDynamicGraph();

  if ((messageHandler as any)[m.type]) {
    // for messages with handlers
    if (m.type == MESSAGE_HIGHLIGHT) {
      const m2: HighlightMessage = <HighlightMessage>m;
      graph.highlight(m2.action, m2.idCompound);
    } else if (m.type == MESSAGE_SELECTION) {
      const m3: SelectionMessage = <SelectionMessage>m;
      graph.selection(m3.action, m3.idCompound, m3.selectionId);
    } else if (m.type == MESSAGE_TIME_RANGE) {
      // this type is a view message. no adjustments on the graph necessary.
    } else if (m.type == MESSAGE_SELECTION_SET_COLORING_VISIBILITY) {
      const m4: ShowSelectionColorMessage = <ShowSelectionColorMessage>m;
      const m4Selection = graph.getSelection(m4.selectionId);
      if (m4Selection != undefined) {
        m4Selection.showColor = m4.showColor;
      }
    } else if (m.type == MESSAGE_SELECTION_PRIORITY) {
      const m5: SelectionPriorityMessage = <SelectionPriorityMessage>m;
      const m5SelectionId1 = graph.getSelection(m5.selectionId1);
      const m5SelectionId2 = graph.getSelection(m5.selectionId2);
      if (m5SelectionId1 != undefined) {
        m5SelectionId1.priority = m5.priority1;
      } // ELSE?
      if (m5SelectionId2 != undefined) {
        m5SelectionId2.priority = m5.priority2;
      } // ELSE?

      const linkElements = graph.links().selected().toArray();
      for (let i = 0; i < linkElements.length; i++) {
        linkElements[i].getSelections().sort(sortByPriority);
      }
      const nodeElements = graph.nodes().selected().toArray();
      for (let i = 0; i < nodeElements.length; i++) {
        nodeElements[i].getSelections().sort(sortByPriority);
      }
      const nodePairElements = graph.nodePairs().selected().toArray();
      for (let i = 0; i < nodePairElements.length; i++) {
        nodePairElements[i].getSelections().sort(sortByPriority);
      }
    } else if (m.type == MESSAGE_SELECTION_FILTER) {
      const m6: FilterSelectionMessage = <FilterSelectionMessage>m;
      graph.filterSelection(m6.selectionId, m6.filter);
    }
    // test messages that don't require a message handler
    else if (m.type == MESSAGE_SELECTION_CREATE) {
      const m7: CreateSelectionMessage = <CreateSelectionMessage>m;
      graph.addSelection(
        m7.selection.id,
        m7.selection.color,
        m7.selection.acceptedType,
        m7.selection.priority
      );
    } else if (m.type == MESSAGE_SELECTION_SET_CURRENT) {
      const m8: SetCurrentSelectionIdMessage = <SetCurrentSelectionIdMessage>m;
      graph.setCurrentSelection(m8.selectionId);
    } else if (m.type == MESSAGE_SELECTION_DELETE) {
      const m10: DeleteSelectionMessage = <DeleteSelectionMessage>m;
      graph.deleteSelection(m10.selectionId);
    } else if (m.type == MESSAGE_SEARCH_RESULT) {
      const m11: SearchResultMessage = <SearchResultMessage>m;
      graph.highlight("set", m11.idCompound);
    } else if (m.type == MESSAGE_SELECTION_COLORING) {
      const m12: SelectionColorMessage = <SelectionColorMessage>m;
      const m12Selection = graph.getSelection(m12.selectionId);
      if (m12Selection != undefined) {
        m12Selection.color = m12.color;
      } // ELSE ??
    } else if (
      m.type == MESSAGE_GET_STATE ||
      m.type == MESSAGE_SET_STATE ||
      m.type == MESSAGE_STATE_CREATED ||
      m.type == MESSAGE_ZOOM_INTERACTION
    ) {
      // this type is a state message. no adjustments on the graph necessary.
    }

    callHandler(m);
  }
}

// calls the handler for the passed message
function callHandler(message: Message) {
  if (
    (messageHandler as any)[message.type] &&
    (messageHandler as any)[message.type] != undefined
  ) {
    (messageHandler as any)[message.type](message);
  }
}
