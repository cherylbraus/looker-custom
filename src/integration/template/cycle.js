import * as d3 from 'd3'
import * as $ from 'jquery'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'

export const object = {
    id: "contract-win-rate",
    label: "ZDev Contract Win Rate",
    options: {
        metric_format: {
            type: "string",
            label: "Metric Value Format",
            display: "text",
            default: ",.0f",
            section: "General",
            order: 1
        },  
        show_avglines: {
            type: "boolean",
            label: "Show average lines",
            default: "false",
            section: "General",
            order: 2
        },
        line_shape: {
            type: "string",
            label: "Line Shape",
            display: "radio",
            values: [
                {"Straight": "straight"},
                {"Curved": "curve"}
            ],
            default: "curve",
            section: "General",
            order: 3
        },
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
              body {
                  font-family: Arial;
                  font-size: 12px;
              }
            </style>
            <svg>
            </svg>`;
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
            top: 30,
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
            entry['month'] = d[dimensions[0].name].value

            let date = new Date()
            date.setMonth(+parseInt(entry['month'].split("-")[1]-1))

            entry['monthname'] = date.toLocaleString("en-US", { month: 'short' })

            entry['year'] = +entry['month'].split("-")[0]
            entry['cat'] = d[dimensions[2].name].value
            entry['measure'] = d[measures[0].name].value
            entry['date'] = new Date(entry['year'], +entry['month'].split("-")[1]-1)
            data_ready.push(entry)
        })

        const monthAccessor = d => d.month;
        const yearAccessor = d => d.year;
        const catAccessor = d => d.cat;
        const measureAccessor = d => d.measure;
        const dateAccessor = d => d.date;

        console.log("data_ready", data_ready)

        // JUST FILTER TO ONE CATEGORY AND FEWER YEARS FOR NOW!!!!! -------------------------
        data_ready = data_ready.filter(entry => {
            return (catAccessor(entry) === "No" && yearAccessor(entry) > 2017)
        })

        // data manipulation ----------------------------------------------
        const uniqueYears = [... new Set(data_ready.map(obj => +obj.year))].sort()
        console.log("uniqueYears", uniqueYears)

        // get a month ranking by year
        let data_array = []

        uniqueYears.forEach((y, i) => {
            let tmp = data_ready.filter(entry => {
                return (yearAccessor(entry) === +y)
            })

            tmp.sort(function(a,b) {
                return b.measure - a.measure
            })

            let rank = 1;
            for (var i = 0; i < tmp.length; i++) {
                if (i > 0 && tmp[i].measure < tmp[i-1].measure) {
                    rank++;
                }
                tmp[i].rank = rank;
            }

            tmp.forEach(d => {
                data_array.push(d)
            })
        })

        data_array.sort(function(a,b) {
            return a.date - b.date
        })

        console.log("data_array", data_array)

        // scales ----------------------------------------------
        let outerDomain = [... new Set(data_array.map(obj => +parseInt(obj.month.split("-")[1]-1)))]
        outerDomain.sort(function(a,b) {
            return a - b;
        })

        outerDomain = [... new Set(outerDomain.map(obj => {
            const date = new Date()
            date.setMonth(obj)
            return date.toLocaleString('en-US', { month: 'short' })
        }))]
        console.log("outerDomain finished", outerDomain)

        const xScale = d3.scaleBand()
            .domain(outerDomain)
            .range([0, boundedWidth])
            .padding(0.2)

        const xAxisGenerator = d3.axisBottom()
            .scale(xScale)
            .tickPadding(30)
            .tickSize(0)
            .tickFormat((d) => `${d}`)

        const xAxis = group.append("g")
            .call(xAxisGenerator)
                .style("transform", `translateY(${boundedHeight}px)`)
                .attr("class", "x-axis")

        const yScale = d3.scaleLinear()
            .domain(d3.extent(data_array, d => measureAccessor(d)))
            .range([boundedHeight, 0])

        const yAxisGenerator = d3.axisLeft()
            .scale(yScale)
            .tickPadding(10)
            .tickFormat(d => d3.format(config.metric_format)(d))
            // .ticks(9)

        const yAxis = group.append("g")
            .call(yAxisGenerator)
                .attr("class", "y-axis")

        const yAxisLabel = yAxis.append("text")
            .attr("class", "axis-label")
            .attr("x", -boundedHeight/2)
            .attr("y", -margin.left + 13)
            .style("transform", "rotate(-90deg)")
            .text(config.y_label ? config.y_label : measures[0].label_short.split(" ")[0])

        const xInnerScale = d3.scaleLinear()
            .domain([Math.min(...uniqueYears), Math.max(...uniqueYears)])

        const xInnerTicks = xInnerScale.ticks()
            .filter(tick => Number.isInteger(tick))

        const xInnerAxisGenerator = d3.axisBottom()
            .scale(xInnerScale)
            .tickPadding(10)
            .tickSize(0)
            .tickValues(xInnerTicks)
            .tickFormat((d) => `'${d.toString().slice(2)}`)

        // Draw the plot ---------------------------------------
        const outerGroups = group.append("g")
            .attr("class", "outer-groups")
            .selectAll("g")
            .data(outerDomain)
            .enter()
            .append("g")
                .attr("class", d => `singleperiod ${d}`)

        // draw rects for shading
        const shadedBars = outerGroups
            .append("rect")
                .attr("x", d => xScale(d))
                .attr("y", 0)
                .attr("width", xScale.bandwidth())
                .attr("height", boundedHeight)
                .attr("fill", "#eaeaea")
                .attr("fill-opacity", 0.4)
                .on("mousemove", mousemove)
                .on("mouseout", mouseout)
                .classed("tooltip-area-rect", true)

        // draw each category's circles/lines -----------------------------
        let xInnerScaleRanges = []

        d3.selectAll(".singleperiod").each(function(e,i) {
            xInnerScale
                .range([
                    xScale(e),
                    xScale(e) + xScale.bandwidth()
                ])

            xInnerScaleRanges.push(xInnerScale.range())

            const innerData = data_array.filter(obj => {
                return (obj.monthname === e)
            })

            const average = d3.mean(innerData, d => measureAccessor(d))

            // console.log("innerData", innerData)
            // console.log("average", average)

            if (config.show_avglines == "true") {
                d3.select(this)
                    .append("line")
                    .style("stroke", "#a1a1a1")
                    .style("stroke-dasharray", "5,3")
                    .style("stroke-width", 1)
                    .attr("x1", xScale(e))
                    .attr("x2", xScale(e) + xScale.bandwidth())
                    .attr("y1", yScale(average))
                    .attr("y2", yScale(average))
            }

            d3.select(this)
                .selectAll("circle")
                .data(innerData)
                .enter()
                .append("circle")
                    .attr("cx", f => xInnerScale(f.year))
                    .attr("cy", f => yScale(f.measure))
                    .attr("r", f => f.measure ? 3 : 0)
                    .style("fill", "#025187")
                    .classed(`circle`, "true")

            let line = d3.line()
                .defined(function(f) { return f.measure != null })
                .x(function(f) { return xInnerScale(f.year) })
                .y(function(f) { return yScale(f.measure) })

            if (config.line_shape == "curve") {
                line.curve(d3.curveNatural)
            }

            d3.select(this)
                .append("path")
                .data([innerData])
                .attr("d", line)
                .attr("fill", "none")
                .attr("stroke", "#025187")
                .attr("stroke-width", ".5px")

            d3.select(this).append("g")
                .call(xInnerAxisGenerator)
                    .style("transform", `translateY(${boundedHeight}px)`)
                    .classed("inner-x-axis", true)
        })

        d3.selectAll(".inner-x-axis text")
            .style("font-size", `${config.xinner_ticksize}px`)

        // LEGEND ---------------------------------------------------
        if (config.show_avglines == "true") {
            const legend = group.append("g")
                .attr("transform", "translate(0,-15)")
                .classed("legend", true)

            legend.append("line")
                .style("stroke", "#a1a1a1")
                .style("stroke-dasharray", "5,3")
                .style("stroke-width", 1)
                .attr("x1", 10)
                .attr("x2", 40)
                .attr("y1", 0)
                .attr("y2", 0)
                
            legend.append("text")
                .attr("x", 47)
                .attr("y", 0)
                .style("text-anchor", "start")
                .style("dominant-baseline", "middle")
                .style("font-size", 11)
                .text(`Average`)
        }

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

        const tt_line = tt_group.append("line")
            .attr("stroke", "#a6a6a6")
            .attr("y1", 0)
            .attr("y2", boundedHeight)
            .attr("stroke-dasharray", "5,3")
            .attr("stroke-width", 2)
            .style("opacity", 0)

        tooltip.html(`<div id="tt-header"></div><p id="tt-body"></p>`)

        const tooltipHeader = tooltip.select("#tt-header")
        const tooltipBody = tooltip.select("#tt-body")

        function mousemove(d) {
            tooltip 
                .transition()
                .duration(0)
                .style("opacity", 0.95)

            const eachBand = xScale.step()
            const xIndex = Math.floor((d3.mouse(this)[0] / eachBand))
            const tt_x1 = xScale.domain()[xIndex]

            xInnerScale.range(xInnerScaleRanges[xIndex])
            let tt_x2 = Math.round(xInnerScale.invert(d3.mouse(this)[0]))

            // console.log("tt_xs", `${tt_x1} - ${tt_x2}`)

            const tt_data = data_array.filter(d => {
                return (d.monthname == tt_x1 && +d.year == +tt_x2)
            })
            // console.log("tt_data", tt_data)

            let measureVal;
            let rankVal;
            if (tt_data[0]) {
                measureVal = d3.format(config.metric_format)(tt_data[0].measure)
                rankVal = `#${tt_data[0].rank} month in year`
            } else {
                measureVal = "N/A"
                rankVal = "N/A"
            }

            tooltipHeader.html(`${tt_x1}<hr>`)
            tooltipBody.html(
                `<span style="float:left;">${tt_x2}:&nbsp&nbsp</span>` + 
                `<span style="float:right;">${measureVal}</span><br>` + 
                `<span style="float:left;">Rank:&nbsp&nbsp</span>` + 
                `<span style="float:right;">${rankVal}</span>` 
            )

            if (d3.event.pageY < boundedHeight * 0.7) {
                tooltip.style("top", d3.event.pageY - 50 + "px")
            } else {
                tooltip.style("top", d3.event.pageY - 140 + "px")
            }

            if (d3.event.pageX < boundedWidth * 0.7) {
                tooltip.style("left", d3.event.pageX + 10 + "px")
            } else {
                tooltip.style("left", d3.event.pageX - 120 + "px")
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
}