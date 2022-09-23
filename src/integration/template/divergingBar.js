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
            font-family: Roboto;
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
          font-family: Roboto;
          text-anchor: middle;
        }

        .y-axis, .x-axis {
          font-family: Roboto;
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
            min_pivots: 0, max_pivots: 1,
            min_dimensions: 0, max_dimensions: undefined,
            min_measures: 0, max_measures: 3
            })) return
        }

        try {
            let left_margin;
            let bottom_margin;
    
            if (config.show_yaxis_name == "true") {
                left_margin = 30
            } else {
                left_margin = 30
            }
    
            if (config.show_xaxis_name == "true") {
                bottom_margin = 50
            } else {
                bottom_margin = 30
            }
    
            let margin = {
                top: 10, 
                right: 30, 
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

            
            // data setup ----------------------------------------
            const headersNegative = ["C", "F"]
            const headersPositive = ["A", "B"]

            let dataPositive = []
            let dataNegative = []

            let negPos = "carrier_scorecard_agg.carrier_grade"

            let positivesVolume = []
            let negativesVolume = []
            let positiveUnique = []
            let negativeUnique = []

    
            // Get the shape of the data, this chart can take two dimensions or a pivot on the shorter dimension
            const dimensions = queryResponse.fields.dimension_like
            const measures = queryResponse.fields.measure_like

            console.log("dimensions", dimensions)
            console.log("measures", measures)

            let data_ready = []
            let data_keys = [] // unique values in the column that will be each y group

            data.forEach((d) => {
              if (data_keys.includes(d[dimensions[1].name].value)) {
                return
              } else if (d[dimensions[1].name].value != null) {
                data_keys.push(d[dimensions[1].name].value)
              }
            })

            data_keys.forEach((entry, i) => {
              let pod = {}
              pod['group'] = entry
              pod['A'] = 0
              pod['B'] = 0
              pod['total'] = 0

              data.forEach((ent) => {
                if (ent[dimensions[1].name]['value'] == entry) {
                  if (ent[dimensions[2].name]['value'] == 'A') {
                    pod['A'] += ent[measures[0].name]['value']
                    pod['total'] += ent[measures[0].name]['value']
                  } else if (ent[dimensions[2].name]['value'] == 'B') {
                    pod['B'] += ent[measures[0].name]['value']
                    pod['total'] += ent[measures[0].name]['value']
                  }
                }
              })
              positivesVolume.push(pod)
            })

            data_keys.forEach((entry,i)=>{
              let pod = {}
              pod["group"] = entry
              pod["C"] = 0
              pod["D"] = 0
              pod["E"] = 0
              pod["F"] = 0
              pod["total"] = 0
              data.forEach((ent)=>{
                if (ent[dimensions[1].name]["value"] == entry) {
                  if (ent[dimensions[2].name]["value"] == "C") {
                    pod["C"] += ent[measures[0].name]["value"]
                    pod["total"] += ent[measures[0].name]["value"]
                  } else if(ent[dimensions[2].name]["value"] == "D") {
                    pod["D"] += ent[measures[0].name]["value"]
                    pod["total"] += ent[measures[0].name]["value"]
                  } else if (ent[dimensions[2].name]["value"] == "E") {
                    pod["E"] += ent[measures[0].name]["value"]
                    pod["total"] += ent[measures[0].name]["value"]
                  } else if(ent[dimensions[2].name]["value"] == "F") {
                    pod["F"] += ent[measures[0].name]["value"]
                    pod["total"] += ent[measures[0].name]["value"]
                  }
                }
              })
              negativesVolume.push(pod)
            })

            console.log("data", data)
            console.log("data_ready", data_ready)
            console.log("data_keys", data_keys)
            console.log("positivesVolume", positivesVolume)
            console.log("negativesVolume", negativesVolume)
            console.log("positivesUnique", positiveUnique)
            console.log("negativesUnique", negativeUnique)
    
            
            const stackedPositives = d3.stack()
              .keys(headersPositive)
              (positivesVolume)

            const stackedNegatives = d3.stack()
              .keys(headersNegative)
              (negativesVolume)

            console.log("stackedPositives", stackedPositives)
            console.log("stackedNegatives", stackedNegatives)
            console.log("data_key mapping", data_keys.map((d) => {return d}))

            // SCALES ------------------------------------------------------------
            const yScale = d3.scaleBand()
              .domain(data_keys.map((d) => {return d}))
              .range([height, 0])
              .padding(0.05)

            const universalMax = d3.max(
              [d3.max(positivesVolume, d => {return d.total}),
              d3.max(negativesVolume, d => {return d.total})])

            console.log("universalMax", universalMax)

            const xScale = d3.scaleLinear()
                .domain([0, universalMax])
                .range([0, width/2])

            const zScale = d3.scaleOrdinal()
                .domain(["A","B","C","F"])
                .range(["#27566b","#339f7b","#007b82","#f1cc56"])

            
            // DRAW DATA ------------------------------------------------------------
            const groupPos = svg.append('g')
                .attr("transform", `translate(${(width/2) + margin.left}, ${margin.top})`)
                .attr("width", (width/2 + "px"))
                .attr("height", (height + "px"))
                .attr("class", "group-pos")

            const groupNeg = svg.append('g')
                .attr("transform", `translate(${margin.left}, ${margin.top})`)
                .attr("width", (width/2 + "px"))
                .attr("height", (height + "px"))
                .attr("class", "group-neg")

            const posGroups = groupPos
                .selectAll(".bar-groups")
                // Enter in the stack data = loop key per key = group per group
                .data(stackedPositives)
                .enter()
                .append("g")
                  .attr("class", "bar-groups")
                  .attr("fill", (d, i) => {
                    return zScale(d.key)
                  })

            const negGroups = groupNeg
                .selectAll(".bar-groups-neg")
                .data(stackedNegatives)
                .enter()
                .append('g')
                  .attr("class", "bar-groups-neg")
                  .attr("fill", (d, i) => {
                    return zScale(d.key)
                  })
            
            posGroups
                .selectAll("rect")
                // enter a second time = loop subgroup per subgroup to add all rects
                .data(d => d)
                .enter()
                .append('rect')
                  .attr('x', d => xScale(d[0])) // already translated to width/2 so can use xScale as-is
                  .attr('y', d => yScale(d.data.group))
                  .attr('height', d => yScale.bandwidth())
                  .attr('width', d => xScale(d[1]) - xScale(d[0]))

            console.log("x neg check")
            console.log("xScale(3145)", xScale(3145))
            console.log("width/2", width/2)
            console.log("diff", (width/2) - xScale(3145))

            negGroups
                .selectAll("rect")
                .data(d => d)
                .enter()
                .append('rect')
                  .attr('x', d => (width/2) - xScale(d[1]))
                  .attr('y', d => yScale(d.data.group))
                  .attr('height', d => yScale.bandwidth())
                  .attr('width', d => xScale(d[1]) - xScale(d[0]))
            

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