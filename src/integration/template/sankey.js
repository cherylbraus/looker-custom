import * as d3 from 'd3'
import * as d3sank from 'd3-sankey'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'
import { line, selectAll } from 'd3'
import { stripComments } from 'tslint/lib/utils'
import { textSpanContainsPosition } from 'typescript'

export const object = {
    id: "sankey-new",
    label: "Sankey New",
    options: {
        flowmap: {
            section: "Setup",
            order: 1,
            type: "string",
            display: "text",
            label: "Flow Mapping",
            placeholder: "see docs",
            default: "0:[5 6], 5:[7 1], 7:[2 3]"
            // default: ["0:[1]", "1:[6 2]", "6:[3 4]"]
        },
        nodenames: {
            section: "Setup",
            order: 2,
            type: "string",
            display: "text",
            label: "Node Renames",
            placeholder: "see docs",
            default: "0:Awarded to Date, 1:Rejected, 2:Cancelled, 3:Covered, 5:Tendered, 7:Accepted"
        },
        currency: {
            type: "boolean",
            label: "Values are USD",
            default: "false",
            section: "Setup",
            order: 3
        }
    },

    create: function(element, config) {
        this.trigger("updateConfig", [{directionality: "true", display_values:"true",freeze_header:"true"}])
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
                    font-family: Roboto;
                    font-size: 12px;
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
                </style>`;
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
            const dimensions = queryResponse.fields.dimension_like;
            const measures = queryResponse.fields.measure_like;

            console.log("queryResponse", queryResponse)
            console.log("dimensions", dimensions)
            console.log("measures", measures)
            console.log("data", data)

            const margin = {
                top: 25,
                bottom: 35,
                left: 2, 
                right: 8
            }

            const width = element.clientWidth - margin.left - margin.right;
            const height = element.clientHeight - margin.top - margin.bottom;

            // const flowmap = config.flowmap
            // const renames = config.nodenames

            // SORT DATA
            data.sort(function(a, b) {
                return (a[dimensions[0].name].value > b[dimensions[0].name].value) ? 1 : ((b[dimensions[0].name].value > a[dimensions[0].name].value) ? -1 : 0)
            })

            console.log("data sorted", data)

            // -----------------------------------------------------------------------------------
            // INCLUDE TOTAL ROW IF ONE EXISTS
            if (queryResponse.has_totals && data[data.length-1][dimensions[0].name]["value"] != "All") {
                let totalObj = queryResponse.totals_data
                if (!Object.keys(totalObj).includes(dimensions[0].name)) {
                    totalObj[dimensions[0].name] = {"value": "All"}
                } 
                console.log("totalObj", totalObj)
                data.unshift(totalObj)
            }

            console.log("new data", data)

            // -----------------------------------------------------------------------------------
            // ONLY LOOK AT ONE ROW FOR DEVELOPMENT PURPOSES
            // const data_sank = data[data.length-1]

            // -----------------------------------------------------------------------------------
            // POPULATE DROPDOWN
            const dropdownTitle = $(`.dropdown-title`);
            dropdownTitle.text(`${dimensions[0].label}: `)

            const listDropdown = $(`#vis-options`);
            listDropdown.empty()



            data.forEach((entry, i) => {
                if (i == 0) {
                    listDropdown.append($(`<option></option>`).attr(`value`, entry[dimensions[0].name].value).text(entry[dimensions[0].name].value).attr("selected","selected"))
                } else {
                    listDropdown.append($(`<option></option>`).attr(`value`, entry[dimensions[0].name].value).text(entry[dimensions[0].name].value))
                }
            })

            listDropdown.on("change", function() {
                redraw()
            })

            console.log("outside flowmap", config.flowmap)

            function redraw() {
                // -----------------------------------------------------------------------------------
                // FILTER DATA BASED ON DROPDOWN SELECTION
                const entity = $(`#vis-options option:selected`).val()
                console.log("ENTITY SELECTED", entity)

                let data_sank = data.filter(d => {
                    return (d[dimensions[0].name].value == entity)
                })[0]

                console.log("data_sank", data_sank)

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
    
                // SET GLOBAL VARIABLES
                let NUMFORMAT;
    
                if (config.currency == "true") {
                    NUMFORMAT = "$,.0f"
                } else {
                    NUMFORMAT = ",.0f"
                }

                // -----------------------------------------------------------------------------------
                // RECONFIGURE DATA FOR SANKEY
                let sank_map = {"nodes":[], "links":[]}
                let node_name_map = {}
                let measures_used = []

                // pick apart config.flowmap
                console.log("flowmap", config.flowmap)
                console.log("flowmap", config.flowmap.split(",")) // ERRORING
                config.flowmap.split(",").forEach((d, i) => {
                    let source = parseInt(d.split(":")[0])
                    measures_used.push(source)

                    d.split("[")[1].split("]")[0].split(" ").forEach((d, i) => {
                        console.log("measure", measures[parseInt(d)], data_sank[measures[parseInt(d)].name])
                        console.log("sank_map: value", data_sank[measures[parseInt(d)].name].value)
                        sank_map["links"].push({"source": source, "target": parseInt(d), "value": data_sank[measures[parseInt(d)].name].value})
                        measures_used.push(parseInt(d))
                    })
                })

                measures_used = [...new Set(measures_used)]
                console.log("measures_used no-dups", measures_used) 

                // make sure any measures not used in sankey are hidden before importing data
                measures.forEach((d, i) => {
                    if (measures_used.includes(i)) {
                        if (d.label_short) {
                            sank_map["nodes"].push({"id": i, "name": d.label_short})
                        } else {
                            sank_map["nodes"].push({"id": i, "name": d.label})
                        }
                    }                 
                })

                // pick apart config.nodenames
                console.log("nodeRenames", config.nodenames.split(","))
                config.nodenames.split(",").forEach((d, i) => {
                    node_name_map[String(parseInt(d.split(":")[0]))] = d.split(":")[1]
                })

                console.log("data_sank", data_sank)
                console.log("sank_map", sank_map)
                console.log("node_name_map", node_name_map)

                // // -----------------------------------------------------------------------------------
                // // SETUP THE TOOLTIP
                // let tooltip = d3.select(".tooltip")
                //     .style("opacity", 0)
                //     .style("background-color", "white")
                //     .style("border-radius", "4px")
                //     .style("padding", "5px")
                //     .style("position", "absolute")
                //     .style("display", "block")
                //     .style("border", "solid")
                //     .style("border-color", "lightgrey")
                //     .style("border-width", ".5px")

                // tooltip.html('<div id="tt-header"></div><p id="tt-body"></p>')
                // const tooltipHeader = tooltip.select("#tt-header")
                // const tooltipBody = tooltip.select("#tt-body")

                // -----------------------------------------------------------------------------------
                // SETUP SANKEY
                const sankey = d3sank.sankey()
                    .nodeId(d => d.id)
                    .nodeWidth(20)
                    .nodePadding(50)
                    .size([width, height])
                    .nodeAlign(d3sank.sankeyCenter)

                let sank_map2 = Object.assign({}, sank_map)

                let graph = sankey(sank_map2)

                console.log("defined sankey")
                console.log("graph.links", graph.links)
                console.log("graph.nodes", graph.nodes)

                // -----------------------------------------------------------------------------------
                // Interactions
                function walkLinks({ obj = srclinks, action = "over" } = {}) {
                    if (obj.length > 0) {
                        obj.forEach((a, i) => {
                            if (action === "over") {
                                d3.select(`.link.ind${String(a["index"])}`)
                                    .attr("stroke-opacity", 0.8)
                                    .attr("stroke", "#a8bbc3")
                            } else {
                                d3.select(`.link.ind${String(a["index"])}`)
                                    .attr("stroke-opacity", 0.4)
                                    .attr("stroke", "#afafaf")
                            }
                            walkLinks({obj: a.target.sourceLinks, action: action})
                        })
                    }
                }

                function nodeHighlightLinks(d) {
                    console.log("node highlight links d", d)

                    walkLinks({obj: d.sourceLinks, action: "over"})

                    d3.select(`.node.id${String(d.id)}`)
                        .attr("fill", "#27566b")
                        .attr("opacity", 1.0)
                } 

                function nodeUnHighlightLinks(d) {
                    walkLinks({obj: d.sourceLinks, action: "out"})

                    d3.select(`.node.id${String(d.id)}`)
                        .attr("fill", "#27566b")
                        .attr("opacity", 0.7)
                }

                // -----------------------------------------------------------------------------------
                // TEXT WRAPPING - NOT WORKING
                // function wrap(text, width, x, y) {
                //     console.log("in wrap function")
                //     text.each(function() {
                //         let text = d3.select(this),
                //             words = text.text().split(/\s+/).reverse(),
                //             word,
                //             line = [],
                //             lineHeight = 1.1, // ems
                //             dy = parseFloat(0),
                //             tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
                //             console.log('pre-tspan', tspan)
                //       while (word = words.pop()) {
                //             console.log("preline & word", line, word)
                //             line.push(word);
                //             console.log("newline", line)
                //             tspan.text(line.join(" "));
                //             console.log("new tspan", tspan)
                //             console.log("tspan length", tspan.node().getComputedTextLength())
                //             if (tspan.node().getComputedTextLength() > width) {
                //                 console.log("too wide")
                //                 line.pop();
                //                 tspan.text(line.join(" "));
                //                 console.log("wide tspan", tspan)
                //                 line = [word];
                //                 tspan = text.append("tspan").attr("dx", -x).attr("y", y).attr("dy", lineHeight + dy + "em").text(word);
                //                 console.log("new line tspan", tspan)
                //             }
                //         }
                //     });
                //   }

                // -----------------------------------------------------------------------------------
                // DRAW SANKEY
                let links = group.append('g')
                    .attr("class", "links")
                    .selectAll("path")
                    .data(graph.links)
                    .enter()
                    .append("path")
                        .attr("class", d => `link ind${d.index}`)
                        .attr("d", d3sank.sankeyLinkHorizontal())
                        .attr("fill", "none")
                        .attr("stroke", "#afafaf")
                        .attr("stroke-width", d => d.width)
                        .attr("stroke-opacity", 0.4)
                        .on("mouseover", function() {
                            d3.select(this)
                                .attr("stroke-opacity", 0.9)
                        })
                        .on("mouseout", function() {
                            d3.select(this)
                                .attr("stroke-opacity", 0.4)
                        })

                let nodes = group.append('g')
                    .attr("class", "nodes")
                    .selectAll("rect")
                    .data(graph.nodes)
                    .enter()
                    .append("rect")
                        .attr("class", d => `node id${d.id}`)
                        .attr("x", d => d.x0)
                        .attr("y", d => d.y0)
                        .attr("width", d => d.x1 - d.x0)
                        .attr("height", d => d.y1 - d.y0)
                        .attr("fill", "#27566b")
                        .attr("opacity", 0.7)
                        .on("mouseover", d => nodeHighlightLinks(d))
                        .on("mouseout", d => nodeUnHighlightLinks(d))

                let labels = group.append('g')
                    .attr("class", "node-labels")
                    .selectAll("text")
                    .data(graph.nodes)
                    .enter()
                    .append("text")
                        .attr("class", "node-label")
                        .attr("x", d => { return d.x0 - 2 })
                        .attr("y", d => d.y0 + ((d.y1 - d.y0) / 2))
                        .attr("font-size", "11px")
                        .attr("text-anchor", "end")
                        .attr("dominant-baseline", "middle")
                        .attr("transform", null)
                        .text(d => {
                            if (Object.keys(node_name_map).includes(String(d.id))) {
                                return node_name_map[String(d.id)]
                            } else {
                                return d.name
                            }
                        })
                        .filter(d => d.x0 < width / 2)
                            .attr("x", d => d.x1 + 2)
                            .attr("text-anchor", "start")

                let labelValues = group.append('g')
                    .attr("class", "node-labels")
                    .selectAll("text")
                    .data(graph.nodes)
                    .enter()
                    .append("text")
                        .attr("class", "node-label value")
                        .attr("x", d => { return d.x0 - 2 })
                        .attr("y", d => d.y0 + ((d.y1 - d.y0) / 2))
                        .attr("dy", 1.1 + "em")
                        .attr("font-size", "10px")
                        .attr("text-anchor", "end")
                        .attr("dominant-baseline", "middle")
                        .attr("transform", null)
                        .text(d => `(${d3.format(NUMFORMAT)(d.value)})`)
                        .filter(d => d.x0 < width / 2)
                            .attr("x", d => d.x1 + 2)
                            .attr("text-anchor", "start")
            }
            
            redraw()

        } catch(error) {
            console.log(error)
        }
        done()
    },
}

            