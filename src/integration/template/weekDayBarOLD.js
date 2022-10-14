import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'

export const object = {

    id: "week-day-bar",
    label: "ZDev Week & Day Bars",
    options: {
        metric_format: {
            type: "string",
            label: "Metric Value Format",
            display: "text",
            default: ",.0f",
            placeholder: "#,###",
            section: "General",
            order: 2
        },
        // comparison: {
        //     type: "string",
        //     label: "Comparison Metric Label",
        //     display: "text",
        //     default: "Forecast",
        //     section: "General",
        //     order: 3
        // },
        budgetlines: {
            type: "boolean",
            label: "Show Budget Goals",
            default: "true",
            section: "General",
            order: 3
        },
        dailylines: {
            type: "boolean",
            label: "Show Daily Avg Budget",
            default: "true",
            section: "General",
            order: 4
        },
        show_yaxis_name: {
            type: "boolean",
            label: "Show Y-Axis Name",
            default: "true",
            section: "Y",
            order: 1
        },
        yaxis_label: {
            type: "string",
            label: "Y-Axis Label",
            display: "text",
            default: "",
            section: "Y",
            order: 2
        },
        yticklabels_show: {
            type: "boolean",
            label: "Show Y Tick Labels",
            default: "true",
            section: "Y",
            order: 3
        },
        ytick_format: {
            type: "string",
            label: "Metric Value Format",
            display: "text",
            default: "~s",
            placeholder: "#,###",
            section: "General",
            order: 2
        },
        y_gridlines: {
            type: "boolean",
            label: "Show Y Gridlines",
            default: "false",
            section: "Y",
            order: 4
        },
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

        // function group_by_week(d) {
        //     d.reduce
        // }
        
        try {

             // set dimensions
             let margin = {
                    top: 45,
                    right: 10,
                    bottom: 60,
                    left: 70
            }

            const width = element.clientWidth;
            const height = element.clientHeight;

            const boundedWidth = width - margin.left - margin.right;
            const boundedHeight = height - margin.top - margin.bottom;

            const svg = (
                d3.select(element).select("svg")
                    .html("")
                    .attr("width", "100%")
                    .attr("height", "100%")
            )

            const group = svg.append("g")
                .attr("transform", `translate(${margin.left}, ${margin.top})`)
                .attr("width", "100%")
                .attr("height", ((boundedHeight) + "px"))
                .classed("group", true)

            // TOOLTIPS ---------------------------------------------------------------
            const tooltip = d3.select(".tooltip")
            .style("position", "absolute")
            .style("padding", "5px")
            .style("background-color", "white")
            .style("opacity", 0)
            .style("border-radius", "4px")
            .style("display", "block")
            .style("border", "solid")
            .style("border-color", "lightgrey")
            .style("border-width", ".5px")

            tooltip.html('<div id="tt-header"></div><p id="tt-body"></p>')

            const tooltipHeader = tooltip.select("#tt-header")
            const tooltipBody = tooltip.select("#tt-body")

            const mouseover = function(d) {
                tooltip
                    .transition()
                    .duration(0)
                    .style("opacity", 0.95)

                d3.select(this)
                    .style("opacity", 1)

                console.log("mouseover", d3.mouse(this))
            }

            const mouseleave = function(d) {
                tooltip
                    .transition()
                    .duration(0)
                    .style("opacity", 0)

                d3.select(this)
                    .style("opacity", 1)

                console.log("mouseleave", d3.mouse(this))
            }

            // const mousemove = function(d) {
            //     console.log("mousemove", d3.mouse(this))
            // }

            const mousemove = function({ data = {}, label = "weekbar" } = {}) {
                console.log("tooltip0")
                // console.log(d3.mouse(this))
                // console.log(d3.mouse(this)[1])
                // console.log(d3.event.pageX)

                // tooltip
                //     .style("top", (d3.event.pageY - 10 + "px"))
                //     .style("left", d3.event.pageX - 50 + "px")

                if (d3.event.pageY < boundedHeight*.7) {
                    console.log("here less")
                    tooltip
                        .style("top", (d3.event.pageY - 60 + "px"))
                } else {
                    tooltip
                        .style("top", (d3.event.pageY - 160 + "px"))
                }
    
                if (d3.event.pageX < boundedWidth*.7) {
                    tooltip
                        .style("left", d3.event.pageX + 10 + "px") 
                } else {
                    if (label === "daycircle") {
                        tooltip     
                            .style("left", d3.event.pageX - 100 + "px")
                    } else {
                        tooltip
                            .style("left", d3.event.pageX - 170 + "px")
                    }
                }

                console.log("tooltip1")

                let title;
                let metricName;
                let metricRef;
                if (label === 'daycircle') {
                    tooltipHeader.html(`Day: ${d3.timeFormat("%b %-d")(data.day)}<hr>`)
                    tooltipBody.html('<span style="float:left;">Actual:&nbsp</span>' + `<span style="float:right;">${d3.format(config.metric_format)(data["actual"])}</span>`)
                } else {
                    let prefix;
                    let prefix2
                    console.log("legend check", data.week.getTime(), lastWeek.getTime())
                    if (data.week.getTime() === lastWeek.getTime()) {
                        prefix = "WTD "
                        prefix2 = "Tot "
                    } else {
                        prefix = ""
                        prefix2 = ""
                    }

                    tooltipHeader.html(`Week: ${d3.timeFormat("%b %-d")(data.week)}<hr>`)
                    tooltipBody.html(
                        `<span style="float:left;">Actual:&nbsp&nbsp</span>` + `<span style="float:right;">${d3.format(config.metric_format)(data["actual"])}</span><br>` + 
                        `<span style="float:left;">Actual-Contract:&nbsp&nbsp</span>` + `<span style="float:right;">${d3.format(config.metric_format)(data["actualContract"])}</span><br>` + 
                        `<span style="float:left;">Actual-Spot:&nbsp&nbsp</span>` + `<span style="float:right;">${d3.format(config.metric_format)(data["actualSpot"])}</span><br>` + 
                        `<span style="float:left;">${prefix}Budget:&nbsp&nbsp</span>` + `<span style="float:right;">${d3.format(config.metric_format)(data["budgetTD"])}</span><br>` +
                        `<span style="float:left;">% to ${prefix2}Budget:&nbsp&nbsp</span>` + `<span style="float:right;">${d3.format(",.0%")(data["actual"]/data["budget"])}</span><br>` + 
                        `<span style="float:left;">${prefix}Forecast:&nbsp&nbsp</span>` + `<span style="float:right;">${d3.format(config.metric_format)(data["forecastTD"])}</span><br>` +
                        `<span style="float:left;">% to ${prefix2}Forecast:&nbsp&nbsp</span>` + `<span style="float:right;">${d3.format(",.0%")(data["actual"]/data["forecast"])}</span><br>` + 
                        `<span style="float:left;">Daily Budget:&nbsp&nbsp</span>` + `<span style="float:right;">${d3.format(config.metric_format)(data["budget"]/7)}</span>`
                    )
                }

                console.log("mousemove")
            }

            // END TOOLTIPS -----------------------------------------------------------

            // load data
            const dimensions = queryResponse.fields.dimension_like
            const measures = queryResponse.fields.measure_like
            console.log("dimension", dimensions)
            console.log("measure", measures)
            console.log('data', data)

            // manipulate data
            let week; 
            let day;

            if (dimensions[0].time_interval['name'] === "week") {
                week = dimensions[0].name
                day = dimensions[1].name
            } else {
                week = dimensions[1].name
                day = dimensions[0].name
            }

            let data_ready = []
            
            data.forEach((d) => {
            
                let entry = {}
                entry['week'] = new Date(d[week].value + 'T00:00')
                entry['day'] = new Date(d[day].value + 'T00:00')
                entry['dayofwk'] = d3.timeFormat("%a")(entry['day'])
                entry['budget'] = d[measures[0].name].value
                entry['forecast'] = d[measures[1].name].value
                entry['budgetTD'] = d[measures[2].name].value
                entry['forecastTD'] = d[measures[3].name].value
                entry['actual'] = d[measures[4].name].value
                entry['actualContract'] = d[measures[5].name].value
                entry['actualSpot'] = d[measures[6].name].value
                data_ready.push(entry)          
            })

            console.log("data_ready", data_ready)

            const weekAccessor = d => d.week
            const dayAccessor = d => d.day
            const dayofwkAccessor = d => d.dayofwk
            const budgetAccessor = d => d.budget
            const forecastAccessor = d => d.forecast
            const budgetTDAccessor = d => d.budgetTD
            const forecastTDAccessor = d => d.forecastTD
            const actualAccessor = d => d.actual
            const actualContractAccessor = d => d.actualContract
            const actualSpotAccessor = d => d.actualSpot

            // filter data - might want to check this?
            const uniqueWeeks = [... new Set(data_ready.map(obj => +obj.week))].sort() // .map(tv => new Date(tv)).sort()
            const lastWeek = data_ready.filter(element => element.day.getTime() === new Date(new Date().setHours(0,0,0,0)).getTime())[0]['week']
            const indexFourWkAgo = uniqueWeeks.indexOf(+lastWeek) - 3
            const firstWeek = new Date(uniqueWeeks[indexFourWkAgo])

            // const firstWeek = data_ready.filter(element => element.day.getTime() === new Date(new Date(new Date().getFullYear(), new Date().getMonth(), 1).setHours(0,0,0,0)).getTime())[0]['week']
            data_ready = data_ready.filter(element => {
                const weekDate = element.week;
                return (weekDate >= firstWeek && weekDate <= lastWeek)
            })

            console.log("data_ready filtered", data_ready)

            data_ready = data_ready.sort(function(a,b) {
                return dayAccessor(a) - dayAccessor(b)
            })

            // group the data by week
            function group_by_week(arr) {
                return Object.values(
                    data_ready.reduce((a, {week: weekStart, 
                                    day: dayVal, 
                                    dayofwk: dayofwk,
                                    budget: budgetVal,
                                    forecast: forecastVal,
                                    budgetTD: budgetTDVal,
                                    forecastTD: forecastTDVal,
                                    actual: actualVal,
                                    actualContract: actualContractVal,
                                    actualSpot: actualSpotVal
                                }) => {
                        const key = weekStart;
        
                        if (a[key] === undefined) {
                            a[key] = {week: key, 
                                budget: 0, 
                                forecast: 0,
                                budgetTD: 0,
                                forecastTD: 0, 
                                actual: 0, 
                                actualContract: 0,
                                actualSpot: 0,
                                days: []};
                        }
        
                        a[key].budget += budgetVal;
                        a[key].forecast += forecastVal;
                        a[key].budgetTD += budgetTDVal;
                        a[key].forecastTD += forecastTDVal;
                        a[key].actual += actualVal;
                        a[key].actualContract += actualContractVal;
                        a[key].actualSpot += actualSpotVal;
                        a[key].days.push({
                            day: dayVal,
                            budget: budgetVal,
                            forecast: forecastVal,
                            actual: actualVal,
                            dayofwk: dayofwk
                        })
        
                        return a;
                    }, {})
                )
            }
                
            const data_group = group_by_week(data_ready)
            console.log("data group", data_group)

            
            // scales
            const xScale = d3.scaleBand()
                .domain(data_group.map(d => weekAccessor(d)))
                .range([0, boundedWidth])
                .padding(0.15)

            const xCompScale = d3.scaleBand()
                .domain(data_group.map(d => weekAccessor(d)))
                .range([0, boundedWidth])
                .padding(0.03)


            let yScale = d3.scaleLinear()
                .range([boundedHeight, 0])

            if (config.budgetlines == "true") {
                yScale
                    .domain([0, Math.max(d3.max(data_group, d => actualAccessor(d)), d3.max(data_group, d => budgetAccessor(d)))])
            } else {
                yScale
                    .domain([0, Math.max(d3.max(data_group, d => actualAccessor(d)), d3.max(data_group, d => forecastAccessor(d)))])
            }
            

            const dayDomain = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

            const xDailyScale = d3.scalePoint()
                .domain(dayDomain)
                .padding(0.5)

            const xDailyAxisGenerator = d3.axisBottom()
                .scale(xDailyScale)
                .tickPadding(5)
                .tickSizeOuter(0)
                .tickSizeInner(0)
                .tickFormat((d, i) => d.slice(0,1))

             // peripherals (axes)
             const xAxisGenerator = d3.axisBottom()
                .scale(xScale)
                .tickPadding(30)
                .tickSizeOuter(0)
                .tickSizeInner(0)
                .tickFormat((d, i) => `Week: ${d3.timeFormat("%b %-d")(d)}`)

            const yAxisGenerator = d3.axisLeft()
                .scale(yScale)
                .tickPadding(10)
                .ticks(9)

            if (config.yticklabels_show === "true") {
                yAxisGenerator
                    .tickFormat(d3.format(config.ytick_format))
            } else {
                yAxisGenerator
                    .tickFormat("")
            }

            if (config.y_gridlines === "true") {
                yAxisGenerator
                    .tickSize(-boundedWidth)
            } else {
                yAxisGenerator
                    .tickSize(0)
            }

            const xAxis = group.append("g")
                .call(xAxisGenerator)
                    .style("transform", `translateY(${boundedHeight}px)`)
                    .attr("class", "x-axis")

            const yAxis = group.append("g")
                .call(yAxisGenerator)
                    .attr("class", "y-axis")

            // axis labels
            if (config.show_yaxis_name == "true") {
                const yAxisLabel = yAxis.append("text")
                    .attr("class", "axis-label")
                    .attr("x", (-boundedHeight/2))
                    .attr("y", -margin.left + 18)
                    .style("transform", "rotate(-90deg)")
                    // .text("Metric Name")
                    .text(function() {
                        if (config.yaxis_label != "") {
                            return config.yaxis_label
                        } else {
                            return measures[0].label_short.split(" ")[0]
                        }
                    })
            }

            
            // draw large/week bars
            const weekGroups = group.append("g")
                .attr("class", "week-groups")
                .selectAll("g")
                .data(data_group)
                .enter()
                .append("g")
                    .attr("class", d => `singleweek ${d3.timeFormat('%b%d')(weekAccessor(d))}`)
                    
            const weekBars = weekGroups
                .append("rect")
                    .attr("x", d => xScale(weekAccessor(d)))
                    .attr("y", d => yScale(actualAccessor(d)))
                    .attr("width", xScale.bandwidth())
                    .attr("height", d => boundedHeight - yScale(actualAccessor(d)))
                    .attr("fill-opacity", 0.2)
                    .attr("fill", function(d,i) {
                        if (actualAccessor(d) < forecastTDAccessor(d)) {
                            return "#D76106"
                        } else {
                            return "#0072b5"
                        }
                    })
                    .attr("stroke", function(d,i) {
                        if (actualAccessor(d) < forecastTDAccessor(d)) {
                            return "#D76106"
                        } else {
                            return "#0072b5"
                        }
                    })
                    .attr("stroke-width", 4)
                    .attr("stroke-opacity", 1.0)
                    .on("mouseover", mouseover)
                    .on("mousemove", d => mousemove({ data: d, label: "weekbar" }))
                    .on("mouseleave", mouseleave)

            // draw weekly forecast lines
            const compBars = weekGroups 
                .append("rect")
                    .attr("x", d => xScale(weekAccessor(d)) - 0.045*(xScale.bandwidth()))
                    .attr("y", d => yScale(forecastTDAccessor(d)))
                    .attr("width", xScale.bandwidth() + 0.09*(xScale.bandwidth()))
                    .attr("height", 3)
                    .attr("fill", "lightgrey")
                    .attr("stroke", "black")
                    .attr("stroke-width", 1)
                    .on("mouseover", mouseover)
                    .on("mousemove", d => mousemove({ data: d, label: "forecastrect" }))
                    .on("mouseleave", mouseleave)

            // draw monthly budget lines
            if (config.budgetlines === "true" ) {
                const budgetGoalLine = weekGroups 
                    .append("rect")
                        .attr("x", d => xScale(weekAccessor(d)) - 0.045*(xScale.bandwidth()))
                        .attr("y", d => yScale(budgetTDAccessor(d)))
                        .attr("width", xScale.bandwidth() + 0.09*(xScale.bandwidth()))
                        .attr("height", 3)
                        .attr("fill", "black")
                        .on("mouseover", mouseover)
                        .on("mousemove", d => mousemove({ data: d, label: "budgetline" }))
                        .on("mouseleave", mouseleave)
            }   

            // draw simple daily goal
            if (config.dailylines === "true" ) {
                const dayGoalLine = weekGroups
                    .append("line")
                        .attr("x1", d => xScale(weekAccessor(d)))
                        .attr("x2", d => xScale(weekAccessor(d)) + xScale.bandwidth())
                        .attr("y1", d => yScale(budgetAccessor(d)/7))
                        .attr("y2", d => yScale(budgetAccessor(d)/7))
                        .attr("stroke", "grey")
                        .attr("stroke-width", 1)
                        .attr("stroke-dasharray", ("5,3"))
                        .attr("class", "daily-average-goal")
                        .on("mouseover", mouseover)
                        .on("mousemove", d => mousemove({ data: d, label: "daygoalline" }))
                        .on("mouseleave", mouseleave)
            }           


            // add daily lines for day that has passed
            d3.selectAll(".singleweek").each(function (e, i) {
                xDailyScale
                    .range([
                        xScale(e.week),
                        xScale(e.week) + xScale.bandwidth()
                    ])

                d3.select(this)
                    .selectAll("line .daily-lines")
                    .data(data_group[i].days)
                    .enter()
                    .append("line")
                        .attr("x1", d => xDailyScale(dayofwkAccessor(d)))
                        .attr("x2", d => xDailyScale(dayofwkAccessor(d)))
                        .attr("y1", d => yScale(actualAccessor(d)))
                        .attr("y2", yScale(0))
                        .attr("stroke", "black")
                        .attr("stroke-width", 2.5)
                        .attr("class", "daily-lines")
                        .on("mouseover", mouseover)
                        .on("mousemove", d => mousemove({ data: d, label: "daycircle" }))
                        .on("mouseleave", mouseleave)

                d3.select(this)
                    .selectAll("circle")
                    .data(data_group[i].days)
                    .enter()
                    .append("circle")
                        .attr("cx", d => xDailyScale(dayofwkAccessor(d)))
                        .attr("cy", d => yScale(actualAccessor(d)))
                        .attr("r", d => {
                            if (actualAccessor(d) === 0) {
                                return 0
                            } else {
                                return 4
                            }
                        })
                        .attr("fill", "black")
                        .on("mouseover", mouseover)
                        .on("mousemove", d => mousemove({ data: d, label: "daycircle" }))
                        .on("mouseleave", mouseleave)

                d3.select(this).append("g")
                    .call(xDailyAxisGenerator)
                        .style("transform", `translateY(${boundedHeight}px)`)
            })


            console.log("here2")


            // legend
            const legendContainer = group.append("g")
                .attr("transform", "translate(0,0)")
                .classed("legendContainer", true)

            const legendGoal = legendContainer.append('g')
                .classed("legend", true)
                .attr("transform", `translate(6, -25)`)

            legendGoal.append("text")
                .attr("x", 20)
                .attr("y", 0)
                .style("text-anchor", "start")
                .style("dominant-baseline", "middle")
                .style("font-size", 11)
                .text(`WTD Forecast`)

            legendGoal.append("rect")
                .attr("x", 0)
                .attr("y", -3)
                .attr("width", 15)
                .attr("height", 3)
                .attr("fill", "lightgrey")
                .attr("stroke", "black")
                .attr("stroke-width", 1)

            const legendXcoord = (() => {
                if (config.dailylines == "true" && config.budgetlines == "true") {
                    return 208
                } else if (config.dailylines == "true" || config.budgetlines == "true") {
                    return 110
                } else {
                    return 0
                }
            })();

            console.log("legendXcoord", legendXcoord)

            if (config.budgetlines == "true" ) {
                const legendBudget = legendContainer.append('g')
                    .classed("legend", true)
                    .attr("transform", `translate(110, -25)`)

                legendBudget.append("text")
                    .attr("x", 20)
                    .attr("y", 0)
                    .style("text-anchor", "start")
                    .style("dominant-baseline", "middle")
                    .style("font-size", 11)
                    .text(`WTD Budget`)

                legendBudget.append("rect")
                    .attr("x", 0)
                    .attr("y", -2)
                    .attr("width", 15)
                    .attr("height", 3)
                    .attr("fill", "black")
            }

            
            if (config.dailylines == "true" ) {
                const legendDayGoal = legendContainer.append('g')
                    .classed("legend", true)
                    .attr("transform", `translate(${legendXcoord}, -25)`)

                legendDayGoal.append("text")
                    .attr("x", 20)
                    .attr("y", 0)
                    .style("text-anchor", "start")
                    .style("dominant-baseline", "middle")
                    .style("font-size", 11)
                    .text('Daily Budget')

                legendDayGoal.append("line")
                    .attr("x1", 0)
                    .attr("x2", 15)
                    .attr("y1", -1)
                    .attr("y2", -1)
                    .attr("stroke", "grey")
                    .attr("stroke-width", 2)
                    .attr("stroke-dasharray", ("5,3"))
            }


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