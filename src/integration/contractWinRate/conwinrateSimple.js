import * as d3 from 'd3'
import * as $ from 'jquery'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'

looker.plugins.visualizations.add({
    id: "contract-win-rate",
    label: "ZDev Contract Win Rate",
    options: {
        show_legend: {
            type: "boolean",
            label: "Show Legend",
            default: "true",
            section: "General",
            order: 1
        },  
    },

    // Set up the initial state of the visualization
    create: function(element, config) {
        // Insert a <style> tag with some styles we'll use later
        element.innerHTML = `
            <style>
                @font-face {
                    font-family: Roboto;
                    font-weight: 300;
                    font-style: normal;
                    src: url('https://static-a.lookercdn.com/fonts/vendor/roboto/Roboto-Light-d6f2f0b9bd.woff') format('woff'),url('/fonts/vendor/roboto/Roboto-Light-d6f2f0b9bd.woff') format('woff');
                }
                
                @font-face { font-family: Roboto; font-weight: 400; font-style: normal;
                    src: url('https://static-b.lookercdn.com/fonts/vendor/roboto/Roboto-Regular-5997dd0407.woff') format('woff'),url('/fonts/vendor/roboto/Roboto-Regular-5997dd0407.woff') format('woff');
                }

                    @font-face { font-family: Roboto; font-weight: 500; font-style: normal;
                    src: url('https://static-b.lookercdn.com/fonts/vendor/roboto/Roboto-Medium-e153a64ccc.woff') format('woff'),url('/fonts/vendor/roboto/Roboto-Medium-e153a64ccc.woff') format('woff');
                }

                @font-face { font-family: Roboto; font-weight: 700; font-style: normal;
                    src: url('https://static-b.lookercdn.com/fonts/vendor/roboto/Roboto-Bold-d919b27e93.woff') format('woff'),url('/fonts/vendor/roboto/Roboto-Bold-d919b27e93.woff') format('woff');
                }

                body {
                    font-family: Arial;
                    font-size: 12px;
                }

            .axis-label {
                fill: #3a4245;
                font-size: 12px;
                font-family: 'Open Sans', 'Helvetica', 'sans-serif';
                text-anchor: middle;
            }

            .y-axis, .x-axis {
                font-family: 'Open Sans', 'Helvetica', 'sans-serif';
            }

            .zero-line {
                stroke: #ccd6eb;
                stroke-width: 1.0;
            }

            .x-axis .domain {
                stroke: #ccd6eb;
                stroke-width: 1;
            }

            .y-axis .domain {
                stroke: none;
            }

            .x-axis text, .y-axis text {
                font-size: 12px;
                color: #3a4245;
                visibility: visible;
            }

            .x-axis text .hide, .y-axis text .hide {
                visibility: hidden;
            }

            .x-axis line, .y-axis line {
                stroke: #e6e6e6;
                stroke-width: 1;
                opacity: 1;
            }

            .x-axis line .hide, .y-axis line .hide {
                opacity: 0;
            }

            .tooltip {
                box-shadow: rgb(60 64 67 / 30%) 0px 1px 2px 0px, rgb(60 64 67 / 15%) 0px 2px 6px 2px;
                font-size: 12px;
                pointer-events: none;
            }

            .tooltip #tt-header {
                font-size: 12px;
                font-weight: 600;
                color: #9d9d9d;
                text-transform: uppercase;
            }

            .tooltip h1 {
                font-size: 11px;
                color: #9d9d9d;
                text-transform: uppercase;
            }

            hr { 
                margin-top: 1px; 
                margin-bottom: 1px 
            }

            .tooltip1 .tooltip2 {
                font-size: 11px;
            }

            #tt-body {
                margin-top: 5px;
            }

            .dropdown-title {
                display: inline-block;
            }

            #vis-options {
                display: inline-block;
            }
        </style>
        <svg></svg>
        <div id="tooltip-div"></div>`;
        element.style.fontFamily = `"Open Sans", "Helvetica", sans-serif`
    },

    // Render in response to the data or settings changing
    updateAsync: function(data, element, config, queryResponse, details, done, environment = "prod") {
            if (environment == "prod") {
                if (!handleErrors(this, queryResponse, {
                    min_pivots: 1, max_pivots: 1,
                    min_dimensions: 0, max_dimensions: 22,
                    min_measures: 1, max_measures: 22
                })) return 
            }
    try {
        let margin = {
            top: 60,
            right: 30,
            bottom: 70,
            left: 60
        }

        const width = element.clientWidth;
        const height = element.clientHeight;

        const boundedWidth = width - margin.left - margin.right;
        const boundedHeight = height - margin.top - margin.bottom;

        console.log("heights", height, boundedHeight)

        // LOAD DATA -----------------------------------------------------------
        const dimensions = queryResponse.fields.dimension_like
        const measures = queryResponse.fields.measure_like
        const pivots = queryResponse.fields.pivots
        console.log("queryResponse", queryResponse)
        console.log("dimension", dimensions)
        console.log("measure", measures)
        console.log("pivots", pivots)
        console.log('data', data)

        let data_ready = []

        data.forEach((d) => {
            let entry = {}
            entry["lane"] = d[dimensions[0].name].value
            entry["model"] = d[dimensions[1].name].value
            entry["winrate"] = d[measures[0].name]
            data_ready.push(entry)
        })

        console.log("data_ready", data_ready)

        const laneAccessor = d => d.lane;
        const modelAccessor = d => d.model;
        const winrateAccessor = d => d.winrate;

        const lanes = [...new Set(data_ready.map(laneAccessor))].sort()
        // pick the first lane in the data
        const lan = lanes[0]

        let data_lane = data_ready.filter(d => {
            return (+d.lane === +lan)
        })

        data_lane.forEach((d, i) => {
            d.winrates = []
            Object.keys(d.winrate).forEach((dd, ii) => {
                const newObj = {
                    ratio: +dd,
                    value: d.winrate[dd].value
                }
                d.winrates.push(newObj)
            })
            delete d.winrate;
        })

        console.log("data_lane", data_lane)

        const svg = (
            d3.select(element).select("svg")
                .html("")
                .attr("width", "100%")
                .attr("height", height - 20 + "px")
        )

        console.log("svg", svg)

        
        // DRAWING PLOT -----------------------------------------------------------
        console.log("LANE CHOSEN", lan)

        svg.html("")

        const group = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
            .attr("width", "100%")
            .attr("height", (boundedHeight + 'px'))
            .classed("group", true)
        
        // Get ranges of values -----------------------------------------------------------

        // let ratio_keys = Object.keys(data_lane[0].winrate)
        let ratio_keys = data_lane[0]["winrates"].map(d => +d.ratio)
        
        const ratio_min = Math.min(...ratio_keys)
        const ratio_max = Math.max(...ratio_keys)

        console.log("ratio keys", ratio_keys)
        console.log("ratio min/max", ratio_min, ratio_max)

        let rates = []
        data_lane.forEach((d, i) => {
            d.winrates.forEach((dd, ii) => {
                rates.push(+dd.value)
            })
        })

        const rate_min = Math.min(...rates)
        const rate_max = Math.max(...rates)

        console.log("rate min/max", rate_min, rate_max)

        // AXES -----------------------------------------------------------
        const xScale = d3.scaleLinear()
            .domain([ratio_min, ratio_max])
            .range([0, boundedWidth])

        const xAxisGenerator = d3.axisBottom()
            .scale(xScale)
            .tickPadding(10)
            .tickSize(0)
            .tickFormat(d3.format(",.0%"))

        const xAxis = group.append("g")
            .call(xAxisGenerator)
                .style("transform", `translateY(${boundedHeight}px)`)
                .attr("class", "x-axis")

        const xAxisLabel = xAxis.append("text")
            .attr("class", "axis-label")
            .attr("x", boundedWidth / 2)
            .attr("y", 42)
            .attr("text-anchor", "middle")
            .text("Price DAT Ratio")

        const yScale = d3.scaleLinear()
            // .domain([rate_min, rate_max])
            .domain([0, 1.05])
            .range([boundedHeight, 0])

        const yAxisGenerator = d3.axisLeft()
            .scale(yScale)
            .tickPadding(10)
            // .tickSize(0)
            .tickFormat(d3.format(",.0%"))
            .tickSize(-boundedWidth)

        const yAxis = group.append("g")
            .call(yAxisGenerator)
                .attr("class", "y-axis")

        const yAxisLabel = yAxis.append("text")
            .attr("class", "axis-label")
            .attr("x", (-boundedHeight / 2))
            .attr("y", -margin.left + 12)
            .style("transform", "rotate(-90deg)")
            .text("Avg. Win Rate Estimate")

        const laneTitle = group.append("text")
            .attr("x", 0)
            .attr("y", -30)
            .attr("text-anchor", "left")
            .text(`Lane ID: ${lan}`)
            .style("fill", "#3a4245")
            .style("font-size", "14px")
            .style("font-family", "Roboto")

        // DRAW DATA -----------------------------------------------------------
        const line = d3.line()
            .defined(function(d) { return d.ratio != null && d["value"] != null })
            .curve(d3.curveNatural)
            .x(function(d) { return xScale(d["ratio"])})
            .y(function(d) { return yScale(d["value"])})

        const color_list = ["#27566b", "#339f7b", "#ee9a5a", "#f1cc56", "#339f7b"]

        let color_map = {}
        
        data_lane.forEach((d, i) => {
            color_map[d.model] = color_list[i]

            group.append("path")
                .data([d.winrates])
                .attr("class", d.model)
                .attr("d", line)
                .attr("fill", "none")
                .attr("stroke", color_list[i])
                .attr("stroke-width", "2.5px")
        })

        console.log("color_map", color_map)

        // LEGEND -------------------------------------------------------------
        const legend = group.selectAll(".legend")
            .data(data_lane)
            .enter()
            .append("g")
                .attr("class", "legend")
                .attr("transform", function(d, i) { return `translate(${boundedWidth * .75},${-30 + (i * 15)})`})

        legend.append("rect")
            .attr("x", 2)
            .attr("y", 2)
            .attr("width", 8)
            .attr("height", 5)
            .style("fill", (d, i) => {
                return color_list[i]
            })

        legend.append("text")
            .attr("x", 15)
            .attr("y", 4)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .style("font-size", 11)
            .text((d) => {
                console.log("d text", d)
                return d.model
            })

        // TOOLTIPS -----------------------------------------------------------
        d3.selectAll("circle").remove();

        // const tooltip = d3.select(element)

        const tooltip = d3.select("#tooltip-div")
            .style("position", "absolute")
            .style("padding", "5px")
            .style("background-color", "white")
            .style("opacity", 0)
            .style("border-radius", "4px")
            .style("display", "block")
            .style("border", "solid")
            .style("border-color", "lightgrey")
            .style("border-width", ".5px")
            .attr("pointer-events", "none")
            .classed("tooltip", true)

        const tt_group = group.append("g")
            .classed("tooltip", true)

        const tt_box = group.append("rect")
            .attr("class", "tooltip-area-rect")
            .attr("width", boundedWidth)
            .attr("height", boundedHeight)
            .attr("opacity", 0)
            .on("mousemove", mousemove)
            .on("mouseout", mouseout)

        const tt_line = tt_group.append("line")
            .attr("stroke", "#a6a6a6")
            .attr("y1", 0)
            .attr("y2", boundedHeight)
            .attr("stroke-dasharray", "5,3")
            .attr("stroke-width", 2)
            .style("opacity", 0)

        const tt_circles = tt_group.append("g")
            .classed("tt_circles", true)
        
        tooltip.html('<div id="tt-header"></div><p id="tt-body"></p>')

        const tooltipHeader = tooltip.select("#tt-header")
        const tooltipBody = tooltip.select("#tt-body")

        function mousemove() {
            let tt_x = xScale.invert(d3.mouse(tt_box.node())[0])
            tt_x = tt_x.toFixed(2)

            console.log("tt_x", tt_x)

            const tt_data = []
            data_lane.forEach((d) => {
                const this_rate = d.winrates.filter((dd) => {
                    return +dd.ratio == +tt_x
                })

                if (this_rate.length > 0) {
                    tt_data.push({"name": d.model, "info": this_rate})
                }
            })

            tt_data.sort((a, b) => b.info[0].value - a.info[0].value)

            console.log("tt_data sorted", tt_data)

            tooltipHeader.html(`Ratio to DAT: ${d3.format(",.0%")(tt_x)}<hr>`)
                .style("color", "#323232")

            tooltipBody.html("")
            tooltipBody
                .selectAll()
                .data(tt_data)
                .enter()
                .append("div")
                .html((d,i) => {
                    return (`<span style="float:left;color:${color_map[d.name]}"><b>` + d.name + ':&nbsp' + '</b></span>' + '<span style="float:right;">' + d3.format(",.0%")(d.info[0].value) + '</span>')
                })

            tooltip
                .transition()
                .duration(0)
                .style("opacity", 0.95)
                .style("left", d3.event.pageX < boundedWidth * 0.6 ? d3.event.pageX + 15 + "px" : d3.event.pageX - 200 + "px")
                .style("top", d3.event.pageY < boundedHeight * 0.5 ? d3.event.pageY + 10 + "px" : d3.event.pageY - 100 + "px")

            tt_line
                .attr("x1", xScale(tt_x))
                .attr("x2", xScale(tt_x))
                .style("opacity", 1)

            tt_circles.selectAll("circle").remove();
            tt_circles.selectAll("circle")
                .data(tt_data)
                .enter()
                .append("circle")
                .attr("r", 4)
                .attr("cx", d => {
                    return xScale(d.info[0].ratio)
                })
                .attr("cy", d => yScale(d.info[0].value))
                .style("fill", "#323232")
                .style("opacity", 1)
        }

        function mouseout() {
            console.log("MOUSEOUT")

            tooltip
                .transition()
                .duration(0)
                .style("opacity", 0)

            tt_line
                .style("opacity", 0)

            tt_circles.selectAll("circle").remove();
            console.log("removed circles")
        }


    } catch(error) {
        if (environment == "prod") {
            if (queryResponse.fields.dimensions.length != queryResponse.fields.measures.length) {
                                this.addError({title: "Data mismatch", message: "This chart requires dimension/measure pairs."});
                                return;
                            } 
        }  else {
        console.log(error)
    }


    // Callback at the end of the rendering to let Looker know it's finished
    done()
    }
    }
})