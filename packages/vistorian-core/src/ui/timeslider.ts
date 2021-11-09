import * as d3 from "d3";

import * as dynamicgraph from "../dynamicgraph";
import * as messenger from "../messenger";

import { SmartSlider } from "./smartslider";

import { RadioButton } from "./ui";

import * as m from "moment";

export class TimeSlider {
  /** VISUALIZATION  PARAMETERS */

  MARGIN_SLIDER_RIGHT = 30;
  MARGIN_SLIDER_LEFT = 10;
  TICK_GAP = 2;
  TICK_LABEL_GAP = 40;
  SLIDER_TOP = 25;
  HEIGHT = 200;

  /** GLOBAL VARIABLES */

  dgraph: dynamicgraph.DynamicGraph;
  slider: SmartSlider;
  times: dynamicgraph.Time[];
  sliderWidth: number;
  widgetWidth: number;
  callBack: ((min: any, max: any, single: any) => void) | undefined = undefined;

  // function that is called when this time slider's time is changed
  propagateButton: RadioButton = new RadioButton("#000000");

  labelStart: any; // BEFORE d3.Selection<d3.BaseType, {}, HTMLElement, any>;
  labelEnd: any; // BEFORE d3.Selection<d3.BaseType, {}, HTMLElement, any>;

  tickScale: any;
  tickHeightFunction: (x: number) => number;

  constructor(
    dgraph: dynamicgraph.DynamicGraph,
    width: number,
    callBack?: (min: any, max: any, single: any) => void
  ) {
    this.dgraph = dgraph;
    this.times = dgraph.times().toArray();
    this.widgetWidth = width;

    const timesDummy = new dynamicgraph.Time(0, this.dgraph);
    this.sliderWidth =
      width - this.MARGIN_SLIDER_RIGHT + 5 - this.MARGIN_SLIDER_LEFT - 5;
    let lastDummyYear: m.Moment =
      this.times.length != 0
        ? this.times[this.times.length - 1].moment()
        : timesDummy.moment(); // WHAT HAPPEND??
    const minGran: number = dgraph.gran_min;
    let minGranName: m.unitOfTime.DurationConstructor = "milliseconds";
    switch (minGran) {
      case 0:
        minGranName = "milliseconds";
        break;
      case 1:
        minGranName = "seconds";
        break;
      case 2:
        minGranName = "minutes";
        break;
      case 3:
        minGranName = "hours";
        break;
      case 4:
        minGranName = "days";
        break;
      case 5:
        minGranName = "weeks";
        break;
      case 6:
        minGranName = "months";
        break;
      case 7:
        minGranName = "years";
        break;
      // case 8: minGranName = 'decades'; break;
      // case 9: minGranName = 'centuries'; break;
      // case 10: minGranName = 'millenia'; break;
    }

    if (!lastDummyYear) {
      lastDummyYear = m.unix(0);
    }

    lastDummyYear.add(1, minGranName);

    const unixTimeSlider =
      this.times.length != 0 ? this.times[0].unixTime() : 0; // IS IT OK??
    this.slider = new SmartSlider(
      this.MARGIN_SLIDER_LEFT,
      this.SLIDER_TOP,
      this.sliderWidth,
      unixTimeSlider,
      lastDummyYear.valueOf(),
      1
    );

    if (callBack) this.callBack = callBack;

    this.tickScale = d3
      .scaleUtc()
      .range([
        this.MARGIN_SLIDER_LEFT,
        this.MARGIN_SLIDER_LEFT + this.sliderWidth,
      ])
      .domain([unixTimeSlider, lastDummyYear.valueOf()]);

    this.tickHeightFunction = d3
      .scaleLinear()
      .range([4, this.SLIDER_TOP - 10])
      .domain([dgraph.gran_min, dgraph.gran_max]);
  }

