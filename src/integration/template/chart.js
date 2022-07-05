export const object = {
    // Id and Label are legacy properties that no longer have any function besides documenting
    // what the visualization used to have. The properties are now set via the manifest
    // form within the admin/visualizations page of Looker.

    id: "column-change",
    label: "ZDev Column Change",
    options: {
        bar_display: {
          type: 'string',
          label: 'Color drops/increases',
          display: "radio",
          values: [
            {"Yes": "yes"},
            {"No": "no"}
          ],
          default: "no"
        }
      },
          // Set up the initial state of the visualization
    create: function(element, config) {
        // Insert a <style> tag with some styles we'll use later
        element.innerHTML = `
            <style>
              body {
                  font-family: Arial;
                  font-size: 12px;
              }
            </style>
            <svg>
            </svg>`;
        element.style.fontFamily = `"Open Sans", "Helvetica", sans-serif`
    },
    // Render in response to the data or settings changing
    updateAsync: function(data, element, config, queryResponse, details, done, environment = "prod") {
        if (environment == "prod") {
            if (!handleErrors(this, queryResponse, {
                min_pivots: 0, max_pivots: 0,
                min_dimensions: 0, max_dimensions: 5,
                min_measures: 0, max_measures: 5
            })) return
        }
    
    try {
            // set dimensions
            const margin = {
                top: 60,
                right: 10,
                bottom: 30,
                left: 40
            }

            const width = element.clientWidth - margin.left - margin.right;
            const height = element.clientHeight - margin.top - margin.bottom;

            const svg = (
                d3.select(element).select("svg")
                    .html("")
                    .attr("width", "100%")
                    .attr("height", "100%")
            )

            const group = svg.append("g")
                .attr("transform", `translate(${margin.left}, ${margin.top})`)
                .attr("width", "100%")
                .attr("height", (height + "px"))
                .classed("group", true)


            // load the data
            const parseDate = d3.timeParse("%Y-%m")

            const dimension = queryResponse.fields.dimension_like[0]
            const measures = queryResponse.fields.measure_like

            console.log(data)

            let measure = null
            measures.forEach((m,i) => {
                if (m.value_format && m.value_format.includes("%")) {
                    measure = measures[i]
                } else {
                    return
                }
            })

            const groupAccessor = d => parseDate(d.group)
            const valueAccessor = d => {
                if (d["value"]) {
                    // return +String(d["value"]).replace(/%/g, '')/100
                    return d["value"]
                } else {
                    return +0
                }
            }

            let data_ready = []

            data.forEach((d) => {

                let entry = {}
                entry["group"] = d[dimension.name].value
                entry["value"] = d[measure.name].value
                data_ready.push(entry)
            })

            console.log(data_ready)

            data_ready = data_ready.sort(function(a,b) {
                return new Date(groupAccessor(a)) - new Date(groupAccessor(b))
            })

            console.log(data_ready)

            // scales
            const xScale = d3.scaleBand()
                .domain(data_ready.map(d => groupAccessor(d)))
                .range([0, width])
                .padding(0.2)

            const yScale = d3.scaleLinear()
                .domain([
                    Math.min(0, d3.min(data_ready, d => valueAccessor(d))),
                    d3.max(data_ready, d => valueAccessor(d))
                ])
                .range([height, 0])

            // draw data
            const bars = group.selectAll("rect")
                .data(data_ready)
                .enter()
                .append("rect")
                    .attr("x", d => xScale(groupAccessor(d)))
                    .attr("y", d => {
                        if (valueAccessor(d) < 0) {
                            return yScale(0)
                        } else {
                            return yScale(valueAccessor(d))
                        }
                    })
                    .attr("width", xScale.bandwidth())
                    .attr("height", d => {
                        if (valueAccessor(d) >= 0) {
                            return yScale(0) - yScale(valueAccessor(d))
                        } else {
                            return yScale(valueAccessor(d)) - yScale(0)
                        }
                    })
                    .attr("fill", (d,i) => {
                        const thisChange = valueAccessor(d)
                        
                        if (thisChange < 0) {
                            return "#D76106"
                        } else {
                            return "#0072B5"
                        }
                    })

                const xAxisGenerator = d3.axisBottom()
                    .scale(xScale)
                    .tickSize(0)
                    .tickPadding([10])
                    .tickFormat(d3.timeFormat("%b %-d"))    

                const xAxis = group.append("g")
                    .call(xAxisGenerator)
                        .style("transform", `translateY(${height}px)`)
                        .attr("stroke-opacity", 0.0)
                        .attr("font-size", "1em")
                        .attr("font-family", "sans-serif")

                const yAxisGenerator = d3.axisLeft()
                    .scale(yScale)
                    .tickSize(0)

                if (config.currency_type == "dollar") {
                    yAxisGenerator.tickFormat(d3.format("$,"))
                } 

                const yAxis = group.append("g")
                    .call(yAxisGenerator)
                        .style("transform", `translate(10,0)`)
                        .attr("stroke-opacity", 0.0)
                        .attr("font-size", "1em")
                        .attr("font-family", "sans-serif")
                

            const minVal = d3.min(data_ready, d => valueAccessor(d))
            const maxVal = d3.max(data_ready, d => valueAccessor(d))

            const labelVals = [minVal, maxVal]

            const barText = group.append("g")
                .selectAll("text")
                .data(data_ready)
                .enter()
                .append("text")
                    .attr("x", d => xScale(groupAccessor(d)) + xScale.bandwidth()/2)
                    .attr("y", d => {
                        if (valueAccessor(d) >= 0) {
                            return yScale(valueAccessor(d)) - 6
                        } else {
                            return yScale(valueAccessor(d)) + 14
                        }
                    })
                    .text((d) => {
                        return d3.format("$,.0f")(d)
                        } 
                    )
                    .style("text-anchor", "middle")
                    .attr("fill", "#323232")
                    .attr("font-size", "0.75em")
                    .attr("font-family", "sans-serif")


        } catch(error) {
            if (queryResponse.fields.dimensions.length != 1 || 
                queryResponse.fields.measures.length < 1) {
                    this.addError({title: "Dimension/Pivot Error", message: "This chart takes 1 dimension and 1 measure."});
                    return;
                }
        }


        // Callback at the end of the rendering to let Looker know it's finished
        done()
    }
}