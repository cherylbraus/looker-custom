import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'

looker.plugins.visualizations.add({
    // Id and Label are legacy properties that no longer have any function besides documenting
    // what the visualization used to have. The properties are now set via the manifest
    // form within the admin/visualizations page of Looker.

    id: "split-violin",
    label: "ZDev Split Violin",
    options: {
        thresholds: {
          type: 'string',
          label: '# Thresholds',
          display: "radio",
          values: [
            {"5": "5"},
            {"10": "10"},
            {"15": "15"},
            {"20": "20"},
            {"25": "25"},
            {"30": "30"}
          ],
          default: "15",
          section: "Custom Options",
          order: 1,
        },
        statistics: {
          type: 'string',
          label: 'Show Statistic',
          display: "radio",
          values: [
            {"Mean": "mean"},
            {"Median": "median"},
            {"None": "none"}
          ],
          default: "mean",
          section: "Custom Options",
          order: 2,
        },
        left_color: {
            type: "array",
            label: "Left Color",
            default: ["#27566b"],
            display: "color",
            section: "Custom Options",
            order: 3
        },
        right_color: {
            type: "array",
            label: "Right Color",
            default: ["#f1cc56"], //"#339f7b"],
            display: "color",
            section: "Custom Options",
            order: 4,
        },
        show_xaxis_name: {
            type: "boolean",
            label: "Show X-Axis Name",
            default: true,
            section: "X",
            order: 3,
        },
        xaxis_label: {
            type: "string",
            label: "X-Axis Label",
            display: "text",
            default: "",
            section: "X",
            order: 6,
        },
        xticklabels_show: {
            type: "boolean",
            label: "Show X Tick Labels",
            default: true,
            section: "X",
            order: 2,
        },
        xticklabel_format: {
            type: "string",
            label: "X Tick Time Label Format",
            display: "text",
            default: "%b",
            section: "X",
            order: 5,
        },
        x_gridlines: {
            type: "boolean",
            label: "Show X Gridlines",
            default: false,
            section: "X",
            order: 1,
        },
        x_rotation: {
            type: "boolean",
            label: "X Tick Rotation",
            default: false,
            section: "X",
            order: 4,
        },
        show_yaxis_name: {
            type: "boolean",
            label: "Show Y-Axis Name",
            default: true,
            section: "Y",
            order: 3,
        },
        yaxis_label: {
            type: "string",
            label: "Y-Axis Label",
            display: "text",
            default: "",
            section: "Y",
            order: 6,
        },
        yticklabels_show: {
            type: "boolean",
            label: "Show Y Tick Labels",
            default: true,
            section: "Y",
            order: 2,
        },
        yticklabel_format: {
            type: "string",
            label: "Y Tick Value Format",
            display: "text",
            default: ",",
            placeholder: "#,###",
            section: "Y",
            order: 5,
        },
        y_gridlines: {
            type: "boolean",
            label: "Show Y Gridlines",
            default: false,
            section: "Y",
            order: 1,
        },
        unpin_y: {
            type: "boolean",
            label: "Unpin Y-Axis from 0",
            default: true,
            section: "Y",
            order: 4,
        },
        margin_bottom: {
            section: 'Margins',
            order:1,
            type: 'string',
            display:'text',
            label: 'Margin - bottom',
            default: ''
        },
        margin_left: {
            section: 'Margins',
            order:3,
            type: 'string',
            display:'text',
            label: 'Margin - left',
            default: ''
        },
        wrap_bottom: {
            section: 'Margins',
            order:2,
            type: 'boolean',
            label: 'Truncate x-axis labels',
            default: false,
        },
        wrap_left: {
            section: 'Margins',
            order:4,
            type: 'boolean',
            label: 'Truncate y-axis labels',
            default: false,
        },
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
        element.style.fontFamily = `"Open Sans", "Helvetica", "sans-serif"`
    },

    // Render in response to the data or settings changing
    updateAsync: function(data, element, config, queryResponse, details, done, environment = "prod") {
        if (environment == "prod") {
            if (!handleErrors(this, queryResponse, {
                min_pivots: 2, max_pivots: 2,
                min_dimensions: 1, max_dimensions: 1,
                min_measures: 1, max_measures: 1
            })) return
        }

        function find_median(numbers) {
            const sorted = Array.from(numbers).sort((a, b) => a - b);
            const middle = Math.floor(sorted.length / 2);
    
            if (sorted.length % 2 === 0) {
                return (sorted[middle - 1] + sorted[middle]) / 2;
            }
    
            return sorted[middle];
        }

        function wrap() {
            const this_width = 100
            const this_padding = 5
            var self = d3.select(this),
                textLength = self.node().getComputedTextLength(),
                text = self.text();
            while (textLength > (this_width - 2 * this_padding) && text.length > 0) {
                text = text.slice(0, -1);
                self.text(text + '...');
                textLength = self.node().getComputedTextLength();
            }
        }

        const options = { ...this.options}

        if (config.show_xaxis_name) {
            options.xaxis_label.hidden = false
        } else {
            options.xaxis_label.hidden = true
        }

        if (config.xticklabels_show) {
            options.x_rotation.hidden = false
            options.xticklabel_format.hidden = false
        } else {
            options.x_rotation.hidden = true
            options.xticklabel_format.hidden = true
        }

        if (config.show_yaxis_name) {
            options.yaxis_label.hidden = false
        } else {
            options.yaxis_label.hidden = true
        }

        if (config.yticklabels_show) {
            options.yticklabel_format.hidden = false
        } else {
            options.yticklabel_format.hidden = true
        }

        this.trigger('registerOptions', options)

        try {

          let left_margin;
          let bottom_margin;
  
          if (config.show_yaxis_name == true) {
              left_margin = 80
          } else {
              left_margin = 60
          }
  
          if (config.show_xaxis_name == true) {
              bottom_margin = 50
          } else {
              bottom_margin = 30
          }
  
        let margin = {
            top: 25, 
            right: 10, 
            bottom: bottom_margin, 
            left: left_margin
        };

        if (config.margin_bottom.length > 0) {
            margin.bottom = +config.margin_bottom
        }

        if (config.margin_left.length > 0) {
            margin.left = +config.margin_left
        }
  
        //   console.log("margin", margin)
  
          const width = element.clientWidth - margin.left - margin.right;
          const height = element.clientHeight - margin.top - margin.bottom; 
      
          const svg = (
              d3.select(element).select('svg')
                  .html('')
                  .attr('width', '100%')
                  .attr('height', '100%')
              )
  
          const group = svg.append('g')
              .attr('transform', `translate(${margin.left}, ${margin.top})`)
              .attr('width', "100%")
              .attr('height', (height + "px"))
              .classed("group", true)

            // require 2 pivots, 1 dimension, 1 measure
            const dimension = queryResponse.fields.dimension_like[0]
            const measure = queryResponse.fields.measure_like[0]
            const pivots = queryResponse.fields.pivots

            console.log("dimension", dimension)
            console.log("measure", measure)
            console.log("pivots", pivots)

            // determine how to format the time pivot (if there is one)
            const dateDict = {
                month: "%Y-%m",
                year: "%Y",
                week: "%Y-%m-%d",
                day: "%Y-%m-%d",
                null: null
            }

            let pivotDate = [];
            pivots.forEach((element, index) => {
                if (pivots[index].time_interval) {
                    if (["day", "week", "month", "year"].includes(pivots[index].time_interval.name)) {
                        pivotDate.push(pivots[index].time_interval.name)
                    } else {
                        pivotDate.push(null)
                    }
                } else {
                    pivotDate.push(null)
                }
            })

            let parseTime = [];
            pivotDate.forEach(element => {
                parseTime.push(d3.timeParse(dateDict[element]))
            })

            console.log("pivotDate", pivotDate)
            console.log("parseTime", parseTime)

            // determine whether the user sorted the pivot in asc or desc order
            let pivotSort = []

            pivots.forEach((element, index) => {
                console.log("PIVOT", pivots[index], "sorted" in pivots[index])
                if ("sorted" in pivots[index]) {
                    if (pivots[index].sorted.desc) {
                        pivotSort.push(true)
                    } else {
                        pivotSort.push(false)
                    }
                } else {
                    pivotSort.push(null)
                }
            })

            console.log("pivotSort", pivotSort)

            const legend_label = pivots[1].field_group_variant

            // reformat the data
            let data_ready = []

            // console.log("data", data)
            

            data.forEach((d) => {
                const keys = Object.keys(d[measure.name])
                // console.log("keys", keys)
                // console.log("object entries", Object.entries(d[measure.name]))

                for (const [key, value] of Object.entries(d[measure.name])) {
                    let entry = {}

                    if (pivotDate[0]) {
                        entry["group"] = parseTime[0](key.split("|FIELD|")[0])
                    } else {
                        entry["group"] = key.split("|FIELD|")[0]
                    }

                    if (pivotDate[1]) {
                        entry["side"] = parseTime[1](key.split("|FIELD|")[1])
                    } else {
                        entry["side"] = key.split("|FIELD|")[1]
                    }

                    entry["to_measure"] = d[dimension.name].value
                    entry["value"] = value.value

                    data_ready.push(entry)
                }
            })

            data_ready = data_ready.filter(function(entry) {
                return entry.right != "TXX Undefined"
            })

            // sort 2nd pivot first and then 1st pivot
            if (pivotSort[1] !== null) {
                if (pivotSort[1]) {
                    data_ready.sort((a,b) => b.side - a.side)
                } else {
                    data_ready.sort((a,b) => a.side - b.side)
                }
            }
            
            if (pivotSort[0] !== null) {
                if (pivotSort[0]) {
                    data_ready.sort((a,b) => b.group - a.group)
                } else {
                    data_ready.sort((a,b) => a.group - b.group)
                }
            }

            console.log("data_ready", data_ready)


            // DATA ANALYSIS
            const groupAccessor = d => d.group
            const sideAccessor = d => d.side
            const measureAccessor = d => d.to_measure
            const valueAccessor = d => d.value

            // // set dimensions and svg element
            // this.clearErrors();
            console.log("errors NOT cleared")
            
            // define range of values for each group/pivot level
            // if just need the highest pivot level to be used on x-axis
            let buckets = {}            
            buckets['label'] = pivots[0].label

            let bucket_data = []
            data_ready.forEach(function(d) {
                if (bucket_data.includes(d.group)) {
                    return 
                } else {
                    bucket_data.push(d.group)
                }
            })

            buckets['range'] = bucket_data

            bucket_data = []

            data_ready.forEach(function(d) {
                if (d.side.includes("Undefined") || bucket_data.includes(d.side)) {
                    return 
                } else {
                    bucket_data.push(d.side)
                }
            })

            buckets['lower_pivot'] = bucket_data

            console.log("buckets", buckets)

            // -------------------------------------------------------
            // SCALES
            const xScale = d3.scaleBand()
                .domain(buckets.range)
                .range([0, width])
                .padding(0.05)

            const yScale = d3.scaleLinear()
                .domain(d3.extent(data_ready, (d) => {
                    return d.value
                }))
                .range([height, 0])

            // const zScale = d3.scaleOrdinal()
            //     .domain(buckets.lower_pivot)
            //     .range(colors)

            // -------------------------------------------------------
            // v5 nest/histogram process, instead of d3.bin in v7
            const binsGenerator = d3.histogram()
                .domain(yScale.domain())
                .value(d => d)
                .thresholds(+config.thresholds)

            const groupBins = d3.nest()
                .key(function(d) {
                    return d.group
                })
                .key(function(d) {
                    return d.side
                })
                .rollup(function(r) {
                    let input = r.map(function(g) {return g.value})
                    let bins = binsGenerator(input)
                    return (bins)
                })
                .entries(data_ready)

            // console.log("groupBins", groupBins)


            // why do we have to loop through - aren't all the x0s the same?
            let yMax = ""
            groupBins.forEach((value, key) => {
                value.values.forEach((v, k) => {
                    yMax = (v.value[v.value.length-1]["x0"])
                })
            })

            yScale.domain([d3.min(data_ready, (d) => {
                return d.value
            }), yMax])

            // get the highest number of data points that are in a single bin
            let maxDepth = 0
            groupBins.forEach((value, key) => {
                value.values.forEach((v, k) => {
                    const findLengthFrom = v.value
                    const lengths = findLengthFrom.map(function(a) {return a.length})
                    const longest = d3.max(lengths)
                    if (longest > maxDepth) {maxDepth = longest}

                    const flat = v.value.flat()

                    v["mean"] = flat.reduce((acc, c) => {
                        return acc + c;
                    }, 0) / flat.length;

                    v["median"] = find_median(flat)
                    v["none"] = 0
                })
            })

            console.log("groupBins", groupBins)

            // -------------------------------------------------------
            // SCALES AGAIN
            if (config.unpin_y == true) {
                yScale.domain([d3.min(data_ready, (d) => {
                    return d.value
                }), yMax])
            } else {
                yScale.domain([0, yMax])
            }

            // create scale for width of violins
            var xNum = d3.scaleLinear()
                .domain([-maxDepth, maxDepth])
                .range([0, xScale.bandwidth()])

            // -------------------------------------------------------
            // DRAW PERIPHERALS
            // X axis
            const xAxisGenerator = d3.axisBottom()
                .scale(xScale)
                .tickPadding(10)

            // x ticklabels
            if (config.xticklabels_show == true) {
                if (pivotDate[0]) {
                xAxisGenerator
                    .tickFormat(d3.timeFormat(config.xticklabel_format))
                }
            } else {
                xAxisGenerator
                    .tickFormat("")
            }

            // x gridlines
            if (config.x_gridlines == true) {
                xAxisGenerator
                    .tickSizeInner(-height)
            } else {
                xAxisGenerator
                    .tickSizeInner(0)
            }

            xAxisGenerator
                .tickSizeOuter(0)

            const xAxis = group.append("g")
                .call(xAxisGenerator)
                    .style("transform", `translateY(${height}px)`)
                    .attr("class", "x-axis")

            if (config.x_rotation == true) {
                xAxis.selectAll("text")
                    .attr("transform", "rotate(-35)")
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", ".15em")
            }
    
            if (config.wrap_bottom == true) {
                xAxis.selectAll("text").each(wrap)
            }

            if (config.xticklabels_show == false) {
                d3.selectAll(".x-axis text")
                    .attr("class", "hide")
            }
    
            if (config.x_gridlines == false) {
                d3.selectAll(".x-axis line")
                    .attr("class", "hide")
            }


            // Y axis
            const yAxisGenerator = d3.axisLeft()
                .scale(yScale)
                .tickPadding(10)

            // y ticklabels
            if (config.yticklabels_show == true) {
                yAxisGenerator
                    .tickFormat(d3.format(config.yticklabel_format))
            } else {
                yAxisGenerator
                    .tickFormat("")
            }

            // y gridlines
            if (config.y_gridlines == true) {
                yAxisGenerator  
                    .tickSize(-width)
            } else {
                yAxisGenerator
                    .tickSize(0)
            }

            const yAxis = group.append("g")
                .call(yAxisGenerator)
                .attr("class", "y-axis")

            if (config.wrap_left == true) {
                yAxis.selectAll("text").each(wrap)
            }

            if (config.yticklabels_show == false) {
                d3.selectAll(".y-axis text")
                    .attr("class", "hide")
            }
    
                if (config.y_gridlines == false) {
                d3.selectAll(".y-axis line")
                    .attr("class", "hide")
            }

            // AXIS LABELS
            if (config.show_xaxis_name == true) {
                console.log("show x axis")
                const xAxisLabel = xAxis.append("text")
                    .attr("class", "axis-label")
                    .attr("x", width/2)
                    .attr("y", (margin.bottom-7))
                    .text(function() {
                        if (config.xaxis_label) {
                            return config.xaxis_label
                        } else {
                            return buckets.label
                        }
                    })
            } else {
                console.log("don't show x axis")
            }
            
            if (config.show_yaxis_name == true) {
                const yAxisLabel = yAxis.append("text")
                    .attr("class", "axis-label")
                    .attr("x", -height/2) // + margin.top/2)
                    .attr("y", -margin.left + 18)
                    .style("transform", "rotate(-90deg)")
                    .text(function() {
                        if (config.yaxis_label) {
                            return config.yaxis_label
                        } else {
                            return measure.label
                        }
                    })
            }
        

            // -------------------------------------------------------
            // DRAW DATA

            // create a clip-path for when they unpin/pin the y axis
            group.append("defs")
              .append("clipPath")
              .attr("id", "plot-area")
              .append("rect")
              .attr("x", 0)
              .attr("y", 0)
              .attr("width", width)
              .attr("height", height)

            const violins = group.selectAll(".violin")
                .data(groupBins)
                .enter()
                .append("g")
                    .attr("transform", function(d) {
                        return ("translate(" + xScale(d.key) + ",0)")
                    })
                    .attr("class", "violin")
                    .attr("clip-path", "url(#plot-area)")

            const leftViolins = violins
                .append("path")
                    .datum(function(d) {
                        return (d.values[0].value)
                    })
                    .attr("class", "left-violin")
                    .style("stroke", "none")
                    .style("fill", config.left_color)
                    .attr("d", d3.area()
                        .x0(function(d) {return xNum(-d.length)})
                        .x1(function(d) {return xNum(0)})
                        .y(function(d) {return yScale(d.x0)})
                        .curve(d3.curveMonotoneY))

            const rightViolins = violins
                .append("path")
                    .datum(function(d) {
                        return (d.values[1].value)
                    })
                    .attr("class", "right-violin")
                    .style("stroke", "none")
                    .style("fill", config.right_color)
                    .attr("d", d3.area()
                        .x0(function(d) {return xNum(0)})
                        .x1(function(d) {return xNum(d.length)})
                        .y(function(d) {return yScale(d.x0)})
                        .curve(d3.curveMonotoneY))

            const leftStatsMarker = group.selectAll(".left-rect")
                .data(groupBins)
                .enter()
                .append("g")
                    .attr("transform", function(d) {
                        return (`translate(${xScale(d.key)}, 0)`)
                    })
                    .attr("class", "left-rect")
                    .append("rect")
                        .attr("x", xScale.bandwidth()/6)
                        .attr("y", (d) => {
                            return yScale(d.values[0][config.statistics])
                        })
                        .attr("width", xScale.bandwidth()/3)
                        .attr("height", 1.75)
                        .attr("stroke", d => {
                            if (config.statistics == "none") {
                                return "none"
                            } else {
                                return "#c6cccf"
                            }
                        })
                        .attr("stroke-width", .75)
                        .attr("fill", d => {
                            if (config.statistics == "none") {
                                return "none"
                            } else {
                                return "#8c8c8c"
                            }
                        })
                        .attr("clip-path", "url(#plot-area)")

            const rightStatsMarker = group.selectAll(".right-rect")
                .data(groupBins)
                .enter()
                .append("g")
                    .attr("transform", function(d) {
                        return (`translate(${xScale(d.key)}, 0)`)
                    })
                    .attr("class", "right-rect")
                    .append("rect")
                        .attr("x", xScale.bandwidth()/2)
                        .attr("y", (d) => {
                            return yScale(d.values[1][config.statistics])
                        })
                        .attr("width", xScale.bandwidth()/3)
                        .attr("height", 1.75)
                        .attr("stroke", d => {
                            if (config.statistics == "none") {
                                return "none"
                            } else {
                                return "#c6cccf"
                            }
                        })
                        .attr("stroke-width", .75)
                        .attr("fill", d => {
                            if (config.statistics == "none") {
                                return "none"
                            } else {
                                return "#8c8c8c"
                            }
                        })
                        .attr("clip-path", "url(#plot-area)")
                    

            
            // -------------------------------------------------------
            // DRAW LEGEND
            const legendContainer = group.append('g')
                .attr("transform", "translate(0, 0)")
                .classed("legendContainer", true)

            const legend = legendContainer.selectAll(".legend")
                .data(buckets.lower_pivot)
                .enter()
                .append("g")
                .attr("class", "legend")
                .attr("transform", function(d, i) { 
                    console.log("d, i", d, i)
                    // console.log("translate", (i+1) * 10)
                    return `translate(6, ${-3 + (i * 17)})`
                    // return "translate(" + (-40 + (i * 110) - width/2.05) + "," + (-margin.top/2) + ")"; 
                });                

            legendContainer.append("text")
                .attr("x", 10) //(width - margin.left)/2)
                .attr("y", -8)
                // .attr("dy", "-0.2em")
                .style("text-anchor", "start")
                .style("font-size",10)
                .text(legend_label);

            legend.append("circle")
                .attr("cx", 10)
                .attr("cy", 9)
                .attr("r", 6)
                .style("fill", (d,i)=>{
                    if (i==0) {
                        return config.left_color
                    } else {
                        return config.right_color
                    }
                });

            legend.append("text")
                .attr("x", 20)
                .attr("y", 9)
                .attr("dy", ".4em")
                .style("text-anchor", "start")
                .style("font-size",10)
                .text((d,i)=>{
                    return d
                });

        } catch(error) {
            if (environment == "prod") {
                console.log("somehow got in here")
                if (queryResponse.fields.dimensions.length > 1 ||
                    queryResponse.fields.dimensions.length < 1 ||
                    queryResponse.fields.pivots.length > 2 ||
                    queryResponse.fields.pivots.length < 2 
                    ) {
                        this.addError({title: "Dimension/Pivot Error", message: "This chart takes two pivots and one dimension."});
                        return;
                    } else {
                        this.addError({title: "Data Error", message: "Check that your second pivot has only two options"});
                        return;
                    }
            }
           
        }

        // Callback at the end of the rendering to let Looker know it's finished
        done()
    }
});