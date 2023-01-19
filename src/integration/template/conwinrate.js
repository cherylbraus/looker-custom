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
        let margin = {
            top: 30,
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

        let test = data_ready

        data_ready.forEach((d, i) => {
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

        console.log("data_ready2", data_ready)

        // DROPDOWN -----------------------------------------------------------
        const lanes = [...new Set(data_ready.map(laneAccessor))].sort()

        const listDropdown = $(`#vis-options`);
        listDropdown.empty()

        d3.select(".dropdown-title")
            .text("Lane ID: ")

        lanes.forEach((d, i) => {
            if (i == 0) {
                listDropdown.append($(`<option></option>`).attr(`value`, d).text(d).attr("selected", "selected"))
            } else {
                listDropdown.append($(`<option></option>`).attr(`value`, d).text(d))
            }
        })

        listDropdown.on("change", function() {
            redraw()
        })

        function redraw() {
            let lan = $(`#vis-options option:selected`).val()
            console.log("LANE CHOSEN", lan)

            let data_lane = data_ready.filter(d => {
                return (+d.lane === +lan)
            })

            console.log("LANE DATA", data_lane)

            const svg = (
                d3.select(element).select("svg")
                    .html("")
                    .attr("width", "100%")
                    .attr("height", height - 20 + "px")
            )
    
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
                .domain([rate_min, rate_max])
                .range([boundedHeight, 0])

            const yAxisGenerator = d3.axisLeft()
                .scale(yScale)
                .tickPadding(10)
                .tickSize(0)
                .tickFormat(d3.format(",.0%"))

            const yAxis = group.append("g")
                .call(yAxisGenerator)
                    .attr("class", "y-axis")

            const yAxisLabel = yAxis.append("text")
                .attr("class", "axis-label")
                .attr("x", (-boundedHeight / 2))
                .attr("y", -margin.left + 12)
                .style("transform", "rotate(-90deg)")
                .text("Avg. Win Rate Estimate")

            // DRAW DATA -----------------------------------------------------------
            const line = d3.line()
                .defined(function(d) { return d.ratio != null && d["value"] != null })
                .curve(d3.curveNatural)
                .x(function(d) { return xScale(d["ratio"])})
                .y(function(d) { return yScale(d["value"])})

            const color_list = ["#27566b", "#8cbb61", "#007b82", "#f1cc56", "#339f7b"]

            data_lane.forEach((d, i) => {
                group.append("path")
                    .data([d.winrates])
                    .attr("class", d.model)
                    .attr("d", line)
                    .attr("fill", "none")
                    .attr("stroke", color_list[i])
                    .attr("stroke-width", "2.5px")
            })

            // const globalLineData = data_lane.filter(d => {
            //     return (d.model === "Global-superior")
            // })

            // console.log("globalLineData", globalLineData)

            // const globalLine = group.append("path")
            //     .data([globalLineData[0].winrates])
            //     .attr("class", "line")
            //     .attr("d", line)
            //     .attr("fill", "none")
            //     .attr("stroke", "#27566b")
            //     .attr("stroke-width", "2.5px")
        }

        redraw()






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