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
            <svg>
            </svg>`;
        element.style.fontFamily = `"Open Sans", "Helvetica", sans-serif`
  },

  updateAsync: function(data, element, config, queryResponse, details, done, environment = "prod") {
      if (environment == "prod") {
        if (!handleErrors(this, queryResponse, {
        min_pivots: 1, max_pivots: 1,
        min_dimensions: 1, max_dimensions: 1,
        min_measures: 1, max_measures: 1
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

        const dimensions = queryResponse.fields.dimension_like
        const measures = queryResponse.fields.measure_like

        console.log("dimensions", dimensions)
        console.log("measures", measures)

        let data_ready = []

        data.forEach((d) => {
            // console.log(d[dimensions[0].name])
            // console.log(d[dimensions[0].name].value)
            let entry = {}

            entry['lat'] = d[dimensions[0].name].value
            entry['lon'] = +d[dimensions[1].name].value
            entry['coords'] = d[dimensions[2].name].value
            entry['market'] = d[dimensions[3].name].value
            entry['region'] = d[dimensions[4].name].value
            entry['measure'] = +d[measures[0].name].value

            data_ready.push(entry)
        })

        const coordAccessor = d => d.coords;
        const measureAccessor = d => +d.measure;
        const lonAccessor = d => +d.lon;
        const latAccessor = d => +d.lat;
        const marketAccessor = d => d.market;
        const regionAccessor = d => d.region;

        // console.log("data_ready", data_ready)

        // try sometime...
        // d3.scaleSequentialQuantile()
        //     .defer(d3.json, "./dataStateAlbers.json")
        //     .await(ready)

        d3.json('./dataState.json').then(function(mdata) { 
            console.log("map", mdata)
            console.log("data_ready", data_ready)

            // grab info from original, looker dataset
            // let coords = []

            // // console.log("dimensions", dimensions[2])
            // data_ready.forEach((d, index) => {
            //     coords.push(d['coords'])
            // })

            // console.log("coords", coords)


            // set-up the map and import the state geometries data
            
            // NEED THIS SECTION FOR EXAMPLES 1-3 (EVERYTHING EXCEPT HEXGRID) ---------------

            // let scale = Math.min(width/Math.PI*5, height/Math.PI*5)
            
            // const projection = d3.geoAlbersUsa()
            //     // .scale(1000)
            //     .scale(scale)
            //     .translate([width/2, height/2])

            // const path = d3.geoPath()
            //     .projection(projection)


            // const state = group
            //     .append('g')
            //     .attr("stroke", "#fff")
            //     .attr("stroke-width", 2)
            //     .attr("fill", "#ededed")
            //     .selectAll("path")
            //     .data(topojson.feature(mdata, mdata.objects.states).features)
            //     .enter()
            //     .append("path")
            //     .attr("d", path) 

            // NEED ABOVE SECTION FOR EXAMPLES 1-3 (EVERYTHING EXCEPT HEXGRID) ---------------
            
            // ---------------------------------------------------------------------
            // 1. Data Points
            // add circles for the individual points

            // const points = group
            //     .append('g')
            //     .selectAll("circle")
            //         .data(data_ready)
            //         .enter()
            //         .append("circle")
            //         .attr("cx", d => projection([d['lon'], d['lat']])[0])
            //         .attr("cy", d => projection([d['lon'], d['lat']])[1])
            //         .attr("r", () => {
            //             if (scale < 500) {
            //                 return 2
            //             } else if (scale < 750) {
            //                 return 3
            //             } else if (scale < 1250) {
            //                 return 4
            //             } else {
            //                 return 5
            //             }
            //         })
            //         .attr("fill", "steelblue")

        
            // ---------------------------------------------------------------------
            // 2. Spikes            

            // const maxLength = 200;
            // const length = d3.scaleLinear(d3.extent(data_ready, d => d['measure']), [0, maxLength])
            // const spike = (length, width = 7) => `M${-width / 2},0L0,${-length}L${width / 2},0`
            // const spikeColor = "steelblue"

            // const spikes = group    
            //     .append('g')
            //         .attr("fill", spikeColor)
            //         .attr("fill-opacity", 0.3)
            //         .attr("stroke", spikeColor)
            //         .attr("stroke-width", 2)
            //         .attr("stroke-opacity", 0.8)
            //     .selectAll("path")
            //     .data(data_ready)
            //     .join("path")
            //         .attr("transform", d => `translate(${projection(d['coords'].reverse())})`)
            //         .attr("d", d => spike(length(measureAccessor(d))))


            // console.log("ticks", length.ticks(4).slice(1))

            // const legend = svg.append("g")
            //         .attr("class", "legend")
            //         .attr("fill", "#777")
            //         .attr("text-anchor", "middle")
            //         .attr("font-size", 10)
            //     .selectAll("g")
            //         .data(length.ticks(4).reverse())
            //     .enter()
            //     .append("g")
            //         .attr("transform", (d, i) => `translate(${width - 20 - i * 24}, ${height - 20})`)

            // legend.append("path")
            //     .attr("fill", spikeColor)
            //     .attr("fill-opacity", 0.3)
            //     .attr("stroke", spikeColor)
            //     .attr("d", d => spike(length(d)))

            // legend.append("text")
            //     .attr("dy", "1.3em")
            //     .text(length.tickFormat(4, "s"))


            // ---------------------------------------------------------------------
            // 3. HexBin Map
            
            // const hexbin = d3.hexbin(0).extent([[0,0], [width, height]]).radius(10) // creates a hexbin generator
            
            // // create other scales
            // const radiusScale = d3.scaleSqrt([0, d3.max(data_ready, d => measureAccessor(d))], [0, hexbin.radius() * Math.SQRT2])
            // // const colorScale = d3.scaleSequential(d3.extent(data_ready, d => regionAccessor(d)), d3.interpolateSpectral)
            // const colorScale = d3.scaleOrdinal()
            //     .domain(d => regionAccessor(d))
            //     .range(d3.schemeDark2)

            // console.log("color domain", colorScale.domain(), colorScale.domain)
            // console.log("color range", colorScale.range(), colorScale.range)

            // const hbins = group
            //     .append('g')
            //     .selectAll("path")
            //     .data(data_ready)
            //     .join("path")
            //         .attr("transform", d => `translate(${projection(d['coords'].reverse())})`)
            //         .attr("d", d => hexbin.hexagon(radiusScale(measureAccessor(d))))
            //         .attr("fill", d => colorScale(regionAccessor(d)))
            //         .attr("stroke", d => d3.lab(colorScale(regionAccessor(d))).darker())

            // const legend = svg.append('g')


            // ---------------------------------------------------------------------
            // 4. HexGrid Map

            const projection = d3.geoAlbersUsa()
                .fitSize([width, height], topojson.feature(mdata, mdata.objects.nation))

            const path = d3.geoPath()
                .projection(projection)

            data_ready.forEach(d => {
                const coords = projection([+d.lon, +d.lat])
                d.x = coords[0]
                d.y = coords[1]
            })

            const hexgrid = d3.hexgrid()
                .extent([width, height])
                .geography(topojson.feature(mdata, mdata.objects.nation))
                .projection(projection)
                .pathGenerator(path)
                .hexRadius(5)

            console.log("data_ready", data_ready)

            const hex = hexgrid(data_ready)

            console.log("grid", hex.grid)
            console.log("pointdensity points", [...hex.grid.extentPointDensity].reverse())

            const colorScale = d3.scaleSequential(d3.interpolateViridis)
                .domain([...hex.grid.extentPointDensity].reverse())         

            const grid = group.append('g')
                .selectAll('.hex')
                .data(hex.grid.layout)
                .enter()
                .append('path')
                    .attr('class', 'hex')
                    .attr('d', hex.hexagon())
                    .attr('transform', d => `translate(${d.x}, ${d.y})`)
                    .style('fill', d => !d.pointDensity ? '#fff' : colorScale(d.pointDensity))
                    .style("stroke", "lightgrey")

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