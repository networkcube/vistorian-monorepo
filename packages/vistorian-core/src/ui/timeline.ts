import * as d3 from "d3";

import * as dynamicgraph from "../data/dynamicgraph";
import * as utils from "../data/utils";

import { WebGL, WebGLElementQuery } from "./glutils";
import { timeFormat } from "d3";

import {
  offsetInMilliseconds,
  addDate,
  startOf,
  formatAsDDMMYYYY,
} from "../data/dates";

export class Timeline {
  TICK_MIN_DIST = 13;
  LABEL_MIN_DIST = 13;

  WIDTH: number;
  HEIGHT: number;
  webgl: WebGL;
  network: dynamicgraph.DynamicGraph;
  x: number;
  y: number;

  position_x: any;
  position_y: any;
  label_opacity: any;

  minTimeId: any;
  maxTimeId: any;

  timeObjects: Date[] = []; // INIT
  highlightPointer: any;
  highlightLabel: any;

  minGran: number; // INIT
  maxGran: number; // INIT

  granules: string[];

  tickmarks: WebGLElementQuery = new WebGLElementQuery(); // INIT
  timeLabels: WebGLElementQuery = new WebGLElementQuery(); // INIT

  tick_minGran_visible: any;
  tick_minGran_visible_prev: any = -1; // INIT

  label_minGran_visible: any;

  dayOfWeek = timeFormat("%w"); // "Sunday-based weekday as a decimal number [0,6]."

  constructor(
    webgl: WebGL,
    network: dynamicgraph.DynamicGraph,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    this.x = x;
    this.y = y;
    this.WIDTH = width;
    this.HEIGHT = height;
    this.webgl = webgl;
    this.network = network;
    this.granules = dynamicgraph.GRANULARITY;
    this.minGran = this.network.getMinGranularity();
    this.maxGran = this.granules.length - 1;
    this.visualize();
  }

