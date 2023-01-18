import { text } from "d3";
import { createIntersectionTypeNode, isWhiteSpaceLike } from "typescript";

export const object = {
    id: "mapTest",
    label: "ZDev Map Test",
    options: {
        radius: {
            type: "number",
            label: "Diameter of hexagons",
            display: "number",
            default: 10,
            section: "Setup",
            order: 1
        },
        directions: {
            type: "boolean",
            label: "Include direction buttons",
            default: "true",
            section: "Setup",
            order: 2
        },
        size_col: {
            type: "string",
            label: "Measure column index",
            display: "text",
            default: "0",
            section: "Setup",
            order: 3
        },
        size_metric: {
            type: "string",
            label: "Metric for Size",
            display: "radio",
            values: [
                {"Raw Count": "count"},
                {"Average": "average"},
                {"Median": "median"},
                {"75% Quartile": "quartile"}
            ],
            default: "count",
            section: "Setup",
            order: 4
        },
        size_label: {
            type: "string",
            label: "Hex Size Legend Label",
            display: "text",
            default: "Volume",
            section: "Setup",
            order: 5
        },
        color_col: {
            type: "string",
            label: "Measure column index",
            display: "text",
            default: "1",
            section: "Setup",
            order: 6
        },
        color_metric: {
            type: "string",
            label: "Metric for Size",
            display: "radio",
            values: [
                {"Raw Count": "count"},
                {"Average": "average"},
                {"Median": "median"},
                {"75% Quartile": "quartile"}
            ],
            default: "count",
            section: "Setup",
            order: 7
        },
        color_label: {
            type: "string",
            label: "Hex Color Legend Label",
            display: "text",
            default: "Average RPM",
            section: "Setup",
            order: 8
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

            <svg id="first"></svg>
            <svg id="second"></svg>`;
        element.style.fontFamily = `"Open Sans", "Helvetica", sans-serif`
  },

  updateAsync: function(data, element, config, queryResponse, details, done, environment = "prod") {
      if (environment == "prod") {
        if (!handleErrors(this, queryResponse, {
        min_pivots: 0, max_pivots: 0,
        min_dimensions: 1, max_dimensions: 5,
        min_measures: 1, max_measures: 5
        })) return
    }

    try {

        // map chart setup ----------------------------------------------------------
        let SELECTED_RANGE;

        let margin = {
            top: 10,
            right: 10,
            bottom: 100,
            left: 10,
        }

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
            .attr('width', '100%')
            .attr('height', (height + 'px'))
            .classed('group', true)

        // data setup ---------------------------------------------------------
        const dimensions = queryResponse.fields.dimension_like
        const measures = queryResponse.fields.measure_like

        console.log("dimensions", dimensions)
        console.log("measures", measures)

        let data_ready = []

        data.forEach((d) => {
            let entry = {}

            entry['lat'] = +d[dimensions[0].name].value
            entry['lon'] = +d[dimensions[1].name].value
            entry['direction'] = d[dimensions[2].name].value
            entry['metric1'] = +d[measures[parseInt(config.size_col)].name].value
            entry['metric2'] = +d[measures[parseInt(config.color_col)].name].value

            data_ready.push(entry)
        })

        data_ready = data_ready.filter(d => d.lat != 0 && d.lon != 0) 

        d3.json('./dataState.json').then(function(mdata) { 
            console.log("map", mdata)
            console.log("data_ready", data_ready)

            
            // INTERACTIONS ------------------------------------------------------
            createHexMap(data_ready)

            function rectClick(clickedElement) {
                // console.log("clickedElement", clickedElement)
                // console.log("clickedElement class", clickedElement.attr("class"))

                const thisClass = clickedElement.attr("class")

                const classes = ['All', 'Inbound', 'Outbound']

                classes.forEach((d, i) => {
                    if (d === thisClass) {
                        let thisRect = d3.select(`rect.${d}`)
                        thisRect
                            .attr("fill", "#323232")

                        let thisText = d3.select(`text.${d}`)
                        thisText
                            .attr("fill", "white")
                    } else {
                        let thisRect = d3.select(`rect.${d}`)
                        thisRect
                            .attr("fill", "#f9f9f9")

                        let thisText = d3.select(`text.${d}`)
                        thisText
                            .attr("fill", "#323232")
                    }
                })

                const selectedDirection = d3.select(`text[fill="white"]`).attr("class")
                console.log("selectedDirection", selectedDirection)

                let data_map;
                if (selectedDirection != "All") {
                    data_map = data_ready.filter(function(d) {
                        return d.direction === selectedDirection
                    })
                    console.log("data_map", data_map)
                    createHexMap(data_map)
                } else {
                    console.log("data_map = data_ready", data_ready)
                    createHexMap(data_ready)
                }

            }

            // ---------------------------------------------------------------------
            // BUTTONS
            if (config.directions == "true") {
                const buttonContainer = group.append("g")
                    .attr("transform", `translate(${width / 1.25},${height + 35})`)
                    .classed("buttonContainer", true)

                buttonContainer.append("text")
                    .attr("x", 0)
                    .attr("y", 2)
                    .style("text-anchor", "middle")
                    .style("dominant-baseline", "middle")
                    .style("font-size", 11)
                    .attr("fill", "#323232")
                    .text("Freight Direction")

                buttonContainer.append("rect")
                    .attr("x", -90)
                    .attr("y", 15)
                    .attr("width", 60)
                    .attr("height", 28)
                    .attr("stroke", "#323232")
                    .attr("fill", "#323232") 
                    .classed("All", true)
                    // .on("click", rectClick(d3.select(this)))
                    .on("click", function() {
                        const d3This = d3.select(this)
                        rectClick(d3This)
                    })

                buttonContainer.append("text")
                    .attr("x", -60)
                    .attr("y", 29)
                    .style("text-anchor", "middle")
                    .style("dominant-baseline", "middle")
                    .style("font-size", 11)
                    .attr("fill", "white")
                    .text("All")
                    .classed("All", true)
                    .on("click", function() {
                        const d3This = d3.select(this)
                        rectClick(d3This)
                    })

                buttonContainer.append("rect")
                    .attr("x", -30)
                    .attr("y", 15)
                    .attr("width", 60)
                    .attr("height", 28)
                    .attr("stroke", "#323232")
                    .attr("fill", "#f9f9f9")
                    .classed("Inbound", true)
                    .on("click", function() {
                        const d3This = d3.select(this)
                        rectClick(d3This)
                    })

                buttonContainer.append("text")
                    .attr("x", 0)
                    .attr("y", 29)
                    .style("text-anchor", "middle")
                    .style("dominant-baseline", "middle")
                    .style("font-size", 11)
                    .attr("fill", "#323232")
                    .text("Inbound")
                    .classed("Inbound", true)
                    .on("click", function() {
                        const d3This = d3.select(this)
                        rectClick(d3This)
                    })

                buttonContainer.append("rect")
                    .attr("x", 30)
                    .attr("y", 15)
                    .attr("width", 60)
                    .attr("height", 28)
                    .attr("stroke", "#323232")
                    .attr("fill", "#f9f9f9")
                    .classed("Outbound", true)
                    .on("click", function() {
                        const d3This = d3.select(this)
                        rectClick(d3This)
                    })

                buttonContainer.append("text")
                    .attr("x", 60)
                    .attr("y", 29)
                    .style("text-anchor", "middle")
                    .style("dominant-baseline", "middle")
                    .style("font-size", 11)
                    .attr("fill", "#323232")
                    .text("Outbound")
                    .classed("Outbound", true)
                    .on("click", function() {
                        const d3This = d3.select(this)
                        rectClick(d3This)
                    })
            } else {
                d3.select(".buttonContainer").remove()
            }
            


            // console.log("select chosen one", d3.select(`text[fill="white"]`).attr("class"))
            

            // ---------------------------------------------------------------------
            // HexGrid Map

            function createHexMap(mapdata) {
                // remove DOM elements
                d3.select(".legendContainer").remove()
                d3.select(".nation-group").remove()
                d3.select(".outer-hexs").remove()
                d3.select(".inner-hexs").remove()

                const projection = d3.geoAlbersUsa()
                    .fitSize([width, height], topojson.feature(mdata, mdata.objects.nation))

                const path = d3.geoPath()
                    .projection(projection)

                // add outline for nation
                const nation = group
                    .append('g')
                    .attr("class", "nation-group")
                    .attr("fill", "#f9f9f9")
                    .selectAll("path")
                    .data(topojson.feature(mdata, mdata.objects.nation).features)
                    .enter()
                    .append("path")
                    .attr("d", path)
                    .attr("class", "map-background")

                mapdata.forEach(d => {
                    const coords = projection([d.lon, d.lat])
                    d.x = coords[0]
                    d.y = coords[1]
                })

                // define hexgrid
                const hexgrid = d3.hexgrid()
                    .extent([width, height])
                    .geography(topojson.feature(mdata, mdata.objects.nation))
                    .projection(projection)
                    .pathGenerator(path)
                    .hexRadius(config.radius)
                    // .hexRadius(10)

                // console.log("mapdata", mapdata)

                const hex = hexgrid(mapdata, ["metric1", "metric2", "direction", "month"])

                console.log("grid", hex.grid)
                // console.log("pointdensity points", [...hex.grid.extentPointDensity].reverse())
                    
                const totals1 = []
                const totals2 = []
                const average1 = []
                const average2 = []
                const median1 = []
                const median2 = []
                const quartile1 = []
                const quartile2 = []

                const median = (arr) => {
                    const mid = Math.floor(arr.length / 2)
                    const nums = [...arr].sort((a, b) => a - b)
                    return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2 
                }

                const quartile = (arr, q) => {
                    const sorted = arr.sort((a, b) => a - b)
                    console.log("list sorted", sorted)

                    let pos = (sorted.length - 1) * q;
                    if (pos % 1 === 0) {
                        return sorted[pos]
                    }

                    pos = Math.floor(pos)
                    if (sorted[pos + 1] !== undefined) {
                        return (sorted[pos] + sorted[pos + 1]) / 2
                    }

                    return sorted[pos]
                }
                    
                hex.grid.layout.forEach((d, i) => {
                    // console.log("HEX.GRID.LAYOUT", d)
                    let sum1 = 0;
                    let sum2 = 0;
                    if (+d.datapoints > 0) {
                        let list1 = []
                        let list2 = []

                        d.forEach((sd, si) => {
                            sum1 += +sd.metric1
                            list1.push(+sd.metric1)

                            sum2 += +sd.metric2
                            list2.push(+sd.metric2)
                        })

                        // averages
                        const avg1 = list1.reduce((a,b) => a + b) / list1.length;
                        const avg2 = list2.reduce((a,b) => a + b) / list2.length;
                        average1.push(avg1)
                        average2.push(avg2)
                        d.metric1_avg = avg1
                        d.metric2_avg = avg2

                        // median
                        const med1 = median(list1)
                        const med2 = median(list2)
                        median1.push(med1)
                        median2.push(med2)
                        d.metric1_med = med1
                        d.metric2_med = med2

                        // upper quartile
                        const quart1 = quartile(list1, 0.75)
                        const quart2 = quartile(list2, 0.75)
                        quartile1.push(quart1)
                        quartile2.push(quart2)
                        d.metric1_quart = quart1
                        d.metric2_quart = quart2
                    } else {
                        d.metric1_avg = 0
                        d.metric2_avg = 0

                        d.metric1_med = 0
                        d.metric2_med = 0

                        d.metric1_quart = 0
                        d.metric2_quart = 0
                    }
                    // sum counts
                    totals1.push(sum1)
                    totals2.push(sum2)
                    d.metric1_sum = sum1
                    d.metric2_sum = sum2
                })

                const metricMap = {
                    "count": ["_sum", totals1, totals2],
                    "average": ["_avg", average1, average2],
                    "median": ["_med", median1, median2],
                    "quartile": ["_quart", quartile1, quartile2]
                }

                console.log("hex.grid.layout", hex.grid.layout)

                // plot empty hexagons for only areas that have data
                const grid = group.append('g')
                    .attr("class", "outer-hexs")
                    .selectAll('.hex')
                    .data(hex.grid.layout)
                    .enter()
                    .append('path')
                        .attr('class', 'hex')
                        .attr('d', hex.hexagon())
                        .attr('transform', d => `translate(${d.x}, ${d.y})`)
                        .style("fill", "none")
                        .style("stroke", d => !d.pointDensity ? "none" : "#b2b2b2")

                // create scale for inner hexagons
                const middleRadius = 2 + ((Number(config.radius) - 2) / 2)

                const innerHexScale = d3.scaleQuantize()
                    .domain([Math.max(.001, d3.min(metricMap[config.size_metric][1])), d3.max(metricMap[config.size_metric][1])])
                    .range([2, Number(middleRadius), Number(config.radius)])
                    // .range([2,6,10])
                    // .domain([0, d3.max(totalVolumes)])
                    // .range([0,1,2,3,4,5,6,7])

                // create color scale for metric2 *change*
                const colorRateScale = d3.scaleQuantize()
                    .domain(d3.extent(metricMap[config.color_metric][2]))
                    .range(["#27566b", "#f1cc56", "#8cbb61"])                

                // hexagon function
                const hexagonPoints = ( radius ) => {
                    const halfWidth = radius * Math.sqrt(3) / 2;
                    return `
                        0,${-radius}
                        ${halfWidth},${-radius / 2}
                        ${halfWidth},${radius / 2}
                        0,${radius}
                        ${-halfWidth},${radius / 2}
                        ${-halfWidth},${-radius / 2}`;
                };

                console.log("inner hex scale", innerHexScale.domain(), innerHexScale.range())
                console.log("metric 1 col", `metric1${metricMap[config.size_metric][0]}`)
                console.log("metric 2 col", `metric2${metricMap[config.color_metric][0]}`)

                const innerHexs = group
                    .append('g')
                    .attr("class", "inner-hexs")
                    .selectAll('.innerhex')
                    .data(hex.grid.layout)
                    .enter()
                    .append("polygon")
                        .attr("class", "innerhex")
                        .attr("points", d => hexagonPoints(innerHexScale(d[`metric1${metricMap[config.size_metric][0]}`]))) 
                        .attr("transform", d => `translate(${d.x}, ${d.y})`)
                        .style("fill", d => {
                            if (+d[`metric1${metricMap[config.size_metric][0]}`] > 0) {
                                return colorRateScale(d[`metric2${metricMap[config.color_metric][0]}`])
                            } else {
                                return "none"
                            }
                        })
                        .style("stroke", "none")

                // HEXMAP LEGEND
                innerHexScale.invert = (function() {
                    let domain = innerHexScale.domain()
                    let range = innerHexScale.range()
                    let scale = d3.scaleQuantize().domain(range).range(domain)
                    console.log("DOMAIN", domain)
                    console.log("RANGE", range)
                    console.log("SCALE reversed", scale)
                    return function(x) {
                        return scale(x)
                    }
                })()

                console.log("INNERHEXSCALE ORIGINAL DOMAIN", innerHexScale.domain())

                const legendContainer = group.append("g")
                    .attr("transform", `translate(${width / 4},${height + 12})`) //10
                    .classed("legendContainer", true)

                const legendSize = legendContainer.append("g")
                    .classed("legend", true)
                    .attr("transform", "translate(0,0)")

                legendSize.append("text")
                    .attr("x", 0)
                    .attr("y", 2)
                    .style("text-anchor", "middle")
                    .style("dominant-baseline", "middle")
                    .style("font-size", 11)
                    .attr("fill", "#323232")
                    .text(config.size_label)
                
                legendSize.append("polygon")
                    .attr("points", d => hexagonPoints(2))
                    .attr("transform", "translate(-110, 20)")
                    .style("fill", "#27566b")

                legendSize.append("text")
                    .attr("x", -104)
                    .attr("y", 21)
                    .style("text-anchor", "start")
                    .style("dominant-baseline", "middle")
                    .style("font-size", 9)
                    .attr("fill", "#323232")
                    .text(`${d3.format(".2s")(innerHexScale.invertExtent(2)[0])} to ${d3.format(".2s")(innerHexScale.invertExtent(2)[1])}`)
                    .classed("legend-text", true)

                legendSize.append("polygon")
                    .attr("points", d => hexagonPoints(Number(middleRadius)))
                    .attr("transform", "translate(-30, 20)")
                    .style("fill", "#27566b")

                legendSize.append("text")
                    .attr("x", -17)
                    .attr("y", 21)
                    .style("text-anchor", "start")
                    .style("dominant-baseline", "middle")
                    .style("font-size", 9)
                    .attr("fill", "#323232")
                    .text(`${d3.format(".2s")(innerHexScale.invertExtent(Number(middleRadius))[0])} to ${d3.format(".2s")(innerHexScale.invertExtent(Number(middleRadius))[1])}`)
                    .classed("legend-text", true)

                legendSize.append("polygon")
                    .attr("points", d => hexagonPoints(Number(config.radius)))
                    .attr("transform", "translate(55, 20)")
                    .style("fill", "#27566b")

                legendSize.append("text")
                    .attr("x", 72)
                    .attr("y", 21)
                    .style("text-anchor", "start")
                    .style("dominant-baseline", "middle")
                    .style("font-size", 9)
                    .attr("fill", "#323232")
                    .text(`${d3.format(".2s")(innerHexScale.invertExtent(Number(config.radius))[0])} to ${d3.format(".2s")(innerHexScale.invertExtent(Number(config.radius))[1])}`)
                    .classed("legend-text", true)


                const legendColor = legendContainer.append("g")
                    .classed("legend", true)
                    .attr("transform", "translate(0, 45)")

                legendColor.append("text")
                    .attr("x", 0)
                    .attr("y", 2)
                    .style("text-anchor", "middle")
                    .style("dominant-baseline", "middle")
                    .style("font-size", 11)
                    .attr("fill", "#323232")
                    .text(config.color_label)

                legendColor.append("polygon")
                    .attr("points", d => hexagonPoints(8))
                    .attr("transform", "translate(-110, 20)")
                    .style("fill", "#27566b")

                legendColor.append("text")
                    .attr("x", -99)
                    .attr("y", 21)
                    .style("text-anchor", "start")
                    .style("dominant-baseline", "middle")
                    .style("font-size", 9)
                    .attr("fill", "#323232")
                    .text(`${d3.format(",.2s")(colorRateScale.invertExtent("#27566b")[0])} to ${d3.format(",.2s")(colorRateScale.invertExtent("#27566b")[1])}`)
                    .classed("legend-text", true)

                legendColor.append("polygon")
                    .attr("points", d => hexagonPoints(8))
                    .attr("transform", "translate(-30, 20)")
                    .style("fill", "#f1cc56")

                legendColor.append("text")
                    .attr("x", -19)
                    .attr("y", 21)
                    .style("text-anchor", "start")
                    .style("dominant-baseline", "middle")
                    .style("font-size", 9)
                    .attr("fill", "#323232")
                    .text(`${d3.format(",.2s")(colorRateScale.invertExtent("#f1cc56")[0])} to ${d3.format(",.2s")(colorRateScale.invertExtent("#f1cc56")[1])}`)
                    .classed("legend-text", true)

                legendColor.append("polygon")
                    .attr("points", d => hexagonPoints(8))
                    .attr("transform", "translate(55, 20)")
                    .style("fill", "#8cbb61")

                legendColor.append("text")
                    .attr("x", 66)
                    .attr("y", 21)
                    .style("text-anchor", "start")
                    .style("dominant-baseline", "middle")
                    .style("font-size", 9)
                    .attr("fill", "#323232")
                    .text(`${d3.format(",.2s")(colorRateScale.invertExtent("#8cbb61")[0])} to ${d3.format(",.2s")(colorRateScale.invertExtent("#8cbb61")[1])}`)
                    .classed("legend-text", true)

                console.log('colorscale', colorRateScale.domain())              
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