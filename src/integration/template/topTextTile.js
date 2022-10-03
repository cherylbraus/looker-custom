import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'

export const object = {
    // Id and Label are legacy properties that no longer have any function besides documenting
    // what the visualization used to have. The properties are now set via the manifest
    // form within the admin/visualizations page of Looker.

    id: "top-text-tile",
    label: "ZDev Top Text Tile",
    options: {
        metric : {
            type: "string",
            label: "Metric Name",
            display: "text",
            default: "Volume",
            section: "Options"
        },
        currency: {
            type: "boolean",
            label: "Metric is Currency",
            default: "false",
            section: "Options"
        },
        comparison: {
            type: "string",
            label: "Comparison Metric Label",
            display: "text",
            default: "YTD Target",
            section: "Options"
        },
        colorTop: {
            type: "boolean",
            label: "Color Main #",
            default: "true",
            section: "Options"
        },
        colorBottom: {
            type: "boolean",
            label: "Color Bottom #",
            default: "true",
            section: "Options"
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
            </style>
            <svg>
            </svg>`;
        element.style.fontFamily = `"Open Sans", "Helvetica", sans-serif`       
    },

    updateAsync: function(data, element, config, queryResponse, details, done, environment = "prod") {
        if (environment == "prod") {
            if (!handleErrors(this, queryResponse, {
                min_pivots: 0, max_pivots: 0,
                min_dimensions: 0, max_dimensions: 2,
                min_measures: 0, max_measures: 11
            })) return
        }
        
        try {

            // set dimensions
            let dimensions = {
                margin: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            }

            const width = element.clientWidth;
            const height = element.clientHeight;

            dimensions.boundedWidth = width - dimensions.margin.left - dimensions.margin.right;
            dimensions.boundedHeight = height - dimensions.margin.top - dimensions.margin.bottom;

            const svg = (
                d3.select(element).select("svg")
                    .html("")
                    .attr("width", "100%")
                    .attr("height", "100%")
            )

            const group = svg.append("g")
                .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)
                .attr("width", "100%")
                .attr("height", ((dimensions.boundedHeight) + "px"))
                .classed("group", true)

            // load data
            const measures = queryResponse.fields.measure_like
            console.log("measures length", measures.length)

            // reformat the data - if margin, add margin % measure
            let data_ready = []

            data.forEach((d) => {
                let entry = {}
                entry["goal"] = d[measures[0].name].value
                entry["actual"] = d[measures[1].name].value
                entry["perc"] = d[measures[2].name].value
        
                if (measures.length === 4) {
                    entry["percMargin"] = d[measures[3].name].value
                } else {
                    null 
                }
        
                data_ready.push(entry)
            })

            // functions
            const titleCase = function(d) {
                return d.toLowerCase().split(' ').map(function(word) {
                    return word.replace(word[0], word[0].toUpperCase());
                }).join(' ')
            }
        
            const rawFormat = function(d) {
                return d.toLocaleString("en-US")
            }
        
            const currFormat = function(d) {
                return d.toLocaleString("en-US", {style: "currency", currency: "USD",
                        minimumFractionDigits: 0, maximumFractionDigits: 0})
            }
        
            const percFormat = function(d) {
                return d.toLocaleString(undefined, {style: "percent", minimumFractionDigits: 1})
            }
        
            const directionWording = function(d) {
                if (data_ready[0].actual < data_ready[0].goal) {
                    return "Below"
                } else {
                    return "Above"
                }
            }

            // text elements
            const title = group.append("g").selectAll("text")
                .data(data_ready)
                .enter()
                .append("text")
                    .text(titleCase(config.metric))
                    .attr("x", dimensions.boundedWidth/2)
                    .attr("y", dimensions.boundedHeight - dimensions.boundedHeight*.9)
                    .attr("font-family", "arial")
                    .attr("font-size", "2.0em")
                    .style("dominant-baseline", "middle")
                    .style("text-anchor", "middle")
                    .style("font-weight", "200")
                    .attr("fill", "#323232")

            const actual = group.append("g")
                .classed("actualNumber", true)
                .selectAll("text")
                .data(data_ready)
                .enter()
                .append("text")
                    .text(function() {
                        if (config.currency === "false") {
                            return rawFormat(data_ready[0].actual)
                        } else {
                            return currFormat(data_ready[0].actual)
                        }
                    })
                    .attr("x", dimensions.boundedWidth/2)
                    .attr("y", dimensions.boundedHeight - dimensions.boundedHeight*.55)
                    .attr("font-family", "arial")
                    .attr("font-size", "3.5em")
                    .style("dominant-baseline", "middle")
                    .style("text-anchor", "middle")
                    .style("font-weight", "600")
                    .attr("fill", function() {
                        if (config.colorTop == "true") {
                            if (data_ready[0].actual < data_ready[0].goal) {
                                return "#D76106"
                            } else {
                                return "#0072b5"
                            }
                        } else {
                            return "#323232"
                        }                        
                    })

            
            const addPercMargin = function() {
                if (measures.length === 4) {
                    const percMargin = group.append("g").selectAll("text")
                        .data(data_ready)
                        .enter()
                        .append("text")
                            .text(`(${percFormat(data_ready[0].percMargin)} Margin)`)
                            .attr("x", dimensions.boundedWidth/2)
                            .attr("y", dimensions.boundedHeight - dimensions.boundedHeight*.3)
                            .attr("font-family", "arial")
                            .attr("font-size", "1.1em")
                            .style("dominant-baseline", "middle")
                            .style("text-anchor", "middle")
                            .style("font-weight", "200")
                            .attr("fill", "#323232")
                } else {
                    return 
                }
            }

            addPercMargin()

            const percentage = group.append("g").selectAll("text")
                .data(data_ready)
                .enter()
                .append("text")
                    .text(`${percFormat(data_ready[0].perc)}`)
                    .attr("x", dimensions.boundedWidth/2)
                    .attr("y", dimensions.boundedHeight - dimensions.boundedHeight*.1)
                    .attr("font-family", "arial")
                    .attr("font-size", "1.4em")
                    .style("dominant-baseline", "middle")
                    .style("text-anchor", "middle")
                    .style("font-weight", "550")
                    .attr("fill", function() {
                        if (config.colorBottom == "true") {
                            if (data_ready[0].actual < data_ready[0].goal) {
                                return "#D76106"
                            } else {
                                return "#0072b5"
                            }
                        } else {
                            return "#323232"
                        }                        
                    })
                .append("tspan")
                    .text(`\u00A0 ${directionWording()} ${config.comparison}`)
                    .attr("fill", "#323232")
                    .style("font-weight", "200")


        } catch(error) {
            if (environment == "prod") {
                if (queryResponse.fields.dimensions.length < 3) {
                                    this.addError({title: "Not Enough Measures", message: "This chart requires at least 3 measures."});
                                    return;
                                } 
            }  else {
            console.log(error)
        }

        // Callback at the end of the rendering to let Looker know it's finished
        done()
    }
}
};