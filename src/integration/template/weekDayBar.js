import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'

export const object = {

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

        // function group_by_week(d) {
        //     d.reduce
        // }
        
        try {

             // set dimensions
             let margin = {
                    top: 30,
                    right: 10,
                    bottom: 60,
                    left: 80
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
                entry['comp'] = d[measures[0].name].value
                entry['actual'] = d[measures[1].name].value
                data_ready.push(entry)          
            })

            console.log("data_ready", data_ready)

            const weekAccessor = d => d.week
            const dayAccessor = d => d.day
            const dayofwkAccessor = d => d.dayofwk
            const actualAccessor = d => d.actualVal
            const compAccessor = d => d.compVal

            // filter data - might want to check this?
            const lastWeek = data_ready.filter(element => element.day.getTime() === new Date(new Date().setHours(0,0,0,0)).getTime())[0]['week']
            const firstWeek = data_ready.filter(element => element.day.getTime() === new Date(new Date(new Date().getFullYear(), new Date().getMonth(), 1).setHours(0,0,0,0)).getTime())[0]['week']
            data_ready = data_ready.filter(element => {
                const weekDate = element.week;
                return (weekDate >= firstWeek && weekDate <= lastWeek)
            })

            console.log("data_ready filtered", data_ready)

            data_ready = data_ready.sort(function(a,b) {
                return dayAccessor(a) - dayAccessor(b)
            })

            function group_by_week(arr) {
                return Object.values(
                    data_ready.reduce((a, {week: weekStart, comp: compVal, actual: actualVal, day: dayVal, dayofwk: dayofwk}) => {
                        const key = weekStart;
        
                        if (a[key] === undefined) {
                            a[key] = {week: key, compVal: 0, actualVal: 0, days: []};
                        }
        
                        a[key].compVal += compVal;
                        a[key].actualVal += actualVal;
                        a[key].days.push({
                            day: dayVal,
                            actualVal: actualVal,
                            compVal: compVal,
                            dayofwk: dayofwk
                        })
        
                        return a;
                    }, {})
                )
            }
                
            const data_group = group_by_week(data_ready)
            console.log("data group", data_group)

            
            // scales
            const dayDomain = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

            const xScale = d3.scaleBand()
                .domain(data_group.map(d => weekAccessor(d)))
                .range([0, boundedWidth])
                .padding(0.15)

            const xCompScale = d3.scaleBand()
                .domain(data_group.map(d => weekAccessor(d)))
                .range([0, boundedWidth])
                .padding(0.03)

            const yScale = d3.scaleLinear()
                .domain([0, Math.max(d3.max(data_group, d => actualAccessor(d)), d3.max(data_group, d => compAccessor(d)))])
                .range([boundedHeight, 0])

            
            // draw large bars
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
                        if (actualAccessor(d) < compAccessor(d)) {
                            return "#D76106"
                        } else {
                            return "#0072b5"
                        }
                    })
                    .attr("stroke", function(d,i) {
                        if (actualAccessor(d) < compAccessor(d)) {
                            return "#D76106"
                        } else {
                            return "#0072b5"
                        }
                    })
                    .attr("stroke-width", 4)
                    .attr("stroke-opacity", 1.0)

            const compBars = weekGroups 
                .append("rect")
                    .attr("x", d => xScale(weekAccessor(d)) - 0.045*(xScale.bandwidth()))
                    .attr("y", d => yScale(compAccessor(d)))
                    .attr("width", xScale.bandwidth() + 0.09*(xScale.bandwidth()))
                    .attr("height", 3)
                    .attr("fill", "black")

            // add daily lines
            const xDailyScale = d3.scalePoint()
                .domain(dayDomain)
                .padding(0.5)

            const xDailyAxisGenerator = d3.axisBottom()
                .scale(xDailyScale)
                .tickPadding(5)
                .tickSizeOuter(0)

            d3.selectAll(".singleweek").each(function (e, i) {
                xDailyScale
                    .range([
                        xScale(e.week),
                        xScale(e.week) + xScale.bandwidth()
                    ])

                d3.select(this)
                    .selectAll("line")
                    .data(data_group[i].days)
                    .enter()
                    .append("line")
                        .attr("x1", d => xDailyScale(dayofwkAccessor(d)))
                        .attr("x2", d => xDailyScale(dayofwkAccessor(d)))
                        .attr("y1", d => yScale(actualAccessor(d)))
                        .attr("y2", yScale(0))
                        .attr("stroke", "black")
                        .attr("stroke-width", 3)
                        .attr("class", d => dayofwkAccessor(d))

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
                                return 6
                            }
                        })
                        .attr("fill", "black")

                d3.select(this).append("g")
                    .call(xDailyAxisGenerator)
                        .style("transform", `translateY(${boundedHeight}px)`)
            })


            console.log("here2")



            // peripherals (axes)
            const xAxisGenerator = d3.axisBottom()
                .scale(xScale)
                .tickPadding(30)
                .tickSizeOuter(0)
                .tickFormat(d3.timeFormat("%b %-d"))

            const yAxisGenerator = d3.axisLeft()
                .scale(yScale)
                .tickPadding(10)

            const xAxis = group.append("g")
                .call(xAxisGenerator)
                    .style("transform", `translateY(${boundedHeight}px)`)
                    .attr("class", "x-axis")

            const yAxis = group.append("g")
                .call(yAxisGenerator)
                    .attr("class", "y-axis")



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