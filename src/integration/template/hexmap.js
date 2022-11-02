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

        let margin = {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10,
        }

        const width = element.clientWidth - margin.left - margin.right;
        const height = element.clientHeight - margin.top - margin.bottom;

        const svg = (
            d3.select(element).select('svg#first')
                .html('')
                .attr('width', '100%')
                .attr('height', '100%')
        )

        const group = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`)
            .attr('width', '100%')
            .attr('height', (height + 'px'))
            .classed('group', true)

        const dimensions = queryResponse.fields.dimension_like
        const measures = queryResponse.fields.measure_like

        console.log("dimensions", dimensions)
        console.log("measures", measures)

        let data_ready = []

        data.forEach((d) => {
            // console.log(d[dimensions[0].name])
            // console.log(d[dimensions[0].name].value)
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

        const monthAccessor = d => d.month;
        const lonAccessor = d => +d.lon;
        const latAccessor = d => +d.lat;
        const directionAccessor = d => d.direction;
        const rateAccessor = d => d.rate;
        const volumeAccessor = d => d.volume;

        d3.json('./dataState.json').then(function(mdata) { 
            console.log("map", mdata)
            console.log("data_ready", data_ready)

            // ---------------------------------------------------------------------
            // HexGrid Map

            const projection = d3.geoAlbersUsa()
                .fitSize([width, height], topojson.feature(mdata, mdata.objects.nation))

            const path = d3.geoPath()
                .projection(projection)

            // add outline for nation
            const nation = group
                .append('g')
                // .attr("stroke", "lightgrey")
                // .attr("stroke-width", 0.5)
                .attr("fill", "#fafafa")
                .selectAll("path")
                .data(topojson.feature(mdata, mdata.objects.nation).features)
                .enter()
                .append("path")
                .attr("d", path)

            console.log("drew nation outline")

            data_ready.forEach(d => {
                const coords = projection([d.lon, d.lat])
                d.x = coords[0]
                d.y = coords[1]
            })

            console.log("data_ready with coords", data_ready)

            const hexgrid = d3.hexgrid()
                .extent([width, height])
                .geography(topojson.feature(mdata, mdata.objects.nation))
                .projection(projection)
                .pathGenerator(path)
                .hexRadius(9)

            console.log("data_ready", data_ready)

            const hex = hexgrid(data_ready, ["volume", "rate", "direction", "month"])

            console.log("grid", hex.grid)
            console.log("pointdensity points", [...hex.grid.extentPointDensity].reverse())

            const colorScale = d3.scaleSequential(d3.interpolateViridis)
                .domain([...hex.grid.extentPointDensity].reverse())  
                
            const totalVolumes = []
            const averageRates = []
                
            hex.grid.layout.forEach((d, i) => {
                let vol = 0;
                if (+d.datapoints > 0) {
                    let rateList = []

                    d.forEach((sd, si) => {
                        vol += +sd.volume
                        rateList.push(+sd.rate)
                    })

                    const avg = rateList.reduce((a,b) => a + b) / rateList.length;
                    averageRates.push(avg)
                    d.rate = avg
                } else {
                    d.rate = 0
                }
                d.volume = vol
                totalVolumes.push(vol)
            })

            console.log("totvolume", hex.grid.layout)
            console.log("totalVolumes", totalVolumes)
            console.log("extent", d3.extent(totalVolumes))
            console.log("averageRates", averageRates)
            console.log("extent", d3.extent(averageRates))

            // plot empty hexagons for only areas that have data
            const grid = group.append('g')
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
                    .style("stroke", d => !d.pointDensity ? "none" : "lightgrey")

            // create scale for inner hexagons
            const innerHexScale = d3.scaleQuantize()
                .domain([Math.max(1, d3.min(totalVolumes)), d3.max(totalVolumes)])
                .range([1,3,5,7,9])
                // .domain([0, d3.max(totalVolumes)])
                // .range([0,1,2,3,4,5,6,7])

            // create color scale for rate *change*
            const colorRateScale = d3.scaleQuantize()
                .domain(d3.extent(averageRates))
                .range(["#f1cc56", "#8cbb61", "#007b82", "#27566b"])

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
                .selectAll('.innerhex')
                .data(hex.grid.layout)
                .enter()
                .append("polygon")
                    .attr("class", "innerhex")
                    .attr("points", d => hexagonPoints(innerHexScale(d.volume)))
                    .attr("transform", d => `translate(${d.x}, ${d.y})`)
                    .style("fill", d => {
                        if (+d.volume > 0) {
                            return colorRateScale(d.rate)
                        } else {
                            return "none"
                        }
                    })
                    .style("stroke", "none")

            // ---------------------------------------------------------------------
            


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