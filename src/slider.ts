/// <reference path="./lib/d3.d.ts"/>

export class Slider {

    /* VISUALIZATION PARAMETERS */
    BAR_WIDTH: number = 5;
    RADIUS_HANDLE: number = 5;

    LEFT: number = this.RADIUS_HANDLE;
    RIGHT: number = this.RADIUS_HANDLE;
    HEIGHT: number = 10;
    TOP: number = 0;

    max: number;
    min: number;
    value: number;
    stepWidth: number;

    svg: any; // BEFORE d3.Selection<d3.BaseType, {}, HTMLElement, any>; // ?????????????
    x: number;
    y: number;
    width: number;
    g: any; // BEFORE d3.Selection<SVGElement, {}, HTMLElement, any>; // ?????????????

    dragEndCallBackFn: any; // BEFORE Function

    constructor(x: number, y: number, width: number, minValue: number, maxValue: number, stepWidth: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.min = minValue;
        this.max = maxValue;
        this.value = this.min;
        this.stepWidth = stepWidth;
    }

    setDragEndCallBack(fn: Function) {
        this.dragEndCallBackFn = fn;
    }


    valueRange: any; // BEFORE d3.ScaleLinear<number, number> ;
    drag: any; // BEFORE d3.DragBehavior<Element, {}, {} | d3.SubjectPosition>;
    bar: any;
    knob: any;
    rect: any;
    appendTo(svg: D3.Selection) {

        this.svg = svg;

        // this.rect = (this.svg as any)['_groups'][0][0].getBoundingClientRect(); // D3 V4
        this.rect = (this.svg as any)[0][0].getBoundingClientRect();


        this.valueRange = d3.scale.linear()
            .domain([0, this.width])
            .range([this.min, this.max])


        this.drag = d3.behavior.drag()
            .origin(Object)
            .on("dragstart", () => { this.dragStart() }) // d3 v4 is only "start"
            .on("drag", () => { this.dragMove() })

        this.svg = svg;

        this.g = svg.append("g")
            .attr("height", this.HEIGHT)
            .attr("width", this.width)
            .attr("transform", "translate(" + this.x + "," + this.y + ")")

        this.g.append("line")
            .attr("x1", this.LEFT)
            .attr("y1", this.TOP)
            .attr("x2", this.width - this.RIGHT - this.LEFT)
            .attr("y2", this.TOP)
            .style("stroke", "#aaa")

        this.knob = this.g.append("circle")
            .attr("id", "#sliderKnob")
            .attr("r", this.RADIUS_HANDLE)
            .attr("cx", this.LEFT)
            .attr("cy", this.TOP)
            .attr("fill", "#777")
            .attr('onchange','trace.event(\'vis_4\',document.location.pathname,this.parentElement.previousElementSibling.innerHTML ,\'cx\' + this.getAttribute(\'cx\'))')
            .attr('onmouseup','trace.event(\'vis_4\',document.location.pathname,this.parentElement.previousElementSibling.innerHTML ,\'cx\' + this.getAttribute(\'cx\'))')
            .call(this.drag);
            
    }

    dragStartXMouse: any;
    dragStartXBar: any;
    dragObj: any;
    currentBarLength: any;
    dragStart() {
        this.dragStartXMouse = Math.max(this.LEFT, Math.min(this.width - this.RIGHT, this.getRelX()))
        var sourceEvent = d3.event.sourceEvent; // (d3.event as d3.BaseEvent)
        this.dragObj = sourceEvent ? sourceEvent.target : undefined;
    }

    dragMove() {
        d3.select(this.dragObj).attr("cx", Math.max(this.LEFT, Math.min(this.width - this.RIGHT, this.getRelX())));
        this.dragEnd()
    }


    dragEnd() {
        this.value = this.valueRange(this.knob.attr("cx"));
        this.dragEndCallBackFn(this.value);
    }


    getRelX(): number {
        var sourceEvent = d3.event.sourceEvent;
        var pageX = sourceEvent ? (sourceEvent).pageX : 0; // <MouseEvent>
        return pageX - this.LEFT - this.x - this.rect.left;
    }



    set(value: number) {
        this.knob.attr("cx", this.valueRange.invert(value));
    }


}
