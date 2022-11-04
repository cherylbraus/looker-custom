import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'

export const object = {
    // Id and Label are legacy properties that no longer have any function besides documenting
    // what the visualization used to have. The properties are now set via the manifest
    // form within the admin/visualizations page of Looker.

    id: "bullet-chart",
    label: "ZDev Bullet Chart",
    options: {
        comparison: {
          type: "string",
          label: "Comparison Metric",
          display: "radio",
          values: [
              {"Monthly Budget": "monthly-budget"},
              {"MTD Budget": "mtd-budget"},
              {"Monthly Forecast": "monthly-forecast"},
              {"MTD Forecast": "mtd-forecast"},
          ],
          default: "mtd-budget"
        },
        currency_type: {
          type: 'string',
          label: 'Currency Prefix',
          display: "radio",
          values: [
            {"USD": "dollar"},
            {"None": "none"}
          ],
          default: "dollar"
        },
        bar_display: {
          type: 'string',
          label: 'Color below/above',
          display: "radio",
          values: [
            {"Yes": "yes"},
            {"No": "no"}
          ],
          default: "yes"
        },
        color: {
          type: 'string',
          label: 'Color',
          display: "radio",
          values: [
            {"#27566b": "rgba(39, 85, 107,"},
            {"#007b82": "rgba(0, 123, 130,"},
            {"#339f7b": "rgba(51, 159, 123,"},
            {"#0072B5": "rgba(0, 115, 181,"}
          ],
          default: "rgba(0, 115, 181,"
        },
      },

    // Set up the initial state of the visualization
    create: function(element, config) {
        // Insert a <style> tag with some styles we'll use later
        element.innerHTML = `
            <style>
              body {
                  font-family: Arial;
                  font-size: 12px;
              }
            </style>
            <svg>
            </svg>`;
        element.style.fontFamily = `"Open Sans", "Helvetica", sans-serif`
    },

    // Render in response to the data or settings changing
updateAsync: function(data, element, config, queryResponse, details, done, environment = "prod") {
        if (environment == "prod") {
            if (!handleErrors(this, queryResponse, {
                min_pivots: 0, max_pivots: 0,
                min_dimensions: 0, max_dimensions: 22,
                min_measures: 0, max_measures: 22
            })) return
        }
try {
    function getMonth(d) {
          d = d || new Date();
          return d.getMonth();
        }

    const parseTime = d3.timeParse("%Y-%m");
    const dimension = queryResponse.fields.dimension_like[0]
    const measures = queryResponse.fields.measure_like

    console.log("measure", measures)
    console.log("dimension", dimension)
    console.log("data", data)
    console.log("parseTime", parseTime("2022-01"))

    let bullet_measures = []

    measures.forEach((d,i)=>{
        bullet_measures.push(d.name)
    })

    let budget_forecast_dps = {}

    let data_remix = []

    const today = new Date("October 1, 2022")
    // const today = new Date()
    const todayYM = d3.timeFormat("%Y-%m")(today)

    console.log("todayYM", todayYM)

    // Slice off only the current month into the chart and package into data_remix array
    data.forEach(function(d,i) {
        if (data[i][dimension.name].value === todayYM) {
            data_remix.push(d)
        }
    })

    console.log("data_remix", data_remix)
    console.log("bulletMeasures", bullet_measures)

    const month_dp_bg = data_remix[0][bullet_measures[0]].value;
    const month_dp_fc = data_remix[0][bullet_measures[1]].value;
    const month_actual = data_remix[0][bullet_measures[2]].value;
    const spot_actual = data_remix[0][bullet_measures[3]].value;
    const contract_actual = data_remix[0][bullet_measures[4]].value;
    const mtd_budget = data_remix[0][bullet_measures[5]].value;
    const mtd_forecast = data_remix[0][bullet_measures[6]].value;

    budget_forecast_dps["monthly-budget"] = month_dp_bg
    budget_forecast_dps["monthly-forecast"] = month_dp_fc
    budget_forecast_dps["monthly-actual"] = month_actual
    budget_forecast_dps["monthly-actual-spot"] = spot_actual
    budget_forecast_dps["monthly-actual-contract"] = contract_actual
    budget_forecast_dps["mtd-budget"] = mtd_budget
    budget_forecast_dps["mtd-forecast"] = mtd_forecast

    console.log("budget_forecast_dps", budget_forecast_dps)


    // const legend_label = pivots[1].field_group_variant
    let dimensions = {
        margin: {
            top: 15,
            // right: 185,
            right: 115,
            bottom: 25,
            left: 20
        }
    }

    const bulletPadding = 4

    console.log("element", element)
    console.log("clientWidth", element.clientWidth)
    console.log("clientHeight", element.clientHeight)

    const w = element.clientWidth;
    const h = element.clientHeight;

    dimensions.boundedWidth = w - dimensions.margin.left - dimensions.margin.right;
    dimensions.boundedHeight = Math.min(h - dimensions.margin.top - dimensions.margin.bottom,120)

    const svg = (
      d3.select(element).select('svg')
        .html('')
        .attr('width', '100%')
        .attr('height', '100%')
    )

    const group = svg.append('g')
        .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)
        .attr("width", "100%")
        .attr("height", ((dimensions.boundedHeight) + "px"))
            .classed("group", true)

    // Add a placeholder array since this is just one chart per tile
    const xMetrics = ["metric"]

    const xScale = d3.scaleLinear()
                 .domain([0, Math.max(budget_forecast_dps["monthly-budget"], budget_forecast_dps["monthly-forecast"])])
                 .range([0, dimensions.boundedWidth])

    const yScale = d3.scaleBand()
        .domain(xMetrics.map(d => d))
        .range([0, dimensions.boundedHeight])
        .padding(0.45)

    // Since this is custom, we just pull off the two values. In another chart this should be done programmatically

    let stackedData = []
    for (let n = 0; n < 2; n++) {
        let dat = []
        if (n == 0) {
           dat.push(0)
           dat.push(budget_forecast_dps["monthly-actual-spot"])
        } else {
            dat.push(budget_forecast_dps["monthly-actual-spot"])
            dat.push(budget_forecast_dps["monthly-actual-spot"] + budget_forecast_dps["monthly-actual-contract"])

        }
        stackedData.push(dat)
    }

    console.log("stackedData", stackedData)

    const rects = group.append("g")

    // Handle hover action to show values of labels
    rects.on('mouseover', function () {
              d3.selectAll(".hidden").transition()
                   .duration('100')
                   .attr('opacity', '1')
              d3.selectAll(".visible").transition()
                   .duration('100')
                   .attr('opacity', '0')})
    .on('mouseout', function () {        
              d3.selectAll(".hidden").transition()
                   .duration('100')
                   .attr('opacity', '0')
              d3.selectAll(".visible").transition()
                   .duration('100')
                   .attr('opacity', '1')})

    const outerRects = rects
        .selectAll(".outer")
        .data([budget_forecast_dps])
        .enter()
            .append("rect")
            .attr("x", (d,i) => {
                console.log("outerrect x", xScale(0))
                return xScale(0)
            })
            .attr("y", d => yScale(xMetrics[0]))
            .attr("width", (d,i) => {
                const maxWidth = Math.max(d["monthly-budget"], d["monthly-forecast"])
                return xScale(maxWidth)
            })
            .attr("height", yScale.bandwidth())
            .attr("fill", "#fbfbfb")
            .style("stroke", "#323232")
            .attr("class", "outer")
            // .style("opacity", 0.3)

    const innerRects = rects
        .selectAll(".stacked")
        .data([stackedData])
        .enter()
        .append("g")
            .attr("class", "stacked")
            .selectAll("rect .stacked")
            .data(function(d) { 
                return d;})
            .enter()
            .append("rect")
                .attr("class", "stacked")
                .attr("x", d => xScale(d[0]))
                .attr("y", d => {
                    return yScale("metric") + bulletPadding
                })
                .attr("width", (d,i) => {
                    return xScale(parseInt(d[1])-parseInt(d[0]))
                })
                .attr("height", yScale.bandwidth() - bulletPadding*2)
                .attr("stroke", "#5a5a5a")
                .attr("stroke-width", 1)

    console.log("stackedData", stackedData)

    // Handle positive/negative value signaling, or let user style bar fills
    if (config.bar_display == "yes") {
        innerRects.attr("fill", function(d,i){
                        if (+budget_forecast_dps["monthly-actual"] < +budget_forecast_dps[config.comparison]) {
                            if (d[0] == 0) {
                                return "#D76106"
                            } else {
                                return "rgba(215, 97, 6,0.75)"
                            }
                        } else {
                            if (d[0] == 0) {
                                return "#0072b5"
                            } else {
                                return "rgba(0, 115, 181,0.75)"
                            }
                        }
                    })        
    } else {
        innerRects.attr("fill", function(d,i){
            if (d[0] == 0) {
                return config.color + "1)"
            } else {
                return config.color + "0.65)"
            }
    })
}

    const stackedLabels = rects
        .selectAll(".stacked-label")
        .data([stackedData])
        .enter()
        .append("g")
            .attr("class", "stacked-label")
            .selectAll("text .stacked")
            .data(function(d) {return d})
            .enter()
            .append("text")
                .attr("x", d => xScale(d[1]) - 9)
                .attr("y", d => yScale("metric") + 8)
                .text(d => {
                    if (+d[1] == +budget_forecast_dps["monthly-actual-spot"]) {
                        return "S"
                    } else {
                        return "C"
                    }
                })
                .attr("text-anchor", "right")
                .style("dominant-baseline", "hanging")
                .attr("fill", "white")
                .attr("font-size", "0.6em")
                .attr("font-weight", "600")
                .attr("font-family", "sans-serif")

    console.log("budget_forecast_dps", budget_forecast_dps)

    const innerBarText = rects
        .selectAll(".inner-text")
        .data([budget_forecast_dps])
        .enter()
        .append("text")
            .attr("x", (d,i) => xScale(0) + 2)
            .attr("y", d => yScale("metric") + yScale.bandwidth()/1.7) //2  1.8
            .text((d) => 
                { 
                    if (config.currency_type == "dollar") {
                        return d3.format("$,.0f")(parseInt(d["monthly-actual"]))
                    } else {
                        return d3.format(",.0f")(parseInt(d["monthly-actual"]))
                    }
                    
                })
            .attr("text-anchor", "left")
            .style("dominant-baseline", "middle")
            .attr("font-size", "0.85em") //0.7em
            .attr("font-weight", "500")
            .attr("font-family", "sans-serif")
            .attr("class", "inner-text")

    innerBarText
        .attr("fill", (d) => {
            if (d3.select('.inner-text').node().getComputedTextLength() < xScale(parseInt(d['monthly-actual']))) {
                return "#ffffff"
            } else {
                return "black"
            }
        })
            

    // Dummy data ---------------------------------------------
    const monthlyBudget = rects
        .selectAll(".mpace")
        .data([budget_forecast_dps])
        .enter()
            .append("g")
            .attr("class", "mpace")
            .attr("transform", function(d, i) { return "translate(" + (xScale(d["monthly-budget"])) + "," + 26 + ")"; })

    monthlyBudget
        .append("path")
        .attr("d", d3.symbol().size(30).type(d3.symbolTriangle))
        .attr("transform", "rotate(180)")
          .attr("pointer-events", "none")
          .attr("fill", () => {
            if (config.bar_display === "yes" && config.comparison === "monthly-budget") {
                if (budget_forecast_dps["monthly-actual"] < budget_forecast_dps["monthly-budget"]) {
                    return "#D76106"
                } else {
                  return "#0072b5"
                }
            } else {
                return "#323232"
            }
        })

    const monthlyBudgetText = monthlyBudget.append("text")
            .attr("x", -5) //4
            .attr("y", -10)
            .text((d) => 
                { 
                    if (config.currency_type == "dollar") {
                        return d3.format("$,.0f")(parseInt(d["monthly-budget"]))
                    } else {
                        return d3.format(",.0f")(parseInt(d["monthly-budget"]))
                    }
                    
                })
            .attr("text-anchor", "start")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("font-size", "0.8em")
            .attr("font-weight", "700")
            .attr("font-family", "sans-serif")
            .attr("class", "visible")
            .attr("fill", () => {
                if (config.bar_display === "yes" && config.comparison === "monthly-budget") {
                    if (budget_forecast_dps["monthly-actual"] < budget_forecast_dps["monthly-budget"]) {
                        return "#D76106"
                    } else {
                      return "#0072b5"
                    }
                } else {
                    return "#323232"
                }
            })

    const monthlyBudgetHiddenText = monthlyBudget.append("text")
            .attr("x", -5) // 4
            .attr("y", -10)
            .text(()=>{
                const res = d3.timeFormat("%b")(new Date()) + " budget";
                return res;
            })
            .attr("text-anchor", "start")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("font-size", "0.8em")
            .attr("font-weight", "700")
            .attr("font-family", "sans-serif")
            .attr("class", "hidden")
            .attr("opacity", 0)
            .attr("fill", () => {
                if (config.bar_display === "yes" && config.comparison === "monthly-budget") {
                    if (budget_forecast_dps["monthly-actual"] < budget_forecast_dps["monthly-budget"]) {
                        return "#D76106"
                    } else {
                      return "#0072b5"
                    }
                } else {
                    return "#323232"
                }
            })

    // --------------------------------------------

    const mtdBudget = rects
        .selectAll(".mtdbudget")
        .data([budget_forecast_dps])
        .enter()
            .append("g")
            .attr("class", "mtdbudget")
            .attr("transform", function(d, i) { return "translate(" + (xScale(d["mtd-budget"])) + "," + 26 + ")"; })

    mtdBudget
        .append("path")
        .attr("d", d3.symbol().size(30).type(d3.symbolTriangle))
        .attr("transform", "rotate(180)")
            .attr("pointer-events", "none")
            .attr("fill", () => {
                if (config.bar_display === "yes" && config.comparison === "mtd-budget") {
                    if (budget_forecast_dps["monthly-actual"] < budget_forecast_dps["mtd-budget"]) {
                        return "#D76106"
                    } else {
                      return "#0072b5"
                    }
                } else {
                    return "#523130"
                }
            })

    const mtdBudgetText = mtdBudget.append("text")
            .attr("x", -5) //4
            .attr("y", -24)
            .text((d) => 
                { 
                    if (config.currency_type == "dollar") {
                        return d3.format("$,.0f")(parseInt(d["mtd-budget"]))
                    } else {
                        return d3.format(",.0f")(parseInt(d["mtd-budget"]))
                    }
                    
                })
            .attr("text-anchor", "start")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("font-size", "0.8em")
            .attr("font-weight", "700")
            .attr("font-family", "sans-serif")
            .attr("class", "visible")
            .attr("fill", () => {
                if (config.bar_display === "yes" && config.comparison === "mtd-budget") {
                    if (budget_forecast_dps["monthly-actual"] < budget_forecast_dps["mtd-budget"]) {
                        return "#D76106"
                    } else {
                      return "#0072b5"
                    }
                } else {
                    return "#523130"
                }
            })

    const mtdBudgetHiddenText = mtdBudget.append("text")
            .attr("x", -5) //4
            .attr("y", -24)
            .text("MTD budget")
            .attr("text-anchor", "start")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("font-size", "0.8em")
            .attr("font-weight", "700")
            .attr("font-family", "sans-serif")
            .attr("class", "hidden")
            .attr("opacity", 0)
            .attr("fill", () => {
                if (config.bar_display === "yes" && config.comparison === "mtd-budget") {
                    if (budget_forecast_dps["monthly-actual"] < budget_forecast_dps["mtd-budget"]) {
                        return "#D76106"
                    } else {
                      return "#0072b5"
                    }
                } else {
                    return "#523130"
                }
            })

    // ---------------------------------------------

    const monthlyForecast = rects
        .selectAll(".mforecast")
        .data([budget_forecast_dps])
        .enter()
            .append("g")
            .attr("class", "mforecast")
            .attr("transform", function(d, i) { return "translate(" + (xScale(d["monthly-forecast"])) + "," + (yScale.bandwidth() + 48) + ")"; })

    monthlyForecast
        .append("path")
        .attr("d", d3.symbol().size(30).type(d3.symbolTriangle))
          .attr("pointer-events", "none")
          .attr("fill", () => {
              if (config.bar_display === "yes" && config.comparison === "monthly-forecast") {
                  if (budget_forecast_dps["monthly-actual"] < budget_forecast_dps["monthly-forecast"]) {
                      return "#D76106"
                  } else {
                    return "#0072b5"
                  }
              } else {
                  return "#323232"
              }
          })

    const monthlyForecastText = monthlyForecast.append("text")
            .attr("x", -5) //4
            .attr("y", 12)
            .text((d) => 
                { 
                    if (config.currency_type == "dollar") {
                        return d3.format("$,.0f")(parseInt(d["monthly-forecast"]))
                    } else {
                        return d3.format(",.0f")(parseInt(d["monthly-forecast"]))
                    }
                    
                })
            .attr("text-anchor", "start")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("font-size", "0.8em")
            .attr("font-weight", "700")
            .attr("font-family", "sans-serif")
            .attr("class", "visible")
            .attr("fill", () => {
                if (config.bar_display === "yes" && config.comparison === "monthly-forecast") {
                    if (budget_forecast_dps["monthly-actual"] < budget_forecast_dps["monthly-forecast"]) {
                        return "#D76106"
                    } else {
                      return "#0072b5"
                    }
                } else {
                    return "#323232"
                }
            })

    const monthlyForecastHiddenText = monthlyForecast.append("text")
            .attr("x", -5) // 4
            .attr("y", 12)
            .text(()=>{
                const res = d3.timeFormat("%b")(new Date()) + " forecast";
                return res;
            })
            .attr("text-anchor", "start")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("font-size", "0.8em")
            .attr("font-weight", "700")
            .attr("font-family", "sans-serif")
            .attr("class", "hidden")
            .attr("opacity", 0)
            .attr("fill", () => {
                if (config.bar_display === "yes" && config.comparison === "monthly-forecast") {
                    if (budget_forecast_dps["monthly-actual"] < budget_forecast_dps["monthly-forecast"]) {
                        return "#D76106"
                    } else {
                      return "#0072b5"
                    }
                } else {
                    return "#323232"
                }
            })

    // --------------------------------------------------

    const mtdForecast = rects
        .selectAll(".mtdforecast")
        .data([budget_forecast_dps])
        .enter()
            .append("g")
            .attr("class", "mtdforecast")
            .attr("transform", function(d, i) { return "translate(" + (xScale(d["mtd-forecast"])) + "," + (yScale.bandwidth() + 48) + ")"; })

    mtdForecast
        .append("path")
        .attr("d", d3.symbol().size(30).type(d3.symbolTriangle))
          .attr("pointer-events", "none")
        //   .style("fill", "#523130")
          .attr("fill", () => {
            if (config.bar_display === "yes" && config.comparison === "mtd-forecast") {
                if (budget_forecast_dps["monthly-actual"] < budget_forecast_dps["mtd-forecast"]) {
                    return "#D76106"
                } else {
                  return "#0072b5"
                }
            } else {
                return "#523130"
            }
        })

    const mtdForecastText = mtdForecast.append("text")
            .attr("x", -5)
            .attr("y", 26)
            .text((d) => 
                { 
                    if (config.currency_type == "dollar") {
                        return d3.format("$,.0f")(parseInt(d["mtd-forecast"]))
                    } else {
                        return d3.format(",.0f")(parseInt(d["mtd-forecast"]))
                    }
                    
                })
            .attr("text-anchor", "start")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("font-size", "0.8em")
            .attr("font-weight", "700")
            .attr("font-family", "sans-serif")
            .attr("class", "visible")
            .attr("fill", () => {
                if (config.bar_display === "yes" && config.comparison === "mtd-forecast") {
                    if (budget_forecast_dps["monthly-actual"] < budget_forecast_dps["mtd-forecast"]) {
                        return "#D76106"
                    } else {
                      return "#0072b5"
                    }
                } else {
                    return "#523130"
                }
            })

    const mtdForecastHiddenText = mtdForecast.append("text")
            .attr("x", -5)
            .attr("y", 26)
            .text("MTD forecast")
            .attr("text-anchor", "start")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("font-size", "0.8em")
            .attr("font-weight", "700")
            .attr("font-family", "sans-serif")
            .attr("class", "hidden")
            .attr("opacity", 0)
            .attr("fill", () => {
                if (config.bar_display === "yes" && config.comparison === "mtd-forecast") {
                    if (budget_forecast_dps["monthly-actual"] < budget_forecast_dps["mtd-forecast"]) {
                        return "#D76106"
                    } else {
                      return "#0072b5"
                    }
                } else {
                    return "#523130"
                }
            })
    
    // //
console.log("finished labels")

    // // Okay from here

    const rightLabels = group.append("g")

    const rightMetric = (function() {
        if (config.comparison.includes("budget")) {
            return `monthly-budget`
        } else {
            return `monthly-forecast`
        }
    })();

    const metricLabel = (function() {
        if (config.comparison.includes("budget")) {
            return `${d3.timeFormat("%b")(new Date())} budget`
        } else {
            return `${d3.timeFormat("%b")(new Date())} forecast`
        }
    })();

    // const metricLabelDict = {
    //     "mtd-budget": "MTD budget",
    //     "monthly-budget": `${d3.timeFormat("%b")(new Date())} budget`,
    //     "mtd-forecast": "MTD forecast",
    //     "monthly-forecast": `${d3.timeFormat("%b")(new Date())} forecast`
    // }


    const percPlanLabels = rightLabels
        .selectAll(".perc-label")
        .data([budget_forecast_dps])
        .enter()
            .append("text")
            .attr("x", (d,i) => xScale(Math.max(d["monthly-budget"], d["monthly-forecast"])) + 53)
            .attr("y", d => yScale("metric") + yScale.bandwidth()/2 - 1)
            // .text(d => d3.format(".0%")(d["monthly-actual"]/d[`${config.comparison}`]))
            .text(d => d3.format(".0%")(d["monthly-actual"]/d[rightMetric]))
            .attr("text-anchor", "middle")
            .style("dominant-baseline", "middle")
            .attr("fill", function(d,i) {
                if (config.comparison.includes("mtd")) {
                    return "#323232"
                } else {
                    if (d["monthly-actual"] < d[config.comparison]) {
                        return "#D76106"
                    } else {
                        return "#0072b5"
                    }
                } 
            })
            .attr("font-size", "1.8em")
            .attr("font-weight", "500")
            .attr("font-family", "sans-serif")
            .attr("class", "perc-label")
        .append("tspan")
            .attr("x", (d,i) => xScale(Math.max(d["monthly-budget"], d["monthly-forecast"])) + 53)
            .attr("y", d => yScale("metric") + yScale.bandwidth()/2 + 18)
            .text(`of ${metricLabel}`)
            // .text(`of ${metricLabelDict[config.comparison]}`)
            .style("text-transform", "uppercase")
            .attr("text-anchor", "middle")
            .style("dominant-baseline", "middle")
            .attr("fill", function(d,i) {
                if (config.comparison.includes("mtd") || config.bar_display === "no") {
                    return "#323232"
                } else {
                    if (d["monthly-actual"] < d[config.comparison]) {
                        return "#D76106"
                    } else {
                        return "#0072b5"
                    }
                } 
            })
            .attr("font-size", "0.35em")
            .attr("font-weight", "500")
            .attr("font-family", "sans-serif")


    // NOTE AT BOTTOM
    const note = group
        .append("text")
            .attr("x", 0)
            .attr("y", dimensions.boundedHeight + 24)
            .text("Hover to see what each value represents.")
            .attr("text-anchor", "start")
            .attr("dominant-baseline", "middle")
            .attr("font-size", "0.95em")
            .attr("font-weight", 300)
            .attr("font-family", "sans-serif")
            .attr("fill", "#323232")

        } catch(error) {
            if (environment == "prod") {
                if (queryResponse.fields.dimensions.length != queryResponse.fields.measures.length) {
                                    this.addError({title: "Data mismatch", message: "This chart requires dimension/measure pairs."});
                                    return;
                                } 
            }  else {
            console.log(error)
        }


        // Callback at the end of the rendering to let Looker know it's finished
        done()
    }
  }
}
