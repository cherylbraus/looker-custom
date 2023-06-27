import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'

looker.plugins.visualizations.add({
    // Id and Label are legacy properties that no longer have any function besides documenting
    // what the visualization used to have. The properties are now set via the manifest
    // form within the admin/visualizations page of Looker.

    id: "line_forecast",
    label: "ZDEV Forecast Line",
    options: {
        y_label: {
            type: "string",
            label: "Y Axis Label",
            display: "text",
            default: "",
            section: "Axes",
            order: 1
        },  
        y_format: {
            type: "string",
            label: "Y Value Format",
            display: "text",
            default: ",.2f",
            section: "Axes",
            order: 2
        },
        show_xlabel: {
            type: "boolean",
            label: "Show X Axis Label",
            default: false,
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
        },
        x_format: {
            type: "string",
            label: "X Value Format",
            display: "text",
            default: "%b %-d",
            section: "Axes",
            order: 5
        },    
        months_forecasted: {
            type: "string",
            label: "# Months to Forecast",
            display: "text",
            default: "3",
            section: "Settings",
            order: 1
        },
        curve_bool: {
            type: "boolean",
            label: "Curved Line",
            default: false,
            section: "Settings",
            order: 2
        },    
      },

    // Set up the initial state of the visualization
    create: function(element, config) {
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
                  font-family: Roboto;
                  font-size: 12px;
              }
              .tick {
                font-family: Roboto;
              }
              .label {
                font-size: 10px;
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
  
              .inner-x-axis text {
                font-size: 9px;
                color: #3a4245;
                visibility: visible;
              }
  
              .x-axis text .hide, .y-axis text .hide {
                visibility: hidden;
              }
  
              .x-axis line, .y-axis line {
                stroke: #f0f0f0;
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
              .error-container {
                margin: 0;
                position: absolute;
                top: 50%;
                -ms-transform: translateY(-50%);
                transform: translateY(-50%);
                text-align:center;
                width:100%;
              }
              .error {
                font-family:Roboto;
                font-size:16px
              }
              .error-header {
                font-family:Roboto;
                font-weight:700;
                font-size:16px
              }
              #value-header {
                padding-top: 8px;
                border-top: solid 1px rgb(222, 225, 229);
              }
            </style>
            <svg>
            </svg>
            <div class="tooltip"></div>`;
        element.style.fontFamily = `Roboto,"Open Sans", "Helvetica", sans-serif`
    },
    updateAsync: function(data, element, config, queryResponse, details, done, environment = "prod") {
      if (environment == "prod") {
            if (!handleErrors(this, queryResponse, {
                min_pivots: 0, max_pivots: 0,
                min_dimensions: 3, max_dimensions: 40,
                min_measures: 0, max_measures: 40
            })) return
        }

    try {

        const margin = {top: 35, right: 30, bottom: 50, left: 70};
        const width = element.clientWidth - margin.left - margin.right;
        const height = element.clientHeight - margin.top - margin.bottom;
    
        const svg = (
            d3.select(element).select('svg')
                .html('')
                .attr('width', '100%')
                .attr('height', '100%')
        )

        const group = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`)
            .attr('width', width)
            .attr('height', height)
            .classed('group', true)
            // .style('pointer-events', 'all')

        // const mdata = dat.data.slice(0, 98)
        // const queryResponse = dat.queryResponse

        const dimensions = queryResponse.fields.dimension_like
        const measures = queryResponse.fields.measure_like

        console.log("dimensions", dimensions)
        console.log("measures", measures)
        console.log("data initial", data)

        const parseTime = d3.timeParse("%Y-%m-%d")

        // determine if data is historical (today or earlier) or forecast (after today)
        let today = new Date()
        today.setHours(0,0,0)
        console.log("today", today)

        let data_ready = []
        data.forEach((d) => {
            let entry = {}
            entry['date'] = parseTime(d[dimensions[0].name].value)
            entry['value'] = +d[dimensions[1].name].value
            entry['histpred'] = +d[dimensions[2].name].value
            entry['category'] = entry['date'] > today ? "Forecast" : "Historical"
            entry['date'] = new Date(entry['date'].getFullYear(), entry['date'].getMonth(), 1, 0, 0, 0)
            data_ready.push(entry)
        })

        data_ready.sort(function(a, b) {
            return a.date - b.date
        })

        const dateAccessor = d => d.date
        const categoryAccessor = d => d.category
        const valueAccessor = d => d.value
        const histpredAccessor = d => d.histpred

        console.log("data_ready", data_ready)

        const hist = data_ready.filter(d => {
            return (d.category == "Historical")
        })

        let forecast = data_ready.filter(d => {
            return (d.category == "Forecast")
        })

        // filter to number of months to forecast in future
        forecast = forecast.slice(0, config.months_forecasted)

        console.log("forecast filter", forecast)

        const lasthist = hist[hist.length - 1]
        lasthist['category'] = 'Forecast'

        forecast.push(lasthist)

        forecast.sort(function(a, b) {
            return a.date - b.date
        })

        console.log("hist", hist)
        console.log("forecast", forecast)
        console.log("lasthist", lasthist)

        // calculate standard deviation of historical values
        const valueArray = data_ready.map(valueAccessor)

        function dev(arr) {
            let mean = arr.reduce((acc, curr) => {
                return acc + curr
            }, 0) / arr.length;

            arr = arr.map((k) => {
                return (k - mean) ** 2
            })

            let sum = arr.reduce((acc, curr) => acc + curr, 0)

            let variance = sum / arr.length
            return Math.sqrt(sum / arr.length)
        }

        const valueStd = dev(valueArray)
        const stepStd = valueStd / (forecast.length - 1)

        console.log("standard deviation", valueStd, stepStd)

        // generate progression to +1/-1 std in forecast object array
        forecast.forEach((d, i) => {
            d['stdint'] = stepStd * i
            d['stdup'] = d.value + d.stdint
            d['stddown'] = d.value - d.stdint
        })

        console.log('forecast', forecast)

        // axes
        const xScale = d3.scaleTime()
            // .domain(d3.extent(data_ready, d => dateAccessor(d)))
            .domain([d3.min(data_ready, d => dateAccessor(d)), d3.max(forecast, d => dateAccessor(d))])
            .range([0, width])

        const xAxisGenerator = d3.axisBottom()
            .scale(xScale)
            .tickPadding(10)
            .tickSize(0)
            .tickFormat((d) => `${d3.timeFormat(config.x_format)(d)}`)

        const xAxis = group.append('g')
            .call(xAxisGenerator)
                .style('transform', `translateY(${height}px)`)
                .attr('class', 'x-axis')

        if (config.show_xlabel == true) {
            const xAxisLabel = xAxis.append('text')
                .attr('class', 'axis-label')
                .attr('x', width / 2)
                .attr('y', margin.bottom - 7)
                .style('text-anchor', 'middle')
                .text(config.x_label ? config.x_label : dimensions[0].label_short) // use label_short
        }
        
        const yMin = Math.min(d3.min(data_ready.map(d => valueAccessor(d))), 
                                d3.min(forecast.map(d => d.stddown)))
        const yMax = Math.max(d3.max(data_ready.map(d => valueAccessor(d))), 
                                d3.max(forecast.map(d => d.stdup)))

        const yScale = d3.scaleLinear()
            .domain([yMin, yMax])
            .range([height, 0])

        const yAxisGenerator = d3.axisLeft()
            .scale(yScale)
            .tickPadding(10)
            .tickSize(-width)
            .tickFormat((d) => `${d3.format(config.y_format)(d)}`)

        const yAxis = group.append('g')
            .call(yAxisGenerator)
                .attr('class', 'y-axis')

        const yAxisLabel = yAxis.append('text')
            .attr('class', 'axis-label')
            .attr('x', (-height/2))
            .attr('y', -margin.left + 13)
            .style('transform', 'rotate(-90deg)')
            .text(config.y_label ? config.y_label : dimensions[1].label_short) // use label_short

        console.log("axes", xScale.domain(), xScale.range(), yScale.domain(), yScale.range())

        // draw data
        const area = d3.area()
            .x(function(d) { return xScale(d.date)})
            .y0(function(d) { return yScale(d.stdup)})
            .y1(function(d) { return yScale(d.stddown)})

        const stdarea = group.append("path")
            .datum(forecast)
            .attr('class', 'area')
            .attr('d', area)
            .style("fill", "lightgrey")
            .style("opacity", .6)

        console.log("stdarea", stdarea)

        const line = d3.line()
            .defined(function(d) { return d['value'] != null})
            .x(function(d) { return xScale(d.date)})
            .y(function(d) { return yScale(d['value'])})

        const line2 = d3.line()
            .defined(function(d) { return d['histpred'] != null})
            .x(function(d) { return xScale(d.date)})
            .y(function(d) { return yScale(d['histpred'])})

        if (config.curve_bool == true) {
            line    
                .curve(d3.curveNatural)
            line2
                .curve(d3.curveNatural)
        }

        const histLine = group.append("path")
            .data([hist])
            .attr('class', 'histline')
            .attr('d', line)
            .attr('fill', 'none')
            .attr('stroke', '#007b82')
            .attr('stroke-width', '1.5px')

        const histpredLine = group.append("path")
            .data([hist])
            .attr('class', 'histpredline')
            .attr('d', line2)
            .attr('fill', 'none')
            .attr('stroke', '#007b82')
            .attr('stroke-width', '1.5px')
            .attr('stroke-dasharray', '3 3')

        const forecastLine = group.append("path")
            .data([forecast])
            .attr('class', 'forecastline')
            .attr('d', line)
            .attr('fill', 'none')
            .attr('stroke', '#323232')
            .attr('stroke-width', '2px')
            .attr('stroke-dasharray', '3 3')

        // legend
        const legend = group.append('g')
            .attr("transform", `translate(0, -22)`)
            .classed("legendContainer", true)

        const legendHist = legend.append('g')
            .classed('legend', true)
            .attr('transform', `translate(0, 0)`)

        legendHist.append("line")
            .attr('x1', 0)
            .attr('x2', 25)
            .attr('y1', 2)
            .attr('y2', 2)
            .style('stroke', '#007b82')
            .style('stroke-width', '1.5px')

        legendHist.append('text')
            .attr('x', 30)
            .attr('y', 3)
            .style('text-anchor', 'start')
            .style('dominant-baseline', 'middle')
            .style('font-size', 11)
            .text('Historical')

        const legendHistPred = legend.append('g')
            .classed('legend', true)
            .attr('transform', 'translate(90, 0)')

        legendHistPred.append("line")
            .attr('x1', 0)
            .attr('x2', 25)
            .attr('y1', 2)
            .attr('y2', 2)
            .style('stroke', '#007b82')
            .style('stroke-width', '1.5px')
            .attr('stroke-dasharray', '3 3')

        legendHistPred.append('text')
            .attr('x', 30)
            .attr('y', 3)
            .style('text-anchor', 'start')
            .style('dominant-baseline', 'middle')
            .style('font-size', 11)
            .text('Hist. Prediction') 

        const legendForecast = legend.append('g')
            .classed('legend', true)
            .attr('transform', 'translate(210, 0)')

        legendForecast.append("line")
            .attr('x1', 0)
            .attr('x2', 25)
            .attr('y1', 2)
            .attr('y2', 2)
            .style('stroke', '#323232')
            .style('stroke-width', '2px')
            .attr('stroke-dasharray', '3 3')

        legendForecast.append('text')
            .attr('x', 30)
            .attr('y', 3)
            .style('text-anchor', 'start')
            .style('dominant-baseline', 'middle')
            .style('font-size', 11)
            .text('Forecast') 

        const legendProgression = legend.append('g')
            .classed('legend', true)
            .attr('transform', 'translate(300, 0)')

        legendProgression.append("rect")
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 25)
            .attr('height', 5)
            .attr("fill", "lightgrey")
            .attr("fill-opacity", .6)

        legendProgression.append('text')
            .attr('x', 30)
            .attr('y', 3)
            .style('text-anchor', 'start')
            .style('dominant-baseline', 'middle')
            .style('font-size', 11)
            .text('Progression to +/- 1 Standard Deviation')

        // tooltips
        // const tt = d3.select(".tooltip")
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
        
        tooltip.html(`<div id="tt-header"></div><p id="tt-body"></p>`)

        const tooltipHeader = tooltip.select("#tt-header")
        const tooltipBody = tooltip.select("#tt-body")

        const tt = group.append("g")
            .classed("tooltip", true)
            .attr("pointer-events", "all")

        const tooltipCircles = tt.append("g")
            .classed("tooltipCircle", true)

        const tooltipCirclesPred = tt.append("g")
            .classed("tooltipCirclePred", true)

        const tooltipBox = tt.append("rect")
            .classed("tooltipBox", true)
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "transparent")
            .style('pointer-events', 'all')
            .on("mousemove", drawTooltip)
            .on("mouseout", removeTooltip)

        function removeTooltip() {
            tooltip 
                .transition()
                .duration(0)
                .style("opacity", 0)
            tooltipCircles.selectAll("circle").remove();
            tooltipCirclesPred.selectAll("circle").remove();
        }

        function drawTooltip() {
            const mousePosition = d3.mouse(this)
            let hoveredDate = xScale.invert(mousePosition[0])
            hoveredDate = new Date(hoveredDate.getFullYear(), hoveredDate.getMonth(), hoveredDate.getDate(), 0, 0, 0)
            const lasthistDate = lasthist.date

            console.log("date comp", hoveredDate, lasthistDate)

            const hoveredDayNum = hoveredDate.getDate()
            if (hoveredDayNum > 15) {
                hoveredDate = new Date(hoveredDate.getFullYear(), hoveredDate.getMonth()+1, 1, 0, 0, 0)
            } else {
                hoveredDate = new Date(hoveredDate.getFullYear(), hoveredDate.getMonth(), 1, 0, 0, 0)
            }

            // if forecast date, change date to be closest month start
            const type = hoveredDate > lasthist.date ? 'forecast' : 'hist'

            console.log("updated hoveredDate", hoveredDate)

            const ttdata = []                
            
            if (hoveredDate <= lasthist.date) {
                const filtered = hist.filter(d => {
                    return d3.timeFormat("%b %d %Y")(d.date) == d3.timeFormat("%b %d %Y")(hoveredDate)
                })

                console.log("filtered hist", filtered)

                if (filtered.length > 0) {
                    ttdata.push(filtered[0])
                }
            } else {
                const filtered = forecast.filter(d => {
                    return d3.timeFormat("%b %d %Y")(d.date) == d3.timeFormat("%b %d %Y")(hoveredDate)
                })

                console.log('filtered forecast', filtered)

                if (filtered.length > 0) {
                    ttdata.push(filtered[0])
                }
            }

            tooltipCircles.selectAll("circle").remove()
            tooltipCircles.selectAll("circle")
                .data(ttdata)
                .enter()
                .append("circle")
                .attr("r", 4)
                .attr("cx", d => xScale(d.date))
                .attr("cy", d => yScale(d.value))
                .style("fill", d => d.date > lasthist.date ? "#323232" :"#007b82")

            tooltipCirclesPred.selectAll("circle").remove()
            if (ttdata[0].date <= lasthist.date) {
                tooltipCirclesPred.selectAll("circle")
                    .data(ttdata)
                    .enter()
                    .append("circle")
                    .attr("r", 4)
                    .attr("cx", d => xScale(d.date))
                    .attr("cy", d => yScale(d.histpred))
                    .style("fill", "#ffffff")
                    .style("stroke", "#007b82")
            }

            console.log("ttdata", ttdata)

            // have title case for the labels in the tooltip text
            function titleCase(str) {
                let sentence = str.toLowerCase().split(" ");
                for (let i = 0; i < sentence.length; i++) {
                sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1)
                }
                return sentence.join(" ")
            }

            tooltip 
                .transition()
                .duration(0)
                .style("opacity", 0.95)

            tooltipHeader.html(d3.timeFormat("%b %Y")(ttdata[0].date) + "<hr>")
            if (type == 'hist') {
                tooltipBody.html(
                    `<span style="float:left;">${titleCase(config.y_label ? config.y_label : dimensions[1].label_short)}:&nbsp&nbsp</span>` + // use label_short
                    `<span style="float:right;">${d3.format(config.y_format)(ttdata[0].value)}</span><br>` + 
                    `<span style="float:left;">Historical Prediction:&nbsp&nbsp</span>` + 
                    `<span style="float:right;">${d3.format(config.y_format)(ttdata[0].histpred)}</span>` 
                )
            } else {
                tooltipBody.html(
                    `<span style="float:left;">${titleCase(config.y_label ? config.y_label : dimensions[1].label_short)}:&nbsp&nbsp</span>` + // use label_short
                    `<span style="float:right;">${d3.format(config.y_format)(ttdata[0].value)}</span><br>` + 
                    `<span style="float:left;">Upper Range:&nbsp&nbsp</span>` + 
                    `<span style="float:right;">${d3.format(config.y_format)(ttdata[0].stdup)}</span><br>` + 
                    `<span style="float:left;">Lower Range:&nbsp&nbsp</span>` + 
                    `<span style="float:right;">${d3.format(config.y_format)(ttdata[0].stddown)}</span>` 
                )
            }                

            if (d3.event.pageY < height * 0.7) {
                tooltip.style("top", d3.event.pageY - 30 + 'px')
            } else {
                tooltip.style("top", d3.event.pageY - 150 + 'px')
            }

            if (d3.event.pageX < width * 0.7) {
                tooltip.style("left", d3.event.pageX + 10 + 'px')
            } else {
                tooltip.style("left", d3.event.pageX - 250 + 'px')
            }
        }
        
    } catch(error) {
        console.log(error)
    }
    done()
    // }
    }   
})