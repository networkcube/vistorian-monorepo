import * as d3 from "d3";

import { Slider } from './slider'

export function makeSlider(
    d3parent: any, // BEFORE d3.Selection<d3.BaseType, {}, HTMLElement, any>, 
    label: string,
    width: number,
    height: number,
    value: number,
    min: number,
    max: number,
    handler: (value: number) => void): void
{

        const slider: Slider = new Slider(5, height - 5, width, min, max, .01);
        const svg = d3parent.append('svg')
            .attr('width', width + 20)
            .attr('height', height);

        svg.append('text')
            .attr('x', 10)
            .attr('y', height - 15)
            .text(label)
            .attr('class', 'sliderLabel');

        slider.appendTo(svg);
        slider.set(value);
        slider.setDragEndCallBack(handler);
}

export class RadioButton {

    private checked = false;

    circle: any; // BEFORE d3.Selection<d3.BaseType, {}, HTMLElement, any>; 
    label: any; // BEFORE d3.Selection<d3.BaseType, {}, HTMLElement, any>; 

    color: string;
    text = '';

    RADIUS = 7;

    clickHandler: () => void = () => null; // BEFORE Function;

    constructor(color: string, text?: string) {
        this.color = color;
        if (text)
            this.text = text;
    }



    appendTo(x: number, y: number, svg: d3.Selection<any,any,any,any>) {
        const g = svg.append('g')
            .attr('transform', 'translate(' + x + ',' + y + ')');

        this.circle = g.append('circle')
            .attr('r', this.RADIUS)
            .attr('fill', '#ffffff')
            .attr('stroke', this.color)
            .attr('stroke-width', 1)
            .attr('cx', this.RADIUS * 2)
            .attr('cy', 0)
            .attr('oninput','trace.event(\'vis_4\',document.location.pathname,this.parentElement.previousElementSibling.innerHTML ,\'cx\' + this.getAttribute(\'cx\'))')
            .attr('onmouseup','trace.event(\'vis_4\',document.location.pathname,this.parentElement.previousElementSibling.innerHTML ,\'cx\' + this.getAttribute(\'cx\'))');



        if (this.text) {
            this.label = g.append('text')
                .attr('x', this.RADIUS * 1.4)
                .attr('y', 5)
                .style('font-family', 'Helvetica')
                .style('font-size', '9pt')
                .style('user-select', 'none')
                .text(this.text[0])
                .on('click', () => {
                    this.checked = !this.checked;
                    if (this.checked) {
                        this.circle.attr('fill', this.color);
                        this.label.attr('fill', '#ffffff');
                    } else {
                        this.circle.attr('fill', '#ffffff');
                        this.label.attr('fill', this.color);
                    }
                    if (this.clickHandler) {
                        this.clickHandler();
                    }
                });
        }
    }

    isChecked(): boolean {
        return this.checked;
    }

    addClickHandler(f: () => void) {
        this.clickHandler = f;
    }
}


export function makeCheckBox(d3parent: any, label: string, callback: (this: any, event: any, d: any) => void) {
    d3parent.append('input')
        .attr('type', 'checkbox')
        .on('change', callback);
    d3parent.append('b').attr('class', 'sliderLabel').html(label);
}

export function makeButton(d3parent: any, label: string, callback: (this: any, event: any, d: any) => void) {
    d3parent.append('input')
        .attr('type', 'button')
        .attr('value', label)
        .on('click', callback);
}

