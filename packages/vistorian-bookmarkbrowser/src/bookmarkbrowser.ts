import * as d3 from "d3";

import * as utils from 'vistorian-core/src/utils';
import * as dynamicgraph from 'vistorian-core/src/dynamicgraph';
import * as main from 'vistorian-core/src/main';
import * as messenger from 'vistorian-core/src/messenger';
import * as datamanager from 'vistorian-core/src/datamanager';

import $ from 'jquery';

const RECT_SIZE = 13;
const INTENT = 0;
const LINE_HEIGHT = 13;
const GAP_ICONS = 3;

const width = window.innerWidth;

// Get data	
const dgraph: dynamicgraph.DynamicGraph = main.getDynamicGraph();

messenger.setDefaultEventListener(updateLists);
messenger.addEventListener('searchResult', searchResultHandler);

// CREATE SEARCH INPUT


// CRETE SELECTION LIST VIEW
// add node selections
createSelectionCategory('Node Selections', 'node');
createSelectionCategory('Link Selections', 'link');

createViewOnlyCategory('Node Colours', 'nodeColor')
createViewOnlyCategory('Node Shapes', 'nodeShape')

updateLists();

export function createSelectionCategory(name: string, type: string): void {

	const nodeDiv: any = d3.select('body').append('div')
		.attr('id', 'div_' + type)

	nodeDiv.append('p')
		.attr('id', 'title_' + type)
		.html(name + ':')

	nodeDiv.append('input')
		.datum(type)
		.attr('type', 'button')
		.attr('value', '+')
		.attr('onclick','trace.event(\'vis_13\',document.location.pathname,\'add \' ,\'' + type + '\')')
		.on('click', function (ev: MouseEvent, d: string) { createSelection(d) })

}

export function createViewOnlyCategory(name: string, type: string): void {

	const nodeDiv: any = d3.select('body').append('div')
		.attr('id', 'divViewOnly_' + type)

	nodeDiv.append('p')
		.attr('id', 'titleViewOnly_' + type)
		.html(name + ':')

}

export function updateViewOnlyList(type: string, name: string): void {
	let tmp: any[] = [];
	let trimmedColorsNoNulls: any[];
	let trimmedShapesNoNulls: any[];

    if(type == "nodeColor" ) {
        //Remove duplicates
        const trimmedColors = (dgraph.nodeArrays as any).color.filter(function (v: any) {
			if(typeof v!='undefined' && v){
				if (tmp.indexOf(v.toString()) < 0) {
					tmp.push(v.toString());
					return v;
				}
			}
        });
        //Remove null/undefinted
        tmp  = [];
		trimmedColorsNoNulls = trimmedColors.filter(function (v: any) {
            if (v[0] != null) {
                return v;
            }
        });
    }

    if(type == "nodeShape" ) {
        //Remove duplicates
        tmp  = [];
        const trimmedShapes = (dgraph.nodeArrays as any).shape.filter(function (v: any) {
			if(typeof v!='undefined' && v){
				if (tmp.indexOf(v.toString()) < 0) {
					tmp.push(v.toString());
					return v;
				}
			}
        });
        //Remove null/undefinted
        tmp  = [];
		trimmedShapesNoNulls = trimmedShapes.filter(function (v: any) {
            if (v[0] != null) {
                return v;
            }
        });
    }

	d3.select('#divViewOnly_' + type)
		.selectAll('.selectionDiv_' + type)
		.remove();

	const nodeGs: any = d3.select('#divViewOnly_' + type)
		.selectAll('.selectionDiv_' + type)
		.data(function(){
			if(type == "nodeColor") {
				return trimmedColorsNoNulls;
            }
            if(type == "nodeShape") {
                return trimmedShapesNoNulls;
            }
			return []
        })
		.enter()
		.append('div')
		.attr('class', 'selectionDiv_' + type)
		.attr('height', LINE_HEIGHT)
		.append('svg')
		.attr('class', 'svg_' + type)
		.attr('height', LINE_HEIGHT)
		.attr('width', width)
		.append('g')
		.attr('transform', 'translate(' + INTENT + ',0)')

	d3.selectAll('.selectionDiv_' + type)
		.style('background-color', function (d: any) {
			if(d) {
				if (dgraph.currentSelection_id == d.id)
					return '#cccccc';
			}
			return '#ffffff';
		})

	if(type == "nodeColor" ) {
		nodeGs.append('rect')
			.attr('x', 0)
			.attr('y', 0)
			.attr('width', RECT_SIZE)
			.attr('height', RECT_SIZE)
			.style('fill', function (d: any) {
				return d[1]
			})
			.on('click', function (ev: MouseEvent, d: any) {
				messenger.setSelectionColor(d, '#' + Math.floor(Math.random() * 16777215).toString(16));
			})
	}

	if(type == "nodeShape" ) {

		nodeGs.append('path')
			.attr("transform", function() { return "translate(7,7)"; })
			.attr('d', (n: string[]) => d3.symbol().size(40).type(getNodeShape(n))())
			.style('fill', 'black')
	}

	nodeGs.append('text')
		.attr('class', 'selectionLabel')
		.text(function (d: any) {
			return d[0];
		})
		.style('font-size', RECT_SIZE)
		.style('font-family', 'Helvetica')
		.attr('x', RECT_SIZE + 10)
		.attr('y', RECT_SIZE * .8)
		.on('click', function (ev: MouseEvent, d: any) {
			messenger.setCurrentSelection(d);
			updateLists();
		})


}

