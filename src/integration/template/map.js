import { isWhiteSpaceLike } from "typescript";

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
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
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

        console.log("data_ready", data_ready)

        // try sometime...
        // d3.scaleSequentialQuantile()
        //     .defer(d3.json, "./dataStateAlbers.json")
        //     .await(ready)

        d3.json('./dataState.json').then(function(mdata) { 
            console.log("map", mdata)
            console.log("data", data)

            // grab info from original, looker dataset
            let coords = []

            // console.log("dimensions", dimensions[2])
            data_ready.forEach((d, index) => {
                coords.push(d['coords'])
            })

            console.log("coords", coords)


            // set-up the map and import the state geometries data
            let scale = Math.min(width/Math.PI*5, height/Math.PI*5)
            console.log("scale", scale)
            
            const projection = d3.geoAlbersUsa()
                // .scale(1000)
                .scale(scale)
                .translate([width/2, height/2])

            const path = d3.geoPath()
                .projection(projection)

            // const usa = group
            //     .append('g')
            //     .append("path")
            //     .datum(topojson.feature(mdata, mdata.objects.nation))
            //     .attr("d", path) 

            const state = group
                .append('g')
                .attr("stroke", "#fff")
                .attr("stroke-width", 2)
                .attr("fill", "#ededed")
                .selectAll("path")
                .data(topojson.feature(mdata, mdata.objects.states).features)
                .enter()
                .append("path")
                .attr("d", path) 
            
            // add circles for the individual points
            const points = group
                .append('g')
                .selectAll("circle")
                    .data(data_ready)
                    .enter()
                    .append("circle")
                    .attr("cx", d => projection([d['lon'], d['lat']])[0])
                    .attr("cy", d => projection([d['lon'], d['lat']])[1])
                    .attr("r", () => {
                        if (scale < 500) {
                            return 2
                        } else if (scale < 750) {
                            return 3
                        } else if (scale < 1250) {
                            return 4
                        } else {
                            return 5
                        }
                    })
                    .attr("fill", "steelblue")

            legend
            const maxLength = 200;
            const length = d3.scaleLinear(d3.extent(data_ready, d => d['measure']), [0, maxLength])
            const spike = (length, width = 7) => `M${-width / 2},0L0,${-length}L${width / 2},0`

            console.log("ticks", length.ticks(4).slice(1))

            const legend = svg.append("g")
                    .attr("class", "legend")
                    .attr("fill", "#777")
                    .attr("text-anchor", "middle")
                    .attr("font-size", 10)
                .selectAll("g")
                    .data(length.ticks(4).reverse())
                .enter()
                .append("g")
                    .attr("transform", (d, i) => `translate(${width - 20 - i * 24}, ${height - 20})`)

            legend.append("path")
                .attr("fill", "red")
                .attr("fill-opacity", 0.3)
                .attr("stroke", "red")
                .attr("d", d => spike(length(d)))

            legend.append("text")
                .attr("dy", "1.3em")
                .text(length.tickFormat(4, "s"))

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