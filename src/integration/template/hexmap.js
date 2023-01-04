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
        calc_type: {
            type: "string",
            label: "Colored metric",
            display: "radio",
            values: [
                {"Overall rate average": "average"},
                {"% Change in average": "change_average"}
            ],
            default: "average",
            section: "Setup",
            order: 2
        },
        directions: {
            type: "boolean",
            label: "Include direction buttons",
            default: "true",
            section: "Setup",
            order: 3
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
        const height = (element.clientHeight * .7) - margin.top - margin.bottom;

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

            entry['month'] = new Date(d[dimensions[0].name].value + 'T00:00')
            entry['lat'] = +d[dimensions[1].name].value
            entry['lon'] = +d[dimensions[2].name].value
            entry['direction'] = d[dimensions[3].name].value
            entry['rate'] = +d[measures[0].name].value
            entry['volume'] = +d[measures[1].name].value

            data_ready.push(entry)
        })

        data_ready = data_ready.filter(d => d.lat != 0 && d.lon != 0) 

        d3.json('./dataState.json').then(function(mdata) { 
            console.log("map", mdata)
            console.log("data_ready", data_ready)

            // ---------------------------------------------------------------------
            // LINE PLOT -----------------------------------------------------------

            function group_by_month(arr) {
                return Object.values(
                    arr.reduce((a, {month: month,
                                    rate: rate
                                }) => {
                        const key = month;
        
                        if (a[key] === undefined) {
                            a[key] = {month: month, 
                                rate: 0, 
                                count: 0};
                        }
        
                        a[key].rate += rate;
                        a[key].count += 1;
        
                        return a;
                    }, {})
                )
            }
                
            const data_month = group_by_month(data_ready)

            data_month.forEach((d, i) => {
                d['rateAvg'] = +d['rate'] / +d['count']
            })

            const monthAccessor = d => d.month;
            const rateAvgAccessor = d => d.rateAvg;
 
            console.log("data_month", data_month)

            // axes
            const xScale = d3.scaleTime()
                .domain(d3.extent(data_month, d => d.month))
                .range([0, width2])

            const xAxisGenerator = d3.axisBottom()
                .scale(xScale)
                .tickFormat(d3.timeFormat("%b'%-y"))
                .tickSizeInner(0)
                .tickSizeOuter(0)
                .tickPadding(10)
                .ticks(8)

            const xAxis = group2
                .append('g')
                .call(xAxisGenerator)
                    .style("transform", `translateY(${height2}px)`)
                    .attr("class", "x-axis")

            d3.select(".x-axis path").attr("class", "zero-line")

            const yScale = d3.scaleLinear()
                // .domain(d3.extent(data_month, d => d.rateAvg))
                .domain([d3.min(data_month, d => d.rateAvg) - 0.5, d3.max(data_month, d => d.rateAvg) + 0.5])
                .range([height2, 0])

            const yAxisGenerator = d3.axisLeft()
                .scale(yScale)
                .tickFormat(d3.format("$.1s"))
                // .tickSize(-width2)
                .tickSize(0)
                .tickPadding(10)
                .ticks(5)

            const yAxis = group2
                .append('g')
                .call(yAxisGenerator)
                    .attr("class", "y-axis")

            const lineGenerator = d3.line()
                .curve(d3.curveNatural)
                .x(d => xScale(monthAccessor(d)))
                .y(d => yScale(rateAvgAccessor(d)))

            const timeline = group2
                .append('path')
                    .attr("fill", "none")
                    .attr("stroke", "darkgrey")
                    .attr("stroke-width", 1.5)
                    .attr("d", lineGenerator(data_month))
                    .attr("class", "timeline")

            
            // INTERACTIONS ------------------------------------------------------
            createHexMap(data_ready)

            group2
                .call(d3.brushX()
                    .extent([[0,0], [width2, height2]])
                    .on("end", brushed)    
                    .on("brush", brushing)
                )        

            // placeholder dots
            const dots = group2
                .selectAll("circle")
                .data(data_month)
                .enter()
                .append("circle")
                    .attr("cx", d => xScale(monthAccessor(d)))
                    .attr("cy", d => yScale(rateAvgAccessor(d)))
                    .attr("r", 3)
                    .attr("fill", "black")
                    .attr("fill-opacity", 0.0)

            let extent = null;

            // console.log("extent", extent)

            function brushing(extent) {
                extent = d3.event.selection;
                // console.log("brushing extent", extent)

                if (extent) {
                    dots
                        .attr('fill-opacity', d => {
                            const bool = xScale(monthAccessor(d)) >= extent[0] && xScale(monthAccessor(d)) <= extent[1];
                            return bool ? 1.0 : 0.0;
                        })
                } 
            }

            function brushed(extentArg) {
                const extent = d3.event.selection;

                // if there is an extent, use it, otherwise use the extentArg, which is from the rect button function
                let extentActual = extent !== undefined ? extent : extentArg;
                console.log("extentActual", extentActual)             

                // let brushRect = d3.select(`rect.selection[style="display: none;"]`)
                // console.log("brushRect", brushRect)

                // determine which button is currently pressed by text color
                const selectedDirection = d3.select(`text[fill="white"]`).attr("class")
                console.log("selectedDirection", selectedDirection)

                if (extentActual) {
                    SELECTED_RANGE = extentActual
                    console.log("SELECTED_RANGE", SELECTED_RANGE)

                    // let monthsSelected = d3.select("#second").select(".group").selectAll(`circle[fill-opacity="1"]`)

                    // let endDate2 = monthsSelected["_groups"][0][0]["__data__"]['month']

                    // const circleCount = monthsSelected["_groups"][0]["length"]
                    // let startDate2 = monthsSelected["_groups"][0][circleCount - 1]["__data__"]["month"]

                    // console.log("HTML DATES", startDate2, circleCount, endDate2)

                    let startDateExact = xScale.invert(SELECTED_RANGE[0])
                    let endDateExact = xScale.invert(SELECTED_RANGE[1])
                    let startDate = new Date(startDateExact.getFullYear(), startDateExact.getMonth() + 1, 1)
                    let endDate = new Date(endDateExact.getFullYear(), endDateExact.getMonth() + 1, 0)

                    console.log("CALC DATES", startDate, endDate, startDate.getTime(), endDate.getTime())

                    let data_map;
                    if (selectedDirection != "All") {
                        console.log("NOT ALL")
                        data_map = data_ready.filter(function(d) {
                            return d.month.getTime() >= startDate.getTime() && d.month.getTime() <= endDate.getTime() && d.direction === selectedDirection
                        })
                    } else {
                        console.log("ALL")
                        data_map = data_ready.filter(function(d) {
                            return d.month.getTime() >= startDate.getTime() && d.month.getTime() <= endDate.getTime() 
                        })
                    }

                    console.log("data_map", data_map)
                    createHexMap(data_map)

                } else {
                    SELECTED_RANGE = undefined;
                    dots
                        .attr('fill-opacity', 0.0)

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
            }

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

                console.log("RECTCLICK SELECTED_RANGE", SELECTED_RANGE)

                brushed(SELECTED_RANGE)

            }

            // ---------------------------------------------------------------------
            // BUTTONS
            const buttonContainer = group.append("g")
                .attr("transform", `translate(${width / 1.33},${height + 15})`)
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

                const hex = hexgrid(mapdata, ["volume", "rate", "direction", "month"])

                console.log("grid", hex.grid)
                // console.log("pointdensity points", [...hex.grid.extentPointDensity].reverse())
                    
                const totalVolumes = []
                const averageRates = []
                const changeAverageRates = []
                    
                hex.grid.layout.forEach((d, i) => {
                    // console.log("HEX.GRID.LAYOUT", d)
                    let vol = 0;
                    if (+d.datapoints > 0) {
                        if (config.calc_type === "average") {
                            let rateList = []

                            d.forEach((sd, si) => {
                                vol += +sd.volume
                                rateList.push(+sd.rate)
                            })

                            const avg = rateList.reduce((a,b) => a + b) / rateList.length;

                            averageRates.push(avg)
                            d.rate = avg
                        } else if (config.calc_type === "change_average") {
                            let firstMonth;
                            let lastMonth;
                            let firstMonthVals = []
                            let lastMonthVals = []

                            let monthsInData = d.map(date => date.month)

                            firstMonth = monthsInData[monthsInData.length - 1]
                            lastMonth = monthsInData[0]

                            // console.log("first and last", firstMonth, lastMonth)

                            d.forEach((sd, si) => {
                                vol += +sd.volume

                                if (sd.month.valueOf() === firstMonth.valueOf()) {
                                    // console.log("in first")
                                    firstMonthVals.push(+sd.rate)
                                } 
                                
                                if (sd.month.valueOf() === lastMonth.valueOf()) {
                                    // console.log("in last")
                                    lastMonthVals.push(+sd.rate)
                                }
                            })

                            const firstAvg = firstMonthVals.reduce((a,b) => a + b) / firstMonthVals.length;
                            const lastAvg = lastMonthVals.reduce((a,b) => a + b) / lastMonthVals.length;
                            const avgChange = (+lastAvg - +firstAvg) / +firstAvg     
                            if (avgChange == Infinity) {
                                console.log("INFINITY", firstMonthVals, lastMonthVals, firstAvg, lastAvg, d)
                            }
                            changeAverageRates.push(avgChange)
                            d.changerate = avgChange
                        }
                    } else {
                        d.rate = 0
                    }
                    d.volume = vol
                    totalVolumes.push(vol)
                })

                console.log("changeAverageRates", changeAverageRates.sort())

                // console.log("AVERAGE RATES MIN/MAX", Math.min(...averageRates), Math.max(...averageRates))


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
                        // .style('fill', d => !d.pointDensity ? '#fff' : colorScale(d.pointDensity))
                        .style("fill", "none")
                        // .style("stroke", "lightgrey")
                        .style("stroke", d => !d.pointDensity ? "none" : "#b2b2b2")

                // create scale for inner hexagons
                const middleRadius = 2 + ((Number(config.radius) - 2) / 2)

                const innerHexScale = d3.scaleQuantize()
                    .domain([Math.max(.001, d3.min(totalVolumes)), d3.max(totalVolumes)])
                    .range([2, Number(middleRadius), Number(config.radius)])
                    // .range([2,6,10])
                    // .domain([0, d3.max(totalVolumes)])
                    // .range([0,1,2,3,4,5,6,7])

                // create color scale for rate *change*
                const colorRateScale = d3.scaleQuantize()
                    .range(["#27566b", "#f1cc56", "#8cbb61"])

                if (config.calc_type === "average") {
                    colorRateScale
                        .domain(d3.extent(averageRates))
                } else if (config.calc_type === "change_average") {
                    colorRateScale
                        // .domain(d3.extent(changeAverageRates))
                        .domain(d3.extent(changeAverageRates.filter(d => d != Infinity)))
                }
                

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

                const innerHexs = group
                    .append('g')
                    .attr("class", "inner-hexs")
                    .selectAll('.innerhex')
                    .data(hex.grid.layout)
                    .enter()
                    .append("polygon")
                        .attr("class", "innerhex")
                        .attr("points", d => hexagonPoints(innerHexScale(d.volume)))
                        .attr("transform", d => `translate(${d.x}, ${d.y})`)
                        .style("fill", d => {
                            if (+d.volume > 0) {
                                if (config.calc_type === "average") {
                                    return colorRateScale(d.rate)
                                } else if (config.calc_type === "change_average") {
                                    if (d.changerate != Infinity) {
                                        return colorRateScale(d.changerate)
                                    } else {
                                        console.log("COLOR IT GREY", d.changerate)
                                        return "#b2b2b2"
                                    }
                                }
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
                    .attr("transform", `translate(${width / 4},${height + 6})`) //10
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
                    .text("Volume")

                // const legendSizeEntries = legendSize.append("g")
                //     .attr("transform", "translate(-30, 20)")

                // const legendS = d3.legendSize()
                //     .labelFormat(d3.format("~s"))
                //     .orient("horizontal")
                //     .useClass("true")
                //     .labelAlign("start")
                //     .title("Volume")
                //     .titleWidth(100)
                //     .scale(innerHexScale)
                //     .shape("circle")

                // legendSizeEntries.call(legendS)
                
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

                let legendColorFormat;
                if (config.calc_type === "average") {
                    legendColorFormat = ",.2s"
                } else if (config.calc_type === "change_average") {
                    legendColorFormat = ",.0%"
                }

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
                    .text(config.calc_type === "average" ? "Average RPM" : "% Change in RPM")
                    // .text("% Change in RPM")

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
                    .text(`${d3.format(legendColorFormat)(colorRateScale.invertExtent("#27566b")[0])} to ${d3.format(legendColorFormat)(colorRateScale.invertExtent("#27566b")[1])}`)
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
                    .text(`${d3.format(legendColorFormat)(colorRateScale.invertExtent("#f1cc56")[0])} to ${d3.format(legendColorFormat)(colorRateScale.invertExtent("#f1cc56")[1])}`)
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
                    .text(`${d3.format(legendColorFormat)(colorRateScale.invertExtent("#8cbb61")[0])} to ${d3.format(legendColorFormat)(colorRateScale.invertExtent("#8cbb61")[1])}`)
                    .classed("legend-text", true)

                if (config.calc_type === "change_average" && changeAverageRates.filter(d => d == Infinity).length > 0) {
                    legendColor.append("polygon")
                        .attr("points", d => hexagonPoints(8))
                        .attr("transform", "translate(-110, 40)")
                        .style("fill", "#b2b2b2")

                    legendColor.append("text")
                        .attr("x", -99)
                        .attr("y", 41)
                        .style("text-anchor", "start")
                        .style("dominant-baseline", "middle")
                        .style("font-size", 9)
                        .attr("fill", "#323232")
                        .text(`Infinity`)
                        .classed("legend-text", true)
                }

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