export function createSelection(type: string): void {

	const b: datamanager.Selection = dgraph.createSelection(type) // IS IT OK?? (dgraph)
	const timer: number = window.setTimeout((e: any) => {
		messenger.setCurrentSelection(b);
		updateLists();
	}, 500);
}

export function updateLists(): void {

	updateList('node', 'Node Selections')
	updateList('link', 'Link Selections')
	updateViewOnlyList('nodeColor', 'Node Colors')
    updateViewOnlyList('nodeShape', 'Node Shapes')

    d3.selectAll('.icon_showColor')
		.attr('xlink:href', function (d: any) { if (d.showColor) return 'drop-full.png'; return 'drop-empty.png' })
	d3.selectAll('.icon_eye')
		.attr('xlink:href', function (d: any) { if (d.filter) return 'eye-blind.png'; return 'eye-seeing.png' })

	d3.selectAll('.selectionLabel')
		.text(function (d: any) { return d.name + ' (' + d.elementIds.length + ')' })
}

export function updateList(type: string, name: string): void {
	const selections: datamanager.Selection[] = dgraph.getSelections(type)

	const title: any = d3.select('#title_' + type)
	title.html(name + ' (' + selections.length + ')');


	d3.select('#div_' + type)
		.selectAll('.selectionDiv_' + type)
		.remove();

	const nodeGs: any = d3.select('#div_' + type)
		.selectAll('.selectionDiv_' + type)
		.data(selections.sort(utils.sortByPriority))
		.enter()
		.append('div')
		.attr('class', 'selectionDiv_' + type)
		.attr('height', LINE_HEIGHT)
		.append('svg')
		.attr('class', 'svg_' + type)
		.attr('height', LINE_HEIGHT)
		.attr('width', width)
		.append('g')
		.attr('transform', 'translate(' + INTENT + ',0)')

	d3.selectAll('.selectionDiv_' + type)
		.style('background-color', function (d: any) {
			if (dgraph.currentSelection_id == d.id)
				return '#cccccc';
			return '#ffffff';
		})

	nodeGs.append('rect')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', RECT_SIZE)
		.attr('height', RECT_SIZE)
		.style('fill', function (d: any) { return d.color })
		.on('click', function (ev: MouseEvent, d: any) {
			messenger.setSelectionColor(d, '#' + Math.floor(Math.random() * 16777215).toString(16));
		})

	nodeGs.append('text')
		.attr('class', 'selectionLabel')
		.text(function (d: any) {
			return d.name;
		})
		.style('font-size', RECT_SIZE)
		.style('font-family', 'Helvetica')
		.attr('x', RECT_SIZE + 10)
		.attr('y', RECT_SIZE * .8)
		.on('click', function (ev: MouseEvent, d: any) {
			messenger.setCurrentSelection(d);
			updateLists();
		})

	// add pictures
	let i = 0;
	nodeGs.append('svg:image')
		.attr('class', 'icon_showColor icon')
		.attr('x', 130 + (RECT_SIZE + GAP_ICONS) * i++)
		.on('click', function (ev: MouseEvent, d: datamanager.Selection, i: number) {
			messenger.showSelectionColor(d, !d.showColor);
		})

	nodeGs.append('svg:image')
		.attr('id', 'eye_' + name)
		.attr('class', 'icon_eye icon')
		.attr('xlink:href', 'eye-seeing.png')//eye-visible.png
		.attr('x', 130 + (RECT_SIZE + GAP_ICONS) * i++)
		.attr('onclick','trace.event(\'vis_14\',document.location.pathname,\'' +name + '\' , this.getAttribute(\'href\'))')
		.on('click', function (ev: MouseEvent, d: datamanager.Selection, i: any) {
			messenger.filterSelection(d, !d.filter);
		})

	nodeGs.append('svg:image')
		.filter((d: any) => { return d.name.indexOf('Unselected') == -1 })
		.attr('class', 'icon')
		.attr('xlink:href', 'up.png')
		.attr('x', 130 + (RECT_SIZE + GAP_ICONS) * i++)
		.on('click', function (ev: MouseEvent, d: datamanager.Selection, i: number) {
			if (i > 0)
				messenger.swapPriority(d, <datamanager.Selection>d3.selectAll('.selectionDiv_' + d.acceptedType).data()[i - 1]); // CAST TO SELECTION??
		})

	nodeGs.append('svg:image')
		.filter((d: any) => { return d.name.indexOf('Unselected') == -1 })
		.attr('class', 'icon')
		.attr('xlink:href', 'down.png')
		.attr('x', 130 + (RECT_SIZE + GAP_ICONS) * i++)
		.on('click', function (ev: MouseEvent, d: datamanager.Selection, i: number) {
			if (d3.selectAll('.selectionDiv_' + d.acceptedType).data()[i + 1])
				messenger.swapPriority(d, <datamanager.Selection>d3.selectAll('.selectionDiv_' + d.acceptedType).data()[i + 1]);// CAST TO SELECTION??
		})

	nodeGs.append('svg:image')
		.filter((d: any) => { return d.name.indexOf('Unselected') == -1 })
		.attr('class', 'icon')
		.attr('xlink:href', 'delete.png')
		.attr('x', 130 + (RECT_SIZE + GAP_ICONS) * i++)
		.on('click', function (ev: MouseEvent, d: datamanager.Selection, i: number) {
			messenger.deleteSelection(d);
		})

	nodeGs.selectAll('.icon')
		.attr('height', RECT_SIZE)
		.attr('width', RECT_SIZE)

}

