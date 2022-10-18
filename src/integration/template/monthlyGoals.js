import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'

export const object = {

    id: "week-day-bar",
    label: "ZDev Week & Day Bars",
    options: {
        metric_format: {
            type: "string",
            label: "Metric Value Format",
            display: "text",
            default: ",.0f",
            placeholder: "#,###",
            section: "General",
            order: 2
        },
        comparison: {
            type: "string",
            label: "Comparison Metric",
            display: "radio",
            values: [
                {"Monthly Target": "monthly-budget"},
                {"MTD Target": "mtd-budget"},
                {"Monthly Forecast": "monthly-forecast"},
                {"MTD Forecast": "mtd-forecast"},
            ],
            default: "mtd-budget",
            section: "General",
            order: 1
          },
          budgetlines: {
            type: "boolean",
            label: "Show Budget Goals",
            default: "true",
            section: "General",
            order: 2
        },
        show_yaxis_name: {
            type: "boolean",
            label: "Show Y-Axis Name",
            default: "true",
            section: "Y",
            order: 1
        },
        yaxis_label: {
            type: "string",
            label: "Y-Axis Label",
            display: "text",
            default: "",
            section: "Y",
            order: 2
        },
        yticklabels_show: {
            type: "boolean",
            label: "Show Y Tick Labels",
            default: "true",
            section: "Y",
            order: 3
        },
        ytick_format: {
            type: "string",
            label: "Y Tick Label Format",
            display: "text",
            default: "~s",
            placeholder: "#,###",
            section: "Y",
            order: 4
        },
        y_gridlines: {
            type: "boolean",
            label: "Show Y Gridlines",
            default: "false",
            section: "Y",
            order: 4
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
                font-family: 'Roboto';
                font-size: 12px;
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
    
            #viz {
                font-family: 'Open Sans', 'Helvetica', 'sans-serif;';
                cursor: move;
                z-index: 10;
                background-color: none;
                color: #fff;
                height: 100%;
                width: 100%;
                fill: black;
                color: black;
            }

            .axis-label {
                fill: #3a4245;
                font-size: 12px;
                // font-family: 'sans-serif';
                text-anchor: middle;
            }

            .y-axis, .x-axis {
                // font-family: "sans-serif";
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
                color: #c3c3c3;
                text-transform: uppercase;
            }

            hr { 
                margin-top: 1px; 
                margin-bottom: 1px 
            }

            #tt-body {
            margin-top: 5px;
            }
        </style>
        <svg>
        </svg>
        <div class="tooltip"></div>`;
        element.style.fontFamily = `"Open Sans", "Helvetica", sans-serif`       
    },

    updateAsync: function(data, element, config, queryResponse, details, done, environment = "prod") {
        if (environment == "prod") {
            if (!handleErrors(this, queryResponse, {
                min_pivots: 0, max_pivots: 0,
                min_dimensions: 0, max_dimensions: 2,
                min_measures: 0, max_measures: 11
            })) return
        }
        
        try {

             // set dimensions
             let margin = {
                    top: 60,
                    right: 10,
                    bottom: 60,
                    left: 80
            }

            const width = element.clientWidth;
            const height = element.clientHeight;

            const boundedWidth = width - margin.left - margin.right;
            const boundedHeight = height - margin.top - margin.bottom;

            const svg = (
                d3.select(element).select("svg")
                    .html("")
                    .attr("width", "100%")
                    .attr("height", "100%")
            )

            const group = svg.append("g")
                .attr("transform", `translate(${margin.left}, ${margin.top})`)
                .attr("width", "100%")
                .attr("height", ((boundedHeight) + "px"))
                .classed("group", true)

            // TOOLTIPS ---------------------------------------------------------------
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

            tooltip.html('<div id="tt-header"></div><p id="tt-body"></p>')

            const tooltipHeader = tooltip.select("#tt-header")
            const tooltipBody = tooltip.select("#tt-body")

            const mouseover = function(d) {
                tooltip
                    .transition()
                    .duration(0)
                    .style("opacity", 0.95)

                d3.select(this)
                    .style("opacity", 1)

                console.log("mouseover", d3.mouse(this))
            }

            const mouseleave = function(d) {
                tooltip
                    .transition()
                    .duration(0)
                    .style("opacity", 0)

                d3.select(this)
                    .style("opacity", 1)

                console.log("mouseleave", d3.mouse(this))
            }

            const mousemove = function({ data = {} } = {}) {
                console.log("tooltip0")

                if (d3.event.pageY < boundedHeight*.7) {
                    console.log("here less")
                    tooltip
                        .style("top", (d3.event.pageY - 60 + "px"))
                } else {
                    tooltip
                        .style("top", (d3.event.pageY - 160 + "px"))
                }
    
                if (d3.event.pageX < boundedWidth*.7) {
                    tooltip
                        .style("left", d3.event.pageX + 10 + "px") 
                } else {
                    tooltip
                        .style("left", d3.event.pageX - 170 + "px")
                }

                console.log("tooltip1")

                tooltipHeader.html(`${d3.timeFormat("%b'%-y")(data.month)}<hr>`)
                tooltipBody.html(
                    `<span style="float:left;">Actual:&nbsp&nbsp</span>` + `<span style="float:right;">${d3.format(config.metric_format)(data["actual"])}</span><br>` + 
                    `<span style="float:left;">Actual-Contract:&nbsp&nbsp</span>` + `<span style="float:right;">${d3.format(config.metric_format)(data["actualContract"])}</span><br>` + 
                    `<span style="float:left;">Actual-Spot:&nbsp&nbsp</span>` + `<span style="float:right;">${d3.format(config.metric_format)(data["actualSpot"])}</span><br>` + 
                    `<span style="float:left;">Budget:&nbsp&nbsp</span>` + `<span style="float:right;">${d3.format(config.metric_format)(data["budget"])}</span><br>` +
                    `<span style="float:left;">% to Budget:&nbsp&nbsp</span>` + `<span style="float:right;">${d3.format(",.0%")(data["actual"]/data["budget"])}</span><br>` + 
                    `<span style="float:left;">Forecast:&nbsp&nbsp</span>` + `<span style="float:right;">${d3.format(config.metric_format)(data["forecast"])}</span><br>` +
                    `<span style="float:left;">% to Forecast:&nbsp&nbsp</span>` + `<span style="float:right;">${d3.format(",.0%")(data["actual"]/data["forecast"])}</span>`
                )

                console.log("mousemove")
            }

            // END TOOLTIPS -----------------------------------------------------------

            // LOAD DATA
            const dimensions = queryResponse.fields.dimension_like
            const measures = queryResponse.fields.measure_like
            console.log("dimension", dimensions)
            console.log("measure", measures)
            console.log('data', data)

            // MANIPULATE DATA
            let data_ready = []

            data.forEach((d) => {
                let entry = {}
                entry['month'] = new Date(d[dimensions[0].name].value + 'T00:00')
                entry['budget'] = d[measures[0].name].value
                entry['forecast'] = d[measures[1].name].value
                entry['actual'] = d[measures[2].name].value
                entry['actualContract'] = d[measures[3].name].value
                entry['actualSpot'] = d[measures[4].name].value
                data_ready.push(entry)      
            })

            console.log("data_ready", data_ready)

            const monthAccessor = d => d.month
            const budgetAccessor = d => d.budget
            const forecastAccessor = d => d.forecast
            const actualAccessor = d => d.actual
            const actualContractAccessor = d => d.actualContract
            const actualSpotAccessor = d => d.actualSpot

            // filter data - might want to check this?
            const uniqueMonths = [... new Set(data_ready.map(obj => +obj.month))].sort() 
            const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
            const indexOneMonthAgo = uniqueMonths.indexOf(+currentMonth) - 1
            const indexFourMonthsAgo = uniqueMonths.indexOf(+currentMonth) - 4
            const firstMonth = new Date(uniqueMonths[indexFourMonthsAgo])
            const lastMonth = new Date(uniqueMonths[indexOneMonthAgo])

            // const firstWeek = data_ready.filter(element => element.day.getTime() === new Date(new Date(new Date().getFullYear(), new Date().getMonth(), 1).setHours(0,0,0,0)).getTime())[0]['week']
            data_ready = data_ready.filter(element => {
                const monthDate = element.month;
                return (monthDate >= firstMonth && monthDate <= lastMonth)
            })

            data_ready = data_ready.sort(function(a,b) {
                return monthAccessor(a) - monthAccessor(b)
            })

            console.log("data_ready filtered", data_ready)

            // get all unique values along x axis for xScale calculations
            let groups = []

            data_ready.forEach((d) => {
                if (groups.includes(d.month)) {
                    return 
                } else if (d.month != null) {
                    groups.push(d.month)
                }
            })

            const subgroups = ['actualSpot', 'actualContract']

            console.log("groups", groups)

            const data_stacked = d3.stack()
                .keys(subgroups)
                (data_ready)

            data_stacked.forEach((d) => {
                const subgroup = d.key
                d.forEach((s,i) => {
                    s['subgroup'] = subgroup
                })
            })

            console.log("data_stacked", data_stacked)

            
            // X-AXIS
            const xScale = d3.scaleBand()
                .domain(groups)
                .range([0, boundedWidth])
                .padding(.1)

            const xAxisGenerator = d3.axisBottom()
                .scale(xScale)
                .tickPadding(10)
                .tickSize(0)
                .tickFormat((d, i) => `${d3.timeFormat("%b'%-y")(d)}`)

            const xAxis = group.append('g')
                .call(xAxisGenerator)
                    .style("transform", `translateY(${boundedHeight}px)`)
                    .attr("class", "x-axis")

            // Y-AXIS
            const yScale = d3.scaleLinear()
                .range([boundedHeight, 0])

            if (config.budgetlines == "true") {
                yScale
                    .domain([0, Math.max(d3.max(data_ready, d => actualAccessor(d)), d3.max(data_ready, d => budgetAccessor(d)), d3.max(data_ready, d => forecastAccessor(d)))])
            } else {
                yScale
                    .domain([0, Math.max(d3.max(data_ready, d => actualAccessor(d)), d3.max(data_ready, d => forecastAccessor(d)))])
            }

            const yAxisGenerator = d3.axisLeft()
                .scale(yScale)
                .tickPadding(10)
                .ticks(6)
            
            if (config.yticklabels_show === "true") {
                yAxisGenerator
                    .tickFormat(d3.format(config.metric_format))
            } else {
                yAxisGenerator
                    .tickFormat("")
            }

            if (config.y_gridlines === "true") {
                yAxisGenerator
                    .tickSize(-boundedWidth)
            } else {
                yAxisGenerator
                    .tickSize(0)
            }

            const yAxis = group.append('g')
                .call(yAxisGenerator)
                    .attr("class", "y-axis")

            // axis labels
            if (config.show_yaxis_name == "true") {
                const yAxisLabel = yAxis.append("text")
                    .attr("class", "axis-label")
                    .attr("x", (-boundedHeight/2))
                    .attr("y", -margin.left + 18)
                    .style("transform", "rotate(-90deg)")
                    // .text("Metric Name")
                    .text(function() {
                        if (config.yaxis_label != "") {
                            return config.yaxis_label
                        } else {
                            return measures[1].label_short.split(" ")[0]
                        }
                    })
            }


            // DRAW DATA
            const biggroup = group.append('g')

            const colormap = {'positive': {
                'actualContract':'rgba(0,115,181,0.75)', 
                'actualSpot':'#0072b5'
            }, 'negative': {
                'actualContract':'rgba(215,97,6,0.75)', 
                'actualSpot':'#D76106'
            }}

            const bars = biggroup
                .selectAll('g .subgroupbars')
                .data(data_stacked)
                .enter()
                .append('g')
                    .attr("stroke", "#323232")
                    .attr("class", `subgroupbars`)

            const stacks = bars
                    .selectAll("rect .stack")
                    .data(d => d)
                    .enter()
                    .append('rect')
                        .attr("x", d => xScale(d.data.month))
                        .attr("y", d => yScale(d[1]))
                        .attr("width", xScale.bandwidth())
                        .attr("height", d => yScale(d[0]) - yScale(d[1]))
                        .attr("class", "stack")
                        .attr("fill", (d) => {
                            if (+d.data.actual < d.data.budget) {
                                console.log("negative/orange")
                                return colormap['negative'][d.subgroup]
                            } else {
                                return colormap['positive'][d.subgroup]
                            }
                        })
                        .on()

            const innerlabels = bars
                    .selectAll("text .stacked-label")
                    .data(d => d)
                    .enter()
                    .append("text")
                        .attr("x", d => xScale(d.data.month) + 4)
                        .attr("y", d => yScale(d[1]) + 4)
                        .text(d => {
                            if (d.subgroup === "actualSpot") {
                                return "S"
                            } else {
                                return "C"
                            }
                        })
                        .attr("text-anchor", "left")
                        .style("dominant-baseline", "hanging")
                        .attr("stroke", "white")
                        .attr("font-size", "0.6em")
                        .attr("font-weight", "200")
                        .attr("font-family", "sans-serif")
                        .attr("class", "stacked-label")

            const toGoal = biggroup
                .selectAll("text .togoallabel")
                .data(data_ready)
                .enter()
                .append("text")
                    .attr("x", d => xScale(d.month) + xScale.bandwidth()/2)
                    .attr("y", 0 - 20)
                    .text(d => {
                        const tempVal = d.actual/d.budget
                        if (tempVal >= 1) {
                            return `+${d3.format(",.0%")(tempVal-1)}`
                        } else {
                            return `-${d3.format(",.0%")(1-tempVal)}`
                        }
                    })
                    .attr("text-anchor", "middle")
                    .attr("stroke", d => {
                        if (d.actual/d.budget >= 1.0) {
                            return "#0072b5"
                        } else {
                            return "#d76106"
                        }
                    })
                    .attr("class", "togoallabel")
                    .attr("font-size", "12px")

            const comps = group.append('g')
                .selectAll("rect .goalbar")
                .data(data_ready)
                .enter()
                .append("rect")
                    .attr("x", d => xScale(monthAccessor(d)) - 0.045*(xScale.bandwidth()))
                    .attr("y", d => yScale(budgetAccessor(d)))
                    .attr("width", xScale.bandwidth() + 0.09*(xScale.bandwidth()))
                    .attr("height", 3)
                    .attr("fill", "grey")
                    .attr("fill-opacity", 0.6)
                    .attr("class", "goalbar")
                    .attr("stroke", "black")

            const hoverWeekBars = biggroup
                .selectAll(".hover-rect")
                .data(data_ready)
                .enter()
                .append("rect")
                    .attr("x", d => xScale(monthAccessor(d)))
                    .attr("y", 0)
                    .attr("width", xScale.bandwidth())
                    .attr("height", boundedHeight)
                    .attr("fill-opacity", 0.0)
                    .attr("class", "hover-rect")
                    .on("mouseover", mouseover)
                    .on("mousemove", d => mousemove({ data: d}))
                    .on("mouseleave", mouseleave)


        } catch(error) {
            if (environment == "prod") {
                if (queryResponse.fields.dimensions.length < 3) {
                                    this.addError({title: "Not Enough Measures", message: "This chart requires at least 3 measures."});
                                    return;
                                } 
            }  else {
            console.log(error)
        }

        // Callback at the end of the rendering to let Looker know it's finished
        done()
    }
}
};