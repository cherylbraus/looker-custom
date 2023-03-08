import * as d3 from 'd3'
import * as $ from 'jquery'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'

looker.plugins.visualizations.add({
    id: "contract-win-rate",
    label: "ZDev Contract Win Rate",
    options: {
        right_measures: {
            type: "string",
            label: "Right Measure Indices",
            display: "text",
            default: "",
            section: "Setup",
            order: 1
        },  
        left_measures: {
            type: "string",
            label: "Left Measure Indices",
            display: "text",
            default: "",
            section: "Setup",
            order: 2
        },  
        left_negative: {
            type: "boolean",
            label: "Left Values Are Negative",
            default: false,
            section: "Setup",
            order: 3
        },
        y_label: {
            type: "string",
            label: "Y Axis Label",
            display: "text",
            default: "",
            section: "Axes",
            order: 1
        },          
        left_margin: {
            type: "string",
            label: "Left Margin Width",
            display: "text",
            default: "120",
            section: "Axes",
            order: 2
        },
        x_format: {
            type: "string",
            label: "X Value Format",
            display: "text",
            default: ",.0f",
            section: "Axes",
            order: 3
        },
        x_label: {
            type: "string",
            label: "X Axis Label",
            display: "text",
            default: "",
            section: "Axes",
            order: 4
        }
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
            top: 50,
            right: 20,
            bottom: 50,
            left: config.left_margin ? +config.left_margin : 20
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

        // determine rights and lefts --------------------------
        let rightCols = [];
        let leftCols = [];
        
        if (config.right_measures) {
            const rightItems  = config.right_measures.split(",")
            rightItems.forEach(d => rightCols.push(+d))
        } else {
            rightCols.push(0)
        }

        if (config.left_measures) {
            const leftItems = config.left_measures.split(",")
            leftItems.forEach(d => leftCols.push(+d))
        } else {
            leftCols.push(1)
        }

        console.log("right/left cols", rightCols, leftCols)


        // format data -----------------------------------------
        let data_right = []
        let rightSubgroups = []

        data.forEach((d) => {
            let entry = {}
            entry['label'] = d[dimensions[0].name].value
            entry['rightTot'] = 0
            rightCols.forEach((ind) => {
                entry[`right-${ind}`] = +d[measures[ind].name].value
                entry['rightTot'] += +d[measures[ind].name].value
                rightSubgroups.push(`right-${ind}`)
            })
            data_right.push(entry)
        })

        let data_left = []
        let leftSubgroups = []
        let leftSign = config.left_negative == true ? 1 : -1

        data.forEach((d) => {
            let entry = {}
            entry['label'] = d[dimensions[0].name].value
            entry['leftTot'] = 0
            leftCols.forEach((ind) => {
                entry[`left-${ind}`] = leftSign * +d[measures[ind].name].value
                entry['leftTot'] += leftSign * +d[measures[ind].name].value
                leftSubgroups.push(`left-${ind}`)
            })
            data_left.push(entry)
        })

        console.log("data_right", data_right)
        console.log("data_left", data_left)

        const labelAccessor = d => d.label
        const righttotAccessor = d => d.rightTot
        const lefttotAccessor = d => d.leftTot

        // setup subgroups and groups ----------------------------------
        // subgroups = the stacked sections in the bars
        rightSubgroups = [...new Set(rightSubgroups)]
        leftSubgroups = [...new Set(leftSubgroups)]

        console.log("subgroups", rightSubgroups, leftSubgroups)

        const rightStacked = d3.stack()
            .keys(rightSubgroups)
            (data_right)

        const leftStacked = d3.stack()
            .keys(leftSubgroups)
            (data_left)

        console.log("rightstacked", rightStacked)
        console.log("leftstacked", leftStacked)

        // sort data ---------------------------------------------------
        // sort left, pull all y values (in case some don't have left values at all)
        // create new object with all y values and left totals or 0 (if nothing)
        // sort in descending order
        // then pull y label values and use those in y axis generator
        data_left.sort((a, b) => +(b.left) - +(a.left));

        const yValues = data.map(d => d[dimensions[0].name].value)
        let yValuesArray = []
        yValues.forEach((d, i) => {
            let entry = {}
            entry['label'] = d

            const filterdata = data_left.filter((f, i) => {
                return (f.label === d)
            })

            if (filterdata) {                
                entry['leftTot'] = filterdata[0].leftTot
            } else {
                entry['leftTot'] = 0
            }
            yValuesArray.push(entry)            
        })

        yValuesArray.sort((a, b) => +(b.leftTot) - +(a.leftTot))

        const yValuesOrdered = yValuesArray.map(d => d.label)

        // AXES ---------------------------------------------------  
        const yScale = d3.scaleBand()
            // .domain(data_ready.map(d => labelAccessor(d)))
            .domain(yValuesOrdered)
            .range([boundedHeight, 0])
            .padding(0.2)

        const yAxisGenerator = d3.axisLeft()
            .scale(yScale)
            .tickPadding(10)
            .tickSize(0)
            // .tickFormat((d) => `${d}`)

        const xScaleDomain = [
            d3.min(data_left.map(d => d.leftTot)), 
            d3.max(data_right.map(d => d.rightTot))
        ]

        const xScale = d3.scaleLinear()
            .domain(xScaleDomain)
            .range([0, boundedWidth])

        const xAxisGenerator = d3.axisBottom()
            .scale(xScale)
            .tickPadding(10)
            .tickSizeOuter(0)
            // .tickSizeInner(5)
            .tickSizeInner(-boundedHeight)

        if (config.left_negative == false) {
            xAxisGenerator
                .tickFormat(d => d3.format(",.2s")(Math.abs(d)))
        } else {
            xAxisGenerator
                .tickFormat(d => d3.format(",.2s")(d))
        }
            

        const xAxis = group.append("g")
            .call(xAxisGenerator)
                .style("transform", `translateY(${boundedHeight}px)`)
                .attr("class", "x-axis")

        console.log("x axis", xScale.domain(), xScale.range())

        // DRAW DATA ---------------------------------------------------
        function colorDivider(len) {
            return 0.5 / (len - 1)
        }

        let left_color_divider = colorDivider(leftCols.length)
        let right_color_divider = colorDivider(rightCols.length)

        let left_colors = []
        let right_colors = []

        console.log("color_dividers", left_color_divider, right_color_divider)

        const barsLeft = group.append("g")
            .selectAll("g")
            .data(leftStacked)
            .enter()
            .append("g")
                .attr("fill", (e,i) => {
                    if (i == 0) {
                        let color = d3.interpolateOranges(.5)
                        left_colors.push(color)
                        return color
                    } else {
                        let color = d3.interpolateOranges((left_color_divider * i) + 0.5)
                        left_colors.push(color)
                        return color
                    }
                })
                .selectAll("rect")
                .data(function(d) { return d })
                .enter()
                .append("rect")
                    .attr("x", d => xScale(d[1]))
                    .attr("y", d => yScale(d.data.label))
                    .attr("height", yScale.bandwidth())
                    .attr("width", d => xScale(d[0]) - xScale(d[1]))
                    .classed("left-bar", true)
                    .on("mousemove", mousemove)
                    .on("mouseout", mouseout)

        const barsRight = group.append("g")
            .selectAll("g")
            .data(rightStacked)
            .enter()
            .append("g")
                .attr("fill", (e,i) => {
                    if (i == 0) {
                        let color = d3.interpolateBlues(.5)
                        right_colors.push(color)
                        return color
                    } else {
                        let color = d3.interpolateBlues((right_color_divider * i) + 0.5)
                        right_colors.push(color)
                        return color
                    }
                })
                .selectAll("rect")
                .data(function(d) { return d })
                .enter()
                .append("rect")
                    .attr("x", d => xScale(d[0]))
                    .attr("y", d => yScale(d.data.label))
                    .attr("height", yScale.bandwidth())
                    .attr("width", d => xScale(d[1]) - xScale(d[0]))
                    .classed("right-bar", true)
                    .on("mousemove", mousemove)
                    .on("mouseout", mouseout)

        // Y AXIS TICK TEXT -----------------------------------------
        const yAxisTickTexts = group.append("g")
            .attr("transform", `translate(${xScale(0)},0)`)
            .call(yAxisGenerator)
            .call(g => g.selectAll(".tick text")
                .attr("dx", -8)
                .attr("x", y => {
                    const rowData = data_left.filter((d,i) => { return d.label == y})
                    return xScale(rowData[0].leftTot) - xScale(0)
                })
            )

        yAxisGenerator  
            .tickFormat("")

        const yAxis = group.append("g")
            .call(yAxisGenerator)
                .attr("class", "y-axis")

        const yAxisLabel = yAxis.append("text")
            .attr("class", "axis-label")
            .attr("x", -boundedHeight/2)
            .attr("y", -margin.left + 13)
            .style("transform", "rotate(-90deg)")
            .text(config.y_label ? config.y_label : dimensions[0].label)

        const xAxisLabel = xAxis.append("text")
            .attr("class", "axis-label")
            .attr("x", width/2)
            .attr("y", (margin.bottom - 8))
            .text(config.x_label)   

        // LEGEND --------------------------------------------------
        const colors = left_colors.reverse().concat(right_colors)
        const cols = leftCols.reverse().concat(rightCols)

        console.log("width", width)

        const legend = group.append("g")
            .attr("transform", `translate(${0 - margin.left + 10},-35)`)
            .classed("legend", true)

        legend.append("g").classed("legend-0", true)
        legend.append("g").classed("legend-1", true)
        legend.append("g").classed("legend-2", true)

        const legendRows = [
            d3.select('.legend-0'), 
            d3.select('.legend-1'),
            d3.select('.legend-2')
        ]

        let rowNum = 0;

        colors.forEach((d, i) => {            
            console.log("begin", rowNum, legendRows[rowNum])
            let thisRowLegend = legendRows[rowNum]
            const gCoord = thisRowLegend.node().getBBox()

            let height = 12 * rowNum

            console.log("thisRowLegend", thisRowLegend)

            let start = gCoord.width == 0 ? gCoord.width : gCoord.width + 15

            if (start > (width - 350)) {
                console.log("too wide")
                rowNum += 1
            }

            console.log("end stuff", rowNum, height, start)

            thisRowLegend.append("rect")
                .attr("x", start)
                .attr("y", height - 5)
                .attr("width", 8)
                .attr("height", 8)
                .attr("fill", colors[i])
                .attr("fill-opacity", 1.0)

            thisRowLegend.append("text")
                .attr("x", start + 12)
                .attr("y", height)
                .style("text-anchor", "start")
                .style("dominant-baseline", "middle")
                .style("font-size", 11)
                .text(measures[cols[i]].label_short)
        })

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

        tooltip.html(`<div id="tt-header"></div><p id="tt-body"></p>`)

        const tooltipHeader = tooltip.select("#tt-header")
        const tooltipBody = tooltip.select("#tt-body")

        function mousemove(d) {
            const subgroupNameNumber = d3.select(this.parentNode).datum().key
            const subgroupValue = d.data[subgroupNameNumber]
            // console.log("subgroupInfo", subgroupNameNumber, subgroupValue, d.data)

            const measureIndex = subgroupNameNumber.split("-")[1]
            const measureSide = subgroupNameNumber.split("-")[0]
            const measureName = measures[measureIndex].label_short

            let valueSign;
            if (measureSide == "left" && config.left_negative == false) {
                valueSign = -1;
            } else {
                valueSign = 1;
            }

            tooltip
                .transition()
                .duration(0)
                .style("opacity", 0.95)

            const totalKey = d.data["leftTot"] ? "leftTot" : "rightTot"

            console.log("totalKey", totalKey)

            tooltipHeader.html(`${d.data.label}<hr>`)
            tooltipBody.html(
                `<span style="float:left;">${measureName}:&nbsp&nbsp</span>` + 
                `<span style="float:right;">${d3.format(config.x_format)(subgroupValue * valueSign)}</span><br>` + 
                `<span style="float:left;">% of Total:&nbsp&nbsp</span>` + 
                `<span style="float:right;">${d3.format(",.1%")(subgroupValue / d.data[totalKey])}</span>`
            )

            if (d3.event.pageY < boundedHeight * 0.7) {
                tooltip.style("top", d3.event.pageY - 40 + "px")
            } else {
                tooltip.style("top", d3.event.pageY - 150 + "px")
            }

            if (d3.event.pageX < boundedWidth * 0.7) {
                tooltip.style("left", d3.event.pageX + 20 + "px")
            } else {
                tooltip.style("left", d3.event.pageX - 170 + "px")
            }
        }

        function mouseout() {
            tooltip
                .transition()
                .duration(0)
                .style("opacity", 0)
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