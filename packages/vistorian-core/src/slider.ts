import * as d3 from "d3";

export class Slider {

    /* VISUALIZATION PARAMETERS */
    BAR_WIDTH = 5;
    RADIUS_HANDLE = 5;

    LEFT: number = this.RADIUS_HANDLE;
    RIGHT: number = this.RADIUS_HANDLE;
    HEIGHT = 10;
    TOP = 0;

    max: number;
    min: number;
    value: number;
    stepWidth: number;

    svg: any; // BEFORE d3.Selection<d3.BaseType, {}, HTMLElement, any>; // ?????????????
    x: number;
    y: number;
    width: number;
    g: any; // BEFORE d3.Selection<SVGElement, {}, HTMLElement, any>; // ?????????????

    dragEndCallBackFn: (value: number) => void = (value) => null;

    constructor(x: number, y: number, width: number, minValue: number, maxValue: number, stepWidth: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.min = minValue;
        this.max = maxValue;
        this.value = this.min;
        this.stepWidth = stepWidth;
    }

    setDragEndCallBack(fn: (value: number) => void): void {
        this.dragEndCallBackFn = fn;
    }


    valueRange: any; // BEFORE d3.ScaleLinear<number, number> ;
    drag: any; // BEFORE d3.DragBehavior<Element, {}, {} | d3.SubjectPosition>;
    bar: any;
    knob: any;
    rect: any;
    appendTo(svg: d3.Selection<any,any,any,any>) {

        this.svg = svg;

        this.rect = (this.svg as any)['_groups'][0][0].getBoundingClientRect();

        this.valueRange = d3.scaleLinear()
            .domain([0, this.width])
            .range([this.min, this.max])


        this.drag = d3.drag()
            //.origin(Object) //???
            .on("start", (ev) => { this.dragStart(ev.sourceEvent) })
            .on("drag", (ev) => { this.dragMove(ev.sourceEvent) })

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
    dragStart(ev: MouseEvent): void {
        this.dragStartXMouse = Math.max(this.LEFT, Math.min(this.width - this.RIGHT, this.getRelX(ev)))
       // var sourceEvent = d3.event.sourceEvent; // (d3.event as d3.BaseEvent)
        this.dragObj = ev ? ev.target : undefined;
    }

    dragMove(ev: MouseEvent): void {
        d3.select(this.dragObj).attr("cx", Math.max(this.LEFT, Math.min(this.width - this.RIGHT, this.getRelX(ev))));
        this.dragEnd()
    }


    dragEnd(): void {
        this.value = this.valueRange(this.knob.attr("cx"));
        this.dragEndCallBackFn(this.value);
    }


    getRelX(ev: MouseEvent): number {
        const pageX = ev ? (ev).pageX : 0; // <MouseEvent>
        return pageX - this.LEFT - this.x - this.rect.left;
    }



    set(value: number): void {
        this.knob.attr("cx", this.valueRange.invert(value));
    }


}
