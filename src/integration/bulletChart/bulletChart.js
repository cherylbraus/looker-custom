import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'

looker.plugins.visualizations.add({
    // Id and Label are legacy properties that no longer have any function besides documenting
    // what the visualization used to have. The properties are now set via the manifest
    // form within the admin/visualizations page of Looker.

    id: "bullet-chart",
    label: "ZDev Bullet Chart",
    options: {
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
          label: 'Color drops/increases',
          display: "radio",
          values: [
            {"Yes": "yes"},
            {"No": "no"}
          ],
          default: "no"
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
          return d.getMonth() + 1;
        }

    const parseTime = d3.timeParse("%Y-%m");
    const dimension = queryResponse.fields.dimension_like[0]
    const measures = queryResponse.fields.measure_like

    let bullet_measures = []

    measures.forEach((d,i)=>{
        bullet_measures.push(d.name)
    })

    let budget_forecast_dps = {}

    let data_remix = []

    

    // Slice off only the current year into the chart and package into data_remix array
    data.forEach(function(d,i) {
        if (parseTime(data[i][dimension.name].value) >= parseTime("2022-01") && parseTime(data[i][dimension.name].value) < parseTime("2023-01")) {
            data_remix.push(d)
        }
    })

    // "Counters" in the for loops below allow you to roll up the data in the previous months 
    // to show where TF must add up volume/margin/revenue to hit its current quarter or month's goals
    let month_dp_bg = 0;
    let quarter_dp_bg = 0;
    let year_dp_bg = 0;
    let month_dp_fc = 0;
    let quarter_dp_fc = 0;
    let year_dp_fc = 0;
    let year_actual = 0;
    let spot_actual = 0;
    let contract_actual = 0;

    data_remix.sort(function(a,b) {
        return parseTime(a[dimension.name].value) - parseTime(b[dimension.name].value)
    })

            // Monthly data
            for (let m = 0; m <= (getMonth(new Date()) - 1); m++) {
                if (m === getMonth(new Date()) - 1) {
                    console.log("last m", m)
                    month_dp_fc += data_remix[m][bullet_measures[1]].value // most recent month = forecast
                } else {
                    console.log("prior m", m)
                    month_dp_fc += data_remix[m][bullet_measures[2]].value // prior months = actuals
                }

                month_dp_bg += data_remix[m][bullet_measures[0]].value
            }   

            // Quarterly data
            for (let j = 0; j <= ((getQuarter(new Date()) * 3) - 1); j++) {
                if (j >= getMonth(new Date()) - 1) {
                    quarter_dp_fc += data_remix[j][bullet_measures[1]].value // current + future months = forecasts
                } else {
                    quarter_dp_fc += data_remix[j][bullet_measures[2]].value // prior months = actuals
                }

                quarter_dp_bg += data_remix[j][bullet_measures[0]].value
            }

            // Yearly data
            for (let k = 0; k <= 11; k++) {
                if (k >= getMonth(new Date()) - 1) {
                    year_dp_fc += data_remix[k][bullet_measures[1]].value // current + figure months = forecasts
                } else {
                    year_dp_fc += data_remix[k][bullet_measures[2]].value // prior months = actuals
                }

                year_dp_bg += data_remix[k][bullet_measures[0]].value
                year_actual += data_remix[k][bullet_measures[2]].value
                spot_actual += data_remix[k][bullet_measures[3]].value
                contract_actual += data_remix[k][bullet_measures[4]].value
            }

            budget_forecast_dps["monthly-budget"] = month_dp_bg
            budget_forecast_dps["monthly-forecast"] = month_dp_fc
            budget_forecast_dps["quarterly-budget"] = quarter_dp_bg
            budget_forecast_dps["quarterly-forecast"] = quarter_dp_fc
            budget_forecast_dps["yearly-budget"] = year_dp_bg
            budget_forecast_dps["yearly-forecast"] = year_dp_fc
            budget_forecast_dps["yearly-actual"] = year_actual
            budget_forecast_dps["yearly-actual-spot"] = spot_actual
            budget_forecast_dps["yearly-actual-contract"] = contract_actual

    // const pivots = queryResponse.fields.pivots

    // const legend_label = pivots[1].field_group_variant
    let dimensions = {
        margin: {
            top: 15,
            right: 155,
            bottom: 15,
            left: 20
        }
    }

    const bulletPadding = 4

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
                 .domain([0, budget_forecast_dps["yearly-budget"]])
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
           dat.push(budget_forecast_dps["yearly-actual-spot"])
        } else {
            dat.push(budget_forecast_dps["yearly-actual-spot"])
            dat.push(budget_forecast_dps["yearly-actual-spot"] + budget_forecast_dps["yearly-actual-contract"])

        }
        stackedData.push(dat)
    }

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
            .attr("x", (d,i) => xScale(0))
            .attr("y", d => yScale(xMetrics[0]))
            .attr("width", (d,i) => {
                return xScale(d["yearly-budget"])
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

    // Handle positive/negative value signaling, or let user style bar fills
    if (config.bar_display == "yes") {
        innerRects.attr("fill", function(d,i){
                        if (+d["yearly-actual"] < +d["yearly-budget"]) {
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
                    if (+d[1] == +budget_forecast_dps["yearly-actual-spot"]) {
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

    const innerBarText = rects
        .selectAll(".inner-text")
        .data([budget_forecast_dps])
        .enter()
        .append("text")
            .attr("x", (d,i) => xScale(0) + 2)
            .attr("y", d => yScale("metric") + yScale.bandwidth()/2)
            .text((d) => 
                { 
                    if (config.currency_type == "dollar") {
                        return d3.format("$,.0f")(parseInt(d["yearly-actual"]))
                    } else {
                        return d3.format(",.0f")(parseInt(d["yearly-actual"]))
                    }
                    
                })
            .attr("text-anchor", "left")
            .style("dominant-baseline", "middle")
            .attr("fill", "#ffffff")
            .attr("font-size", "0.7em")
            .attr("font-weight", "500")
            .attr("font-family", "sans-serif")
            .attr("class", "inner-text")


    // For each label, we assign a group, add a symbol, add text above and add hidden text in the same position. 
    // Hover toggles the opacity for the "visible" and "hidden" label texts
    const yearTarget = rects
        .selectAll(".plan")
        .data([budget_forecast_dps])
        .enter()
            .append("g")
            .attr("class", "plan")
            .attr("transform", function(d, i) { return "translate(" + xScale(d["yearly-budget"]) + "," + 26 + ")"; })

    yearTarget
        .append("path")
        .attr("d", d3.symbol().size(30).type(d3.symbolTriangle))
          .attr("transform", "rotate(180)")
          .attr("pointer-events", "none")
          .style("fill", "black")

    const yearTargetText = yearTarget.append("text")
            .attr("x", 0)
            .attr("y", -8)
            .text("Budget Target")
            .attr("text-anchor", "middle")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("fill", "#323232")
            .attr("font-size", "0.6em")
            .attr("font-weight", "700")
            .attr("font-family", "sans-serif")
            .attr("class", "visible")

    const yearTargetHiddenText = yearTarget.append("text")
            .attr("x", 0)
            .attr("y", -8)
            .text((d) => 
                { 
                    if (config.currency_type == "dollar") {
                        return d3.format("$,.0f")(parseInt(d["yearly-budget"]))
                    } else {
                        return d3.format(",.0f")(parseInt(d["yearly-budget"]))
                    }
                    
                })
            .attr("text-anchor", "middle")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("fill", "#323232")
            .attr("font-size", "0.6em")
            .attr("font-weight", "700")
            .attr("font-family", "sans-serif")
            .attr("class", "hidden")
            .attr("opacity", 0)

    const quarterlyTarget = rects
        .selectAll(".pace")
        .data([budget_forecast_dps])
        .enter()
            .append("g")
            .attr("class", "pace")
            .attr("transform", function(d, i) { return "translate(" + (xScale(d["quarterly-budget"])) + "," + 26 + ")"; })

    quarterlyTarget
        .append("path")
        .attr("d", d3.symbol().size(30).type(d3.symbolTriangle))
        .attr("transform", "rotate(180)")
          .attr("pointer-events", "none")
          .style("fill", "#007b82")

    const quarterlyTargetText = quarterlyTarget.append("text")
            .attr("x", -4)
            .attr("y", -20)
            .text(()=>{
                const res = "Q" + getQuarter(new Date()) + " target";
                return res;
            })
            .attr("text-anchor", "middle")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("fill", "#007b82")
            .attr("font-size", "0.6em")
            .attr("font-weight", "700")
            .attr("font-family", "sans-serif")
            .attr("class", "visible")

        const quarterlyTargetHiddenText = quarterlyTarget.append("text")
            .attr("x", -4)
            .attr("y", -20)
            .text((d) => 
                { 
                    if (config.currency_type == "dollar") {
                        return d3.format("$,.0f")(parseInt(d["quarterly-budget"]))
                    } else {
                        return d3.format(",.0f")(parseInt(d["quarterly-budget"]))
                    }
                    
                })
            .attr("text-anchor", "middle")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("fill", "#007b82")
            .attr("font-size", "0.6em")
            .attr("font-weight", "700")
            .attr("font-family", "sans-serif")
            .attr("class", "hidden")
            .attr("opacity", 0)

    // Dummy data
    const monthlyTarget = rects
        .selectAll(".mpace")
        .data([budget_forecast_dps])
        .enter()
            .append("g")
            .attr("class", "mpace")
            .attr("transform", function(d, i) { return "translate(" + (xScale(d["monthly-budget"])) + "," + 26 + ")"; })

    monthlyTarget
        .append("path")
        .attr("d", d3.symbol().size(30).type(d3.symbolTriangle))
        .attr("transform", "rotate(180)")
          .attr("pointer-events", "none")
          .style("fill", "#523130")

    const monthlyTargetText = monthlyTarget.append("text")
            .attr("x", 4)
            .attr("y", -8)
            .text(()=>{
                const res = d3.timeFormat("%b")(new Date()) + " target";
                return res;
            })
            .attr("text-anchor", "end")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("fill", "#523130")
            .attr("font-size", "0.6em")
            .attr("font-weight", "700")
            .attr("font-family", "sans-serif")
            .attr("class", "visible")

    const monthlyTargetHiddenText = monthlyTarget.append("text")
            .attr("x", 4)
            .attr("y", -8)
            .text((d) => 
                { 
                    if (config.currency_type == "dollar") {
                        return d3.format("$,.0f")(parseInt(d["monthly-budget"]))
                    } else {
                        return d3.format(",.0f")(parseInt(d["monthly-budget"]))
                    }
                    
                })
            .attr("text-anchor", "end")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("fill", "#523130")
            .attr("font-size", "0.6em")
            .attr("font-weight", "700")
            .attr("font-family", "sans-serif")
            .attr("class", "hidden")
            .attr("opacity", 0)

    const yearForecast = rects
        .selectAll(".forecast")
        .data([budget_forecast_dps])
        .enter()
            .append("g")
            .attr("class", "forecast")
            .attr("transform", function(d, i) { return "translate(" + xScale(d["yearly-forecast"]) + "," + (yScale.bandwidth() + 48) + ")"; })

    yearForecast
        .append("path")
        .attr("d", d3.symbol().size(30).type(d3.symbolTriangle))
          .attr("pointer-events", "none")
          .style("fill", "#989898")

    const yearForecastText = yearForecast.append("text")
            .attr("x", 0)
            .attr("y", 10)
            .text("Forecast")
            .attr("text-anchor", "middle")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("fill", "#989898")
            .attr("font-size", "0.6em")
            .attr("font-weight", "700")
            .attr("font-family", "sans-serif")
            .attr("class", "visible")

    const yearForecastHiddenText = yearForecast.append("text")
            .attr("x", 0)
            .attr("y", 10)
            .text((d) => 
                { 
                    if (config.currency_type == "dollar") {
                        return d3.format("$,.0f")(parseInt(d["yearly-forecast"]))
                    } else {
                        return d3.format(",.0f")(parseInt(d["yearly-forecast"]))
                    }
                    
                })
            .attr("text-anchor", "middle")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("fill", "#989898")
            .attr("font-size", "0.6em")
            .attr("font-weight", "700")
            .attr("font-family", "sans-serif")
            .attr("class", "hidden")
            .attr("opacity", 0)

    // Dummy data
    const quarterlyForecast = rects
        .selectAll(".qforecast")
        .data([budget_forecast_dps])
        .enter()
            .append("g")
            .attr("class", "qforecast")
            .attr("transform", function(d, i) { return "translate(" + (xScale(d["quarterly-forecast"])) + "," + (yScale.bandwidth() + 48) + ")"; })

    quarterlyForecast
        .append("path")
        .attr("d", d3.symbol().size(30).type(d3.symbolTriangle))
          .attr("pointer-events", "none")
          .style("fill", "#6ea6aa")

    const quarterlyForecastText = quarterlyForecast.append("text")
            .attr("x", -4)
            .attr("y", 22)
            .text(()=>{
                const res = "Q" + getQuarter(new Date()) + " forecast";
                return res;
            })
            .attr("text-anchor", "middle")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("fill", "#6ea6aa")
            .attr("font-size", "0.6em")
            .attr("font-weight", "700")
            .attr("font-family", "sans-serif")
            .attr("class", "visible")

    const quarterlyForecastHiddenText = quarterlyForecast.append("text")
            .attr("x", -4)
            .attr("y", 22)
            .text((d) => 
                { 
                    if (config.currency_type == "dollar") {
                        return d3.format("$,.0f")(parseInt(d["quarterly-forecast"]))
                    } else {
                        return d3.format(",.0f")(parseInt(d["quarterly-forecast"]))
                    }
                    
                })
            .attr("text-anchor", "middle")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("fill", "#6ea6aa")
            .attr("font-size", "0.6em")
            .attr("font-weight", "700")
            .attr("font-family", "sans-serif")
            .attr("class", "hidden")
            .attr("opacity", 0)

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
          .style("fill", "#856b69")

    const monthlyForecastText = monthlyForecast.append("text")
            .attr("x", 4)
            .attr("y", 10)
            .text(()=>{
                const res = d3.timeFormat("%b")(new Date()) + " forecast";
                return res;
            })
            .attr("text-anchor", "end")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("fill", "#856b69")
            .attr("font-size", "0.6em")
            .attr("font-weight", "700")
            .attr("font-family", "sans-serif")
            .attr("class", "visible")

        const monthlyForecastHiddenText = monthlyForecast.append("text")
            .attr("x", 4)
            .attr("y", 10)
            .text((d) => 
                { 
                    if (config.currency_type == "dollar") {
                        return d3.format("$,.0f")(parseInt(d["monthly-forecast"]))
                    } else {
                        return d3.format(",.0f")(parseInt(d["monthly-forecast"]))
                    }
                    
                })
            .attr("text-anchor", "end")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("fill", "#856b69")
            .attr("font-size", "0.6em")
            .attr("font-weight", "700")
            .attr("font-family", "sans-serif")
            .attr("class", "hidden")
            .attr("opacity", 0)

    
    // //


    // // Okay from here

    const rightLabels = group.append("g")

    const percPlanLabels = rightLabels
        .selectAll(".perc-label")
        .data([budget_forecast_dps])
        .enter()
            .append("text")
            .attr("x", (d,i) => xScale(d["yearly-budget"]) + 40)
            .attr("y", d => yScale("metric") + yScale.bandwidth()/2 - 3)
            .text(d => d3.format(".0%")(d["yearly-actual"]/d["yearly-budget"]))
            .attr("text-anchor", "middle")
            .style("dominant-baseline", "middle")
            .attr("fill", function(d,i) {
                if (config.color == "yes") {
                    if (d["yearly-actual"]/d["yearly-budget"]) {
                        return "#D76106"
                    } else { return "#0072b5"
                    } 
                } else {
                    return config.color + "1)";
                }
                
            })
            .attr("font-size", "1.8em")
            .attr("font-weight", "500")
            .attr("font-family", "sans-serif")
            .attr("class", "perc-label")
        .append("tspan")
            .attr("x", (d,i) => xScale(d["yearly-budget"]) + 40)
            .attr("y", d => yScale("metric") + yScale.bandwidth()/2 + 16)
            .text("of target")
            .style("text-transform", "uppercase")
            .attr("text-anchor", "middle")
            .style("dominant-baseline", "middle")
            .attr("fill", function(d,i) {
                if (config.color == "yes") {
                    if (d["yearly-actual"]/d["yearly-budget"]) {
                        return "#D76106"
                    } else { return "#0072b5"
                    } 
                } else {
                    return config.color + "1)";
                }
                
            })
            .attr("font-size", "0.35em")
            .attr("font-weight", "500")
            .attr("font-family", "sans-serif")

    const planLabels = rightLabels
        .selectAll(".plan-label")
        .data([budget_forecast_dps])
        .enter()
        .append("text")
            .attr("x", (d,i) => xScale(d["yearly-budget"]) + 110)
            .attr("y", d => yScale("metric") + yScale.bandwidth()/2 - 2)
            .text((d) => 
                { 
                    if (config.currency_type == "dollar") {
                        return d3.format("$,.0f")(parseInt(d["yearly-budget"]))
                    } else {
                        return d3.format(",.0f")(parseInt(d["yearly-budget"]))
                    }
                    
                })
            .attr("text-anchor", "middle")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("fill", "#323232")
            .attr("font-size", "1em")
            .attr("font-weight", "500")
            .attr("font-family", "sans-serif")
            .attr("class", "plan-label")
        .append("tspan")
            .attr("x", (d,i) => xScale(d["yearly-budget"]) + 110)
            .attr("y", d => yScale("metric") + yScale.bandwidth()/2 + 12)
            .text("Target")
            .attr("text-anchor", "middle")
            .style("dominant-baseline", "middle")
            .attr("fill", "#323232")
            .attr("font-size", "0.7em")
            .attr("font-weight", "500")
            .attr("font-family", "sans-serif")

        } catch(error) {
            if (environment == "prod") {
                if (queryResponse.fields.dimensions.length != queryResponse.fields.measures.length) {
                                    this.addError({title: "Data mismatch", message: "This chart requires dimension/measure pairs."});
                                    return;
                                } 
            }  else {
            console.log(error)
        }
    }
        // Callback at the end of the rendering to let Looker know it's finished
        done()
    }
})