  timeGranularities: any;
  visualize(): void {
    /* MOVE TO CONSTRUCTOR */
    const times = this.network.times().toArray();

    // create non-indexed times
    const unix_start = times[0] ? times[0].unixTime() : 0;
    const unix_end = times[times.length - 1]
      ? times[times.length - 1].unixTime()
      : 0;

    const start = startOf(new Date(unix_start), this.granules[this.minGran]);
    const end = startOf(new Date(unix_end), this.granules[this.minGran]);
    const numTimes = Math.ceil(
      Math.abs(
        (end.getTime() - start.getTime()) /
          offsetInMilliseconds[this.granules[this.minGran]]
      )
    ); // WITHOUT 's'
    this.maxGran = Math.min(this.maxGran, this.granules.length - 1);
    const granularity_levels = this.maxGran - this.minGran + 1;
    const granularity_height = this.HEIGHT / granularity_levels;

    // create all timeObjects (UTC)
    let prev = new Date(unix_start);
    const prevprev = new Date(unix_start - 86400000); // subtract one day
    // bb: check why 'subtract' is not working:
    // prevprev.substract(1, this.granules[this.minGran] + 's');
    this.timeObjects.push(prev);
    for (let i = 1; i < numTimes; i++) {
      //prev = new Date(prev); // ???
      prev = addDate(prev, 1, this.granules[this.minGran]);
      this.timeObjects.push(prev);
    }

    this.timeGranularities = [];
    // set granularity for first time step:

    let granularitySet: boolean;
    let y1: any, y2: any;
    let to1: Date, to2: Date;
    for (let i = 0; i < this.timeObjects.length; i++) {
      granularitySet = false;
      if (i == 0) to1 = prevprev;
      else to1 = this.timeObjects[i - 1];
      to2 = this.timeObjects[i];
      for (
        let gran = this.maxGran;
        gran >= this.minGran && !granularitySet;
        gran--
      ) {
        if (gran > 7) {
          y1 = utils.formatAtGranularity(to1, 7);
          y2 = utils.formatAtGranularity(to2, 7);

          // test for millenia
          if (y1[y1.length - 4] != y2[y2.length - 4]) {
            this.timeGranularities.push(10);
            granularitySet = true;
          }
          // test for centuries
          else if (y1[y1.length - 3] != y2[y2.length - 3]) {
            this.timeGranularities.push(9);
            granularitySet = true;
          }
          // test for decades
          else if (y1[y1.length - 2] != y2[y2.length - 2]) {
            this.timeGranularities.push(8);
            granularitySet = true;
          }
        } else if (
          utils.formatAtGranularity(to1, gran) !=
          utils.formatAtGranularity(to2, gran)
        ) {
          this.timeGranularities.push(gran);
          granularitySet = true;
        }
      }
    }

    // create mapping functions
    this.position_x = d3
      .scaleLinear()
      .domain([0, this.timeGranularities.length - 1])
      .range([this.x + 1, this.x + this.WIDTH - 1]);
    this.position_y = d3
      .scaleLinear()
      .domain([this.minGran - 1, this.maxGran])
      .range([-this.HEIGHT, 0]);
    this.label_opacity = d3
      .scaleLinear()
      .domain([this.minGran - 1, this.maxGran])
      .range([0.2, 1]);

    // Draw tickmarks
    this.tickmarks = this.webgl
      .selectAll()
      .data(this.timeGranularities)
      .append("line")
      .attr("x1", (d: any, i: any) => this.position_x(i))
      .attr("x2", (d: any, i: any) => this.position_x(i))
      .attr("y1", (d: any, i: any) => this.position_y(d))
      .attr("y2", (d: any, i: any) => -this.HEIGHT)
      .style("stroke", "#000")
      .style("opacity", 0.1);

    // create highlight pointer
    this.highlightPointer = this.webgl
      .selectAll()
      .data([0])
      .append("line")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", 0)
      .attr("y2", -this.HEIGHT)
      .style("stroke", "#f00")
      .style("opacity", 0);
    this.highlightLabel = this.webgl
      .selectAll()
      .data([0])
      .append("text")
      .attr("x", 0)
      .attr("y", -6)
      .style("fill", "#f00")
      .style("font-size", 10)
      .style("opacity", 0);

    this.updateWithIds(0, this.timeObjects.length - 1);
  }

  update(startUnix: any, endUnix: any): void {
    // search for start:
    let startId: any, endId: any;
    let i = 0;
    for (i; i < this.timeObjects.length; i++) {
      if (this.timeObjects[i].getTime() > startUnix) {
        startId = i - 1;
        break;
      }
    }
    for (i = startId; i < this.timeObjects.length; i++) {
      if (this.timeObjects[i].getTime() > endUnix) {
        endId = i;
        break;
      }
    }
    if (endId == undefined) {
      endId = this.timeObjects.length - 1;
    }
    this.updateWithIds(startId, endId);
  }

