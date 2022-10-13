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
            label: "Comparison Metric Label",
            display: "text",
            default: "Forecast",
            section: "General",
            order: 3
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
    
            #vis {
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
                    top: 40,
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
            // END TOOLTIPS -----------------------------------------------------------

            // LOAD DATA
            const dimensions = queryResponse.fields.dimension_like
            const measures = queryResponse.fields.measure_like
            console.log("dimension", dimensions)
            console.log("measure", measures)
            console.log('data', data)

            // MANIPULATE DATA
            let week; 
            let day;

            if (dimensions[0].time_interval['name'] === "week") {
                week = dimensions[0].name
                day = dimensions[1].name
            } else {
                week = dimensions[1].name
                day = dimensions[0].name
            }

            let data_ready = []

            data.forEach((d) => {
                let entry = {}
                entry['week'] = new Date(d[week].value + 'T00:00')
                entry['day'] = new Date(d[day].value + 'T00:00')
                entry['comp'] = d[measures[0].name].value
                entry['actual'] = d[measures[1].name].value
                entry['actcontract'] = d[measures[2].name].value
                entry['actspot'] = d[measures[3].name].value
                data_ready.push(entry)
            })

            console.log("data_ready", data_ready)

            const weekAccessor = d => d.week
            const dayAccessor = d => d.day
            const compAccessor = d => d.comp
            const actualAccessor = d => d.actual
            const actContractAccessor = d => d.actcontract
            const actSpotAccessor = d => d.actspot

            // filter data - might want to check this?
            const lastWeek = data_ready.filter(element => element.day.getTime() === new Date(new Date().setHours(0,0,0,0)).getTime())[0]['week']
            const firstWeek = data_ready.filter(element => element.day.getTime() === new Date(new Date(new Date().getFullYear(), new Date().getMonth(), 1).setHours(0,0,0,0)).getTime())[0]['week']
            data_ready = data_ready.filter(element => {
                const weekDate = element.week;
                return (weekDate >= firstWeek && weekDate <= lastWeek)
            })

            data_ready = data_ready.sort(function(a,b) {
                return dayAccessor(a) - dayAccessor(b)
            })

            console.log("data_ready filtered", data_ready)

            // group data by week
            function group_by_week(arr) {
                return Object.values(
                    data_ready.reduce((a, {week: week, comp: comp, actual: actual, actcontract: actcontract, actspot: actspot}) => {
                        const key = week;

                        if (a[key] === undefined) {
                            a[key] = {week: key, comp: 0, actual: 0, actcontract: 0, actspot: 0, actcum: 0, compcum: 0};
                        }

                        a[key].comp += comp;
                        a[key].actual += actual;
                        a[key].actcontract += actcontract;
                        a[key].actspot += actspot;

                        return a;
                    }, {})
                )
            }

            const data_grp = group_by_week(data_ready)            
            console.log("data_grp", data_grp)

            // calculate cumulative actuals
            const c = data_grp.map((d, i) => ({
                week: d.week,
                // actcum: data_grp.slice(0, i+1).map(({actual}) => actual).reduce((x,y) => x + y)
                actcum: (function() {
                    if (i > 0) {
                        return data_grp.slice(0, i).map(({ actual }) => actual).reduce((x,y) => x + y)
                    } else {
                        return 0
                    }
                })(),
                compcum: data_grp.slice(0, i + 1).map(({ comp }) => comp).reduce((x,y) => x + y)
            }))

            const actcumAccessor = d => d.actcum
            const compcumAccessor = d => d.compcum

            console.log("c", c)

            const data_groups = data_grp.map((item, i) => Object.assign({}, item, c[i]))

            console.log("data_groups", data_groups)

            let groups = []

            data_groups.forEach((d) => {
                if (groups.includes(d.week)) {
                    return 
                } else if (d.week != null) {
                    groups.push(d.week)
                }
            })

            const subgroups = ['actcum', 'actspot', 'actcontract']

            console.log("groups", groups)

            const data_stacked = d3.stack()
                .keys(subgroups)
                (data_groups)

            data_stacked.forEach((d) => {
                const subgroup = d.key
                d.forEach((s,i) => {
                    s['subgroup'] = subgroup
                })
            })

            console.log("data_stacked", data_stacked)

            const data_stacked_raw = d3.stack()
                .keys(subgroups.filter((d, i) => i !== 0))
                (data_groups)

            data_stacked_raw.forEach((d) => {
                const subgroup = d.key
                d.forEach((s,i) => {
                    s['subgroup'] = subgroup
                })
            })

            console.log("data_stacked_raw", data_stacked_raw)

            
            // X-AXIS
            const xScale = d3.scaleBand()
                .domain(groups)
                .range([0, boundedWidth])
                .padding(.1)

            const xAxisGenerator = d3.axisBottom()
                .scale(xScale)
                .tickPadding(10)
                .tickSize(0)
                .tickFormat((d, i) => `Week: ${d3.timeFormat("%b %-d")(d)}`)

            const xAxis = group.append('g')
                .call(xAxisGenerator)
                    .style("transform", `translateY(${boundedHeight}px)`)
                    .attr("class", "x-axis")

            // Y-AXIS
            const maxActualY = data_groups[data_groups.length - 1].actcum + data_groups[data_groups.length - 1].actual
            const maxCompCumY = data_groups[data_groups.length - 1].compcum
            const maxY = Math.max(maxActualY, maxCompCumY)
            console.log("maxY", maxY)

            const yScale = d3.scaleLinear()
                .domain([0, maxY])
                .range([boundedHeight, 0])

            const yAxisGenerator = d3.axisLeft()
                .scale(yScale)
                .tickPadding(10)
            
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


            // TRANSITIONS
            defaultView = "cumulative"
            defaultData = data_stacked
            function transitionToRaw() {
                if (defaultView === "cumulative") {
                    defaultView = "raw"
                    defaultData = data_stacked_raw
                } else {
                    defaultView = "cumulative"
                    defaultData = data_stacked
                }
            }


            // DRAW DATA
            const biggroup = group.append('g')

            const colormap = {'positive': {
                'actcum':'white', 
                'actspot':'rgba(0,115,181,0.75)', 
                'actcontract':'#0072b5'
            }, 'negative': {
                'actcum':'white', 
                'actspot':'rgba(215,97,6,0.75)', 
                'actcontract':'#D76106'
            }}

            const bars = biggroup
                .selectAll('g .subgroupbars')
                .data(data_stacked)
                .enter()
                .append('g')
                    .attr("stroke", d => {
                        if (d.key === "actcum") {
                            return "white"
                        } else {
                            return "black"
                        }
                    })
                    .attr("class", `subgroupbars`)
                    .on("click", transitionToRaw)

            const stacks = bars
                    .selectAll("rect .stack")
                    .data(d => d)
                    .enter()
                    .append('rect')
                        .attr("x", d => xScale(d.data.week))
                        .attr("y", d => yScale(d[1]))
                        .attr("width", xScale.bandwidth())
                        .attr("height", d => yScale(d[0]) - yScale(d[1]))
                        .attr("class", "stack")
                        .attr("fill", (d) => {
                            if (+d.data.actcum + +d.data.actual < d.data.compcum) {
                                console.log("negative/orange")
                                return colormap['negative'][d.subgroup]
                            } else {
                                return colormap['positive'][d.subgroup]
                            }
                        })

            const innerlabels = bars
                    .selectAll("text .stacked-label")
                    .data(d => d)
                    .enter()
                    .append("text")
                        .attr("x", d => xScale(d.data.week) + 4)
                        .attr("y", d => yScale(d[1]) + 4)
                        .text(d => {
                            if (+d.data.actcum === +d[1]) {
                                return ""
                            } else if (+d.data.actcum + +d.data.actspot === +d[1]) {
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
                .data(data_groups)
                .enter()
                .append("text")
                    .attr("x", d => xScale(d.week) + xScale.bandwidth()/2)
                    .attr("y", 0 - 10)
                    .text(d => {
                        const tempVal = (d.actcum + d.actual)/d.compcum
                        if (tempVal >= 1) {
                            return `+${d3.format(",.0%")(tempVal-1)}`
                        } else {
                            return `-${d3.format(",.0%")(1-tempVal)}`
                        }
                    })
                    .attr("text-anchor", "middle")
                    .attr("stroke", d => {
                        if ((d.actcum + d.actual)/d.compcum >= 1.0) {
                            return "#0072b5"
                        } else {
                            return "#d76106"
                        }
                    })
                    .attr("class", "togoallabel")
                    .attr("font-size", "12px")

            const comps = group.append('g')
                .selectAll("rect .goalbar")
                .data(data_groups)
                .enter()
                .append("rect")
                    .attr("x", d => xScale(weekAccessor(d)) - 0.045*(xScale.bandwidth()))
                    .attr("y", d => yScale(compcumAccessor(d)))
                    .attr("width", xScale.bandwidth() + 0.09*(xScale.bandwidth()))
                    .attr("height", 3)
                    .attr("fill", "grey")
                    .attr("fill-opacity", 0.6)
                    .attr("class", "goalbar")
                    .attr("stroke", "black")


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