  appendTo(
    svg: d3.Selection<any, any, any, any>,
    x?: number,
    y?: number
  ): void {
    if (!x) x = 0;
    if (!y) y = 0;

    const g: any = svg
      .append("g")
      .attr("transform", "translate(" + x + "," + y + ")");

    g.append("g")
      .attr("transform", "translate(0," + this.SLIDER_TOP + ")")
      .attr("class", "x axis")
      .call(d3.axisTop(this.tickScale));

    this.labelStart = g
      .append("text")
      .attr("y", this.SLIDER_TOP + 20)
      .style("opacity", 0)
      .style("font-family", "Helvetica")
      .style("font-weigth", "100")
      .style("font-size", "8pt")
      .style("text-anchor", "end")
      .text("")
      .style("user-select", "none")
      .style("-webkit-user-select", "none")
      .style("-khtml-user-select", "none")
      .style("-moz-user-select", "none")
      .style("-o-user-select", "none")
      .style("user-select", "none");

    this.labelEnd = g
      .append("text")
      .style("opacity", 0)
      .attr("y", this.SLIDER_TOP + 20)
      .style("font-family", "Helvetica")
      .style("font-weigth", "100")
      .style("font-size", "8pt")
      .style("text-anchor", "start")
      .text("")
      .style("user-select", "none")
      .style("-webkit-user-select", "none")
      .style("-khtml-user-select", "none")
      .style("-moz-user-select", "none")
      .style("-o-user-select", "none")
      .style("user-select", "none");

    this.slider.appendTo(g);
    this.slider.setDragEndCallBack((min: any, max: any, single: any) =>
      this.updateTime(min, max, single)
    );

    this.propagateButton = new RadioButton("#000000", "Syncronize Time");
    this.propagateButton.appendTo(
      this.sliderWidth + 15,
      this.SLIDER_TOP + 8,
      g
    );
  }

  drawTickmarks(
    granularity: number,
    tickTimes: dynamicgraph.Time[],
    svg: d3.Selection<any, any, any, any>
  ): void {
    let time: dynamicgraph.Time;
    let displayLabelSpacing = 1; // display every label
    while (
      Math.floor(this.sliderWidth / this.TICK_LABEL_GAP) <
        tickTimes.length / displayLabelSpacing &&
      displayLabelSpacing < 100
    ) {
      displayLabelSpacing++;
    }

    for (let i = 0; i < tickTimes.length; i++) {
      if (i % displayLabelSpacing == 0) {
        svg
          .append("text")
          .attr("x", this.tickScale(tickTimes[i].unixTime()))
          .attr("y", this.SLIDER_TOP - this.tickHeightFunction(granularity))
          .text(this.formatAtGranularity(tickTimes[i].time(), granularity))
          .attr("id", "timelabel_" + granularity + "_" + i)
          .attr("class", "timelabel")
          .style("opacity", 0.5)
          .style("font-family", "Helvetica")
          .style("font-weigth", "100")
          .style("font-size", "7pt");

        svg
          .append("line")
          .attr("x1", this.tickScale(tickTimes[i].unixTime()))
          .attr("x2", this.tickScale(tickTimes[i].unixTime()))
          .attr("y1", this.SLIDER_TOP)
          .attr("y2", this.SLIDER_TOP - this.tickHeightFunction(granularity))
          .style("stroke", "#bbb");
      }
    }
  }

  formatAtGranularity(time: m.Moment, granualarity: number): number {
    switch (granualarity) {
      case 0:
        return time.millisecond();
      case 1:
        return time.second();
      case 2:
        return time.minute();
      case 3:
        return time.hour();
      case 4:
        return time.day();
      case 5:
        return time.week();
      case 6:
        return time.month() + 1;
      default:
        return time.year();
    }
  }

  formatForGranularities(
    time: dynamicgraph.Time,
    gran_min: number,
    gran_max: number
  ): string {
    let formatString = "";
    let format: string;
    while (gran_max >= gran_min) {
      formatString += this.getGranularityFormattingString(
        gran_max,
        gran_max > gran_min
      );
      gran_max--;
    }
    return time.format(formatString.trim());
  }

  getGranularityFormattingString(
    granualarity: any,
    separator: boolean
  ): string {
    switch (granualarity) {
      case 0:
        return "SSS";
      case 1:
        return "ss" + (separator ? "." : "");
      case 2:
        return "mm" + (separator ? ":" : "");
      case 3:
        return "hh" + (separator ? "" : "");
      case 4:
        return "DD" + (separator ? " " : "");
      case 6:
        return "MM" + (separator ? "-" : "");
      default:
        return "YYYY" + (separator ? "-" : "");
    }
  }

  updateTime(minUnix: number, maxUnix: number, single: number): void {
    // times are still correct here?

    const format = function (d: any) {
      return d.toDateString();
    };

    single = Math.round(single);

    this.labelStart
      .attr("x", this.slider.valueRange.invert(minUnix) + 10)
      .style("opacity", 1)
      .text(format(new Date(minUnix)));

    this.labelEnd
      .attr("x", this.slider.valueRange.invert(maxUnix) + 10)
      .style("opacity", 1)
      .text(format(new Date(maxUnix)));

    if (this.callBack != undefined)
      this.callBack(minUnix, maxUnix, this.propagateButton.isChecked());
    else
      messenger.timeRange(
        minUnix,
        maxUnix,
        this.times[single],
        this.propagateButton.isChecked()
      );
  }

  set(startUnix: number, endUnix: number) {
    this.slider.set(startUnix, endUnix);
  }
}
