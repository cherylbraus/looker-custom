import { color } from "d3";

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
      margin_left: {
        section: 'Margins',
        order:4,
        type: 'string',
        display:'text',
        label: 'Margin - left',
        default: ''
      },
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

        const grades = {
            "A": {sign: 1},
            "B": {sign: 1},
            "C": {sign: -1},
            "D": {sign: -1},
            "E": {sign: -1},
            "F": {sign: -1}
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
                right: 40, 
                bottom: bottom_margin, 
                left: left_margin
            };
  
            if (config.margin_bottom.length > 0) {
                margin.bottom = +config.margin_bottom
            }
  
            if (config.margin_left.length > 0) {
                margin.left = +config.margin_left
            }
    
            console.log("margin", margin)
  
            console.log("element", element)
    
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
    
            // Get the shape of the data, this chart can take two dimensions or a pivot on the shorter dimension
            const dimensions = queryResponse.fields.dimension_like
            const measures = queryResponse.fields.measure_like

            console.log("dimensions", dimensions)
            console.log("measures", measures)

            let data_ready = []

            data.forEach((d) => {
                if (d[measures[0].name].value != null && d[dimensions[0].name].value != null) {
                    let entry = {}
                    entry['entity'] = d[dimensions[0].name].value
                    entry['group'] = d[dimensions[1].name].value
                    entry['measure'] = d[dimensions[2].name].value
                    data_ready.push(entry)
                }
            })

            console.log("data", data)
            console.log("data_ready", data_ready)
    
            // const grouped = d3.nest()
            //     .key((d) => {return d.group})
            //     .key((d) => {return d.measure})
            //     .rollup((d) => {return d.length})
            //     .entries(data_ready)

            // console.log("grouped", grouped)

            let positives = []
            let negatives = []
            data_ready.forEach((d,i) => {
                const sign = grades[d.measure].sign

                if (sign === 1) {
                  const exists = positives.find(e => e.group === d.group && e.measure === d.measure)
                  if (exists !== undefined) {
                    exists.total += 1
                  } else {
                    let ent = {}
                    ent['group'] = d.group
                    ent['measure'] = d.measure
                    ent['total'] = 1 * grades[d.measure].sign
                    positives.push(ent)
                  }
                } else {
                  const exists = negatives.find(e => e.group === d.group && e.measure === d.measure)
                  if (exists !== undefined) {
                    exists.total += 1
                  } else {
                    let ent = {}
                    ent['group'] = d.group
                    ent['measure'] = d.measure
                    ent['total'] = 1 * grades[d.measure].sign
                    negatives.push(ent)
                  }
                }
              });

            console.log("positives", positives)
            console.log("negatives", negatives)

            // accessor functions
            const groupAccessor = d => d.group // (y)
            const measureAccessor = d => d.measure // (z)
            const totalAccessor = d => d.total // (x)

            console.log("map example", d3.map(positives, d => measureAccessor(d)))

            // REALIZED THIS IS WRONG - need to figure out the max total when all stacks are placed consecutively
            // not just what the max single stack section is
            const maxX = Math.max(d3.max(positives.map(d => d.total)), 
              d3.max(negatives.map(d => d.total)))

            d3.rollup(positives, D => {
              console.log("D", D)
              return d3.sum(D, d => -d['total'])
            }, d => d['group'])
            // console.log(d3.max(d3.sum(positives, d => -d.total)))



            // SCALES ------------------------------------------------------------
            // const xScalePos = d3.scaleLinear()
            //   .domain([0, maxX])
            //   .range([width/2, width])

            // const xAxisPos = d3.axisTop()
            //   .scale(xScalePos)

            // const xScaleNeg = d3.scaleLinear()
            //   .domain([0, maxX])
            //   .range([width/2, 0])

            // const xAxisNeg = d3.axisTop()
            //   .scale(xScaleNeg)

            // const yScale = d3.scaleBand()
            //   .domain([... new Set(data_ready.map(d => d.group))].sort())
            //   .range([height, 0])
            //   .padding(0.2)

            // const yAxis = d3.axisLeft()
            //   .scale(yScale)
            //   .tickSize(0)

            // console.log("reverse", [... new Set(data_ready.map(d => d.measure))].sort().reverse())

            // const colorScalePos = d3.scaleOrdinal()
            //   .domain([... new Set(positives.map(d => d.measure))].sort().reverse())
            //   .range(d3.schemeTableau10)

            // const colorScaleNeg = d3.scaleOrdinal()
            //   .domain([... new Set(negatives.map(d => d.measure))].sort())
            //   .range(d3.schemeSet3)

            // console.log(colorScalePos("A"))
            // console.log(colorScalePos("B"))
            // console.log(colorScaleNeg("C"))
            // console.log(colorScaleNeg("F"))


            // const stackPos = d3.stack()
            //   .keys([... new Set(positives.map(d => d.measure))].sort())
            //   .value((obj, key) => obj.total)
            //   (positives)

            // const stackNeg = d3.stack()
            //   .keys([... new Set(negatives.map(d => d.measure))].sort())
            //   .value((obj, key) => obj.total)
            //   (negatives)

            // console.log("stackedData", stackPos, stackNeg)

            // // colors are not filling in (maybe I can't use a sequential color scheme for categorical)
            // // also, placement of negatives is not correct... maybe setup xScaleNeg wrong?
            // const barsPos = group
            //   .selectAll("g")
            //   .data(stackPos)
            //   .enter()
            //   .append('g')
            //   .selectAll('rect')
            //   .data(d => d)
            //   .enter()
            //   .append('rect')
            //     .attr('fill', d => colorScalePos(d.data.measure))
            //     .attr('x', d => Math.min(xScalePos(d[0]), xScalePos(d[1])))
            //     .attr('y', d => yScale(d.data.group))
            //     .attr('width', d => Math.abs(xScalePos(d[0]) - xScalePos(d[1])))
            //     .attr('height', yScale.bandwidth())
            //     .classed("rect-pos", true)

            // const barsNeg = group
            //   .selectAll("g")
            //   .data(stackNeg)
            //   .enter()
            //   .append('g')
            //   .selectAll('rect')
            //   .data(d => d)
            //   .enter()
            //   .append('rect')
            //     .attr('fill', d => {
            //       console.log(d.data.measure, colorScaleNeg(d.data.measure))
            //       colorScaleNeg(d.data.measure)
            //     })
            //     .attr('x', d => Math.max(xScaleNeg(d[0]), xScaleNeg(d[1])))
            //     .attr('y', d => yScale(d.data.group))
            //     .attr('width', d => Math.abs(xScaleNeg(d[0]) - xScaleNeg(d[1])))
            //     .attr('height', yScale.bandwidth())
            //     .classed("rect-neg", true)

            
            



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