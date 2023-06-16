import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'
import * as $ from 'jquery'

looker.plugins.visualizations.add({
    // Id and Label are legacy properties that no longer have any function besides documenting
    // what the visualization used to have. The properties are now set via the manifest
    // form within the admin/visualizations page of Looker.

    id: "heatmap",
    label: "ZDEV Heatmap",
    options: {
        color_palette: {
          section: 'Arrangement',
          order:1,
          type: 'string',
          label: 'Palette Type',
          display: "radio",
          values: [
            {"Gradient": "gradient"},
            {"Sequential": "sequential"},
            {"Diverging (Choose midpoint)": "diverging"}
          ],
          default: "gradient"
        },
        transpose: {
          section: 'Arrangement',
          order:2,
          type: 'boolean',
          label: 'Transpose',
          default: false
        },
        reverse: {
          section: 'Arrangement',
          order:4,
          type: 'boolean',
          label: 'Reverse palette',
          default: false
        },
        rounded: {
          section: 'Arrangement',
          order:6,
          type: 'boolean',
          label: 'Rounded rectangles',
          default: true
        },
        text: {
          section: 'Arrangement',
          order:3,
          type: 'boolean',
          label: 'Display value inside rects',
          default: false
        },
        automatic: {
          section: 'Binning',
          order:1,
          type: 'string',
          label: 'Binning method',
          display: "select",
          values: [
              {"Equal width binning": "0"},
              {"Set breakpoints": "1"},
              {"Equal frequency binning": "2"}
          ],
          default: "0"
        },
        number_quantiles: {
          section: 'Binning',
          order:2,
          type:'string',
          label: 'Number of bins',
          display: "select",
          values: [
              {"Four": "4"},
              {"Five": "5"},
              {"Six": "6"},
              {"Seven": "7"},
              {"Eight": "8"}
          ],
          default: "5"
        },
        breakpoints: {
          section: "Binning",
          order:3,
          type: "string",
          display: "text",
          label: "Custom breakpoints (comma separated)",
          placeholder: "Separate breakpoints with commas",
          default: ""
        },
        mid_breakpoint: {
          section: "Binning",
          order: 4,
          type: "string",
          display: "text",
          label: "Custom midpoint",
          placeholder: "If a percentage, use X.XX format",
          default: "0.2"
        },
        metric_format: {
          section: "Binning",
          order: 5,
          type: "string",
          label: "Number type",
          display: "select",
          values: [
            {"Raw Number": "number"},
            {"USD": "usd"},
            {"Percentage": "percentage"}
          ],
          default: "number"
        },
        bin_null: {
          section: 'Binning',
          order:6,
          type: 'boolean',
          label: 'Count null as zero',
          default: false
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
        label_bottom: {
          section: 'Margins',
          order:2,
          type: 'string',
          display:'text',
          label: 'Label offset - bottom',
          default: ''
        },
        label_left: {
          section: 'Margins',
          order:5,
          type: 'string',
          display:'text',
          label: 'Label offset - left',
          default: ''
        },
        wrap_bottom: {
          section: 'Margins',
          order:3,
          type: 'boolean',
          label: 'Truncate x-axis labels',
          default: false
        },
        wrap_left: {
          section: 'Margins',
          order:6,
          type: 'boolean',
          label: 'Truncate y-axis labels',
          default: false
        },
        axis_label_bottom: {
          section: 'Labels',
          order:1,
          type: 'string',
          display:'text',
          label: 'Custom bottom axis label',
          default: ''
        },
        axis_label_left: {
          section: 'Labels',
          order:2,
          type: 'string',
          display:'text',
          label: 'Custom left axis label',
          default: ''
        },
        tooltip_dimension_label: {
          section: 'Labels',
          order:3,
          type: 'string',
          display:'text',
          label: 'Custom tooltip label for dimension',
          default: ''
        },
        tooltip_value_label: {
          section: 'Labels',
          order:4,
          type: 'string',
          display:'text',
          label: 'Custom tooltip label for value',
          default: ''
        },
      },

    // Set up the initial state of the visualization
    create: function(element, config) {
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
              .tick {
                font-family: Roboto;
              }
              .label {
                font-size: 10px;
              }
              .tooltip {
                box-shadow: rgb(60 64 67 / 30%) 0px 1px 2px 0px, rgb(60 64 67 / 15%) 0px 2px 6px 2px;
                font-size: 11px;
                pointer-events: none;
              }
              .tooltip h1 {
                font-size: 11px;
                color: #c3c3c3;
                text-transform: uppercase;
              }
              .error-container {
                margin: 0;
                position: absolute;
                top: 50%;
                -ms-transform: translateY(-50%);
                transform: translateY(-50%);
                text-align:center;
                width:100%;
              }
              .error {
                font-family:Roboto;
                font-size:16px
              }
              .error-header {
                font-family:Roboto;
                font-weight:700;
                font-size:16px
              }
              #value-header {
                padding-top: 8px;
                border-top: solid 1px rgb(222, 225, 229);
              }
            </style>
            <svg>
            </svg>
            <div class="tooltip"></div>`;
        element.style.fontFamily = `Roboto,"Open Sans", "Helvetica", sans-serif`
    },
    updateAsync: function(data, element, config, queryResponse, details, done, environment = "prod") {
      if (environment == "prod") {
            if (!handleErrors(this, queryResponse, {
                min_pivots: 1, max_pivots: 1,
                min_dimensions: 1, max_dimensions: 40,
                min_measures: 1, max_measures: 40
            })) return
        }

    const formatMap = {
      'number': d3.format(",.0f"),
      'usd': d3.format("$,.0f"),
      'percentage': d3.format(",.0%") 
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

    function dupeCheck(array) {
      return array.length === new Set(array).size;
    }
    // equal frequency
    function equalFreq(arrayI, bins,returnFormat = "arrays") {

      function arrayEquals(a, b) {
          return Array.isArray(a) &&
              Array.isArray(b) &&
              a.length === b.length &&
              a.every((val, index) => val === b[index]);
      }

      let array = []
      arrayI.forEach(entry => array.push(entry))


      let fArray = []
      // Get everything into separate arrays
      if (config.bin_null == false) {
        array = array.filter((entry) =>{ 
          return entry.value != null
        }).sort((a, b) =>{
          return a.value - b.value
        })
      }

      //may be useless
      let binSize = (() => {
        return Math.floor(array.length/bins)
      })()

      while (array.length >= bins) {
        fArray.push(array.splice(0,binSize).map((ent)=>{
          return ent.value } 
          ))
      }

      let rem = 0
      while (array.length > 0) {
        fArray[rem].push(array.pop().value)
        rem++
      } 

      // Sorting algorithm
      let finished = false
      while (finished == false) {
        let testArray = []
        let checkArray = []
        let halffinished = true

        // creates test and check arrays. the final product should have each bin's average go in ascending order
        // having a higher max value than the next bin's minimum value
        for (let dy = 0; dy<fArray.length; dy++) {
          testArray.push(fArray[dy].reduce((a,b)=> a + b)/fArray[dy].length)
          checkArray.push(fArray[dy].reduce((a,b)=> a + b)/fArray[dy].length)
          if (fArray[dy+1] && d3.max(fArray[dy]) > d3.min(fArray[dy+1])) {
            halffinished = false
          } 
        }

        if(halffinished == true && arrayEquals(testArray.sort((a,b)=> a-b), checkArray)) {
          finished = true
        } else {

          // Here we go through each nested array and ensure there is no crossover between the kth array
          // And the k+1 th array in terms of values, flipping values that do not belong out of the lower array
          for (let k = 0; k<fArray.length - 1; k++) {
            while (d3.max(fArray[k])>d3.min(fArray[k+1])) {
              const flip1 = d3.max(fArray[k])
              const flip2 = d3.min(fArray[k+1])
              const flip1Ind = fArray[k].indexOf(flip1)
              const flip2Ind = fArray[k+1].indexOf(flip2)
              fArray[k+1].splice(flip2Ind,1,flip1)
              fArray[k].splice(flip1Ind,1,flip2)
            }
          }
        }
      }
      return fArray.map(ent => d3.max(ent))
    }    

    const options = { ...this.options }

    if (config.color_palette == 'diverging') {
      options.breakpoints.hidden = true
      options.number_quantiles.hidden = true
      options.automatic.hidden = true
      options.mid_breakpoint.hidden = false
      options.metric_format.hidden = false
    } else {
      options.breakpoints.hidden = false
      options.number_quantiles.hidden = false
      options.automatic.hidden = false
      options.mid_breakpoint.hidden = true
      options.metric_format.hidden = true

      if (config.automatic == "0" || config.automatic == "2") {
        options.breakpoints.hidden = true
        options.number_quantiles.hidden = false
        options.breakpoints == ""
      } else {
        options.breakpoints.hidden = false
        options.number_quantiles.hidden = true
        options.number_quantiles == "5"
      }
    }

    

    this.trigger('registerOptions', options)



    // Custom error handling
    if (queryResponse.fields.dimension_like.length != 1 || queryResponse.fields.measure_like.length != 1 || queryResponse.fields.pivots.length != 1) {
      $('#vis').contents(':not(style)').remove();
      const error = '<div class="error-container"><div class="error-header">Incorrect data inputs</div><div class="error">Heatmap requires one dimension, one measure and one pivot.</div></div>'
      $('#vis').append(error);
    } else if ((config.color_palette == "gradient" && config.breakpoints.split(",").length > 8) || (config.color_palette == "sequential" && config.breakpoints.split(",").length > 5)) {
      $('#vis').contents(':not(style)').remove();
      const error = '<div class="error-container"><div class="error-header">Too many buckets</div><div class="error">The gradient palette can manage 8 bins while the sequential palette manages 5 bins.</div></div>'
      $('#vis').append(error);
    } else if (config.color_palette == "sequential" && +config.number_quantiles.length > 5) {
      $('#vis').contents(':not(style)').remove();
      const error = '<div class="error-container"><div class="error-header">Too many buckets</div><div class="error">The sequential palette can manage 5 bins. Switch to the gradient palette for more bins.</div></div>'
      $('#vis').append(error);
    } else if (config.color_palette == "diverging" && config.mid_breakpoint == "") {
      $('#vis').contents(':not(style)').remove();
      const error = '<div class="error-container"><div class="error-header">Incorrect data inputs</div><div class="error">The diverging palette requires a value for the mid-breakpoint.</div></div>'
      $('#vis').append(error);
    } else {
            try {
        d3.select("#vis")
            .select("svg").html("")

        const dimensions = queryResponse.fields.dimension_like;
        const measures = queryResponse.fields.measure_like;
        const pivots = queryResponse.fields.pivots;
        
        //This is just for getting responsive left margin
        let formatRead;

        if (config.transpose == false) {
          formatRead = Object.keys(data[0][measures[0].name]) 
        } else {
            let return_array = []
            data.forEach((entry) =>{
              return_array.push(entry[dimensions[0].name].value)
            })
            formatRead = return_array
          }

        let highest = 0
        formatRead.forEach((entry) =>{
          if (entry.includes("$")) {
            return
          } else if (entry.length > highest) {
            highest = entry.length 
          }
        })


        let margin = {top: 70, right: 25, bottom: 100, left: 90}

        if (config.margin_bottom.length > 0) {
          margin.bottom = +config.margin_bottom
        }

        if (config.margin_left.length > 0) {
          margin.left = +config.margin_left
        }


        const getNode = d3.select("#vis");

        // Update this once we have a better idea how Looker integration will look
        const new_node_width = getNode.select(function() { return this.parentNode; })
        const new_node_height = getNode.select(function() { return this.parentNode; })
        const w = new_node_width.node().getBoundingClientRect().width;
        const h = new_node_height.node().getBoundingClientRect().height;

        const width = w - margin.left - margin.right;
        const height = h - margin.bottom - margin.top;

      // append the svg object to the body of the page
      var svg = d3.select("#vis")
      .select("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

      let final_measures = Object.keys(data[0][measures[0].name]).filter(key => key[0] != "$")
      let final_dimensions = []
      
      data.forEach((entry) => {
        final_dimensions.push(entry[dimensions[0].name].value)
      })

      console.log("dimensions", dimensions)
      console.log("final_dimensions", final_dimensions)

      let final_data = []
      data.forEach((entry,i) => {
          // if (config.bin_null == "true") {
          //   console.log(entry, final_measures)
          // }
          final_measures.forEach((ent) => {
            let dat = {}
            dat['variable'] = ent
            dat['group'] = entry[dimensions[0].name].value 
            if (config.bin_null == true && entry[measures[0].name][ent].value == null) {
              dat['value'] = 0
            } else {
              dat['value'] = entry[measures[0].name][ent].value
            }
            
            final_data.push(dat)
          })
      })

      // Labels of row and columns -> unique identifier of the column called 'group' and 'variable'
      let myGroups = final_dimensions

      let myVars = final_measures

      const extent = d3.extent(final_data, (d)=>{
            return +d.value
          })

      let tScaleDomain = config.breakpoints.split(",") || [""]

      if (config.automatic == "1") {
        tScaleDomain = tScaleDomain.map((ent)=>{
          return +ent
        })
        tScaleDomain.shift()

        tScaleDomain.push(extent[1])

        tScaleDomain.sort((a,b) =>{
          return a - b
        })

      } else if (+config.automatic == 2) {
        tScaleDomain = equalFreq(final_data, +config.number_quantiles)
        if (dupeCheck(tScaleDomain) == false) {
          tScaleDomain = Array.from(new Set(tScaleDomain))
        } 
        if (tScaleDomain[0] == 0) {
          tScaleDomain.shift()
        }
      }

      const sequentialPalette = ["#025187","#0072b5","#2b93ca","#5bacd7","#8fcae9","#bee7fd","#e0f3fd","#edf8fe"]
      const divergingPaletteOne = ["#27566b","#007b82","#339f7b","#8cbb61","#f1cc56"]
      // const divergingPaletteTwo = ["#27566b","#556391","#9d689c","#d96f85","#ee8d5c"]

      // Diverging Palette Two for a gradient and not threshold
      const colors = (config.reverse == true) ? ['#025187', '#ffffff', '#e48d2d'] : ['#e48d2d', '#ffffff', '#025187'];
      const divergingPaletteTwo = d3.scaleLinear()
        .domain([extent[0], +config.mid_breakpoint, extent[1]]) // Define the domain using value extent
        .range(colors)

      // Define a function to get color for a specific value
      function getColorForPercentage(pct) {
        return divergingPaletteTwo(pct);
      }

      let palette; 

      if (config.color_palette == "gradient") {
        palette = sequentialPalette
      } else {
        // this isn't used for the diverging option, just the sequential
        palette = divergingPaletteOne
      }

      const qScale = d3.scaleQuantize()
      const tScale = d3.scaleThreshold()

      if (config.reverse == false) {
        let qPalette = palette.slice(0,config.number_quantiles).reverse()
        qScale.domain(extent)
          .range(qPalette);
        let tPalette = palette.slice(0,tScaleDomain.length).reverse()
        tScale.domain(tScaleDomain)
          .range(tPalette);
      } else {
        let qPalette = palette.slice(0,config.number_quantiles)
        qScale.domain(extent)
          .range(qPalette);
        let tPalette = palette.slice(0,tScaleDomain.length)
        tScale.domain(tScaleDomain)
          .range(tPalette);
      }

      const scales = [qScale,tScale,tScale]

      const legendScale = d3.scaleBand().domain([...Array(scales[+config.automatic].range().length).keys()]).range([0,width - 72])

      // Build X scales and axis:
      var x = d3.scaleBand()
      // Build Y scales and axis:
      var y = d3.scaleBand()

      if (config.transpose == true) {
        x.range([ 0, width ])
          .domain(myVars)
          .padding(0.05);
        y.range([ height, 0 ])
          .domain(myGroups)
          .padding(0.05);
      } else {
        x.range([ 0, width ])
          .domain(myGroups)
          .padding(0.05);
        y.range([ height, 0 ])
          .domain(myVars)
          .padding(0.05);
      }

      const xAxis = svg.append("g")
        .style("font-size", 12)
        .attr("transform", "translate(10," + height + ")")
        .call(d3.axisBottom(x)
          .tickSize(0)
          .tickFormat(d => d.split("|FIELD")[0]))
      
      xAxis.select(".domain").remove()

      xAxis.selectAll("text")  
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-35)")

      if (config.wrap_bottom == true) {
         xAxis.selectAll("text").each(wrap); 
      }
            
      const yAxis = svg.append("g")
        .style("font-size", 12)
        .call(d3.axisLeft(y)
          .tickSize(0)
          .tickFormat(d => d.split("|FIELD")[0]))
      
      yAxis.select(".domain").remove()

      if (config.wrap_left == true) {
         yAxis.selectAll("text") .each(wrap); 
      }

      // create a tooltip
      var tooltip = d3.select(".tooltip")
        .style("opacity", 0)
        .style("background-color", "white")
        .style("border-radius", "4px")
        .style("padding", "5px")
        .style("position", "absolute")

      if (config.tooltip_dimension_label.length > 0 && config.tooltip_value_label.length > 0) {
        tooltip.html("<h1 id='dimension-header'>" + config.tooltip_dimension_label + "</h1><p id='dimension-body'></p><h1 id='value-header'>" + config.tooltip_value_label + "</h1><p id='value-body'></p>")
      } else if (config.tooltip_dimension_label.length > 0) {
        tooltip.html("<h1 id='dimension-header'>" + config.tooltip_dimension_label + "</h1><p id='dimension-body'></p><h1 id='value-header'>Value</h1><p id='value-body'></p>")
      } else if (config.tooltip_value_label.length > 0) {
        tooltip.html("<h1 id='dimension-header'>" + dimensions[0].name + "</h1><p id='dimension-body'></p><h1 id='value-header'>" + config.tooltip_value_label + "</h1><p id='value-body'></p>")
      } else {
        tooltip.html("<h1 id='dimension-header'>" + dimensions[0].name + "</h1><p id='dimension-body'></p><h1 id='value-header'>Value</h1><p id='value-body'></p>")
      }

      var tooltipValueBody = tooltip.select("#value-body")
      var tooltipDimensionBody = tooltip.select("#dimension-body")


      // Three function that change the tooltip when user hover / move / leave a cell
      var mouseover = function(d) {
        tooltip
          .style("opacity", 1)
        d3.select(this)
          .style("stroke", "black")
          .style("stroke-width", 1)
          .style("opacity", 1)
      }

      var mousemove = function(d) {

        tooltip
          .style("left", (d3.mouse(this)[0]) + "px")
          .style("top", (d3.mouse(this)[1]-25) + "px")

          tooltipDimensionBody.html("<span>" + d.group + "</span>")
        if (d.value != null) {
          tooltipValueBody.html("<span>" + formatMap[config.metric_format](d.value) + "</span>")
        } else {
          tooltipValueBody.html("<span class='null-val'>∅</span>")
        }
      }
      var mouseleave = function(d) {
        tooltip
          .style("opacity", 0)
        d3.select(this)
          .style("stroke", "none")
          .style("opacity", 1)
      }

      // add the squares
      if (config.transpose == true) {
          const tiles = svg.selectAll(".tile")
            .data(final_data)
            .enter()
            .append("g")
              .attr("class", "tile")
          
          tiles.append("rect")
              .attr("x", function(d) { return x(d.variable) })
              .attr("y", function(d) { return y(d.group) })
              // Change rounded to square here
              .attr("rx", ()=>{
                if (config.rounded == true) {
                  return 4
                } else {
                  return 0
                }
              })
              .attr("ry", ()=>{
                if (config.rounded == true) {
                  return 4
                } else {
                  return 0
                }
              })
              .attr("width", x.bandwidth() )
              .attr("height", y.bandwidth() )
              .style("fill", function(d) { 
                if (d.value == null) {
                  return "#c3c3c3"
                } else {
                  if (config.color_palette != 'diverging') {
                    return scales[+config.automatic](+d.value)
                  } else {
                    return divergingPaletteTwo(+d.value)
                  }                  
                }
              })
              .style("stroke-width", 4)
              .style("stroke", "none")
              .style("opacity", 1)
                  .on("mouseover", mouseover)
                  .on("mousemove", mousemove)
                  .on("mouseleave", mouseleave)

          if (config.text == true && final_dimensions.length < 25) {
            tiles.append("text")
                .attr("x", function(d) { return x(d.variable) + ((x.bandwidth() /1.967))})
                .attr("y", function(d) { return y(d.group) + (y.bandwidth() /1.765) })
                .attr("text-anchor", "middle")
                .attr("font-size", 10)
                .attr("font-weight", 500)
                .attr("opacity", 0.5)
                .attr("pointer-events", "none")
                .attr("fill", (d)=>{
                  if (config.color_palette == 'diverging') {
                    let background = divergingPaletteTwo(+d.value)
                    let colors = ['red', 'green', 'blue']

                    let colorArr = background.slice(
                      background.indexOf("(") + 1, 
                      background.indexOf(")")
                    ).split(", ");

                    let colorObj = new Object()
                    colorArr.forEach((k, i) => {
                      colorObj[colors[i]] = +k
                    })

                    return ((colorObj['red'] * .299 + colorObj['green'] * .587 + colorObj['blue'] * .114) > 150) ? 'black' : 'white'
                  } else if (config.reverse == true) {
                    if (scales[+config.automatic](+d.value) == scales[+config.automatic].range()[0] || scales[+config.automatic](+d.value) == scales[+config.automatic].range()[1]) {
                      return "white"
                    }
                  } else {
                    if (scales[+config.automatic](+d.value) == scales[+config.automatic].range()[scales[+config.automatic].range().length-1] || scales[+config.automatic](+d.value) == scales[+config.automatic].range()[scales[+config.automatic].range().length-2]) {
                      return "white"
                    }
                  }
                })
                .text((d)=>{
                  if (config.color_palette == 'diverging' && d.value) {
                    console.log("text value", +d.value)
                    return formatMap[config.metric_format](+d.value)
                  } else if (d.value > 1000000) {
                    return Math.round(d.value/100000)/10 + "M" }
                    else if (d.value > 1000) {
                    return Math.round(d.value/100)/10 + "K" } else {
                      return d.value
                    }
                  }) 
              }

        } else {
          const tiles = svg.selectAll(".tile")
            .data(final_data)
            .enter()
            .append("g")
            .attr("class", "tile")

          tiles.append("rect")
              .attr("x", function(d) { return x(d.group) })
              .attr("y", function(d) { return y(d.variable) })
              // Change rounded to square here
              .attr("rx", ()=>{
                if (config.rounded == true) {
                  return 4
                } else {
                  return 0
                }
              })
              .attr("ry", ()=>{
                if (config.rounded == true) {
                  return 4
                } else {
                  return 0
                }
              })
              .attr("width", x.bandwidth() )
              .attr("height", y.bandwidth() )
              .style("fill", function(d) { 
                if (d.value == null) {
                  return "#c3c3c3"
                } else {
                  if (config.color_palette != 'diverging') {
                    return scales[+config.automatic](+d.value)
                  } else {
                    return divergingPaletteTwo(+d.value)
                  }                  
                }
              })
              .style("stroke-width", 4)
              .style("stroke", "none")
              .style("opacity", 1)
                  .on("mouseover", mouseover)
                  .on("mousemove", mousemove)
                  .on("mouseleave", mouseleave)

         if (config.text == true && final_dimensions.length < 25) {
            tiles.append("text")
                .attr("x", function(d) { return x(d.group) + ((x.bandwidth() /1.967))})
                .attr("y", function(d) { return y(d.variable) + (y.bandwidth() /1.77) })
                .attr("text-anchor", "middle")
                .attr("font-size", 10)
                .attr("font-weight", 500)
                .attr("opacity", 0.5)
                .attr("pointer-events", "none")
                .attr("fill", (d)=>{
                  if (config.color_palette == 'diverging') {
                    let background = divergingPaletteTwo(+d.value)
                    let colors = ['red', 'green', 'blue']

                    let colorArr = background.slice(
                      background.indexOf("(") + 1, 
                      background.indexOf(")")
                    ).split(", ");

                    let colorObj = new Object()
                    colorArr.forEach((k, i) => {
                      colorObj[colors[i]] = +k
                    })

                    return ((colorObj['red'] * .299 + colorObj['green'] * .587 + colorObj['blue'] * .114) > 150) ? 'black' : 'white'
                  } else if (config.reverse == true) {
                    if (scales[+config.automatic](+d.value) == scales[+config.automatic].range()[0] || scales[+config.automatic](+d.value) == scales[+config.automatic].range()[1]) {
                      return "white"
                    }
                  } else {
                    if (scales[+config.automatic](+d.value) == scales[+config.automatic].range()[scales[+config.automatic].range().length-1] || scales[+config.automatic](+d.value) == scales[+config.automatic].range()[scales[+config.automatic].range().length-2]) {
                      return "white"
                    }
                  }
                })
                .text((d)=>{
                  if (config.color_palette == 'diverging' && d.value) {
                    console.log("text value", +d.value)
                    return formatMap[config.metric_format](+d.value)
                  } else if (d.value > 1000000) {
                    return Math.round(d.value/100000)/10 + "M" }
                    else if (d.value > 1000) {
                    return Math.round(d.value/100)/10 + "K" } else {
                      return d.value
                    }
                  }) 
         }
        }

        // const histogram = d3.histogram()
        //   .value(function(d) { 
        //     return +d.value; })
        //   .domain(d3.extent(data, (d)=>{
        //               return d.value
        //             }))
        //   .thresholds(config.number_quantiles);

        const qRange = qScale.range()
        const qDomain = qRange.map((entry) =>{
          return qScale.invertExtent(entry)
        })

        let legendGroupData;
        if (config.automatic == "0") {
          legendGroupData = qDomain
        } else {
          legendGroupData = tScaleDomain
        }

        const leftLabel = svg.append("text")
            .attr('y', (margin.left - margin.right)/-1)
            .attr('x', height/-2)
            .attr('text-anchor', 'middle')
            .attr('transform','rotate(-90)')
            .style('font-size', 14)
            .style('font-weight', 700)
 

        const bottomLabel = svg.append("text")
            .attr('y', height + margin.top)
            .attr('x', width / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', 14)
            .style('font-weight', 700)

        if (config.transpose == false) {
          leftLabel
              .text(pivots[0].label_short);
          
          bottomLabel
              .text(dimensions[0].label_short);
        } else {
          bottomLabel
              .text(pivots[0].label_short);
          
          leftLabel
              .text(dimensions[0].label_short);
        }

        if (config.axis_label_bottom.length > 0) {
            bottomLabel
              .text(config.axis_label_bottom);
        }

        if (config.axis_label_left.length > 0) {
            leftLabel
              .text(config.axis_label_left);
        }

        if (config.label_bottom.length > 0) {
          var yOffset = height + margin.top + (+config.label_bottom)
          bottomLabel.attr('y', yOffset)
        }

        if (config.label_left.length > 0) {
          var xOffset = ( margin.left + (-1*margin.right) + (+config.label_left) ) * -1
          leftLabel.attr('y', xOffset)
        }

        if (config.color_palette != 'diverging') {
          const legendContainer = svg.append("g")
            .attr("class", "legendContainer")
            .attr("transform", "translate(30, -30)");

          const legendGroup = legendContainer.selectAll('.leg-group')
            .data(legendGroupData)
            .enter()
              .append('g')
              .attr('class', 'leg-group')
              .attr('transform', (d,i)=> {
                return 'translate(' + 38 + ',' + -14 + ')'
              })

          const legendPrefix = legendContainer
            .append('text')
            .attr('dy', 14)
            .attr('dx', -28)
            .attr('text-anchor', 'start')
            .attr('font-size', 12)
            .text("Bin values: ");

          const legendCircle = legendGroup
            .append('rect')
            .attr('y', 20)
            .attr('x', (d,i)=>{
              return legendScale(i)})
            .attr('height', 10)
            .attr('width', legendScale.bandwidth())
            .attr('fill', (d,i)=>{
                return scales[+config.automatic].range()[i]
              })

          const legendText = legendGroup
            .append('text')
            .attr('x', (d,i)=>{
              return legendScale(i) + legendScale.bandwidth()})
            .attr('y', 0)
            .attr('dy', 14)
            .attr('dx', 0)
            .attr('text-anchor', 'end')
            .attr('font-size', ()=>{
              if ($("svg").width() < 380) {
                return 8
              } else if (legendGroupData.length == 4 && $("svg").width() > 550) {
                return 16
              } else if (legendGroupData.length == 5) {
                return 14
              } else if (legendGroupData.length >= 7 || $("svg").width() < 550) {
                return 10
              } else if (legendGroupData.length == 6) {
                return 12
              } 
            })
            .text(function(d,i) {
              let sep;
              if (legendGroupData.length >= 7) {
                sep = "–"
              } else {
                sep = " – "
              }
              if (config.automatic == "1" || config.automatic == "2") {
                if (i == 0) {
                  if (extent[0] > legendGroupData[i]) {
                    if (legendGroupData[i] < 1000000) {
                      return "0" + sep + Math.round(legendGroupData[i])
                    } else {
                      return "0" + sep + Math.round(legendGroupData[i]/1000000,2) + "M"
                    }
                  } else {
                    if (legendGroupData[i] < 1000000) {
                      return extent[0] + sep + Math.round(legendGroupData[i])
                    } else {
                      if (extent[0] < 1000000) {
                        return extent[0] + sep + Math.round(legendGroupData[i]/1000000,2) + "M"
                      } else {
                        return Math.round(extent[0],2) + "M" + sep + Math.round(legendGroupData[i]/1000000,2) + "M"
                      }
                    }
                  }
                } else {
                  if (legendGroupData[i] < 1000000) {
                      return Math.round(legendGroupData[i-1]) + sep + Math.round(legendGroupData[i])
                  } else {
                    if (legendGroupData[i-1] < 1000000) {
                      return Math.round(legendGroupData[i-1]) + sep + Math.round(legendGroupData[i]/1000000,2) + "M"
                    } else {
                      return Math.round(legendGroupData[i-1]/1000000,2) + "M" + sep + Math.round(legendGroupData[i]/1000000,2) + "M" 
                    }
                  }
                }
              } else {
                if (d[1] >= 1000000) {
                  if (d[0] >= 1000000) {
                    if (i == 0) {
                      return (extent[0]/1000000,2) + "M" + sep + Math.round(d[1]/1000000,2) + "M"
                    } else {
                      return Math.round(d[0]/1000000,2) + "M" + sep + Math.round(d[1]/1000000,2) + "M"
                    }
                  } else {
                    if (i == 0) {
                      return extent[0] + sep + Math.round(d[1]/1000000,2) + "M"
                    } else {
                      return Math.round(d[0]) + sep + Math.round(d[1]/1000000,2) + "M"
                    }
                  }
                } else {
                  if (i == 0) {
                      return extent[0] + sep + Math.round(d[1])
                    } else {
                      return Math.round(d[0]) + sep + Math.round(d[1])
                    }
                }
              }
            });
        } else if (config.color_palette == 'diverging') {
          const legendContainer = svg.append("g")
            .attr("class", "legendContainer")
            .attr("transform", "translate(30, -30)");

            const defs = svg.append("defs")
            let linearGradient = defs.append("linearGradient")
              .attr("id", "linear-gradient")
              .attr("x1", "0%")
              .attr("y1", "0%")
              .attr("x2", "100%")
              .attr("y2", "0%")

            const midpoint = +config.mid_breakpoint * 100

            console.log("extent", extent)

            let normalizedMidpoint = ((+config.mid_breakpoint - extent[0]) / (extent[1] - extent[0]));

            linearGradient.selectAll("stop")
              .data([
                {offset: `0%`, color: colors[0]},
                {offset: `${d3.format(".0%")(normalizedMidpoint)}`, color: colors[1]},
                {offset: `100%`, color: colors[2]}
              ])
              .enter().append("stop")
              .attr("offset", function(d) { return d.offset })
              .attr("stop-color", function(d) { return d.color })

            legendContainer.append("rect")
              .attr("width", width - 35)
              .attr('height', 20)
              .style("fill", "url(#linear-gradient)")

            const legendTicks = d3.scaleLinear()
              // .domain([0, 1])
              .domain([extent[0], extent[1]])
              .range([0, width - 35])

            const legendAxis = d3.axisTop(legendTicks)
              .tickValues(divergingPaletteTwo.domain())
              // .tickFormat(d3.format(".0%"))
              .tickFormat(formatMap[config.metric_format])
              .tickSize(0)

            legendContainer
              .attr("class", "axis")
              .append("g")
                .attr("class", "legend-labels")
                .call(legendAxis)

            d3.select(".legend-labels path")
              .attr("opacity", 0)
        }

          
        
          
      } catch(error) {
        console.log(error)
      }
  }
}
})