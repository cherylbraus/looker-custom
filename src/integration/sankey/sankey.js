import * as d3 from 'd3'
import * as d3sank from 'd3-sankey'
import { formatType, handleErrors } from '../common/utils'
import * as $ from 'jquery'

looker.plugins.visualizations.add({
    id: "sankey-new",
    label: "ZDev Sankey New",
    options: {
        flowmap: {
            section: "Setup",
            order: 1,
            type: "string",
            display: "text",
            label: "Flow Mapping",
            placeholder: "0:[1 2], 1:[3 4] (see docs)",
            default: "0:[1]"
        },
        nodenames: {
            section: "Setup",
            order: 2,
            type: "string",
            display: "text",
            label: "Node Renames",
            placeholder: "0:Rename0, 1:Rename1 (see docs)",
            default: ""
        },
        currency: {
            type: "boolean",
            label: "Values are USD",
            default: false,
            section: "Setup",
            order: 3
        }
    },

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
                    font-family: Roboto;
                    font-size: 12px;
                }
                text {
                    font-family: 'Roboto';
                }
                .domain {
                    display: none;
                }
                .gridline {
                    stroke: rgb(230, 230, 230);
                    shape-rendering: crispEdges;
                    stroke-opacity: .1;
                }
                .gridline2 {
                    stroke: white;
                    shape-rendering: crispEdges;
                    stroke-opacity: 1;
                }
                #viz-container {
                    z-index: 9;
                    position: relative;
                    background-color: none;
                    border: 1px solid #d3d3d3;
                    text-align: center;
                    // width: 600px;
                    // height: 360px;
                }
                #dimension-header {
                    font-size: 12px;
                }
                .value-headers {
                    font-size: 12px;
                }
                .value-headers-body {
                    font-weight: 500;
                }
                #vis {
                    font-family: 'Open Sans', 'Helvetica', 'sans-serif';
                    cursor: move;
                    z-index: 10;
                    background-color: none;
                    color: #fff;
                    // height: 100%;
                    // width: 100%;
                    fill: black;
                    color: black;
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
                #menu-options p {
                    font-weight: 500;
                }
                #vis-options-container {
                  display: flex;
                  margin: 12px 8px, 4px;
                }
                #vis-options-container p {
                  font-size: 14px;
                  margin: 0 4px 0 0;
                }
                .backdrop {
                  opacity: .5;
                }
                .tooltip {
                    box-shadow: rgb(60 64 67 / 30%) 0px 1px 2px 0px, rgb(60 64 67 / 15%) 0px 2px 6px 2px;
                    font-size: 12px;
                    pointer-events: none;
                }

                .tooltip #tt-header {
                    font-size: 12px;
                    font-weight: 600;
                    color: #afafaf;
                    text-transform: uppercase;
                }

                .tooltip h1 {
                    font-size: 11px;
                    color: #afafaf;
                    text-transform: uppercase;
                }
                hr { 
                    margin-top: 1px; 
                    margin-bottom: 1px 
                }

                #tt-body {
                    margin-top: 5px;
                }
                </style>
                <div id="vis-options-container"><p class="dropdown-title"></p>
                    <select name="vis-options" id="vis-options"></select>
                </div>
                <svg></svg>
                <div class="tooltip"></div>`;
        element.style.fontFamily = `Roboto,"Open Sans", "Helvetica", sans-serif`
    },

    updateAsync: function(data, element, config, queryResponse, details, done, environment = "prod") {
        if (environment == "prod") {
              if (!handleErrors(this, queryResponse, {
                  min_pivots: 0, max_pivots: 0,
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
                right: 10
            }

            const getNode = d3.select("#vis");

            // Update this once we have a better idea how Looker integration will look
            const new_node_width = getNode.select(function() { return this.parentNode; })
            const new_node_height = getNode.select(function() { return this.parentNode; })
            const nodewidth = new_node_width.node().getBoundingClientRect().width;
            const nodeheight = new_node_height.node().getBoundingClientRect().height;

            const width = nodewidth - margin.left - margin.right;
            const height = nodeheight - margin.top - margin.bottom;
            

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
                    console.log("totalObj column", dimensions[0].name)
                    totalObj[dimensions[0].name] = {"value": "All"}
                } else {
                    totalObj[dimensions[0].name]["value"] = "All"
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

            // listDropdown.on("change", function() {
            //     redraw()
            // })

            console.log("CONFIG", config)
            console.log("OUTSIDE FLOWMAP", config.flowmap)

            // -----------------------------------------------------------------------------------
            // SET GLOBAL VARIABLES
            let NUMFORMAT;
    
            if (config.currency == true) {
                NUMFORMAT = "$,.0f"
            } else {
                NUMFORMAT = ",.0f"
            }

            // -----------------------------------------------------------------------------------
            // RECONFIGURE DATA FOR SANKEY
            let sank_map_all = []
            // let node_map = []
            let node_name_map = {}
            let measures_used = []

            console.log("original config", config)
            data.forEach((entry, ind) => {
                let tmp_map = {"entity": entry[dimensions[0].name].value, "links": [], "nodes": []}
                config.flowmap.split(",").forEach((d, i) => {
                    let source = parseInt(d.split(":")[0])
                    measures_used.push(source)                
                    d.split("[")[1].split("]")[0].split(" ").forEach((di, ii) => {
                        tmp_map["links"].push({"source": source, "target": parseInt(di), "value": entry[measures[parseInt(di)].name].value})
                        measures_used.push(parseInt(di))
                    })
                })
                sank_map_all.push(tmp_map)
            })


            measures_used = [...new Set(measures_used)]
            console.log("measures_used no-dups", measures_used)

            data.forEach((entry, ind) => {
                measures.forEach((d, i) => {
                    if (measures_used.includes(i)) {
                        if (d.label_short) {
                            sank_map_all.find(obj => obj.entity === entry[dimensions[0].name].value)["nodes"].push({"id": i, "name": d.label_short});
                            // node_map.push({"id": i, "name": d.label_short})
                        } else {
                            sank_map_all.find(obj => obj.entity === entry[dimensions[0].name].value)["nodes"].push({"id": i, "name": d.label});
                            // node_map.push({"id": i, "name": d.label})
                        }
                    }                 
                })
            })
            

            console.log("nodeRenames", config.nodenames.split(","))
            config.nodenames.split(",").forEach((d, i) => {
                node_name_map[String(parseInt(d.split(":")[0]))] = d.split(":")[1]
            })

            console.log("sank_map", sank_map_all)
            // console.log("node_map", node_map)
            console.log("node_name_map", node_name_map)
            console.log("measures_used", measures_used)

            listDropdown.on("change", function() {
                redraw(sank_map_all)
            })

        
            function redraw(sank_map_all) {
                console.log("first redraw config", config)
                // -----------------------------------------------------------------------------------
                // FILTER DATA BASED ON DROPDOWN SELECTION
                let entity = $(`#vis-options option:selected`).val()
                console.log("ENTITY SELECTED", entity)

                let data_sank = data.filter(d => {
                    return (d[dimensions[0].name].value == entity)
                })[0]

                console.log("data_sank", data_sank)

                const svg = (
                    d3.select("#vis").select('svg')
                        .html('')
                        .attr('width', '100%')
                        .attr('height', '100%')
                )
        
                const group = svg.append('g')
                    .attr('transform', `translate(${margin.left},${margin.top})`)
                    .attr('width', '100%')
                    .attr('height', (height + 'px'))
                    .classed('group', true)

                console.log("sank_map_all inside redraw", sank_map_all)

                let sank_map = sank_map_all.filter(d => {
                    return (d.entity == entity)
                })

                console.log("sank_map for entity", sank_map[0])

                // -----------------------------------------------------------------------------------
                // RUN FUNCTION TO CONFIGURE DATA
                // const [sank_map, node_name_map, measures_used] = create_maps(data_sank)
                // console.log("ran function to configure data")

                // -----------------------------------------------------------------------------------
                // SETUP THE TOOLTIP
                let tooltip = d3.select(".tooltip")
                    .style("opacity", 0)
                    .style("background-color", "white")
                    .style("border-radius", "4px")
                    .style("padding", "5px")
                    .style("position", "absolute")
                    .style("display", "block")
                    .style("border", "solid")
                    .style("border-color", "lightgrey")
                    .style("border-width", ".5px")

                tooltip.html('<div id="tt-header"></div><p id="tt-body"></p>')

                const tooltipHeader = tooltip.select("#tt-header")
                const tooltipBody = tooltip.select("#tt-body")

                const mouseoverNode = function(d) {
                    tooltip
                        .transition()
                        .duration(0)
                        .style("opacity", 0.95)

                    nodeHighlightLinks(d)

                    console.log("MOUSEOVER-NODE", d)
                }

                const mousemoveNode = function(d) {
                    console.log("mousemoveNode", d)

                    if (d.targetLinks.length > 0) {
                        let sourceTotals = []
                        let sourceNames = []

                        d.targetLinks.forEach((tl, i) => {
                            sourceTotals.push(tl.source.value)
                            sourceNames.push(tl.source.name)
                        })

                        const sourceSum = sourceTotals.reduce((acc, cur) => {
                            return acc + cur;
                        }, 0)

                        let sourceHTML = "";
                        sourceNames.forEach((sn, i) => {
                            if (i < sourceNames.length - 1) {
                                sourceHTML += `<span style="float:right;">${sn}</span><br>` 
                            } else {
                                sourceHTML += `<span style="float:right;">${sn}</span>` 
                            }  
                        })

                        tooltipHeader.html(`Node: ${d.name}<hr>`)
                        tooltipBody.html(
                            `<span style="float:left;">% of Sources:&nbsp&nbsp</span>` + `<span style="float:right;">${d3.format(",.1%")(d.value / sourceSum)}</span><br>` +
                            `<span style="float:left;">Sources:&nbsp&nbsp</span>` + sourceHTML
                        )
                    } else {
                        tooltipHeader.html(`Node: ${d.name}<hr>`)
                        tooltipBody.html(`<span style="float:left;">No Sources</span>`)
                    }

                    let tooltipWidth = d3.select(".tooltip").node().getBoundingClientRect().width
                    let tooltipHeight = d3.select(".tooltip").node().getBoundingClientRect().height

                    if (d3.event.pageY < height * .7) {
                        tooltip
                            .style("top", d3.event.pageY - 40 + "px")
                    } else {
                        tooltip
                            .style("top", d3.event.pageY - 80 - tooltipHeight + "px")
                    }

                    if (d3.event.pageX < width * .5) {
                        tooltip
                            .style("left", d3.event.pageX + "px")
                    } else {
                        tooltip
                            .style("left", d3.event.pageX - 20 - tooltipWidth + "px")
                    }

                    console.log("MOUSEMOVE-NODE")
                }

                const mouseoutNode = function(d) {
                    tooltip
                        .transition()
                        .duration(0)
                        .style("opacity", 0)

                    nodeUnHighlightLinks(d)

                    console.log("MOUSEOUT-NODE")
                }

                const mouseoverLink = function(d) {
                    tooltip
                        .transition()
                        .duration(0)
                        .style("opacity", 0.95)

                    d3.select(this)
                        .attr("stroke-opacity", 0.9)

                    console.log("MOUSEOVER-LINK", d)
                }

                const mousemoveLink = function(d) {
                    tooltipHeader.html(`Link to ${d.target.name}<hr>`)
                    tooltipBody.html(
                        `<span style="float:left;">% of ${d.source.name}:&nbsp&nbsp</span>` + `<span style="float:right;">${d3.format(",.1%")(d.value / d.source.value)}</span>`
                    )

                    let tooltipWidth = d3.select(".tooltip").node().getBoundingClientRect().width
                    let tooltipHeight = d3.select(".tooltip").node().getBoundingClientRect().height

                    if (d3.event.pageY < height * .7) {
                        tooltip
                            .style("top", d3.event.pageY - 40 + "px")
                    } else {
                        tooltip
                            .style("top", d3.event.pageY - 80 - tooltipHeight + "px")
                    }

                    if (d3.event.pageX < width * .5) {
                        tooltip
                            .style("left", d3.event.pageX + "px")
                    } else {
                        tooltip
                            .style("left", d3.event.pageX - 20 - tooltipWidth + "px")
                    }

                    console.log("MOUSEMOVE-LINK")
                }

                const mouseoutLink = function(d) {
                    tooltip
                        .transition()
                        .duration(0)
                        .style("opacity", 0)

                    d3.select(this)
                        .attr("stroke-opacity", 0.4)
                }

                // -----------------------------------------------------------------------------------
                // SETUP SANKEY
                const sankey = d3sank.sankey()
                    .nodeId(d => d.id)
                    .nodeWidth(20)
                    .nodePadding(50)
                    .size([width, height])
                    .nodeAlign(d3sank.sankeyCenter)

                console.log("HERE 1")

                let sank_map2 = Object.assign({}, sank_map[0])

                console.log("HERE 2")

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
                        .on("mouseover", mouseoverLink)
                        .on("mousemove", mousemoveLink)
                        .on("mouseout", mouseoutLink)

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
                        .on("mouseover", mouseoverNode)
                        .on("mousemove", mousemoveNode)
                        .on("mouseout", mouseoutNode)

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
            
            redraw(sank_map_all)

        } catch(error) {
            console.log(error)
        }
        done()
    },
})

            