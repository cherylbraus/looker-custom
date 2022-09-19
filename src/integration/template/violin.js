export const object = {
    // Id and Label are legacy properties that no longer have any function besides documenting
    // what the visualization used to have. The properties are now set via the manifest
    // form within the admin/visualizations page of Looker
    id: "violin",
    label: "ZDev Violin",
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
      },
      colors: {
          type: "array",
          label: "Violin Color",
          default: ["#27566b"],
          display: "color",
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
      x_rotation: {
          type: "boolean",
          label: "X Tick Rotation",
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
          default: ",.0f",
          placeholder: "#,###",
          section: "Y"
      },
      y_gridlines: {
          type: "boolean",
          label: "Show Y Gridlines",
          default: "false",
          section: "Y"
      },
      unpin_y: {
          type: "boolean",
          label: "Unpin Y-Axis from 0",
          default: "true",
          section: "Y"
      },
      margin_bottom: {
        section: 'Margins',
        order:1,
        type: 'string',
        display:'text',
        label: 'Margin - bottom',
        default: ''
      },
    //   margin_left: {
    //     section: 'Margins',
    //     order:4,
    //     type: 'string',
    //     display:'text',
    //     label: 'Margin - left',
    //     default: ''
    //   },
    //   label_bottom: {
    //     section: 'Margins',
    //     order:2,
    //     type: 'string',
    //     display:'text',
    //     label: 'Label offset - bottom',
    //     default: ''
    //   },
    //   label_left: {
    //     section: 'Margins',
    //     order:5,
    //     type: 'string',
    //     display:'text',
    //     label: 'Label offset - left',
    //     default: ''
    //   },
      wrap_bottom: {
        section: 'Margins',
        order:3,
        type: 'boolean',
        label: 'Truncate x-axis labels',
        default: "false"
      },
      wrap_left: {
        section: 'Margins',
        order:6,
        type: 'boolean',
        label: 'Truncate y-axis labels',
        default: "false"
      },
    },
    // Set up the initial state of the visualization
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
    // Render in response to the data or settings changing
    updateAsync: function(data, element, config, queryResponse, details, done, environment = "prod") {
      if (environment == "prod") {
          if (!handleErrors(this, queryResponse, {
          min_pivots: 1, max_pivots: 1,
          min_dimensions: 1, max_dimensions: 1,
          min_measures: 1, max_measures: 1
          })) return
      }
  
      function find_median(numbers) {
          const sorted = Array.from(numbers).sort((a, b) => a - b);
          const middle = Math.floor(sorted.length / 2);
          const lowerQ = Math.floor(sorted.length / 4);
          const upperQ = Math.floor(sorted.length * (3/4));

          let medianVal;
  
          if (sorted.length % 2 === 0) {
              medianVal = (sorted[middle - 1] + sorted[middle]) / 2;
            //   return (sorted[middle - 1] + sorted[middle]) / 2;
          } else {
              medianVal = sorted[middle]
          }

          const quartiles = {
              lower: sorted[lowerQ],
              median: medianVal,
              upper: sorted[upperQ]
          }
  
          return quartiles;
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
  
      try {
  
          let left_margin;
          let bottom_margin;
  
          if (config.show_yaxis_name == "true") {
              left_margin = 80
          } else {
              left_margin = 60
          }
  
          if (config.show_xaxis_name == "true") {
              bottom_margin = 50
          } else {
              bottom_margin = 30
          }
  
          let margin = {
              top: 10, 
              right: 10, 
              bottom: bottom_margin, 
              left: left_margin
          };

          if (config.margin_bottom.length > 0) {
              margin.bottom = +config.margin_bottom
          }

        //   if (config.margin_left.length > 0) {
        //       margin.left = +config.margin_left
        //   }
  
          console.log("margin", margin)

          console.log("element", element)
  
          // Get the shape of the data, this chart can take two dimensions or a pivot on the shorter dimension
          const dimensions = queryResponse.fields.dimension_like
          const measure = queryResponse.fields.measure_like[0]
          const pivots = queryResponse.fields.pivots
  
          const dateDict = {
              month: "%Y-%m",
              year: "%Y",
              week: "%Y-%m-%d",
              day: "%Y-%m-%d",
              null: null
          }

          let pivotSort;
          if (pivots[0].sorted.desc) {
              pivotSort = true
          } else {
              pivotSort = false
          }
  
          let pivotDate;
          if (pivots[0].time_interval) {
              if (["day", "week", "month", "year"].includes(pivots[0].time_interval.name)) {
                  pivotDate = pivots[0].time_interval.name
              } else {
                  pivotDate = null
              }
          } else {
              pivotDate = null
          }

          console.log("pivotSort", pivotSort)
          console.log("pivotDate", pivotDate)
  
          const parseTime = d3.timeParse(dateDict[pivotDate])
  
          console.log("dimensions, measures, pivots", dimensions, measure, pivots)
  
          let data_ready = []
  
              const pivot_name = pivots[0].name
              const pivot_column_labels = queryResponse.pivots
  
              data.forEach((d)=>{
                  const keys = Object.keys(d[measure.name])
                  keys.forEach(function(val) {
                      if (d[measure.name][val].value != null) {
                          let entry = {}
                          if (pivotDate) {
                              entry["group"] = parseTime(val)
                          } else {
                              entry["group"] = val
                          }
                          entry["to_measure"] = d[dimensions[0].name].value
                          entry["value"] = d[measure.name][val]["value"]
                          data_ready.push(entry)
                      }
                  })
                  
              });

            if (pivotSort) {
                data_ready.sort((a,b) => a.group - b.group)
            } else if (pivotSort == false) {
                data_ready.sort((a,b) => b.group - a.group)
            }
      
          console.log("data ready sorted", data_ready)

          // ------------------------------------------------------------------

          let yvalFormatted = 0;
          data_ready.forEach((d,i) => {
              const strLength = d3.format(config.yticklabel_format)(d["value"]).length;
              if (strLength > yvalFormatted) {
                  yvalFormatted = strLength
              }
          })
          
          if (config.show_yaxis_name == "true") {
              margin.left = 6 * yvalFormatted + 45
          } else {
              margin.left = 6 * yvalFormatted + 25
          }
          console.log("margin.left new", margin.left)


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
  
  
          // Clear any errors from previous updates
          // this.clearErrors();
  
          let buckets = {}
          buckets["label"] = pivots[0].label
          
          let bucket_data = []
          data_ready.forEach(function(d){
              if (bucket_data.includes(d.group)) {
                  return
              } else {
                  bucket_data.push(d.group)
              }
          })
  
          buckets["range"] = bucket_data
  
          // -------------------------------------------------------
          // SCALES
          const xScale = d3.scaleBand()
              .domain(buckets.range)
              .range([0, width])
              .padding(0.05)
  
          const yScale = d3.scaleLinear()
              .domain(d3.extent(data_ready, (d)=>{
                  return d.value
              }))
              .range([height, 0])
  
          // const zScale = d3.scaleOrdinal()
          //     .domain(buckets.range)
          //     .range(config.colors)
  
          // -------------------------------------------------------
          // BINS
          const binsGenerator = d3.histogram()
              .domain(yScale.domain())
              .value((d) => {
                  return d})
              .thresholds(+config.thresholds)
          
          const groupBins = d3.nest()
              .key(function(d){
                  return d.group
              })
              .rollup(function(r) {
              const input = r.map(function(g) { return g.value;})
              const bins = binsGenerator(input)   
              return(bins)
              })
              .entries(data_ready)
  
          let yMax = ""
          groupBins.forEach(function(value,key){
              yMax = (value.value.slice(-1)[0]["x0"])
          })
  
          let maxNum = 0
          groupBins.forEach((value, key) => {
  
              const findLengthFrom = value.value
              const flat = value.value.flat()
              const quartileVals = find_median(flat)
  
              value["mean"] = flat.reduce((acc, c) => {
                return acc + c;
                }, 0) / flat.length;
  
              value["median"] = quartileVals["median"]
              value["lower"] = quartileVals["lower"]
              value["upper"] = quartileVals["upper"]
              value["none"] = 0
  
              const lengths = findLengthFrom.map(function(a) {return a.length})
              const longest = d3.max(lengths)
              if (longest > maxNum) {maxNum = longest}
          })

          console.log("look at data", groupBins)
  
          // -------------------------------------------------------
          // SCALES AGAIN
          if (config.unpin_y == "true") {
              yScale.domain([d3.min(data_ready, (d)=>{
                  return d.value
                  }),yMax])
          } else {
              yScale.domain([0, yMax])
          }
          
          var xNum = d3.scaleLinear()
              .domain([-maxNum, maxNum])
              .range([0, xScale.bandwidth()])
  
  
          // -------------------------------------------------------
          // DRAW PERIPHERALS
          const xAxisGenerator = d3.axisBottom()
              .scale(xScale)
              .tickPadding(10)
  
          // x ticklabels
          if (config.xticklabels_show == "true") {
              if (pivotDate) {
                xAxisGenerator
                    .tickFormat(d3.timeFormat(config.xticklabel_format))
              }
          } else {
              xAxisGenerator
                  .tickFormat("")
          }
  
          // x gridlines
          if (config.x_gridlines == "true") {
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

          if (config.x_rotation == "true") {
            xAxis.selectAll("text")
                .attr("transform", "rotate(-35)")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
          }

          if (config.wrap_bottom == "true") {
              xAxis.selectAll("text").each(wrap)
          }

          if (config.xticklabels_show == "false") {
            d3.selectAll(".x-axis text")
                .attr("class", "hide")
        } 

          if (config.x_gridlines == "false") {
            d3.selectAll(".x-axis line")
                .attr("class", "hide")
        }
  
  
  
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
                  .tickSize(-width)
          } else {
              yAxisGenerator
                  .tickSize(0)
          }
  
          const yAxis = group.append("g")
              .call(yAxisGenerator)
              .attr("class", "y-axis")

          if (config.wrap_left == "true") {
              yAxis.selectAll("text").each(wrap)
          }

          if (config.yticklabels_show == "false") {
            d3.selectAll(".y-axis text")
               .attr("class", "hide")
       }

          if (config.y_gridlines == "false") {
            d3.selectAll(".y-axis line")
                .attr("class", "hide")
        }

        const yLabels = yAxis.selectAll("text")
        const maxTextWidth = d3.max(yLabels.nodes(), n => n.getComputedTextLength())
        console.log("yLabels, length", yLabels, maxTextWidth)

        // group.attr("transform", `translateX(${maxTextWidth})`)
  
              
          // AXIS LABELS
          if (config.show_xaxis_name == "true") {
              const xAxisLabel = xAxis.append("text")
                .attr("class", "axis-label")
                .attr("x", width/2)
                .attr("y", (margin.bottom - 5))
                .text(function() {
                    if (config.xaxis_label) {
                        return config.xaxis_label
                    } else {
                        return buckets.label
                    }
                 })
          }
  
          if (config.show_yaxis_name == "true") {
              const yAxisLabel = yAxis.append("text")
                .attr("class", "axis-label")
                .attr("x", (-height/2))
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
                      return (`translate(` + xScale(d.key) +` ,0)`)
                  })
                  .attr("class", "violin")
                      .style("fill", config.colors)
              .append("path")
                  .datum(function(d) {
                          return (d.value)})
                  .style("stroke", "none")
                  .attr("d", d3.area()
                      .x0(function(d) {return xNum(-d.length)})
                      .x1(function(d) {return xNum(d.length)})
                      .y(function(d) {return yScale(d.x0)})
                      .curve(d3.curveCatmullRom))
                  .attr("clip-path", "url(#plot-area)")
              
          const stats_marker = group.selectAll(".rect")
              .data(groupBins)
              .enter()
              .append("g")
                  .attr("transform", function(d) {
                      return (`translate(` + xScale(d.key) +` ,0)`)
                  })
                  .attr("class", "rect")
                  .append("rect")
                      .attr("x", xScale.bandwidth()/4)
                      .attr("y", (d)=>{
                          return yScale(d[config.statistics])
                      })
                      .attr("width", xScale.bandwidth()/2)
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

        if (config.statistics === "median") {
            const lowerQuartileMarkers = group.selectAll(".lower-quartile")
                .data(groupBins)
                .enter()
                .append("g")
                    .attr("transform", function(d) {
                        return (`translate(${xScale(d.key)}, 0)`)
                    })
                    .attr("class", "lower-quartile")
                    .append("line")
                        .attr("x1", xScale.bandwidth()/4)
                        .attr("x2", xScale.bandwidth()*(3/4))
                        .attr("y1", d => {
                            return yScale(d["lower"])
                        })
                        .attr("y2", d => {
                            return yScale(d["lower"])
                        })
                        .attr("stroke-dasharray", ("5,3"))
                        .attr("stroke-width", 1.5)
                        .attr("stroke", "#8c8c8c")

            const upperQuartileMarkers = group.selectAll(".upper-quartile")
                .data(groupBins)
                .enter()
                .append("g")
                    .attr("transform", function(d) {
                        return (`translate(${xScale(d.key)}, 0)`)
                    })
                    .attr("class", "upper-quartile")
                    .append("line")
                        .attr("x1", xScale.bandwidth()/4)
                        .attr("x2", xScale.bandwidth()*(3/4))
                        .attr("y1", d => {
                            return yScale(d["upper"])
                        })
                        .attr("y2", d => {
                            return yScale(d["upper"])
                        })
                        .attr("stroke-dasharray", ("5,3"))
                        .attr("stroke-width", 1.5)
                        .attr("stroke", "#8c8c8c")

        }
                      
  
      } catch(error) {
          if (environment == "prod") {
              console.log("somehow got in here")
              if (queryResponse.fields.dimensions.length > 2 || queryResponse.fields.dimensions.length < 1 || queryResponse.fields.dimensions.length == 1 && queryResponse.fields.pivots.length != 1 ) {
              this.addError({title: "Dimension/Pivot Error", message: "This chart takes two dimensions or one pivot on a single dimension."});
              return;
              } 
          }
      }
      
      // Callback at the end of the rendering to let Looker know it's finished
      done()
    }
  };