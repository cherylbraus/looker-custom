import * as d3 from 'd3'
import * as $ from 'jquery'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'

export const object = {
    id: "bullet-chart",
    label: "ZDev Bullet Chart",
    options: {
        show_legend: {
            type: "boolean",
            label: "Show Legend",
            default: "true",
            section: "General",
            order: 1
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

        // set dimensions
        let margin = {
                top: 10,
                right: 10,
                bottom: 20,
                left: 10
        }

        const width = element.clientWidth;
        const height = element.clientHeight;

        const boundedWidth = width - margin.left - margin.right;
        const boundedHeight = height - margin.top - margin.bottom;

        // TOOLTIPS ---------------------------------------------------------------

        // END TOOLTIPS -----------------------------------------------------------

        // LOAD DATA -----------------------------------------------------------
        const dimensions = queryResponse.fields.dimension_like
        const measures = queryResponse.fields.measure_like
        console.log("dimension", dimensions)
        console.log("measure", measures)
        console.log('data', data)

        let data_ready = []

        data.forEach((d) => {
            let entry = {}
            entry['year'] = +d[dimensions[0].name].value
            entry['month'] = new Date(d[dimensions[1].name].value + 'T00:00')
            entry['day'] = new Date(d[dimensions[2].name].value + 'T00:00')
            entry['daynum'] = +d[dimensions[3].name].value
            entry['actual'] = d[measures[0].name].value
            data_ready.push(entry)
        })

        console.log("data_ready", data_ready)

        const yearAccessor = d => d.year;
        const monthAccessor = d => d.month;
        const dayAccessor = d => d.day;
        const daynumAccessor = d => d.daynum;
        const actualAccessor = d => d.actual;

        const uniqueMonths = [... new Set(data_ready.map(obj => +obj.month))].sort().reverse()
        console.log("uniqueMonths", uniqueMonths)
        const currentMonth = new Date(uniqueMonths[0])
        const priorMonth = new Date(uniqueMonths[1])
        const priorYear = new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth()) // getMonth and new Date() are 0 index
        const prior2Year = new Date(currentMonth.getFullYear() - 2, currentMonth.getMonth())
        const prior3Year = new Date(currentMonth.getFullYear() - 3, currentMonth.getMonth())
        console.log("different dates", currentMonth, priorMonth, priorYear, prior2Year, prior3Year)

        const dateskeep = [currentMonth.toDateString(), 
            priorMonth.toDateString(), 
            priorYear.toDateString(), 
            prior2Year.toDateString(), 
            prior3Year.toDateString()]

        data_ready = data_ready.filter(d => {
            return (dateskeep.includes(d.month.toDateString()))
        })

        console.log("big filter", data_ready)

        const filteredUniqueMonths = [... new Set(data_ready.map((obj) => {return obj.month.toDateString()}))]
        console.log("filteredUniqueMonths", filteredUniqueMonths)

        const indexofcurrent = filteredUniqueMonths.indexOf(currentMonth.toDateString())
        filteredUniqueMonths.splice(indexofcurrent, 1)
        console.log("filteredUniqueMonths", filteredUniqueMonths)

        let dateMap = []
        filteredUniqueMonths.forEach((d,i) => {
            let entry = {}
            entry['dropdownval'] = d
            entry['label'] = `${d.split(" ")[1]}-${d.split(" ")[3]}`
            entry['dateval'] = new Date(d)
            dateMap.push(entry)
        })

        console.log("dateMap", dateMap)

        const listDropdown = $(`#vis-options`);
        listDropdown.empty()

        dateMap.forEach((entry, i) => {
            if (i == 0) {
                listDropdown.append($(`<option></option>`).attr(`value`, entry['dateval']).text(entry['label']).attr("selected","selected"))
            } else {
                listDropdown.append($(`<option></option>`).attr(`value`, entry['dateval']).text(entry['label']))
            }
        })

        listDropdown.on("change", function() {
            redraw()
        })

        function group_by_month(arr) {
            return Object.values(
                arr.reduce((a, {month: month, day: day, daynum: daynum, actual: actual}) => {
                    const key = month;

                    if (a[key] === undefined) {
                        a[key] = {month: key, days: []};
                    }

                    a[key].days.push({
                        day: day,
                        daynum: daynum,
                        actual: actual
                    })
                    return a;
                }, {})
            )
        }

        function redraw() {
            let compperiod = $(`#vis-options option:selected`).val()
            console.log("COMP PERIOD", compperiod)

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

            let data_line = data_ready.filter(d => {
                return (d.month.toDateString() === currentMonth.toDateString() || d.month.toDateString() === new Date(compperiod).toDateString())
            })

            console.log("final filtered data", data_line)

            data_line = data_line.sort(function(a,b) {
                return dayAccessor(a) - dayAccessor(b)
            })

            const data_group = group_by_month(data_line)
            console.log("data_group", data_group)

            // calculate cumulative actuals
            let cumHighs = [];

            data_group.forEach((m, i) => {
                const c = m.days.map((d, j) => ({
                    day: d.day,
                    actcum: m.days.slice(0, j + 1).map(({ actual }) => actual).reduce((x, y) => x + y)
                }))
                console.log(`c - ${i}`, c)

                m.days = m.days.map((item, j) => Object.assign({}, item, c[j]))

                cumHighs.push(d3.max(m.days, d => d.actcum))
            })

            console.log("data_group cum", data_group)
            console.log("cumHighs", cumHighs)

            // X-Axis
            const xScale = d3.scaleLinear()
                .domain(d3.extent(data_line, d => daynumAccessor(d)))
                .range([0, boundedWidth])

            // Y-Axis
            const yScale = d3.scaleLinear()
                .domain([0, Math.max(...cumHighs)])
                .range([boundedHeight, 0])

            // Draw Data
            const line = d3.line()
                .defined(function(d) { return d.actcum != null && d.actnum != 0})
                .curve(d3.curveNatural)
                .x(function(d) { return xScale(d.daynum)})
                .y(function(d) { return yScale(d.actcum)})

            console.log("made line", line)

            const currentLine = group.append("path")
                .data([data_group[1].days])
                .attr("class", "currentmonth")
                .attr("d", line)
                .attr("fill", "none")
                .attr("stroke", "#323232")
                .attr("stroke-width", "2.5px")

            const priorLine = group.append("path")
                .data([data_group[0].days])
                .attr("class", "priormonth")
                .attr("d", line)
                .attr("fill", "none")
                .attr("stroke", "#323232")
                .attr("stroke-width", "2px")
                .attr("stroke-dasharray", "5 3")

            // calculation of MTD comparison as % change
            const current_total = data_group[1].days[data_group[1].days.length - 1].actcum
            const prior_total = ( function() {
                if (data_group[1].days.length > data_group[0].days.length) { // if more days in current month elapsed than in prior had
                    return data_group[0].days[data_group[0].days.length - 1].actcum // use prior month's total, however many days that is
                } else {
                    return data_group[0].days[data_group[1].days.length - 1].actcum // use max days from current and pull that from prior
                }
            })();
            console.log("current and prior MTD totals", current_total, prior_total)

            const formatter = Intl.NumberFormat('en-US', {
                style: 'percent',
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
            })

            const change = formatter.format((current_total - prior_total) / prior_total)
            console.log("change", change)

            const changeContainer = group.append('g')
                .attr("transform", `translate(70, 30)`)
                .classed("changeContainer", true)

            const changeNumber = changeContainer.append("g")
                .classed("change", true)
                .attr("transform", `translate(0, 0)`)

            changeNumber.append("text")
                .attr("x", 10)
                .attr("y", 0)
                .style("text-anchor", "middle")
                .style("dominant-baseline", "middle")
                .style("font-size", 28)
                .attr("fill", () => {
                    console.log("test", current_total, prior_total)
                    if (+current_total >= +prior_total) {
                        console.log("here")
                        return "#0072b5"
                    } else {
                        console.log("here1")
                        return "#D76106"
                    }
                })
                .text(change)

            const changeText = changeContainer.append("g")
                .classed("change", true)
                .attr("transform", "translate(0, 25)")

            changeText.append("text")
                .attr("x", 10)
                .attr("y", 0)
                .style("text-anchor", "middle")
                .style("dominant-baseline", "middle")
                .style("font-size", 12)
                .attr("fill", () => {
                    if (+current_total >= +prior_total) {
                        return "#0072b5"
                    } else {
                        return "#D76106"
                    }
                })
                .text(() => {
                    const temp = new Date(data_group[0].month).toDateString()
                    return `MTD Change vs ${temp.split(" ")[1]}-${temp.split(" ")[3]}`
                })

            // legend
            if (config.show_legend == "true") {
                const legendContainer = group.append("g")
                    .attr("transform", `translate(${boundedWidth - 120},${boundedHeight - 40})`)
                    .classed("legendContainer", true)

                const legendCurrent = legendContainer.append("g")
                    .classed("legend", true)
                    .attr("transform", `translate(6, 2)`)
    
                legendCurrent.append("line")
                    .attr("x1", 6)
                    .attr("x2", 25)
                    .attr("y1", 2)
                    .attr("y2", 2)
                    .attr("stroke", "#323232")
                    .attr("stroke-width", "2.5px")
    
                legendCurrent.append("text")
                    .attr("x", 30)
                    .attr("y", 2)
                    .style("text-anchor", "start")
                    .style("dominant-baseline", "middle")
                    .style("font-size", 11)
                    .attr("color", "#323232")
                    .text("Current Month")
    
                const legendPrior = legendContainer.append("g")
                    .classed("legend", true)
                    .attr("transform", `translate(6, 10)`)
    
                legendPrior.append("line")
                    .attr("x1", 6)
                    .attr("x2", 25)
                    .attr("y1", 10)
                    .attr("y2", 10)
                    .attr("stroke", "#323232")
                    .attr("stroke-width", "2.5px")
                    .attr("stroke-dasharray", "5 3")
    
                legendPrior.append("text")
                    .attr("x", 30)
                    .attr("y", 10)
                    .style("text-anchor", "start")
                    .style("dominant-baseline", "middle")
                    .style("font-size", 11)
                    .attr("color", "#323232")
                    .text( () => {
                        const temp = new Date(data_group[0].month).toDateString()
                        return `${temp.split(" ")[1]}-${temp.split(" ")[3]}`
                    })
            }

        }

        redraw()


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