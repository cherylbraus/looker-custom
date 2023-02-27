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

        </style>
        <svg>
        </svg>`;
        element.style.fontFamily = `"Open Sans", "Helvetica", sans-serif`       
    },

    updateAsync: function(data, element, config, queryResponse, details, done, environment = "prod") {
        if (environment == "prod") {
            if (!handleErrors(this, queryResponse, {
                min_pivots: 0, max_pivots: 0,
                min_dimensions: 1, max_dimensions: 10,
                min_measures: 1, max_measures: 10
            })) return
        }
        
        try {

             // set dimensions
             let margin = {
                    top: 10,
                    right: 10,
                    bottom: 60,
                    left: 60
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
                entry['count'] = d[measures[0].name].value
                data_ready.push(entry)
            })

            console.log("data_ready", data_ready)

            const monthAccessor = d => d.month
            const countAccessor = d => d.count

            console.log("here")

            const xScale = d3.scaleTime()
                .domain(d3.extent(data_ready, d => monthAccessor(d)))
                .range([0, boundedWidth])

            const formatDate = d3.timeFormat("%b'%-y")

            const xAxisGenerator = d3.axisBottom()
                .scale(xScale)
                .tickPadding(25)
                .tickSize(0)
                .tickFormat((d) => formatDate(d))
    
            const xAxis = group.append("g")
                .call(xAxisGenerator)
                    .style("transform", `translateY(${boundedHeight}px)`)
                    .attr("class", "x-axis")

            console.log("here1")

            // Y-AXIS
            const yScale = d3.scaleLinear()
                .domain(d3.extent(data_ready, d => countAccessor(d)))
                .range([boundedHeight, 0])

            const yAxisGenerator = d3.axisLeft()
                .scale(yScale)
                .tickPadding(10)
    
            const yAxis = group.append("g")
                .call(yAxisGenerator)
                    .attr("class", "y-axis")

            // DRAW DATA
            const line = d3.line()
                .x(function(d) { return xScale(d.month)})
                .y(function(d) { return yScale(d.count)})

            console.log("made line", line)

            const currentLine = group.append("path")
                .datum(data_ready)
                .attr("d", line)
                .attr("fill", "none")
                .attr("stroke", "#323232")
                .attr("stroke-width", "2.5px")

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
