import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'

looker.plugins.visualizations.add({

    id: "week-day-bar",
    label: "ZDev Week & Day Bars",
    options: {
        show_legend: {
            type: "boolean",
            label: "Show Legend",
            default: true,
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
                   top: 10,
                   right: 10,
                   bottom: 10,
                   left: 10
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

           let data_ready = []

           data.forEach((d) => {
               let entry = {}
               entry['month'] = new Date(d[dimensions[0].name].value + 'T00:00')
               entry['day'] = new Date(d[dimensions[1].name].value + 'T00:00')
               entry['daynum'] = +d[dimensions[2].name].value
               entry['actual'] = d[measures[0].name].value
               data_ready.push(entry)
           })

           console.log("data_ready", data_ready)

           const monthAccessor = d => d.month
           const dayAccessor = d => d.day
           const daynumAccessor = d => d.daynum
           const actualAccessor = d => d.actual

           // filter data - might want to check this?
           const uniqueMonths = [... new Set(data_ready.map(obj => +obj.month))].sort().reverse()
           console.log("uniqueMonths", uniqueMonths)
           const currentMonth = new Date(uniqueMonths[0])
           const priorMonth = new Date(uniqueMonths[1])

           data_ready = data_ready.filter(element => {
               const monthDate = element.month;
               return (monthDate >= priorMonth && monthDate <= currentMonth)
           })

           data_ready = data_ready.sort(function(a,b) {
               return dayAccessor(a) - dayAccessor(b)
           })

           console.log("data_ready filtered", data_ready)

           // group data by week
           function group_by_month(arr) {
               return Object.values(
                   data_ready.reduce((a, {month: month, day: day, daynum: daynum, actual: actual}) => {
                       const key = month;

                       if (a[key] === undefined) {
                           a[key] = {month: key, days: []};
                       }

                       a[key].days.push({
                           day: day,
                           daynum: daynum,
                           actual: actual
                       })

                       return a;
                   }, {})
               )
           }

           const data_group = group_by_month(data_ready)            
           console.log("data_group", data_group)

           // calculate cumulative actuals
           let cumHighs = [];

           data_group.forEach((m,i) => {
               const c = m.days.map((d, j) => ({
                   day: d.day,
                   actcum: m.days.slice(0, j + 1).map(({ actual }) => actual).reduce((x,y) => x + y)
               }))
               console.log(`c - ${i}`, c)

               m.days = m.days.map((item, j) => Object.assign({}, item, c[j]))

               cumHighs.push(d3.max(m.days, d => d.actcum))
           })

           console.log("data_group cum", data_group)
           console.log("cumHighs", cumHighs)

           
           // X-AXIS
           const xScale = d3.scaleLinear()
               .domain(d3.extent(data_ready, d => daynumAccessor(d)))
               .range([0, boundedWidth])

           // Y-AXIS
           const yScale = d3.scaleLinear()
               .domain([0, Math.max(...cumHighs)])
               .range([boundedHeight, 0])

           // DRAW DATA
           const line = d3.line()
               .defined(function(d) { return d.actcum != null && d.actcum != 0})
               .curve(d3.curveNatural)
               .x(function(d) { return xScale(d.daynum)})
               .y(function(d) { return yScale(d.actcum)})

           console.log("made line", line)

           const currentLine = group.append("path")
               .data([data_group[1].days])
               .attr("class", "currentmonth")
               .attr("d", line)
               .attr("fill", "none")
               .attr("stroke", "#323232")
               .attr("stroke-width", "2.5px")

           const priorLine = group.append("path")
               .data([data_group[0].days])
               .attr("class", "priormonth")
               .attr("d", line)
               .attr("fill", "none")
               .attr("stroke", "#323232")
               .attr("stroke-width", "2px")
               .attr("stroke-dasharray", "5 3")

       // legend
       if (config.show_legend ) {
           const legendContainer = group.append("g")
               .attr("transform", "translate(0,0)")
               .classed("legendContainer", true)

           const legendCurrent = legendContainer.append("g")
               .classed("legend", true)
               .attr("transform", `translate(6, 2)`)

           legendCurrent.append("line")
               .attr("x1", 6)
               .attr("x2", 25)
               .attr("y1", 2)
               .attr("y2", 2)
               .attr("stroke", "#323232")
               .attr("stroke-width", "2.5px")

           legendCurrent.append("text")
               .attr("x", 30)
               .attr("y", 2)
               .style("text-anchor", "start")
               .style("dominant-baseline", "middle")
               .style("font-size", 11)
               .attr("color", "#323232")
               .text("Current Month")

           const legendPrior = legendContainer.append("g")
               .classed("legend", true)
               .attr("transform", `translate(6, 10)`)

           legendPrior.append("line")
               .attr("x1", 6)
               .attr("x2", 25)
               .attr("y1", 10)
               .attr("y2", 10)
               .attr("stroke", "#323232")
               .attr("stroke-width", "2.5px")
               .attr("stroke-dasharray", "5 3")

           legendPrior.append("text")
               .attr("x", 30)
               .attr("y", 10)
               .style("text-anchor", "start")
               .style("dominant-baseline", "middle")
               .style("font-size", 11)
               .attr("color", "#323232")
               .text("Prior Month")
       }

       


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
});