import * as d3 from "d3";
import * as dynamicgraph from "./dynamicgraph";

import $ from "jquery";

export class Legend {
  data: any[];

  margin = {
    left: 10,
    top: 20,
  };

  height = 0; // INIT ????

  constructor(
    data: dynamicgraph.LegendElement[],
    handlerFunction?: (this: any, event: any, d: any) => void
  ) {
    this.data = data;
  }

  setClickCallBack(
    handlerFunction: (this: any, event: any, d: any) => void
  ): void {
    this.clickCallBack = handlerFunction;
  }

  legendEntries: any;

  clickCallBack: (this: any, event: any, d: any) => void = () => null; // BEFORE Function;

  appendTo(svg: SVGSVGElement): void {
    this.legendEntries = d3
      .select("#legendSvg")
      .selectAll(".legend")
      .data(this.data)
      .enter()
      .append("g")
      .attr("transform", (d: any, i: any) => {
        return (
          "translate(" +
          this.margin.left +
          "," +
          (this.margin.top + i * 20) +
          ")"
        );
      });
    this.height = this.margin.top + this.data.length * 20;

    $(svg).height(this.height);

    this.legendEntries
      .append("circle")
      .attr("r", 5)
      .style("opacity", 0.7)
      .style("fill", function (d: any) {
        if (d.color) return d.color;
        else return "#000";
      })
      .style("stroke", function (d: any) {
        if (d.color) return d.color;
        else return "#000";
      })
      .style("stroke-width", 2)
      .on("click", this.clickCallBack);

    this.legendEntries
      .append("text")
      .text(function (d: any) {
        return d.name;
      })
      .attr("x", 20)
      .attr("y", 5);
  }
}
