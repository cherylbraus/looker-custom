import * as d3 from 'd3'
import * as $ from 'jquery'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'

export const object = {
    id: "contract-win-rate",
    label: "ZDev Contract Win Rate",
    options: {
        xinner_ticksize: {
            type: "string",
            label: "X Tick Font Size (Inner)",
            display: "text",
            default: "9",
            section: "Axes",
            order: 1
        },  
        y_label: {
            type: "string",
            label: "Y Axis Label",
            display: "text",
            default: "",
            section: "Axes",
            order: 2
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
                tr:first-child {
                font-weight:500
                }
                body {
                    font-family: 'Roboto';
                }
                text {
                font-family: 'Roboto';
                }
                /* .domain {
                display: none;
                } */
                .gridline {
                stroke: rgb(230, 230, 230);
                shape-rendering: crispEdges;
                stroke-opacity: .1;
                }
                .gridline2 {
                stroke: white;
                shape-rendering: crispEdges;
                stroke-opacity: 1;
                }
                #viz-container {
                z-index: 9;
                position: relative;
                background-color: none;
                border: 1px solid #d3d3d3;
                text-align: center;
                width: 600px;
                height: 360px;
                }
                #dimension-header {
                font-size: 12px;
                }
                .value-headers {
                font-size: 12px;
                }
                .value-headers-body {
                font-weight: 500;
                }
                #vis {
                font-family: 'Open Sans', 'Helvetica', 'sans-serif';
                cursor: move;
                z-index: 10;
                background-color: none;
                color: #fff;
                height: 100%;
                width: 100%;
                fill: black;
                color: black;
                }
                .line {
                fill: none;
                stroke-width: 2px;
                }

                /* ---Cheryl's Stuff: Start--- */

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

                .inner-x-axis text {
                font-size: 9px;
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

                /* ---Cheryl's Stuff: End--- */

                .axis text {
                /* fill: green;  */
                font-size: 12px;
                }
            </style>
            <svg></svg>
            <div class="tooltip"></div>`;
        element.style.fontFamily = `"Open Sans", "Helvetica", sans-serif`
    },

    // Render in response to the data or settings changing
    updateAsync: function(data, element, config, queryResponse, details, done, environment = "prod") {
            if (environment == "prod") {
                if (!handleErrors(this, queryResponse, {
                    min_pivots: 0, max_pivots: 0,
                    min_dimensions: 0, max_dimensions: 22,
                    min_measures: 0, max_measures: 22
                })) return 
            }
    try {

        const dimensions = queryResponse.fields.dimension_like
        const measures = queryResponse.fields.measure_like

        console.log("queryResponse", queryResponse)
        console.log("dimension", dimensions)
        console.log("measure", measures)
        // console.log('data', data)

        let margin = {
            top: 20,
            right: 20,
            bottom: 50,
            left: 80
        }

        const width = element.clientWidth;
        const height = element.clientHeight;

        const boundedWidth = width - margin.left - margin.right;
        const boundedHeight = height - margin.top - margin.bottom;

        const svg = (
            d3.select(element).select("svg")
                .html('')
                .attr('width', '100%')
                .attr('height', '100%')
        )

        const group = svg.append('g')
            .attr("transform", `translate(${margin.left},${margin.top})`)
            .attr("width", "100%")
            .attr("height", boundedHeight + "px")
            .classed("group", true)

        // format data -----------------------------------------
        let data_ready = []

        data.forEach((d) => {
            let entry = {}
            entry['label'] = d[dimensions[0].name].value
            entry['right'] = +d[measures[1].name].value
            entry['leftraw'] = +d[measures[2].name].value
            entry['left'] = (-1) * +d[measures[2].name].value
            data_ready.push(entry)
        })

        console.log("data_ready", data_ready)

        const labelAccessor = d => d.label
        const rightAccessor = d => d.right
        const leftAccessor = d => d.left

        // sort data 
       data_ready.sort((a, b) => +(b.left) - +(a.left)); 

        // AXES ----------------------------------------------------
        const yScale = d3.scaleBand()
            .domain(data_ready.map(d => labelAccessor(d)))
            .range([boundedHeight, 0])
            .padding(0.2)

        const yAxisGenerator = d3.axisLeft()
            .scale(yScale)
            .tickPadding(10)
            .tickSize(0)
            // .tickFormat((d) => `${d}`)

        const yAxis = group.append("g")
            .call(yAxisGenerator)
                .attr("class", "y-axis")

        const xScaleDomain = [
            d3.min(data_ready.map(d => leftAccessor(d))), 
            d3.max(data_ready.map(d => rightAccessor(d)))
        ]

        const xScale = d3.scaleLinear()
            .domain(xScaleDomain)
            .range([0, boundedWidth])

        const xAxisGenerator = d3.axisBottom()
            .scale(xScale)
            .tickPadding(10)
            .tickSizeOuter(0)
            .tickSizeInner(5)
            .tickFormat(d => d3.format(",.2s")(d))

        const xAxis = group.append("g")
            .call(xAxisGenerator)
                .style("transform", `translateY(${boundedHeight}px)`)
                .attr("class", "x-axis")

        console.log("x axis", xScale.domain(), xScale.range())

        // DRAW DATA ---------------------------------------------------
        const barsLeft = group.append("g")
            .classed("lefts", true)
            .selectAll("rect")
            .data(data_ready)
            .enter()
            .append("rect")
                .attr("x", d => xScale(leftAccessor(d)))
                .attr("y", d => yScale(labelAccessor(d)))
                .attr("width", d => xScale(Math.abs(leftAccessor(d))) - xScale(0))
                .attr("height", yScale.bandwidth())
                .classed("left-bar", true)
                .style("fill", "orange")
                .style("fill-opacity", 0.7)

        const barsRight = group.append("g")
            .classed("rights", true)
            .selectAll("rect")
            .data(data_ready)
            .enter()
            .append("rect")
                .attr("x", xScale(0))
                .attr("y", d => yScale(labelAccessor(d)))
                .attr("width", d => xScale(Math.abs(rightAccessor(d))) - xScale(0))
                .attr("height", yScale.bandwidth())
                .classed("right-bar", true)
                .style("fill", "blue")
                .style("fill-opacity", "0.7")

        // LEGEND ---------------------------------------------------
        const legend = group.append("g")
            .attr("transform", "translate(0,-15)")
            .classed("legend", true)

        // TOOLTIPS ---------------------------------------------------
        const tooltip = d3.select(".tooltip")
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

        // const tt_line = tt_group.append("line")
        //     .attr("stroke", "#a6a6a6")
        //     .attr("y1", 0)
        //     .attr("y2", boundedHeight)
        //     .attr("stroke-dasharray", "5,3")
        //     .attr("stroke-width", 2)
        //     .style("opacity", 0)

        // tooltip.html(`<div id="tt-header"></div><p id="tt-body"></p>`)

        // const tooltipHeader = tooltip.select("#tt-header")
        // const tooltipBody = tooltip.select("#tt-body")

        // function mousemove(d) {
        //     tooltip 
        //         .transition()
        //         .duration(0)
        //         .style("opacity", 0.95)

        //     const eachBand = xScale.step()
        //     const xIndex = Math.floor((d3.mouse(this)[0] / eachBand))
        //     const tt_x1 = xScale.domain()[xIndex]

        //     xInnerScale.range(xInnerScaleRanges[xIndex])
        //     let tt_x2 = Math.round(xInnerScale.invert(d3.mouse(this)[0]))

        //     // console.log("tt_xs", `${tt_x1} - ${tt_x2}`)

        //     const tt_data = data_array.filter(d => {
        //         return (d.monthname == tt_x1 && +d.year == +tt_x2)
        //     })
        //     // console.log("tt_data", tt_data)

        //     let measureVal;
        //     let rankVal;
        //     if (parseInt(tt_data[0].measure)) {
        //         measureVal = d3.format(config.metric_format)(tt_data[0].measure)
        //         rankVal = `#${tt_data[0].rank} month in year`
        //     } else {
        //         measureVal = "N/A"
        //         rankVal = "N/A"
        //     }

        //     tooltipHeader.html(`${tt_x1}<hr>`)
        //     tooltipBody.html(
        //         `<span style="float:left;">${tt_x2}:&nbsp&nbsp</span>` + 
        //         `<span style="float:right;">${measureVal}</span><br>` + 
        //         `<span style="float:left;">Rank:&nbsp&nbsp</span>` + 
        //         `<span style="float:right;">${rankVal}</span>` 
        //     )

        //     if (d3.event.pageY < boundedHeight * 0.7) {
        //         tooltip.style("top", d3.event.pageY + 10 + "px")
        //     } else {
        //         tooltip.style("top", d3.event.pageY - 100 + "px")
        //     }

        //     if (d3.event.pageX < boundedWidth * 0.7) {
        //         tooltip.style("left", d3.event.pageX + 20 + "px")
        //     } else {
        //         tooltip.style("left", d3.event.pageX - 150 + "px")
        //     }
        // }

        // function mouseout() {
        //     tooltip
        //         .transition()
        //         .duration(0)
        //         .style("opacity", 0)
        // }


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
}