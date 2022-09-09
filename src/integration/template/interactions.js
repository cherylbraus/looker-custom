import { createIntersectionTypeNode, isWhiteSpaceLike } from "typescript";

export const object = {
    id: "mapTest",
    label: "ZDev Map Test",
    options: {
        test: {
            type: "string",
            label: "test",
            display: "text",
            default: "",
        }
    },

    create: function(element, config) {
        // Insert a <style> tag with some styles we'll use later.
        element.innerHTML = `
            <style>
                body {
                font-family: Arial;
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

            .line {
                fill: none;
                stroke-width: 2px;
            }

            /* ---AXIS OPTIONS: START--- */

            .axis-label {
                fill: #3a4245;
                font-size: 12px;
                font-family: 'sans-serif';
                text-anchor: middle;
            }

            .y-axis, .x-axis {
                font-family: "sans-serif";
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

            /* ---AXIS OPTIONS: END--- */

            </style>
            <svg id="first">
            </svg>
            <svg id="second">
            </svg>`;
        element.style.fontFamily = `"Open Sans", "Helvetica", sans-serif`
  },

  updateAsync: function(data, element, config, queryResponse, details, done, environment = "prod") {
      if (environment == "prod") {
        if (!handleErrors(this, queryResponse, {
        min_pivots: 0, max_pivots: 20,
        min_dimensions: 1, max_dimensions: 20,
        min_measures: 0, max_measures: 20
        })) return
    }

    try {

        let margin = {
            top: 10,
            right: 10,
            bottom: 50,
            left: 50,
        }

        const width = element.clientWidth - margin.left - margin.right;
        const height = element.clientHeight - margin.top - margin.bottom;

        const svgMap = (
            d3.select(element).select('#first')
                .html('')
                .attr('width', '100%')
                .attr('height', '100%')
        )

        const groupMap = svgMap.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`)
            .attr('width', '100%')
            .attr('height', (height + 'px'))
            .classed('group', true)

        const svgLine = (
            d3.select(element).select('#second')
                .html('')
                .attr('width', '100%')
                .attr('height', '100%')
        )

        const groupLine = svgLine.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`)
            .attr('width', '100%')
            .attr('height', (height + 'px'))
            .classed('group', true)

        // look at data
        const dimensions = queryResponse.fields.dimension_like
        const measures = queryResponse.fields.measure_like

        console.log("dimensions", dimensions)
        console.log("measures", measures)

        const parseTimeDay = d3.timeParse("%Y-%m-%d") // turn string in this format into date
        // to reformat a date object use d3.timeFormat()

        let data_ready = []

        data.forEach((d) => {
            let entry = {}

            entry['date'] = parseTimeDay(d[dimensions[1].name].value)
            entry['mo'] = parseTimeDay(d[dimensions[1].name].value).getMonth()
            entry['lat'] = +d[dimensions[2].name].value
            entry['lng'] = +d[dimensions[3].name].value
            entry['type'] = d[dimensions[4].name].value
            entry['id'] = d[dimensions[0].name].value
            entry['measure'] = +d[measures[0].name].value

            data_ready.push(entry)
        })

        const dateAccessor = d => d.date;
        const latAccessor = d => d.lat;
        const lngAccessor = d => d.lng;
        const typeAccessor = d => d.type;
        const idAccessor = d => d.id;
        const measureAccessor = d => d.measure;
        const moAccessor = d => d.mo;

        d3.json('./dataState.json').then(function(mdata) {
            console.log("data_ready", data_ready)
            console.log("map data", mdata)

            // MAP ------------------------------------------------------
            let scale = Math.min(width/Math.PI*5, height/Math.PI*5)

            const projection = d3.geoAlbersUsa()
                .scale(scale)
                .translate([width/2, height/2])

            const path = d3.geoPath()
                .projection(projection)

            const state = groupMap
                .append('g')
                .attr("stroke", "#fff")
                .attr("stroke-width", 2)
                .attr("fill", "#f4f4f4")
                .selectAll("path")
                .data(topojson.feature(mdata, mdata.objects.states).features)
                .enter()
                .append("path")
                .attr("d", path)

            // data points
            const radiusScale = d3.scaleSqrt()
                .domain([d3.min(data_ready, d => measureAccessor(d)), 0,
                    d3.max(data_ready, d => measureAccessor(d))])
                .range([15, 2, 15])

            // const colorScale = d3.scaleLinear()
            //     .domain([d3.min(data_ready, d => measureAccessor(d)), 0,
            //         d3.max(data_ready, d => measureAccessor(d))])
            //     .range(["red", "yellow", "green"])

            const colorScale = d3.scaleOrdinal()
                .domain(d => moAccessor(d))
                .range(d3.schemeAccent)

            const points = groupMap 
                .append('g')
                .selectAll("circle")
                    .data(data_ready)
                    .enter()
                    .append('circle')
                    .attr("cx", d => projection([d['lng'], d['lat']])[0])
                    .attr("cy", d => projection([d['lng'], d['lat']])[1])
                    .attr("r", d => radiusScale(measureAccessor(d)))
                    .attr("fill", d => colorScale(moAccessor(d)))
                    .attr("fill-opacity", 0.5)
                    // .attr("stroke", d => d3.lab(colorScale(moAccessor(d))).darker())
                    .attr("stroke", d => {
                        if (measureAccessor(d) < 0) {
                            return "red"
                        } else {
                            return "grey"
                        }
                    })
                    .attr("stroke-opacity", 0.9)
                    // .attr("stroke-dasharray", function(d) {
                    //     if (measureAccessor(d) < 0) {
                    //         return ("10,5")
                    //     } else {
                    //         return ("10,0")
                    //     }
                    // })
                    .attr('stroke-width', (d) => {
                        if (measureAccessor(d) < 0) {
                            return 2
                        } else {
                            return 0.5
                        }
                    })

            // LINE ------------------------------------------------------

            // aggregate by date and sum up margin
            let result = []
            data_ready.reduce(function(res, value) { // look up how reduce really works
                if (!res[value.date]) {
                    res[value.date] = {date: value.date, measure: 0}
                    result.push(res[value.date])
                }
                res[value.date].measure += value.measure
                return res;
            }, {})

            console.log("result", result)

            const xScale = d3.scaleTime()
                .domain(d3.extent(result, d => dateAccessor(d)))
                .range([0, width])

            const yScale = d3.scaleLinear()
                .domain(d3.extent(result, d => measureAccessor(d)))
                .range([height, 0])

            console.log('y scale', yScale.domain(), yScale.range(), height, margin.top)

            const xAxisGenerator = d3.axisBottom()
                .scale(xScale)
                .tickFormat(d3.timeFormat("%b-%d"))

            const xAxis = groupLine 
                .append('g')
                .call(xAxisGenerator)
                .style("transform", `translateY(${height}px)`) 

            const yAxisGenerator = d3.axisLeft()
                .scale(yScale)
                .tickFormat(d3.format("$.0s"))

            const yAxis = groupLine 
                .append('g')
                .call(yAxisGenerator)

            const lineGenerator = d3.line()
                .curve(d3.curveCatmullRom)
                .x(d => xScale(dateAccessor(d)))
                .y(d => yScale(measureAccessor(d)))

            const timeline = groupLine
                .append('path')
                    .attr("fill", "none")
                    .attr("stroke", "steelblue")
                    .attr("stroke-width", 1.5)
                    .attr("d", lineGenerator(result))
                    .attr("class", "base-line")

            
            // INTERACTIONS ------------------------------------------------------
            groupLine
                .call(d3.brushX()
                    .extent([[0,0], [width,height]])
                    .on("start brush end", brushed)
                )

            function isInBrushExtent(d) {
                console.log("brush extent calc")
                console.log("extent", extent)
                console.log("d.date", dateAccessor(d))

                return extent &&
                    dateAccessor(d) >= extent[0] &&
                    dateAccessor(d) <= extent[1];
            }

            result.forEach((d,i) => {
                const bool = isInBrushExtent(d)
                console.log("bool", bool, dateAccessor(d))
            })

            let extent = null;
            const dots = groupLine
                .selectAll("circle")
                .data(result)
                .enter()
                .append("circle")
                    .attr("cx", d => xScale(dateAccessor(d)))
                    .attr("cy", d => yScale(measureAccessor(d)))
                    .attr('r', 5)
                    .attr('fill', 'steelblue')
                    .attr('fill-opacity', 0.0)
                

            function brushed(extent) {
                extent = d3.event.selection;

                if (extent) {
                    // add dots to the line plot
                    dots
                        .attr("fill-opacity", (d) => {
                            const bool = xScale(dateAccessor(d)) >= extent[0] && xScale(dateAccessor(d)) <= extent[1];
                            return bool ? 1.0 : 0.0;
                        })

                    // only show dots on the map in the brush selection
                    points
                        .attr("fill-opacity", (d) => {
                            const bool = xScale(dateAccessor(d)) >= extent[0] && xScale(dateAccessor(d)) <= extent[1];
                            return bool ? 0.5 : 0.0;
                        })
                        .attr("stroke-opacity", (d) => {
                            const bool = xScale(dateAccessor(d)) >= extent[0] && xScale(dateAccessor(d)) <= extent[1];
                            return bool ? 0.9 : 0.0;
                        })
                } else {
                    dots
                        .attr("fill-opacity", 0.0)

                    points
                        .attr("fill-opacity", 0.5)
                        .attr("stroke-opacity", 0.9)
                }

                
            }
        })

            


        

    } catch(error) {
        if (environment == "prod") {
            console.log("somehow got in here")
            if (queryResponse.fields.dimensions.length > 2 || queryResponse.fields.dimensions.length < 1 || queryResponse.fields.dimensions.length == 1 && queryResponse.fields.pivots.length != 1 ) {
            this.addError({title: "Dimension/Pivot Error", message: "This chart takes two dimensions or one pivot on a single dimension."});
            return;
            } 
        }
    }
    done()
  }
};