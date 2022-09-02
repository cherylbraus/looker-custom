export const object = {
    // Id and Label are legacy properties that no longer have any function besides documenting
    // what the visualization used to have. The properties are now set via the manifest
    // form within the admin/visualizations page of Looker.

    id: "colored-bar-chart",
    label: "ZDev Colored Bar Chart",
    options: {
        number_type: {
          type: 'string',
          label: 'Number Type',
          display: "select",
          values: [
            {"Raw": "raw"},
            {"Percentage": "percentage"},
            {"USD": "USD"}
          ],
          default: "percentage",
          section: "Y"
        },
        color_drops_decreases: {
            type: "boolean",
            label: "Color Decreases/Negatives",
            default: "false",
            section: "Custom Options",
        },
        periods_shown: {
            type: "number",
            label: "# Periods to Show",
            display: "number",
            default: 6,
            section: "Custom Options"
        },
        bar_labels: {
            type: "string",
            label: "Bars to Label",
            display: "radio",
            values: [
                {"All": "all"},
                {"Extremes": "extremes"}
            ],
            default: "extremes",
            section: "Custom Options"
        },
        show_xaxis_name: {
            type: "boolean",
            label: "Show X-Axis Name",
            default: "true",
            section: "X"
        },
        xaxis_label: {
            type: "string",
            label: "X-Axis Label",
            display: "text",
            default: "",
            section: "X"
        },
        xticklabels_show: {
            type: "boolean",
            label: "Show X Tick Labels",
            default: "true",
            section: "X"
        },
        xticklabel_format: {
            type: "string",
            label: "X Tick Time Label Format",
            display: "text",
            default: "%b",
            section: "X"
        },
        x_gridlines: {
            type: "boolean",
            label: "Show X Gridlines",
            default: "false",
            section: "X"
        },
        show_yaxis_name: {
            type: "boolean",
            label: "Show Y-Axis Name",
            default: "true",
            section: "Y"
        },
        yaxis_label: {
            type: "string",
            label: "Y-Axis Label",
            display: "text",
            default: "",
            section: "Y"
        },
        yticklabels_show: {
            type: "boolean",
            label: "Show Y Tick Labels",
            default: "true",
            section: "Y"
        },
        yticklabel_format: {
            type: "string",
            label: "Y Tick Value Format",
            display: "text",
            default: ",",
            placeholder: "#,###",
            section: "Y"
        },
        y_gridlines: {
            type: "boolean",
            label: "Show Y Gridlines",
            default: "false",
            section: "Y"
        },
        bar_color: {
            type: "array",
            label: "Bar Color",
            default: ["#27566b"],
            display: "color",
            section: "Custom Options"
        },
        negative_color: {
            type: "array",
            label: "Negative/Decrease Color",
            default: ["#8cbb61"],
            display: "color",
            section: "Custom Options"
        },
        second_metric_color: {
            type: "array",
            label: "2nd Metric Color",
            default: ["#8cbb61"],
            display: "color",
            section: "Custom Options"
        },
        two_measures: {
            type: "boolean",
            label: "Show 2 Measures",
            default: "false",
            section: "Custom Options"
        },
        legend_first_label: {
            type: "string",
            label: "Legend Label: Measure 1",
            display: "text",
            default: "",
            section: "Legend"
        },
        legend_second_label: {
            type: "string",
            label: "Legend Label: Measure 2",
            display: "text",
            default: "",
            section: "Legend"
        }
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
            font-family: 'Roboto';
            text-anchor: middle;
            }

            .y-axis, .x-axis {
            font-family: "Roboto";
            }

            .x-axis .domain {
            stroke: #ccd6eb;
            stroke-width: 1;
            }

            .zero-line {
                stroke: #ccd6eb;
                stroke-width: 0.5;
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

            .error-container {
                margin: 0;
                position: absolute;
                top: 50%;
                -ms-transform: translateY(-50%);
                transform: translateY(-50%);
                text-align: center;
                width: 100%;
            }

            .error {
                font-family: Roboto;
                font-size: 16px;
            }

            .error-header {
                font-family: Roboto;
                font-weight: 700;
                font-size: 16px;
            }

            #value-header {
                padding-top: 8px;
                border-top: solid 1px rgb(222, 225, 229);
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
                min_dimensions: 1, max_dimensions: 1,
                min_measures: 1, max_measures: 2
            })) return
        }

        const options = { ...this.options}

        // if (config.two_measures) {
        //     //hide
        //     options.negative_color.hidden = true
        //     options.color_drops_decreases.hidden = true
        //     //show
        //     options.second_metric_color.hidden = false
        //     options.legend_first_label.hidden = false
        //     options.legend_second_label.hidden = false
        // } else {
        //     //show
        //     options.negative_color.hidden = false
        //     options.color_drops_decreases.hidden = false
        //     //hide
        //     options.second_metric_color.hidden = true
        //     options.legend_first_label.hidden = true
        //     options.legend_second_label.hidden = true
        // }

        // if (config.color_drops_decreases) {
        //     //show
        //     options.negative_color.hidden = false
        // } else {
        //     //hide
        //     options.negative_color.hidden = true
        // }

        // if (config.show_xaxis_name) {
        //     //show
        //     options.xaxis_label.hidden = false
        // } else {
        //     options.xaxis_label.hidden = true
        // }

        // if (config.show_yaxis_name) {
        //     //show
        //     options.yaxis_label.hidden = false
        // } else {
        //     options.yaxis_label.hidden = true
        // }

        // this.trigger('registerOptions', options)

        try {

            // set dimensions
            let top_margin;

            if (config.two_measures == "true") {
                top_margin = 60;
            } else {
                top_margin = 30;
            }

            const margin = {
                top: top_margin,
                right: 10,
                bottom: 65,
                left: 80
            }
            
            const width = element.clientWidth 
            const height = element.clientHeight 
            const boundedWidth = width - margin.left - margin.right
            const boundedHeight = height - margin.top - margin.bottom

            const svg = (
                d3.select(element).select("svg")
                    .html("")
                    .attr("width", "100%")
                    .attr("height", "100%")
            )

            console.log("here1")

            const group = svg.append("g")
                .attr("transform", `translate(${margin.left}, ${margin.top})`)
                .attr("width", "100%")
                .attr("height", (height + "px"))
                .classed("group", true)

            console.log("here2")
            
            // load the data
            const parseTime = d3.timeParse("%Y-%m")
            
            const dimension = queryResponse.fields.dimension_like[0]
            const measures = queryResponse.fields.measure_like

            let measureMatch;
            if (config.two_measures == "true") {
                if (measures[0].value_format === measures[1].value_format) {
                    measureMatch = true
                } else {
                    measureMatch = false
                }
            } else {
                measureMatch = false
            }
            
            // console.log(data)
            console.log("measures", measures)
            console.log("measureMatch", measureMatch)
            console.log("show 2?", config.two_measures)
            
            // let measure = null
            // measures.forEach((m,i) => {
            //     if (m.value_format) {
            //         measure = measures[i]
            //     } else {
            //         return
            //     }
            // })
            
            const groupAccessor = d => parseTime(d.group)
            const valueAccessor = d => {
                if (d["value"]) {
                    // return +String(d["value"]).replace(/%/g, '')/100
                    return d["value"]
                } else {
                    return +0
                }
            }
            const value2Accessor = d => {
                if (d["value2"]) {
                    return d["value2"]
                } else {
                    return +0
                }
            }
            
            
            // DATE STUFF
            const today = new Date()
            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
            const backDate = firstDayOfMonth.setMonth(firstDayOfMonth.getMonth() - config.periods_shown);

            console.log("data", data)
            console.log("backdate", backDate, new Date(backDate))
            
            let data_ready = []
            
            data.forEach((d) => {
            
                let entry = {}
                // if (d[measure.name].value != 0 && parseTime(d[dimension.name].value) > new Date(backDate)) {
                if (measureMatch && parseTime(d[dimension.name].value) > new Date(backDate)) {
                    entry["group"] = d[dimension.name].value
                    entry["value"] = d[measures[0].name].value
                    entry["value2"] = d[measures[1].name].value
                    data_ready.push(entry)
                } else if (measureMatch == false && parseTime(d[dimension.name].value) > new Date(backDate)) {
                    entry["group"] = d[dimension.name].value
                    entry["value"] = d[measures[0].name].value
                    data_ready.push(entry)
                }            
            })
        
            
            data_ready = data_ready.sort(function(a,b) {
                return new Date(groupAccessor(a)) - new Date(groupAccessor(b))
            })

            console.log("data_ready", data_ready)
            
            // SCALES
            const xScale = d3.scaleBand()
                .domain(data_ready.map(d => groupAccessor(d)))
                .range([0, boundedWidth])
                .padding(0.3)

            // const x2Scale = d3.scaleBand()
            //     .domain(data_ready.map(d => groupAccessor(d)))
            //     .range([0, boundedWidth])
            //     .padding(0.2)


            let yScale;
            if (measureMatch) {
                console.log("2 measures")
                const totalMin = Math.min(
                    Math.min(0, d3.min(data_ready, d => valueAccessor(d))),
                    Math.min(0, d3.min(data_ready, d => value2Accessor(d)))
                )
                const totalMax = Math.max(
                    d3.max(data_ready, d => valueAccessor(d)),
                    d3.max(data_ready, d => value2Accessor(d))
                )
                yScale = d3.scaleLinear()
                    .domain([totalMin, totalMax])
                    .range([boundedHeight, 0])
            } else {
                console.log("1 measure")
                yScale = d3.scaleLinear()
                    .domain([
                        Math.min(0, d3.min(data_ready, d => valueAccessor(d))),
                        d3.max(data_ready, d => valueAccessor(d))
                    ])
                    .range([boundedHeight, 0])
            }        

            console.log(yScale.domain()[0])
            
            // -------------------------------------------------------
            // DRAW PERIPHERALS
            // X AXIS   
            const xAxisGenerator = d3.axisBottom()
                .scale(xScale)
                .tickPadding(10)
                .tickSizeOuter(0)

            // x ticklabels
            if (config.xticklabels_show == "true") {
                xAxisGenerator
                    .tickFormat(d3.timeFormat(config.xticklabel_format))
            }  else { // can't account for non-time x axis data
                xAxisGenerator
                    .tickFormat("")
            }

            // x gridlines
            if (config.x_gridlines == "true") {
                xAxisGenerator
                    .tickSizeInner(-boundedHeight)
            } else {
                xAxisGenerator
                    .tickSizeInner(0)
            }

            // x axis
            const xAxis = group.append("g")
                .call(xAxisGenerator)
                    .style("transform", `translateY(${boundedHeight + 15}px)`)
                    .attr("class", "x-axis")

            if (config.xticklabels_show == "false") {
                d3.selectAll(".x-axis text")
                    .attr("class", "hide")
            } 

            if (config.x_gridlines == "false") {
                d3.selectAll(".x-axis line")
                    .attr("class", "hide")
            }


            // Y AXIS
            const yAxisGenerator = d3.axisLeft()
                .scale(yScale)
                .tickPadding(10)

            // y ticklabels
            if (config.yticklabels_show == "true") {
                yAxisGenerator
                    .tickFormat(d3.format(config.yticklabel_format))
            } else {
                yAxisGenerator
                    .tickFormat("")
            }

            // y gridlines
            if (config.y_gridlines == "true") {
                yAxisGenerator
                    .tickSize(-boundedWidth)
            } else {
                yAxisGenerator
                    .tickSize(0)
            }

            // y axis
            const yAxis = group.append("g")
                .call(yAxisGenerator)
                .attr("class", "y-axis")

            if (config.yticklabels_show == "false") {
                d3.selectAll(".y-axis text")
                    .attr("class", "hide")
            }

            if (config.y_gridlines == "false") {
                d3.selectAll(".y-axis line")
                    .attr("class", "hide")
            }


            // AXIS LABELS
            if (config.show_xaxis_name == "true") {
                xAxis.append("text")
                    .attr("class", "axis-label")
                    .attr("x", boundedWidth/2)
                    .attr("y", (margin.bottom-20))
                    .text(function() {
                        if (config.xaxis_label) {
                            return config.xaxis_label
                        } else {
                            return dimension.label
                        }
                    })
            } else {
                console.log("don't show x axis name")
            }

            if (config.show_yaxis_name == "true") {
                yAxis.append("text")
                    .attr("class", "axis-label")
                    .attr("x", -boundedHeight/2)
                    .attr("y", -margin.left + 18)
                    // .style("text-anchor", "middle")
                    .style("transform", "rotate(-90deg)")
                    .text(function() {
                        if (config.yaxis_label) {
                            return config.yaxis_label
                        } else {
                            if (measureMatch) {
                                return `${measures[0].label} / ${measures[1].label}`
                            } else {
                                return measures[0].label
                            }
                        }
                    })
            }

            // -------------------------------------------------------
            // Add zero line
            if (yScale.domain()[0] < 0) {
                console.log("add zero line")
                group.append("line")
                    .attr("class", "zero-line")
                    .attr("x1", 0)
                    .attr("x2", boundedWidth)
                    .attr("y1", yScale(0))
                    .attr("y2", yScale(0))
            }

            // -------------------------------------------------------
            // HOVERING
            if (measureMatch) {
                const barGroups = ["front-bars", "back-bars"]

                var mouseover = function(d) {
                    console.log("LEGEND")
                    console.log(this.parentNode)
                    
                    const barGroup = d3.select(this.parentNode)
                    const barGroupClass = barGroup.attr("class")
                    const otherClass = barGroups.filter(f => f != barGroupClass)

                    barGroup.selectAll("rect")
                        .attr("fill-opacity", "0.7")                 
                    d3.selectAll(`.${otherClass}`)
                        .selectAll("rect")
                        .attr("fill-opacity", "0.1")       

                    d3.selectAll(`.legendContainer .${otherClass}-leg`)
                        .attr("fill-opacity", "0.1")
                    d3.selectAll(`.legendContainer .${barGroupClass}-leg`)
                        .attr("fill-opacity", "1.0")

                    d3.selectAll(`.${otherClass}-labels`)
                        .attr("fill-opacity", "0")
                    d3.selectAll(`.${barGroupClass}-labels`)
                        .attr("fill-opacity", "1.0")
                }
    
                var mouseleave = function(d) {
                    d3.selectAll(".front-bars rect")
                        .attr("fill-opacity", "0.9")
    
                    d3.selectAll(".back-bars rect")
                        .attr("fill-opacity", "0.3")

                    d3.selectAll(`.legendContainer .front-bars-leg`)
                        .attr("fill-opacity", "1.0")

                    d3.selectAll(`.legendContainer .back-bars-leg`)
                        .attr("fill-opacity", "1.0")

                    d3.selectAll(`rect.front-bars-leg`)
                        .attr("fill-opacity", "0.9")

                    d3.selectAll(`rect.back-bars-leg`)
                        .attr("fill-opacity", "0.3")

                    d3.selectAll(".front-bars-labels")
                        .attr("fill-opacity", "1.0")

                    d3.selectAll(".back-bars-labels")
                        .attr("fill-opacity", "1.0")
                }
            }

            // -------------------------------------------------------
            // draw data

            // back bars
            if (measureMatch) {
                const barsBack = group.append("g")
                    .attr("class", "back-bars")
                    .selectAll("rect")
                    .data(data_ready)
                    .enter()
                    .append("rect")
                        // .attr("class", "back-bar")
                        .attr("x", d => xScale(groupAccessor(d)))
                        .attr("y", d => {
                            if (value2Accessor(d) < 0) {
                                return yScale(0)
                            } else {
                                return yScale(value2Accessor(d))
                            }
                        })
                        .attr("width", xScale.bandwidth())
                        .attr("height", d => {
                            if (value2Accessor(d) >= 0) {
                                return yScale(0) - yScale(value2Accessor(d))
                            } else {
                                return yScale(value2Accessor(d)) - yScale(0)
                            }
                        })
                        .attr("fill", config.second_metric_color)
                        .attr("fill-opacity", "0.3")
                    .on("mouseover", mouseover)
                    .on("mouseleave", mouseleave)
            }

            // front bars
            const bars = group.append("g")
                .attr("class", "front-bars")
                .selectAll("rect")
                .data(data_ready)
                .enter()
                .append("rect")
                    // .attr("class", "front-bar")
                    .attr("x", d => xScale(groupAccessor(d)) + 8)
                    .attr("y", d => {
                        if (valueAccessor(d) < 0) {
                            return yScale(0)
                        } else {
                            return yScale(valueAccessor(d))
                        }
                    })
                    .attr("width", xScale.bandwidth() - 16)
                    .attr("height", d => {
                        if (valueAccessor(d) >= 0) {
                            return yScale(0) - yScale(valueAccessor(d))
                        } else {
                            return yScale(valueAccessor(d)) - yScale(0)
                        }
                    })
                    .attr("fill-opacity", "0.9")
                    .on("mouseover", mouseover)
                    .on("mouseleave", mouseleave)
            
            // front bars coloring
            if (config.color_drops_decreases == "false" || measureMatch) {
                bars
                    .attr("fill", config.bar_color)
            } else {
                bars
                    .attr("fill", (d,i) => {
                        if (config.number_type == "percentage") {
                            if (valueAccessor(d) < 0) {
                                return config.negative_color
                            } else {
                                return config.bar_color
                            }
                        } else {
                            if (i == 0) {
                                return config.bar_color
                            } else {
                                const priorVal = valueAccessor(data_ready[i-1])
                                const currVal = valueAccessor(d)
            
                                if (currVal < priorVal) {
                                    return config.negative_color
                                } else {
                                    return config.bar_color
                                }
                            }
                        }
                    })
                }

            // -------------------------------------------------------
            // bar labels
            const minVal = d3.min(data_ready, d => valueAccessor(d))
            const maxVal = d3.max(data_ready, d => valueAccessor(d))

            let min2Val;
            let max2Val;
            let labelVals;
            if (measureMatch) {
                min2Val = d3.min(data_ready, d => value2Accessor(d))
                max2Val = d3.max(data_ready, d =>  value2Accessor(d))
                labelVals = [minVal, maxVal, min2Val, max2Val]
            } else {
                labelVals = [minVal, maxVal]
            }

            console.log("labelvals", labelVals, labelVals.slice(0,2))
            
            const barText = group.append("g")
                .attr("class","front-bars-labels")
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
                        if (config.bar_labels == "all" && config.number_type == "percentage") {
            
                            return d3.format(",")(Math.round(d.value * 100, 1)) + "%"
            
                        } else if (config.bar_labels == "extremes" && config.number_type == "percentage") {
            
                            if (labelVals.slice(0,3).includes(d.value)) {
                                return d3.format(",")(Math.round(d.value * 100, 1)) + "%"
                            }                 
            
                        } else if (config.bar_labels == "all" && config.number_type == "raw") {
            
                        return d3.format(",")(d.value)
            
                        } else if (config.bar_labels == "extremes" && config.number_type == "raw") {
            
                            if (labelVals.slice(0,3).includes(d.value)) {
                                return d3.format(",")(d.value)
                            } 
            
                        } else if (config.bar_labels == "all" && config.number_type == "USD") {
                            
                            if (d.value>=1000000) {
                                return d3.format("$,")(d.value/1000000) + "M"
                            } else {
                                return d3.format("$,")(d.value)
                            }
                            
                        } else if (config.bar_labels == "extremes" && config.number_type == "USD") {
            
                            if (labelVals.slice(0,3).includes(d.value)) {
                                if (d.value>=1000000) {
                                    return d3.format("$,")(d.value/1000000) + "M"
                                } else {
                                    return d3.format("$,")(d.value)
                                }
                            } 
                        }
                    })
                    .style("text-anchor", "middle")
                    .attr("fill", "#323232")
                    .attr("font-size", "1.0em")
                    .attr("font-family", "sans-serif")

                if (measureMatch) {
                    console.log("2 labels", labelVals.slice(2, 5))
                    const bar2Text = group.append("g")
                        .attr("class","back-bars-labels")
                        .selectAll("text")
                        .data(data_ready)
                        .enter()
                        .append("text")
                            .attr("x", d => xScale(groupAccessor(d)) + xScale.bandwidth()/2)
                            .attr("y", d => {
                                if (value2Accessor(d) >= 0) {
                                    return yScale(value2Accessor(d)) - 6
                                } else {
                                    return yScale(value2Accessor(d)) + 14
                                }
                            })
                            .text((d) => {
                                if (config.bar_labels == "all" && config.number_type == "percentage") {
                    
                                    return d3.format(",")(Math.round(d.value2 * 100, 1)) + "%"
                    
                                } else if (config.bar_labels == "extremes" && config.number_type == "percentage") {
                    
                                    if (labelVals.slice(2,5).includes(d.value2)) {
                                        return d3.format(",")(Math.round(d.value2 * 100, 1)) + "%"
                                    }                 
                    
                                } else if (config.bar_labels == "all" && config.number_type == "raw") {
                    
                                return d3.format(",")(d.value2)
                    
                                } else if (config.bar_labels == "extremes" && config.number_type == "raw") {
                    
                                    if (labelVals.slice(2,5).includes(d.value2)) {
                                        return d3.format(",")(d.value2)
                                    } 
                    
                                } else if (config.bar_labels == "all" && config.number_type == "USD") {
                                    
                                    if (d.value2>=1000000) {
                                        return d3.format("$,")(d.value2/1000000) + "M"
                                    } else {
                                        return d3.format("$,")(d.value2)
                                    }
                                    
                                } else if (config.bar_labels == "extremes" && config.number_type == "USD") {
                    
                                    if (labelVals.slice(2,5).includes(d.value2)) {
                                        if (d.value2>=1000000) {
                                            return d3.format("$,")(d.value2/1000000) + "M"
                                        } else {
                                            return d3.format("$,")(d.value2)
                                        }
                                    } 
                                }
                            })
                            .style("text-anchor", "middle")
                            .attr("fill", "#323232")
                            .attr("font-size", "1.0em")
                            .attr("font-family", "sans-serif")
                }

            // -------------------------------------------------------
            // DRAW LEGEND
            if (measureMatch) {
                const legendContainer = group.append('g')
                    .attr("transform", "translate(-8, -55)")
                    .classed("legendContainer", true)

                const legend = legendContainer.selectAll(".legend")
                    .data(measures)
                    .enter()
                    .append("g")
                    .attr("class", "legend")
                    .attr("transform", function(d,i) {
                        console.log("d,i", d, i)
                        return `translate(6, ${-3 + (i * 17)})`
                    })

                // legendContainer.append("text")
                //     .attr("x", 10)
                //     .attr("y", -8)
                //     .style("text-anchor", "start")
                //     .style("font-size", 10)
                //     .text(legend_label)

                legend.append("rect")
                    .attr("class", (d,i) => {
                        if (i==0) {
                            return "front-bars-leg"
                        } else {
                            return "back-bars-leg"
                        }
                    })
                    .attr("x", 10)
                    .attr("y", 6)
                    .attr("width", 8)
                    .attr("height", 6)
                    .attr("fill", (d,i) => {
                       if (i==0) {
                           return config.bar_color
                       } else {
                           return config.second_metric_color
                       }
                    })
                    .attr("fill-opacity", (d,i) => {
                        if (i==0) {
                            return "1.0"
                        } else {
                            return "0.3"
                        }
                    })

                legend.append("text")
                    .attr("class", (d,i) => {
                        if (i==0) {
                            return "front-bars-leg"
                        } else {
                            return "back-bars-leg"
                        }
                    })
                    .attr("x", 22)
                    .attr("y", 8)
                    .attr("dy", ".4em")
                    .style("text-anchor", "start")
                    .style("font-size", 12)
                    .text((d,i) => {
                        if (i==0 && config.legend_first_label) {
                            return config.legend_first_label
                        } else if (i!=0 && config.legend_second_label) {
                            return config.legend_second_label
                        } else {
                            return d.label
                        }
                    })            
            }            
            
                
    } catch(error) {
        console.log(error)
    }

    // callback at the end of the rendering to let Looker know it's finished
    done()

}
}