  updateWithIds(minTimeId: any, maxTimeId: any): void {
    this.minTimeId = minTimeId;
    this.maxTimeId = maxTimeId;
    // set range function domain
    this.position_x.domain([minTimeId, maxTimeId]);

    const ticksFitting = Math.floor(this.WIDTH / this.TICK_MIN_DIST);
    const minTime = this.timeObjects[this.minTimeId];
    const maxTime = this.timeObjects[this.maxTimeId];
    let requiredTicks: number = Number.MAX_VALUE; // INIT?
    let t1: any, t2: any;
    this.tick_minGran_visible = undefined;
    for (
      let g = this.minGran;
      g < this.maxGran && this.tick_minGran_visible == undefined;
      g++
    ) {
      // calculate how many times of this granularity can fit.

      t1 = startOf(new Date(minTime), this.granules[g]);
      t2 = startOf(new Date(maxTime), this.granules[g]);

      const ticks = (granularityIndex: number) =>
        (t2.getTime() - t1.getTime()) /
        offsetInMilliseconds[this.granules[granularityIndex]];

      if (g <= 7) {
        requiredTicks = ticks(g);
      } else {
        if (g == 8) requiredTicks = ticks(7) / 10;
        if (g == 9) requiredTicks = ticks(7) / 100;
        if (g == 10) requiredTicks = ticks(7) / 1000;
      }

      if (requiredTicks <= ticksFitting) {
        this.tick_minGran_visible = g;
      }
    }

    this.label_minGran_visible = this.tick_minGran_visible;

    this.label_opacity.domain([this.tick_minGran_visible - 1, this.maxGran]);

    if (this.tick_minGran_visible_prev != this.tick_minGran_visible) {
      console.log("re-create time labels");
      // re-create labels
      if (this.timeLabels != undefined) this.timeLabels.removeAll();

      this.timeLabels = this.webgl
        .selectAll()
        .data(this.timeObjects)
        .filter((d: any, i: number) => {
          const visible =
            this.timeGranularities[i] >= this.tick_minGran_visible;
          return visible;
        })
        .append("text")
        .attr(
          "x",
          (d: any, i: number) =>
            this.position_x(this.timeObjects.indexOf(d)) + 8
        )
        .attr("y", (d: any, i: number) => -this.HEIGHT + 17)
        .text((d: any, i: number) =>
          this.formatTime(this.timeObjects.indexOf(d))
        )
        .attr("z", 1)
        .style("fill", "#000")
        .attr("rotation", 90)
        .style("font-size", 10)
        .style("opacity", 0.1);

      console.log("time labels created:", this.timeLabels.length);
    }
    this.tick_minGran_visible_prev = this.tick_minGran_visible;

    this.tickmarks
      .style("opacity", (d: any, i: number) => {
        const visible =
          i == 0 ||
          (i >= this.minTimeId &&
            i <= this.maxTimeId &&
            this.timeGranularities[i] >= this.tick_minGran_visible)
            ? this.label_opacity(this.timeGranularities[i])
            : 0;
        return visible;
      })
      .attr("x1", (d: any, i: number) => this.position_x(i))
      .attr("x2", (d: any, i: number) => this.position_x(i))
      .style(
        "stroke-width",
        (d: any, i: number) => this.label_opacity(this.timeGranularities[i]) * 4
      );

    // update labels
    this.timeLabels
      .style("opacity", (d: any, i: number) => {
        const globalId = this.timeObjects.indexOf(d);
        const visible =
          globalId >= this.minTimeId &&
          globalId <= this.maxTimeId &&
          this.timeGranularities[globalId] >= this.label_minGran_visible;
        return visible ? 1 : 0;
      })
      .attr("x", (d: any, i: number) => {
        const globalId = this.timeObjects.indexOf(d);
        return this.position_x(globalId) + 8;
      });

    // update highlightPointer
    if (this.highlightId != undefined) {
      this.highlightPointer
        .attr("x1", this.position_x(this.highlightId))
        .attr("x2", this.position_x(this.highlightId));

      this.highlightLabel.attr("x", this.position_x(this.highlightId) + 37);
    }
  }

  formatTime(index: number): number | undefined {
    const t = this.timeObjects[index];
    const g = Math.min(
      Math.max(this.tick_minGran_visible, this.timeGranularities[index]),
      7
    );

    return utils.formatTimeAtGranularity(t, g);
  }

  highlightId: any; // INIT ???

  highlight(unixTime?: number): void {
    if (unixTime == undefined) {
      this.highlightPointer.style("opacity", 0);
      this.highlightId = undefined;
    }

    for (let i = 0; i < this.timeObjects.length; i++) {
      if (!unixTime || this.timeObjects[i].getTime() > unixTime) {
        // IS CORRECT !unixTime ??
        this.highlightId = i - 1;
        break;
      }
    }
    if (this.highlightId == undefined) {
      this.highlightId = this.timeObjects.length - 1;
    }

    this.highlightPointer
      .attr("x1", this.position_x(this.highlightId))
      .attr("x2", this.position_x(this.highlightId))
      .style("opacity", 1);

    this.highlightLabel
      .style("opacity", 1)
      .attr("x", this.position_x(this.highlightId) + 37)
      .text(formatAsDDMMYYYY(this.timeObjects[this.highlightId]));
  }
}
