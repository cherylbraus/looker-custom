import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'

export const object = {
    // Id and Label are legacy properties that no longer have any function besides documenting
    // what the visualization used to have. The properties are now set via the manifest
    // form within the admin/visualizations page of Looker.

    id: "bar_race",
    label: "ZDev Bar Race",
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
            default: "false",
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
              .tooltip {
                box-shadow: rgb(60 64 67 / 30%) 0px 1px 2px 0px, rgb(60 64 67 / 15%) 0px 2px 6px 2px;
                font-size: 11px;
                pointer-events: none;
              }
              .tooltip h1 {
                font-size: 11px;
                color: #c3c3c3;
                text-transform: uppercase;
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
                min_pivots: 1, max_pivots: 1,
                min_dimensions: 1, max_dimensions: 40,
                min_measures: 1, max_measures: 40
            })) return
        }

    try {

        const margin = {top: 35, right: 30, bottom: 50, left: 70};
        const width = element.clientWidth - margin.left - margin.right;
        const height = element.clientHeight - margin.top - margin.bottom;
    
        d3.json('./dataBarRace.json').then(function(dat) { 
            // setup
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

            const mdata = dat.data.slice(0, 98)
            const queryResponse = dat.queryResponse

            const dimensions = queryResponse.fields.dimension_like
            const measures = queryResponse.fields.measure_like
            const pivots = queryResponse.fields.pivots

            console.log("dimensions", dimensions)
            console.log("measures", measures)
            console.log("pivots", pivots)
            console.log("data initial", mdata)

            const parseTime = d3.timeParse("%Y")

            let data_ready = []
            mdata.forEach((d) => {
                let entry = {}
                entry['name'] = d[dimensions[0].name].value
                entry['cat'] = d[dimensions[1].name].value
                entry['value'] = d[measures[0].name]
                data_ready.push(entry)
            })

            let data_final = []
            data_ready.forEach(d => {
                const dateKeys = Object.keys(d['value'])
                dateKeys.forEach(t => {
                    let entry = {}
                    entry['name'] = d.name
                    entry['cat'] = d.cat
                    entry['date'] = t //parseTime(t)
                    entry['value'] = d['value'][t].value
                    data_final.push(entry)
                })
            })

            console.log("data_ready", data_ready)
            console.log("data_final", data_final)

            const names = new Set(data_final.map(d => d.name))
            const dates = new Set(data_final.map(d => d.date))

            console.log("names", names)
            console.log("dates", dates)

            // Create a nested structure with d3.nest()
            var nest = d3.nest()
                .key(function(d) { return d.date; })
                .key(function(d) { return d.name; })
                .rollup(function(v) { return v[0].value; })
                .entries(data_final);

            // Map each nested entry to a Date and a Map of names/values
            const datevalues = nest.map(function(d) {
            var nameValueMap = new Map();
                d.values.forEach(function(e) {
                    nameValueMap.set(e.key, e.value);
                });
                return [new Date(d.key), nameValueMap];
            })
            .sort(function(a, b) { return d3.ascending(a[0], b[0]); });

            console.log('datevalues', datevalues)

            const duration = 250;
            const n = 12;
            const k = 10;

            function rank(value) {
                const data = Array.from(names, name => ({name, value: value(name)}));
                data.sort((a, b) => d3.descending(a.value, b.value));
                for (let i = 0; i < data.length; ++i) data[i].rank = Math.min(n, i);
                return data;
              }

            const test = rank(name => datevalues[0][1].get(name))
            console.log("test rank", test)

            

            // let data_group = []
            // dates.forEach(d => {
            //     let mainEntry = {}
            //     mainEntry['date'] = parseTime(d)

            //     const tmp = data_final.filter(t => {
            //         return (t.date == d)
            //     })

            //     let dataSet = []
            //     tmp.forEach(t => {
            //         let entry = {}
            //         entry['name'] = t['name']
            //         entry['cat'] = t['cat']
            //         entry['value'] = +t['value']
            //         dataSet.push(entry)
            //     })

            //     mainEntry['dataSet'] = dataSet
            //     data_group.push(mainEntry)
            // })

            // data_group.sort((a,b) => a.date - b.date)

            // data_group.forEach(d => {
            //     d['dataSet'].sort((a, b) => b.value - a.value)
            //     d['dataSet'].forEach((dd, i) => {
            //         dd.rank = i
            //     })
            // })

            // console.log("data_group", data_group)

            // // axes
            // const xScale = d3.scaleLinear()
            //     .range([0, width])

            // const xAxisGenerator = d3.axisBottom()
            //     .scale(xScale)
            //     .tickPadding(10)
            //     .tickSize(0)
            //     .tickFormat(d => `${d}`)

            // const xAxis = group.append('g')
            //     .call(xAxisGenerator)
            //         .style("transform", `translateY(${height}px)`)
            //         .attr("class", "x-axis")
            
            // const yScale = d3.scaleBand()
            //     .range([0, height])
            //     .padding(0.2)

            // const yAxisGenerator = d3.axisLeft()
            //     .scale(yScale)
            //     .tickPadding(10)
            //     .tickFormat(d => `${d}`)

            // const yAxis = group.append('g')
            //     .call(yAxisGenerator)
            //         .attr("class", "y-axis")

            // // chart
            // const duration = 250;
            // const n = 12;
            // const k = 10;

            // function rank(value) {
            //     const copyObject = (obj) => {
            //         let result = {}
            //         Object.entries(obj).forEach(([key, value]) => {
            //             result[key] = value;
            //         });
            //         return result
            //     };
            //     data = copyObject(data_group);
            //     console.log("copied data", data)
            //     for (let i = 0; i < data.length; ++i) data[i].rank = Math.min(n, i);
            //     return data;
            // };

            // function keyframes() {
            //     const keyframes = [];
            //     let ka, a, kb, b;
            //     for ([[ka, a], [kb, b]] of d3.pairs(dates)) {
            //         for (let i = 0; i < k; ++i) {
            //             const t = i / k;
            //             keyframes.push([
            //                 new Date(ka * (1 - t) + kb * t),
            //                 rank(name => (a.get(name) || 0) * (1  - t) + (b.get(name) || 0) * t)
            //             ])
            //         }
            //     }
            //     keyframes.push([new Date(kb), rank(name => b.get(name) || 0)])
            //     return keyframes;
            // }

            // // replay;

            // const updateBars = bars(svg);
            // const updateAxis = axis(svg);
            // const updateLabels = labels(svg);
            // const updateTicker = ticker(svg);

            // yield svg.node();

            // for (const keyframe of keyframes) {
            //     const transition = svg.transition()
            //         .duration(duration)
            //         .ease(d3.easeLinear);

            //     xScale.domain([0, keyframe[1][0].value]);

            //     updateAxis(keyframe, transition);
            //     updateBars(keyframe, transition);
            //     updateLabels(keyframe, transition);
            //     updateTicker(keyframe, transition);

            //     invalidation.then(() => svg.interrupt());
            //     await transition.end();
            // }


            // // axes
            // const xScale = d3.scaleTime()
            //     // .domain(d3.extent(data_ready, d => dateAccessor(d)))
            //     .domain([d3.min(data_ready, d => dateAccessor(d)), d3.max(forecast, d => dateAccessor(d))])
            //     .range([0, width])

            // const xAxisGenerator = d3.axisBottom()
            //     .scale(xScale)
            //     .tickPadding(10)
            //     .tickSize(0)
            //     .tickFormat((d) => `${d3.timeFormat(config.x_format)(d)}`)

            // const xAxis = group.append('g')
            //     .call(xAxisGenerator)
            //         .style('transform', `translateY(${height}px)`)
            //         .attr('class', 'x-axis')

            // if (config.show_xlabel == "true") {
            //     const xAxisLabel = xAxis.append('text')
            //         .attr('class', 'axis-label')
            //         .attr('x', width / 2)
            //         .attr('y', margin.bottom - 7)
            //         .style('text-anchor', 'middle')
            //         .text(config.x_label ? config.x_label : dimensions[0].label_short) // use label_short
            // }
            
            // const yMin = Math.min(d3.min(data_ready.map(d => valueAccessor(d))), 
            //                         d3.min(forecast.map(d => d.stddown)))
            // const yMax = Math.max(d3.max(data_ready.map(d => valueAccessor(d))), 
            //                         d3.max(forecast.map(d => d.stdup)))

            // const yScale = d3.scaleLinear()
            //     .domain([yMin, yMax])
            //     .range([height, 0])

            // const yAxisGenerator = d3.axisLeft()
            //     .scale(yScale)
            //     .tickPadding(10)
            //     .tickSize(-width)
            //     .tickFormat((d) => `${d3.format(config.y_format)(d)}`)

            // const yAxis = group.append('g')
            //     .call(yAxisGenerator)
            //         .attr('class', 'y-axis')

            // const yAxisLabel = yAxis.append('text')
            //     .attr('class', 'axis-label')
            //     .attr('x', (-height/2))
            //     .attr('y', -margin.left + 13)
            //     .style('transform', 'rotate(-90deg)')
            //     .text(config.y_label ? config.y_label : dimensions[1].label_short) // use label_short

            // console.log("axes", xScale.domain(), xScale.range(), yScale.domain(), yScale.range())

            // // draw data
            // const area = d3.area()
            //     .x(function(d) { return xScale(d.date)})
            //     .y0(function(d) { return yScale(d.stdup)})
            //     .y1(function(d) { return yScale(d.stddown)})

            // const stdarea = group.append("path")
            //     .datum(forecast)
            //     .attr('class', 'area')
            //     .attr('d', area)
            //     .style("fill", "lightgrey")
            //     .style("opacity", .6)

            // console.log("stdarea", stdarea)

            // const line = d3.line()
            //     .defined(function(d) { return d['value'] != null})
            //     .x(function(d) { return xScale(d.date)})
            //     .y(function(d) { return yScale(d['value'])})

            // const line2 = d3.line()
            //     .defined(function(d) { return d['histpred'] != null})
            //     .x(function(d) { return xScale(d.date)})
            //     .y(function(d) { return yScale(d['histpred'])})

            // if (config.curve_bool == "true") {
            //     line    
            //         .curve(d3.curveNatural)
            //     line2
            //         .curve(d3.curveNatural)
            // }

            // const histLine = group.append("path")
            //     .data([hist])
            //     .attr('class', 'histline')
            //     .attr('d', line)
            //     .attr('fill', 'none')
            //     .attr('stroke', '#007b82')
            //     .attr('stroke-width', '1.5px')

            // const histpredLine = group.append("path")
            //     .data([hist])
            //     .attr('class', 'histpredline')
            //     .attr('d', line2)
            //     .attr('fill', 'none')
            //     .attr('stroke', '#007b82')
            //     .attr('stroke-width', '1.5px')
            //     .attr('stroke-dasharray', '3 3')

            // const forecastLine = group.append("path")
            //     .data([forecast])
            //     .attr('class', 'forecastline')
            //     .attr('d', line)
            //     .attr('fill', 'none')
            //     .attr('stroke', '#323232')
            //     .attr('stroke-width', '2px')
            //     .attr('stroke-dasharray', '3 3')

            // // legend
            // const legend = group.append('g')
            //     .attr("transform", `translate(0, -22)`)
            //     .classed("legendContainer", true)

            // const legendHist = legend.append('g')
            //     .classed('legend', true)
            //     .attr('transform', `translate(0, 0)`)

            // legendHist.append("line")
            //     .attr('x1', 0)
            //     .attr('x2', 25)
            //     .attr('y1', 2)
            //     .attr('y2', 2)
            //     .style('stroke', '#007b82')
            //     .style('stroke-width', '1.5px')

            // legendHist.append('text')
            //     .attr('x', 30)
            //     .attr('y', 3)
            //     .style('text-anchor', 'start')
            //     .style('dominant-baseline', 'middle')
            //     .style('font-size', 11)
            //     .text('Historical')

            // const legendHistPred = legend.append('g')
            //     .classed('legend', true)
            //     .attr('transform', 'translate(90, 0)')

            // legendHistPred.append("line")
            //     .attr('x1', 0)
            //     .attr('x2', 25)
            //     .attr('y1', 2)
            //     .attr('y2', 2)
            //     .style('stroke', '#007b82')
            //     .style('stroke-width', '1.5px')
            //     .attr('stroke-dasharray', '3 3')

            // legendHistPred.append('text')
            //     .attr('x', 30)
            //     .attr('y', 3)
            //     .style('text-anchor', 'start')
            //     .style('dominant-baseline', 'middle')
            //     .style('font-size', 11)
            //     .text('Hist. Prediction') 

            // const legendForecast = legend.append('g')
            //     .classed('legend', true)
            //     .attr('transform', 'translate(210, 0)')

            // legendForecast.append("line")
            //     .attr('x1', 0)
            //     .attr('x2', 25)
            //     .attr('y1', 2)
            //     .attr('y2', 2)
            //     .style('stroke', '#323232')
            //     .style('stroke-width', '2px')
            //     .attr('stroke-dasharray', '3 3')

            // legendForecast.append('text')
            //     .attr('x', 30)
            //     .attr('y', 3)
            //     .style('text-anchor', 'start')
            //     .style('dominant-baseline', 'middle')
            //     .style('font-size', 11)
            //     .text('Forecast') 

            // const legendProgression = legend.append('g')
            //     .classed('legend', true)
            //     .attr('transform', 'translate(300, 0)')

            // legendProgression.append("rect")
            //     .attr('x', 0)
            //     .attr('y', 0)
            //     .attr('width', 25)
            //     .attr('height', 5)
            //     .attr("fill", "lightgrey")
            //     .attr("fill-opacity", .6)

            // legendProgression.append('text')
            //     .attr('x', 30)
            //     .attr('y', 3)
            //     .style('text-anchor', 'start')
            //     .style('dominant-baseline', 'middle')
            //     .style('font-size', 11)
            //     .text('Progression to +/- 1 Standard Deviation')

            // // tooltips
            // // const tt = d3.select(".tooltip")
            // const tooltip = d3.select(".tooltip")
            //     .style("position", "absolute")
            //     .style("padding", "5px")
            //     .style("background-color", "white")
            //     .style("opacity", 0)
            //     .style("border-radius", "4px")
            //     .style("display", "block")
            //     .style("border", "solid")
            //     .style("border-color", "lightgrey")
            //     .style("border-width", ".5px")
            //     .attr("pointer-events", "none")
            //     .classed("tooltip", true)
            
            // tooltip.html(`<div id="tt-header"></div><p id="tt-body"></p>`)

            // const tooltipHeader = tooltip.select("#tt-header")
            // const tooltipBody = tooltip.select("#tt-body")

            // const tt = group.append("g")
            //     .classed("tooltip", true)
            //     .attr("pointer-events", "all")

            // const tooltipCircles = tt.append("g")
            //     .classed("tooltipCircle", true)

            // const tooltipCirclesPred = tt.append("g")
            //     .classed("tooltipCirclePred", true)
    
            // const tooltipBox = tt.append("rect")
            //     .classed("tooltipBox", true)
            //     .attr("width", width)
            //     .attr("height", height)
            //     .attr("fill", "transparent")
            //     .style('pointer-events', 'all')
            //     .on("mousemove", drawTooltip)
            //     .on("mouseout", removeTooltip)

            // function removeTooltip() {
            //     tooltip 
            //         .transition()
            //         .duration(0)
            //         .style("opacity", 0)
            //     tooltipCircles.selectAll("circle").remove();
            //     tooltipCirclesPred.selectAll("circle").remove();
            // }

            // function drawTooltip() {
            //     const mousePosition = d3.mouse(this)
            //     let hoveredDate = xScale.invert(mousePosition[0])
            //     hoveredDate = new Date(hoveredDate.getFullYear(), hoveredDate.getMonth(), hoveredDate.getDate(), 0, 0, 0)
            //     const lasthistDate = lasthist.date

            //     console.log("date comp", hoveredDate, lasthistDate)

            //     const hoveredDayNum = hoveredDate.getDate()
            //     if (hoveredDayNum > 15) {
            //         hoveredDate = new Date(hoveredDate.getFullYear(), hoveredDate.getMonth()+1, 1, 0, 0, 0)
            //     } else {
            //         hoveredDate = new Date(hoveredDate.getFullYear(), hoveredDate.getMonth(), 1, 0, 0, 0)
            //     }

            //     // if forecast date, change date to be closest month start
            //     const type = hoveredDate > lasthist.date ? 'forecast' : 'hist'

            //     console.log("updated hoveredDate", hoveredDate)

            //     const ttdata = []                
                
            //     if (hoveredDate <= lasthist.date) {
            //         const filtered = hist.filter(d => {
            //             return d3.timeFormat("%b %d %Y")(d.date) == d3.timeFormat("%b %d %Y")(hoveredDate)
            //         })

            //         console.log("filtered hist", filtered)

            //         if (filtered.length > 0) {
            //             ttdata.push(filtered[0])
            //         }
            //     } else {
            //         const filtered = forecast.filter(d => {
            //             return d3.timeFormat("%b %d %Y")(d.date) == d3.timeFormat("%b %d %Y")(hoveredDate)
            //         })

            //         console.log('filtered forecast', filtered)

            //         if (filtered.length > 0) {
            //             ttdata.push(filtered[0])
            //         }
            //     }

            //     tooltipCircles.selectAll("circle").remove()
            //     tooltipCircles.selectAll("circle")
            //         .data(ttdata)
            //         .enter()
            //         .append("circle")
            //         .attr("r", 4)
            //         .attr("cx", d => xScale(d.date))
            //         .attr("cy", d => yScale(d.value))
            //         .style("fill", d => d.date > lasthist.date ? "#323232" :"#007b82")

            //     tooltipCirclesPred.selectAll("circle").remove()
            //     if (ttdata[0].date <= lasthist.date) {
            //         tooltipCirclesPred.selectAll("circle")
            //             .data(ttdata)
            //             .enter()
            //             .append("circle")
            //             .attr("r", 4)
            //             .attr("cx", d => xScale(d.date))
            //             .attr("cy", d => yScale(d.histpred))
            //             .style("fill", "#ffffff")
            //             .style("stroke", "#007b82")
            //     }

            //     console.log("ttdata", ttdata)

            //     // have title case for the labels in the tooltip text
            //     function titleCase(str) {
            //         let sentence = str.toLowerCase().split(" ");
            //         for (let i = 0; i < sentence.length; i++) {
            //         sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1)
            //         }
            //         return sentence.join(" ")
            //     }

            //     tooltip 
            //         .transition()
            //         .duration(0)
            //         .style("opacity", 0.95)

            //     tooltipHeader.html(d3.timeFormat("%b %Y")(ttdata[0].date) + "<hr>")
            //     if (type == 'hist') {
            //         tooltipBody.html(
            //             `<span style="float:left;">${titleCase(config.y_label ? config.y_label : dimensions[1].label_short)}:&nbsp&nbsp</span>` + // use label_short
            //             `<span style="float:right;">${d3.format(config.y_format)(ttdata[0].value)}</span><br>` + 
            //             `<span style="float:left;">Historical Prediction:&nbsp&nbsp</span>` + 
            //             `<span style="float:right;">${d3.format(config.y_format)(ttdata[0].histpred)}</span>` 
            //         )
            //     } else {
            //         tooltipBody.html(
            //             `<span style="float:left;">${titleCase(config.y_label ? config.y_label : dimensions[1].label_short)}:&nbsp&nbsp</span>` + // use label_short
            //             `<span style="float:right;">${d3.format(config.y_format)(ttdata[0].value)}</span><br>` + 
            //             `<span style="float:left;">Upper Range:&nbsp&nbsp</span>` + 
            //             `<span style="float:right;">${d3.format(config.y_format)(ttdata[0].stdup)}</span><br>` + 
            //             `<span style="float:left;">Lower Range:&nbsp&nbsp</span>` + 
            //             `<span style="float:right;">${d3.format(config.y_format)(ttdata[0].stddown)}</span>` 
            //         )
            //     }                

            //     if (d3.event.pageY < height * 0.7) {
            //         tooltip.style("top", d3.event.pageY - 30 + 'px')
            //     } else {
            //         tooltip.style("top", d3.event.pageY - 150 + 'px')
            //     }

            //     if (d3.event.pageX < width * 0.7) {
            //         tooltip.style("left", d3.event.pageX + 10 + 'px')
            //     } else {
            //         tooltip.style("left", d3.event.pageX - 250 + 'px')
            //     }
            // }
        })
        
    } catch(error) {
        console.log(error)
    }
    done()
    // }
    }   
}