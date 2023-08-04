import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { isCallLikeExpression } from 'typescript';
import { formatType, handleErrors } from '../common/utils'

export const object = {
    // Id and Label are legacy properties that no longer have any function besides documenting
    // what the visualization used to have. The properties are now set via the manifest
    // form within the admin/visualizations page of Looker.

    id: "bar_race",
    label: "ZDev Bar Race",
    options: {
        x_label: {
            type: "string",
            label: "X Axis Label",
            display: "text",
            default: "",
            section: "Axes",
            order: 1
        },
        x_format: {
            type: "string",
            label: "X Value Format",
            display: "text",
            default: ",.0f",
            section: "Axes",
            order: 2
        },   
        x_ticklabel_size: {
            type: "string",
            label: "X-Tick Font Size",
            display: "text",
            default: "12",
            section: "Axes",
            order: 3
        },
        show_ylabel: {
            type: "boolean",
            label: "Show Y Axis Label",
            default: "false",
            section: "Axes",
            order: 4
        },
        y_label: {
            type: "string",
            label: "Y Axis Label",
            display: "text",
            default: "",
            section: "Axes",
            order: 5
        },  
        axes_label_size: {
            type: "string",
            label: "X/Y Axis Label Size",
            display: "text",
            default: "12",
            section: "Axes",
            order: 6
        },
        bar_number: {
            type: "string",
            label: "# Bars Show",
            display: "text",
            default: "10",
            section: "Setup",
            order: 1
        },
        duration: {
            type: "string",
            label: "Transition Duration",
            display: "text",
            default: "250",
            section: "Setup",
            order: 2
        },
        interpolations: {
            type: "string",
            label: "# Interpolations Between Each Period",
            display: "text",
            default: "10",
            section: "Setup",
            order: 3
        },
        label_size: {
            type: "string",
            label: "Bar Label Font Size",
            display: "text",
            default: "12",
            section: "Setup",
            order: 4
        }
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
              .axis-label {
                fill: #3a4245;
                // font-size: 12px;
                font-family: 'Open Sans', 'Helvetica', 'sans-serif';
                text-anchor: middle;
              }
  
              .y-axis, .x-axis {
                font-family: 'Open Sans', 'Helvetica', 'sans-serif';
              }
  
              .zero-line {
                stroke: #ccd6eb;
                stroke-width: 1.0;
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
  
              .inner-x-axis text {
                font-size: 9px;
                color: #3a4245;
                visibility: visible;
              }
  
              .x-axis text .hide, .y-axis text .hide {
                visibility: hidden;
              }
  
              .x-axis line, .y-axis line {
                stroke: #f0f0f0;
                stroke-width: 1;
                opacity: 1;
              }
  
              .x-axis line .hide, .y-axis line .hide {
                opacity: 0;
              }
              .label {
                font-size: 12px;
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

    try {

        const margin = {top: 25, right: 6, bottom: 80, left: 20};
        const width = element.clientWidth - margin.left - margin.right;
        let height = element.clientHeight - margin.top - margin.bottom;
    
        d3.json('./dataBarRace.json').then(function(dat) { 
            // setup
            const svg = (
                d3.select(element).select('svg')
                    .html('')
                    .attr('width', '100%')
                    .attr('height', '100%')
            )
    
            const group = svg.append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`)
                .attr('width', '100%')
                .attr('height', '100%')
                .classed('group', true)
                // .style('pointer-events', 'all')

            const mdata = dat.data.slice(0, 98)
            const queryResponse = dat.queryResponse

            const dimensions = queryResponse.fields.dimension_like
            const measures = queryResponse.fields.measure_like
            const pivots = queryResponse.fields.pivots

            console.log("dimensions", dimensions)
            console.log("measures", measures)
            console.log("pivots", pivots)
            console.log("data initial", mdata)

            const parseTime = d3.timeParse("%Y")

            let data_ready = []
            mdata.forEach((d) => {
                let entry = {}
                entry['name'] = d[dimensions[0].name].value
                entry['cat'] = d[dimensions[1].name].value
                entry['value'] = d[measures[0].name]
                data_ready.push(entry)
            })

            let data_final = []
            data_ready.forEach(d => {
                const dateKeys = Object.keys(d['value'])
                dateKeys.forEach(t => {
                    let entry = {}
                    entry['name'] = d.name
                    entry['cat'] = d.cat
                    entry['date'] = t //parseTime(t)
                    entry['value'] = d['value'][t].value
                    data_final.push(entry)
                })
            })

            console.log("data_ready", data_ready)
            console.log("data_final", data_final)

            const names = new Set(data_final.map(d => d.name))
            const dates = new Set(data_final.map(d => d.date))
            const cats = new Set(data_final.map(d => d.cat))

            console.log("names", names)
            console.log("dates", dates)
            console.log("cats", cats)

            // Create a nested structure with d3.nest()
            var nest = d3.nest()
                .key(function(d) { return d.date; })
                .key(function(d) { return d.name; })
                .rollup(function(v) { return v[0].value; })
                .entries(data_final);

            // Map each nested entry to a Date and a Map of names/values
            const datevalues = nest.map(function(d) {
            var nameValueMap = new Map();
                d.values.forEach(function(e) {
                    nameValueMap.set(e.key, e.value);
                });
                return [new Date(d.key), nameValueMap];
            })
            .sort(function(a, b) { return d3.ascending(a[0], b[0]); });

            console.log('datevalues', datevalues)

            const duration = config.duration ? Number(config.duration) : 250;
            const n = config.bar_number ? Number(config.bar_number) : 10;;
            const k = config.interpolations ? Number(config.interpolations) : 10;

            function rank(value) {
                const data = Array.from(names, name => {
                    const cat = data_final.find(x => x.name === name)
                    return ({name, value: value(name), category: cat['cat']})
                });
                data.sort((a, b) => d3.descending(a.value, b.value));
                for (let i = 0; i < data.length; ++i) data[i].rank = Math.min(n, i);
                return data;
              }

            const test = rank(name => datevalues[0][1].get(name))
            console.log("test rank", test)

            const keyframes = function() {
                const keyframes = [];
                let ka, a, kb, b;
              
                for (let i = 0; i < datevalues.length - 1; i++) {
                  [ka, a] = datevalues[i];
                  [kb, b] = datevalues[i + 1];
              
                  for (let j = 0; j < k; ++j) {
                    const t = j / k;
                    keyframes.push([
                      new Date(ka * (1 - t) + kb * t),
                      rank(name => (a.get(name) || 0) * (1 - t) + (b.get(name) || 0) * t)
                    ]);
                  }
                }
                
                [kb, b] = datevalues[datevalues.length - 1];
                keyframes.push([new Date(kb), rank(name => b.get(name) || 0)]);
              
                return keyframes;
            }();

            console.log("keyframes", keyframes)

            // Step 1: Use Array.map and Array.concat.apply to achieve the functionality of flatMap
            const flattenedData = Array.prototype.concat.apply([], keyframes.map((keyframe) => keyframe[1]));

            // Step 2: Use d3.nest to group by name
            const nameframes = d3.nest()
                .key(function(d) { return d.name; })
                .entries(flattenedData);

            console.log("nameframes", nameframes)

            function flatten(array) {
                return [].concat.apply([], array);
            }
            
            function pairs(array, callback = (a, b) => [a, b]) {
                let result = [];
                for (let i = 0; i < array.length - 1; i++) {
                    result.push(callback(array[i], array[i + 1]));
                }
                return result;
            }
            
            const prev = new Map(flatten(nameframes.map(nameframe => pairs(nameframe.values, (a, b) => [b, a]))));
            const next = new Map(flatten(nameframes.map(nameframe => pairs(nameframe.values))));      

            console.log("prev", prev)
            console.log("next", next)

            // DEFINE GROUPS
            const barGroup = group.append('g').attr('class', 'bar-group')

            const labelGroup = group.append('g').attr('class', 'label-group').attr("clip-path", "url(#clip)")

            const axisGroup = group.append('g').attr('class', 'axis-group')
            const xAxisLabel = axisGroup.append("text")
                .attr("class", "axis-label")
                .attr("x", width / 2)
                .attr("y", margin.top - 25)
                .attr("font-size", config.axes_label_size ? `${config.axes_label_size}px` : `12px`)
                .text(config.x_label ? config.x_label : measures[0].label_short)
            if (config.show_ylabel == "true") {
                const yAxisLabel = axisGroup.append("text")
                    .attr("class", "axis-label")
                    .attr("x", (-height / 2))
                    .attr("y", -margin.left + 20)
                    .style("transform", "rotate(-90deg)")
                    .attr("text-anchor", "middle")
                    .attr("font-size", config.axes_label_size ? `${config.axes_label_size}px` : `12px`)
                    .text(config.y_label ? config.y_label : dimensions[0].label_short)
            }

            const tickerGroup = group.append('g').attr('class', 'ticker-group')
            let tick = tickerGroup.append("text")

            let isAnimationCompleted = false

            svg.append("defs").append("clipPath")
                .attr("id", "clip")
                .append("rect")
                .attr("x", margin.left)
                .attr("y", 0)
                .attr("width", width - margin.left)
                .attr("height", height + margin.top);

                    
            function bars(group) {
                let bar = group.selectAll(".bars");
            
                return ([date, data], transition) => {
                    bar = bar.data(data.slice(0, n), d => d.name);
            
                    bar.exit().remove();
            
                    bar = bar.enter().append("rect")
                        .attr("class", "bars")
                        .attr("fill", d => {
                            return colorScale(d.category)
                        })
                        .attr("fill-opacity", .80)
                        .attr("height", y.bandwidth())
                        .attr("x", x(0))
                        .attr("y", d => y((prev.get(d) || d).rank))
                        .attr("width", d => x((prev.get(d) || d).value) - x(0))
                        .merge(bar);
            
                    bar.transition(transition)
                        .attr("y", d => y(d.rank))
                        .attr("width", d => x(d.value) - x(0));
                }
            }

            function labels(group) {
                let labelName = group.selectAll(".labelName")
                    .style("font-variant-numeric", "tabular-nums")
                let labelValue = group.selectAll(".labelValue")
                    .style("font-variant-numeric", "tabular-nums")
            
                return ([date, data], transition) => {
                    labelName = labelName.data(data.slice(0, n), d => d.name);
                    labelValue = labelValue.data(data.slice(0, n), d => d.name);
            
                    labelName.exit().remove();
                    labelValue.exit().remove();
            
                    labelName = labelName.enter().append("text")
                        .attr("class", "labelName")
                        .attr("text-anchor", "end")
                        .attr("transform", d => `translate(${x((prev.get(d) || d).value)},${y((prev.get(d) || d).rank)})`)
                        .attr("y", y.bandwidth() / 2)
                        .attr("x", -6)
                        .attr("dy", "-0.25em")
                        .attr("font-size", config.label_size ? Number(config.label_size) : 10)
                        .style("font-weight", "bold")
                        .style("fill", "black")
                        .text(d => d.name)
                        .merge(labelName);
            
                    labelValue = labelValue.enter().append("text")
                        .attr("class", "labelValue")
                        .attr("text-anchor", "end")
                        .attr("transform", d => `translate(${x((prev.get(d) || d).value)},${y((prev.get(d) || d).rank)})`)
                        .attr("y", y.bandwidth() / 2)
                        .attr("x", -6)
                        .attr("dy", "1.0em")
                        .attr("font-size", config.label_size ? Number(config.label_size) : 10)
                        .style("font-weight", "normal")
                        .style("fill", "#262626")
                        .text(d => formatNumber((prev.get(d) || d).value))
                        .merge(labelValue);
            
                    labelName.transition(transition)
                        .attr("transform", d => `translate(${x(d.value)},${y(d.rank)})`);
            
                    labelValue.transition(transition)
                        .attr("transform", d => `translate(${x(d.value)},${y(d.rank)})`)
                        .tween("text", function(d) {
                            const that = d3.select(this)
                            const i = d3.interpolateNumber((prev.get(d) || d).value, d.value)
                            return function(t) {
                                that.text(formatNumber(i(t)))
                            }
                        });
                }
            }

            const formatNumber = d3.format(config.x_format)
            const formatDate = d3.utcFormat("%Y")

            function ticker(group) {
                tick
                    .attr("class", "tickval")
                    .style("font-weight", "bold")
                    .style("font-size", "20px")
                    .style("font-variant-numeric", "tabular-nums")
                    .attr("text-anchor", "end")
                    .attr("x", width - 6)
                    .attr("y", margin.top + barSize * (n - 0.45))
                    .attr("dy", "0.32em")
                    .text(formatDate(keyframes[0][0]))

                return ([date, data], transition) => {
                    tick.transition(transition)
                        .text(formatDate(date))
                }
            }

            function axis(svg) {
                let g = svg.selectAll(".axis")
                    .data([null]);
            
                // Enter
                g = g.enter().append("g").attr("class", "axis")
                    .merge(g)
                    .attr("transform", `translate(0,${margin.top})`);
            
                const axis = d3.axisTop(x)
                    .ticks(width / 160)
                    .tickSizeOuter(0)
                    .tickSizeInner(-barSize * (n + y.padding()))
                    .tickFormat(d => d3.format(config.x_format)(d))
            
                return (_, transition) => {
                    g = transition.select(".axis");
            
                    // Remove old ticks before new ones are added
                    if (!isAnimationCompleted) {
                        g.selectAll("*").remove();
                    }
            
                    g.call(axis)
                        .selectAll("text")
                        .style("font-size", config.x_ticklabel_size ? `${config.x_ticklabel_size}px` : '12px');
            
                    g.select("path")
                        .attr("opacity", 0)

                    // g.select(".tick:first-of-type text").remove();
                    g.selectAll(".tick:not(:first-of-type) line").attr("stroke", "white");
                    g.select(".domain").remove();
                };
            }            

            // INSERT COLOR STUFF HERE

            // AXES
            const x = d3.scaleLinear([0, 1], [margin.left, width - margin.right])

            const barSize = height/n

            const y = d3.scaleBand()
                .domain(d3.range(n + 1))
                .rangeRound([margin.top, margin.top + barSize * (n + 1 + 0.1)])
                .padding(0.1)

            console.log("original y bandwidth", y.bandwidth())

            const colorScale = d3.scaleOrdinal()
                .domain(cats)
                .range(d3.schemeSet3)

            height = margin.top + barSize * n + margin.bottom

            // BUILD CHART
            var chart = function(i) { 
                if(i >= keyframes.length) return; // stop recursion when all keyframes have been shown
              
                var keyframe = keyframes[i];
                // console.log("chart keyframe", keyframe)
              
                var transition = group.transition()
                  .duration(duration)
                  .ease(d3.easeLinear);
              
                // Extract the top bar’s value.
                x.domain([0, keyframe[1][0].value]);
              
                var updateBars = bars(barGroup);
                var updateAxis = axis(axisGroup);
                var updateLabels = labels(labelGroup);
                var updateTicker = ticker(tickerGroup);
              
                updateBars(keyframe, transition);
                updateAxis(keyframe, transition);
                updateLabels(keyframe, transition);
                updateTicker(keyframe, transition);
              
                transition.on('end', function() {
                  isAnimationCompleted = true
                  chart(i + 1); // call the next keyframe when the transition ends
                });
              }
              
              chart(0);  // start the chart with the first keyframe
              
        
            // legend
            const legend = group.append('g')
                .attr("transform", `translate(${margin.left}, ${height - margin.top - margin.bottom/2})`)
                .classed("legendContainer", true)

            let catSort = Array.from(cats)
            catSort.sort()

            catSort.forEach((d, i) => {
                console.log("i", i, d)
                let curr = legend.append('g')
                    .classed('legend', true)
                    .attr('transform', `translate(${100 * i}, 0)`)

                curr.append("rect")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", 20)
                    .attr("height", 20)
                    .attr("fill", colorScale(d))

                curr.append("text")
                    .attr("x", 25)
                    .attr("y", 12)
                    .style("text-anchor", "start")
                    .style("dominant-baseline", "middle")
                    .style("font-size", 12)
                    .text(`${d}`)
                
            })
        })
        
    } catch(error) {
        console.log(error)
    }
    done()
    // }
    }   
}