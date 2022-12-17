import * as d3 from 'd3'
import * as d3sank from 'd3-sankey'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'
import { selectAll } from 'd3'
import { stripComments } from 'tslint/lib/utils'

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
            default: ["0:[1]", "1:[6 2]", "6:[3 4]"]
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
                top: 12,
                bottom: 12,
                left: 2, 
                right: 2
            }

            const width = element.clientWidth - margin.left - margin.right;
            const height = element.clientHeight - margin.top - margin.bottom;

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

            // -----------------------------------------------------------------------------------
            // ONLY LOOK AT ONE ROW FOR DEVELOPMENT PURPOSES
            const data_sank = data[0]

            // -----------------------------------------------------------------------------------
            // RECONFIGURE DATA FOR SANKEY
            let sank_map = {"nodes":[], "links":[]}

            // make sure any measures not used in sankey are hidden before importing data
            measures.forEach((d, i) => {
                if (d.label_short) {
                    sank_map["nodes"].push({"id": i, "name": d.label_short})
                } else {
                    sank_map["nodes"].push({"id": i, "name": d.label})
                }
            })

            console.log("flowmap", config.flowmap.split(","))
            config.flowmap.split(",").forEach((d, i) => {
                let source = parseInt(d.split(":")[0])

                d.split("[")[1].split("]")[0].split(" ").forEach((d, i) => {
                    sank_map["links"].push({"source": source, "target": parseInt(d), "value": data_sank[measures[parseInt(d)].name].value})
                })
            })


            console.log("data_sank", data_sank)
            console.log("sank_map", sank_map)

            // -----------------------------------------------------------------------------------
            // SETUP SANKEY
            const sankey = d3sank.sankey()
                .nodeId(d => d.id)
                .nodeWidth(20)
                .nodePadding(200)
                .size([width, height])
                .nodeAlign(d3sank.sankeyCenter)

            let graph = sankey(sank_map)

            console.log("defined sankey")
            console.log("graph.links", graph.links)
            console.log("graph.nodes", graph.nodes)

            // -----------------------------------------------------------------------------------
            // Interactions
            function nodeHighlightLinks(d) {
                console.log("d", d)
                let linkIndices = []

                d.sourceLinks.forEach((e, ind) => {
                    linkIndices.push(e["index"])
                })
                d.targetLinks.forEach((e, ind) => {
                    linkIndices.push(e["index"])
                })

                linkIndices.forEach((e, ind) => {
                    d3.select(`.link.ind${String(e)}`)
                        .attr("stroke-opacity", 0.7)
                        .attr("stroke", "#8cbb61")
                })

                d3.select(`.node.id${String(d.id)}`)
                    .attr("fill", "#006268")
                    .attr("opacity", 1.0)
            } 

            function nodeUnHighlightLinks(d) {
                let linkIndices = []

                d.sourceLinks.forEach((e, ind) => {
                    linkIndices.push(e["index"])
                })
                d.targetLinks.forEach((e, ind) => {
                    linkIndices.push(e["index"])
                })

                linkIndices.forEach((e, ind) => {
                    d3.select(`.link.ind${String(e)}`)
                        .attr("stroke-opacity", 0.4)
                        .attr("stroke", "#afafaf")
                })

                d3.select(`.node.id${String(d.id)}`)
                    .attr("fill", "#007b82")
                    .attr("opacity", 0.7)
            }

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
                    .attr("fill", "#007b82")
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
                    .attr("font-size", "10px")
                    .attr("text-anchor", "end")
                    .attr("transform", null)
                    .text(d => d.name)
                    .filter(d => d.x0 < width / 2)
                        .attr("x", d => d.x1 + 2)
                        .attr("text-anchor", "start")

        } catch(error) {
            console.log(error)
        }
        done()
    },
}