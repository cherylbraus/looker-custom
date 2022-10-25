import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'

looker.plugins.visualizations.add({
    // Id and Label are legacy properties that no longer have any function besides documenting
    // what the visualization used to have. The properties are now set via the manifest
    // form within the admin/visualizations page of Looker.

    id: "top-text-tile",
    label: "ZDev Top Text Tile",
    options: {
        metric : {
            type: "string",
            label: "Title Metric Name",
            display: "text",
            default: "Volume",
            section: "General",
            order: 2
        },
        comparison: {
            type: "string",
            label: "Comparison Metric",
            display: "radio",
            values: [
                {"MTD Budget": "budget"},
                {"MTD Forecast": "forecast"}
            ],
            default: "budget",
            section: "General",
            order: 1
        },
        currency: {
            type: "boolean",
            label: "Metric is Currency",
            default: false,
            section: "General",
            order: 3
        },
        colorTop: {
            type: "boolean",
            label: "Color Actuals",
            default: true,
            section: "General",
            order: 4
        },
        colorBottom: {
            type: "boolean",
            label: "Color Percentages",
            default: true,
            section: "General",
            order: 5
        },
        showmarginperc: {
            type: "boolean",
            label: "Show Margin %",
            default: false,
            section: "General",
            order: 6
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
                min_measures: 0, max_measures: 22
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
            const dimension = queryResponse.fields.dimension_like
            const measures = queryResponse.fields.measure_like
            console.log("dimension", dimension)
            console.log("measures", measures)
            console.log("data", data)

            // reformat the data - if margin, add margin % measure
            let data_ready = []

            data.forEach((d) => {
                let entry = {}
                entry["month"] = new Date(d[dimension[0].name].value + 'T00:00')
                entry["day"] = new Date(d[dimension[1].name].value + 'T00:00')
                entry['daynum'] = +d[dimension[2].name].value
                entry['daynumyest'] = +d[dimension[3].name].value
                entry["budget"] = d[measures[0].name].value
                entry["forecast"] = d[measures[1].name].value
                entry["actual"] = d[measures[2].name].value
                entry['actmargin'] = d[measures[3].name].value
                entry['actrev'] = d[measures[4].name].value
                data_ready.push(entry)
            })

            console.log("data_ready", data_ready)

            const monthAccessor = d => d.month
            const dayAccessor = d => d.day
            const daynumAccessor = d => d.daynum
            const daynumyestAccessor = d => d.daynumyest
            const budgetAccessor = d => d.budget
            const forecastAccessor = d => d.forecast
            const actualAccessor = d => d.actual

            // filter data 
            const uniqueMonths = [... new Set(data_ready.map(obj => +obj.month))].sort().reverse()
            console.log("uniqueMonths", uniqueMonths)
            const currentMonth = new Date(uniqueMonths[0])
            const priorMonth = new Date(uniqueMonths[1])

            data_ready = data_ready.filter(element => {
                const monthDate = element.month;
                return (monthDate >= priorMonth && monthDate <= currentMonth && element.daynum <= element.daynumyest)
            })

            data_ready = data_ready.sort(function(a,b) {
                return dayAccessor(a) - dayAccessor(b)
            })

            console.log("data_ready filtered", data_ready)

            // group data by month
            function group_by_month(arr) {
                return Object.values(
                    data_ready.reduce((a, {month: month, budget: budget, forecast: forecast, actual: actual, 
                                            actmargin: actmargin, actrev: actrev}) => {
                        const key = month;

                        if (a[key] === undefined) {
                            a[key] = {month: key, budget: 0, forecast: 0, actual: 0, actmargin: 0, actrev: 0}
                        }

                        a[key].budget += budget;
                        a[key].forecast += forecast;
                        a[key].actual += actual;
                        a[key].actmargin += actmargin;
                        a[key].actrev += actrev;

                        return a;
                    }, {})
                )
            }

            let data_group = group_by_month(data_ready)
            console.log("data_group", data_group)

            const paceCalc = data_group.map((d,i) => ({
                month: d.month,
                paceBudget: (+d.actual/+d.budget) - 1,
                paceForecast: (+d.actual/+d.forecast) - 1,
                percMargin: +d.actmargin/+d.actrev
            }))

            const paceBudgetAccessor = d => d.paceBudget
            const paceForecastAccessor = d => d.paceForecast

            console.log("paceCalc", paceCalc)

            data_group = data_group.map((item, i) => Object.assign({}, item, paceCalc[i]))

            console.log("data_group with pace", data_group)

            const data_current = data_group.filter(element => {
                return (element.month.getTime() === currentMonth.getTime())
            })

            const data_prior = data_group.filter(element => {
                return (element.month.getTime() === priorMonth.getTime())
            })

            console.log("data_current", data_current)
            console.log("data_prior", data_prior)


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
                if (data_current[0].actual < data_current[0][config.comparison]) {
                    return "Below"
                } else {
                    return "Above"
                }
            }

            const directionWordingPrior = function(d) {
                if (data_prior[0].actual < data_prior[0][config.comparison]) {
                    return "Below"
                } else {
                    return "Above"
                }
            }

            // text elements
            const title = group.append("g").selectAll("text")
                .data(data_current)
                .enter()
                .append("text")
                    .text(titleCase(config.metric))
                    .attr("x", dimensions.boundedWidth/2)
                    .attr("y", dimensions.boundedHeight - dimensions.boundedHeight*.95)
                    .attr("font-family", "arial")
                    .attr("font-size", "2.0em")
                    .style("dominant-baseline", "middle")
                    .style("text-anchor", "middle")
                    .style("font-weight", "200")
                    .attr("fill", "#323232")

            const actual = group.append("g")
                .classed("actualNumber", true)
                .selectAll("text")
                .data(data_current)
                .enter()
                .append("text")
                    .text(function() {
                        if (config.currency == false) {
                            return rawFormat(data_current[0].actual)
                        } else {
                            return currFormat(data_current[0].actual)
                        }
                    })
                    .attr("x", dimensions.boundedWidth/2)
                    .attr("y", dimensions.boundedHeight - dimensions.boundedHeight*.60)
                    .attr("font-family", "arial")
                    .attr("font-size", "3.5em")
                    .style("dominant-baseline", "middle")
                    .style("text-anchor", "middle")
                    .style("font-weight", "600")
                    .attr("fill", function() {
                        if (config.colorTop ) {
                            if (data_current[0].actual < data_current[0][config.comparison]) {
                                return "#D76106"
                            } else {
                                return "#0072b5"
                            }
                        } else {
                            return "#323232"
                        }                        
                    })


            if (config.showmarginperc ) {
                const percMargin = group.append("g").selectAll("text")
                    .data(data_current)
                    .enter()
                    .append("text")
                        .text(`(${percFormat(data_current[0].percMargin)} Margin)`)
                        .attr("x", dimensions.boundedWidth/2)
                        .attr("y", dimensions.boundedHeight - dimensions.boundedHeight*.42)
                        .attr("font-family", "arial")
                        .attr("font-size", "1.1em")
                        .style("dominant-baseline", "middle")
                        .style("text-anchor", "middle")
                        .style("font-weight", "200")
                        .attr("fill", "#323232")
            } 

            const bottomLabel = (() => {
                if (config.comparison === "budget") {
                    return "MTD Budget"
                } else {
                    return "MTD Forecast"
                }
            })();

            const percentage = group.append("g").selectAll("text")
                .data(data_current)
                .enter()
                .append("text")
                    .text(d => {
                        if (config.comparison === "budget") {
                            return `${percFormat(d.paceBudget)}`
                        } else {
                            return `${percFormat(d.paceForecast)}`
                        }
                    })
                    .attr("x", dimensions.boundedWidth/2)
                    .attr("y", dimensions.boundedHeight - dimensions.boundedHeight*.2)
                    .attr("font-family", "arial")
                    .attr("font-size", "1.55em")
                    .style("dominant-baseline", "middle")
                    .style("text-anchor", "middle")
                    .style("font-weight", "550")
                    .attr("fill", function() {
                        if (config.colorBottom ) {
                            if (data_current[0].actual < data_current[0][config.comparison]) {
                                return "#D76106"
                            } else {
                                return "#0072b5"
                            }
                        } else {
                            return "#323232"
                        }                        
                    })
                .append("tspan")
                    .text(`\u00A0 ${directionWording()} ${bottomLabel}`)
                    .attr("fill", "#323232")
                    .style("font-weight", "200")


            // prior month info
            const priorInfo = group
                .append("g")
                .selectAll("text")
                .data(data_prior)
                .enter()
                .append("text")
                    .text("Prior MTD:")
                    .attr("x", dimensions.boundedWidth/2)
                    .attr("y", dimensions.boundedHeight - dimensions.boundedHeight*.05)
                    .attr("font-family", "arial")
                    .attr("font-size", "1.24em")
                    .style("dominant-baseline", "middle")
                    .style("text-anchor", "middle")
                    .style("font-weight", "200")
                    .attr("fill", "#323232")
                .append("tspan")
                    .text(function() {
                        if (config.currency == false) {
                            return `\u00A0 ${rawFormat(data_prior[0].actual)}`
                        } else {
                            return `\u00A0 ${currFormat(data_prior[0].actual)}`
                        }
                    })
                    .attr("fill", function() {
                        if (config.colorTop ) {
                            if (data_prior[0].actual < data_prior[0][config.comparison]) {
                                return "#D76106"
                            } else {
                                return "#0072b5"
                            }
                        } else {
                            return "#323232"
                        }                        
                    })
                    .style("font-weight", "550")
                .append("tspan")
                    .text(`;`)
                    .attr("fill", "#323232")
                    .style("font-weight", "200")
                .append("tspan")
                    .text(d => {
                        if (config.comparison === "budget") {
                            return `\u00A0${percFormat(d.paceBudget)}`
                        } else {
                            return `\u00A0${percFormat(d.paceForecast)}`
                        }
                    })
                    .attr("fill", function() {
                        if (config.colorBottom ) {
                            if (data_prior[0].actual < data_prior[0][config.comparison]) {
                                return "#D76106"
                            } else {
                                return "#0072b5"
                            }
                        } else {
                            return "#323232"
                        }                        
                    })
                    .style("font-weight", "550")
                .append("tspan")
                    .text(`\u00A0${directionWordingPrior()} ${bottomLabel}`)
                    .attr("fill", "#323232")
                    .style("font-weight", "200")
                    .attr("class", "lastlabel")


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
});