let searchMessage: messenger.SearchResultMessage;
export function searchResultHandler(m: messenger.SearchResultMessage): void {
	searchMessage = m;
	$('#searchResults').empty();
	const row = $('#searchResults').append('<li></li>')
	if (m.idCompound.nodeIds)
		row.append('<p class="searchResult">Nodes: <b>' + m.idCompound.nodeIds.length + '</b> <u onclick="saveSearchResultAsSelection(\'node\')">(Save as selection)</u></p>')
	if (m.idCompound.linkIds)
		row.append('<p class="searchResult">Links: <b>' + m.idCompound.linkIds.length + '</b> <u onclick="saveSearchResultAsSelection(\'link\')">(Save as selection)</u></p>')
}

export function saveSearchResultAsSelection(type: string): void {
	const s: datamanager.Selection = messenger.createSelection(type, searchMessage.searchTerm);
	const selectionIdCompound: dynamicgraph.IDCompound = new dynamicgraph.IDCompound();
	(selectionIdCompound as any)[type + 'Ids'] = (searchMessage.idCompound as any)[type + 'Ids']
	const temp: utils.ElementCompound = utils.makeElementCompound(selectionIdCompound, dgraph);
	window.setTimeout(() => {
		messenger.highlight('reset');
		window.setTimeout(() => {
			messenger.selection('set', utils.makeElementCompound(selectionIdCompound, dgraph), s.id);
		}, 1000);

	}, 1000);
}

// clear search field and highlighted nodes
export function clearSearchSelection(): void {
	messenger.highlight('reset');
	$('#searchResults').empty();
}

export function getNodeShape(n: string[]) {
	var tmp = (n[1] as any).split(',');
	if(tmp) {
		return tmp[tmp.length - 1];
	}
	return 'wye'
}