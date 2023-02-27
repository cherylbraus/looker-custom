import * as d3 from 'd3'
import * as $ from 'jquery'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'

export const object = {
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
            entry['month'] = d[dimensions[0].name].value

            let date = new Date()
            date.setMonth(+parseInt(entry['month'].split("-")[1]-1))

            entry['monthname'] = date.toLocaleString("en-US", { month: 'short' })

            entry['year'] = d[dimensions[1].name].value
            entry['cat'] = d[dimensions[2].name].value
            entry['measure'] = d[measures[0].name].value
            data_ready.push(entry)
        })

        console.log("data_ready", data_ready)

        const monthAccessor = d => d.month;
        const yearAccessor = d => d.year;
        const catAccessor = d => d.cat;
        const measureAccessor = d => d.measure;

        // JUST FILTER TO ONE CATEGORY AND FEWER YEARS FOR NOW!!!!! -------------------------
        data_ready = data_ready.filter(entry => {
            return (catAccessor(entry) === "No" && yearAccessor(entry) > 2017)
        })

        // scales ----------------------------------------------
        const uniqueYears = [... new Set(data_ready.map(obj => +obj.year))].sort()
        console.log("uniqueYears", uniqueYears)

        let outerDomain = [... new Set(data_ready.map(obj => +parseInt(obj.month.split("-")[1]-1)))]
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
            .tickPadding(25)
            .tickSize(0)
            .tickFormat((d) => `${d}`)

        const xAxis = group.append("g")
            .call(xAxisGenerator)
                .style("transform", `translateY(${boundedHeight}px)`)
                .attr("class", "x-axis")

        const yScale = d3.scaleLinear()
            .domain(d3.extent(data_ready, d => measureAccessor(d)))
            .range([boundedHeight, 0])

        const yAxisGenerator = d3.axisLeft()
            .scale(yScale)
            .tickPadding(10)
            // .ticks(9)

        const yAxis = group.append("g")
            .call(yAxisGenerator)
                .attr("class", "y-axis")

        const yAxisLabel = yAxis.append("text")
            .attr("class", "axis-label")
            .attr("x", -boundedHeight/2)
            .attr("y", -margin.left + 13)
            .style("transform", "rotate(-90deg)")
            .text(measures[0].label_short.split(" ")[0])

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
                // .on("mousemove", mousemove)
                // .on("mouseout", mouseout)
                // .classed("tooltip-area-rect", true)

        // draw each category's circles/lines -----------------------------
        d3.selectAll(".singleperiod").each(function(e,i) {
            xInnerScale
                .range([
                    xScale(e),
                    xScale(e) + xScale.bandwidth()
                ])

            const innerData = data_ready.filter(obj => {
                return (obj.monthname === e)
            })

            d3.select(this)
                .selectAll("circle")
                .data(innerData)
                .enter()
                .append("circle")
                    .attr("cx", f => xInnerScale(f.year))
                    .attr("cy", f => yScale(f.measure))
                    .attr("r", 3)
                    .style("fill", "#025187")
                    .classed(`circle`, "true")

            const line = d3.line()
                .defined(function(f) { return f.measure != null })
                .curve(d3.curveNatural)
                .x(function(f) { return xInnerScale(f.year) })
                .y(function(f) { return yScale(f.measure) })

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

        tooltip.html(`<div id="tt-header"></div><p id="tt-body"></p>`)

        const tooltipHeader = tooltip.select("#tt-header")
        const tooltipBody = tooltip.select("#tt-body")

        function mousemove(d) {
            const thiselement = d3.select(this)
            console.log("this", thiselement)
            console.log("this mouse", d3.mouse(this)[0])
            console.log("event", xScale.invert(d3.mouse(this)[0]))

            console.log("xScale invert", xScale.invert(24))

            let tt_x = xScale.invert(d3.mouse(this)[0])
            let tt_x2 = xInnerScale.invert(d3.mouse(this)[0])

            console.log("tt_x", tt_x)
            console.log("tt_x2", tt_x2)

            const tt_data = []
            // data
        }

        function mouseout() {
            //
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