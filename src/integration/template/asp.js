import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'
import { line, selectAll } from 'd3'
import { stripComments } from 'tslint/lib/utils'
import { textSpanContainsPosition } from 'typescript'
import * as $ from 'jquery'

export const object = {
    id: "asp",
    label: "ASP",
    options: {
        view: {
            section: "Setup",
            order: 1,
            type: "string",
            display: "radio",
            label: "View",
            values: [
                {"Single Shipment": "single"},
                {"Multiple Bids": "multiple"}
            ],
            default: "single"
        },
        selector: {
            section: "Setup",
            order: 2,
            type: "string",
            display: "radio",
            label: "Shipment Selector",
            values: [
                {"Price Request ID": "pr_id"},
                {"External ID & Shipper Application ID": "ext_app_ids"}
            ],
            default: "pr_id"
        },
        pr_id: {
            section: "Setup",
            order: 3,
            type: "string",
            display: "text",
            label: "Price Request ID",
            default: "80215373"
        },
        metric: {
            section: "Setup",
            order: 4,
            type: "string",
            display: "radio",
            label: "Metric Focus",
            values: [
                {"2-Bid Comparison": "twobid"},
                {"Cost Reduction Comparison": "costreduc"},
                {"Averages & Distributions": "avgdist"}
            ],
            default: "twobid"
        },
        x_min: {
            section: "Axes",
            order: 1,
            type: "string",
            display: "text",
            label: "X Min %",
            default: ".8"
        },
        x_max: {
            section: "Axes",
            order: 2,
            type: "string",
            display: "text",
            label: "X Max %",
            default: "1.05"
        },
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

            async function drawASP() {
                let data = await d3.csv("/asp_stub.csv")
                console.log("data", data)

                // PLOT AREA SETUP
                let margin = {
                    top: 10, 
                    right: 20,
                    bottom: 40, 
                    left: 90
                }

                const width = element.clientWidth - margin.left - margin.right;
                const height = (element.clientHeight * .30) - margin.top - margin.bottom;

                const svg1 = (
                    d3.select(element).select("svg#first")
                        .html('')
                        .attr("width", "100%")
                        .attr("height", "30%")
                )

                const group1 = svg1.append("g")
                    .attr("transform", `translate(${margin.left}, ${margin.top})`)
                    .attr("width", "100%")
                    .attr("height", (height + 'px'))
                    .classed("group", true)

                const svg2 = (
                    d3.select(element).select("svg#second")
                        .html('')
                        .attr("width", "100%")
                        .attr("height", "30%")
                )

                const group2 = svg2.append("g")
                    .attr("transform", `translate(${margin.left}, ${margin.top + (height * 0.05)})`)
                    .attr("width", "100%")
                    .attr("height", (height + 'px'))
                    .classed("group", true)

                const svg3 = (
                    d3.select(element).select("svg#third")
                        .html('')
                        .attr("width", "100%")
                        .attr("height", "30%")
                )

                const group3 = svg3.append("g")
                    .attr("transform", `translate(${margin.left}, ${margin.top + (height * 0.10)})`)
                    .attr("width", "100%")
                    .attr("height", (height + 'px'))
                    .classed("group", true)

                // DATA SETUP
                let data_ready = []
                data.forEach((d) => {
                    let entry = {}

                    entry["event_price_request_id"] = d["event_price_request_id"]
                    entry["bid_to_dat"] = +d["bid_to_dat"]
                    entry["bid_made_at_this_level"] = d["bid_made_at_this_level"]
                    entry["dat_rate"] = +d["dat_rate"]
                    entry["expected_margin_dollars"] = +d["expected_margin_dollars"] 
                    entry["expected_margin_dollars_no_appetite"] = +d["expected_margin_dollars_no_appetite"]
                    entry["expected_margin_dollars_with_appetite"] = +d["expected_margin_dollars_with_appetite"]
                    entry["margin_dollars"] = +d["margin_dollars"]
                    entry["margin_dollars_no_appetite"] = +d["margin_dollars_no_appetite"]
                    entry["margin_dollars_with_appetite"] = +d["margin_dollars_with_appetite"]
                    entry["pwin"] = +d["pwin"]

                    data_ready.push(entry)
                })

                const idAccessor = d => d.event_price_request_id;
                const bidtodatAccessor = d => d.bid_to_dat;
                const bidmadeAccessor = d => d.bid_made_at_this_level;
                const datrateAccessor = d => dat_rate;
                const expmarginAccessor = d => d.expected_margin_dollars;
                const expmarginnoappAccessor = d => d.expected_margin_dollars_no_appetite;
                const expmarginappAccessor = d => d.expected_margin_dollars_with_appetite;
                const marginAccessor = d => d.margin_dollars;
                const marginnoappAccessor = d => d.margin_dollars_no_appetite;
                const marginappAccessor = d => d.margin_dollars_with_appetite;
                const pwinAccessor = d => d.pwin;

                // DATA FILTERING
                const xmin = config.x_min == null ? d3.min(dataBid, d => bidtodatAccessor(d)) : config.x_min;
                const xmax = config.x_max == null ? d3.max(dataBid, d => bidtodatAccessor(d)) : config.x_max;

                const dataBid = data_ready.filter(function(d) {
                    return (d.event_price_request_id == config.pr_id && +d.bid_to_dat >= +xmin && +d.bid_to_dat <= +xmax)
                })

                const dataBidYes = data_ready.filter(function(d) {
                    return (d.event_price_request_id == config.pr_id && d.bid_made_at_this_level == "True")
                })

                console.log("dataBid", dataBid)
                console.log("dataBidYes", dataBidYes)

                // COMMON X-AXIS
                const xScale = d3.scaleLinear()
                    .domain([xmin, xmax])
                    // .domain(d3.extent(dataBid, d => bidtodatAccessor(d)))
                    .range([0, width])

                const xAxisGenerator = d3.axisBottom() 
                    .scale(xScale)
                    .tickFormat("")
                    .tickSize(0)
                    .tickPadding(10)

                // ----------------------------------------------------------------
                // INTERACTIONS
                const bisect = d3.bisector(function(d) { return d.bid_to_dat; }).left;
                
                function mouseover() {
                    focusCircle1.style("opacity", 1)
                    focusX1.style("opacity", 1)
                    focusY1.style("opacity", 1)
                    focusXtext1.style("opacity", 1)
                    focusYtext1.style("opacity", 1)

                    focusCircle2.style("opacity", 1)
                    focusX2.style("opacity", 1)
                    focusY2.style("opacity", 1)
                    focusXtext2.style("opacity", 1)
                    focusYtext2.style("opacity", 1)

                    focusCircle3.style("opacity", 1)
                    focusX3.style("opacity", 1)
                    focusY3.style("opacity", 1)
                    focusXtext3.style("opacity", 1)
                    focusYtext3.style("opacity", 1)

                    tooltipFocus.style("opacity", 1)
                }

                function mousemove() {
                    const x0 = xScale.invert(d3.mouse(this)[0])
                    const i = bisect(dataBid, x0, 1)
                    const selectedData = dataBid[i]

                    focusCircle1
                        .transition()
                        .duration(0)
                        .attr("cx", xScale(selectedData.bid_to_dat))
                        .attr("cy", yScale1(selectedData.pwin))

                    focusX1
                        .attr("x1", xScale(selectedData.bid_to_dat))
                        .attr("x2", xScale(selectedData.bid_to_dat))
                        .attr("y1", yScale1(selectedData.pwin))
                        .attr("y2", yScale1(yScale1.domain()[0]))

                    focusY1
                        .attr("x1", xScale(xScale.domain()[0]))
                        .attr("x2", xScale(selectedData.bid_to_dat))
                        .attr("y1", yScale1(selectedData.pwin))
                        .attr("y2", yScale1(selectedData.pwin))

                    focusXtext1
                        .text(d3.format(",.0%")(selectedData.bid_to_dat))
                        .attr("x", xScale(selectedData.bid_to_dat))
                        .attr("y", yScale1(yScale1.domain()[0]) + 17)

                    focusYtext1
                        .text(d3.format(",.0%")(selectedData.pwin))
                        .attr("x", xScale(xScale.domain()[0]) - 30)
                        .attr("y", yScale1(selectedData.pwin))

                    focusCircle2
                        .transition()
                        .duration(0)
                        .attr("cx", xScale(selectedData.bid_to_dat))
                        .attr("cy", yScale2(selectedData.margin_dollars))

                    focusX2
                        .attr("x1", xScale(selectedData.bid_to_dat))
                        .attr("x2", xScale(selectedData.bid_to_dat))
                        .attr("y1", yScale2(selectedData.margin_dollars))
                        .attr("y2", yScale2(yScale2.domain()[0]))

                    focusY2
                        .attr("x1", xScale(xScale.domain()[0]))
                        .attr("x2", xScale(selectedData.bid_to_dat))
                        .attr("y1", yScale2(selectedData.margin_dollars))
                        .attr("y2", yScale2(selectedData.margin_dollars))

                    focusXtext2
                        .text(d3.format(",.0%")(selectedData.bid_to_dat))
                        .attr("x", xScale(selectedData.bid_to_dat))
                        .attr("y", yScale2(yScale2.domain()[0]) + 17)

                    focusYtext2
                        .text(d3.format("$,.0f")(selectedData.margin_dollars))
                        .attr("x", xScale(xScale.domain()[0]) - 30)
                        .attr("y", yScale2(selectedData.margin_dollars))

                    focusCircle3
                        .transition()
                        .duration(0)
                        .attr("cx", xScale(selectedData.bid_to_dat))
                        .attr("cy", yScale3(selectedData.expected_margin_dollars))

                    focusX3
                        .attr("x1", xScale(selectedData.bid_to_dat))
                        .attr("x2", xScale(selectedData.bid_to_dat))
                        .attr("y1", yScale3(selectedData.expected_margin_dollars))
                        .attr("y2", yScale3(yScale3.domain()[0]))

                    focusY3
                        .attr("x1", xScale(xScale.domain()[0]))
                        .attr("x2", xScale(selectedData.bid_to_dat))
                        .attr("y1", yScale3(selectedData.expected_margin_dollars))
                        .attr("y2", yScale3(selectedData.expected_margin_dollars))

                    focusXtext3
                        .text(d3.format(",.0%")(selectedData.bid_to_dat))
                        .attr("x", xScale(selectedData.bid_to_dat))
                        .attr("y", yScale3(yScale3.domain()[0]) + 17)

                    focusYtext3
                        .text(d3.format("$,.0f")(selectedData.expected_margin_dollars))
                        .attr("x", xScale(xScale.domain()[0]) - 30)
                        .attr("y", yScale3(selectedData.expected_margin_dollars))

                    tooltipFocusBody.html(
                        `<span style="float:left;"><b>Possible Bid</b></span><br>` + 
                        `<span style="float:left;">Ratio to DAT:&nbsp&nbsp</span>` + `<span style="float:right;">${d3.format(",.0%")(selectedData.bid_to_dat)}</span><br>` + 
                        `<span style="float:left;">Win Probability:&nbsp&nbsp</span>` + `<span style="float:right;">${d3.format(",.0%")(selectedData.pwin)}</span><br>` + 
                        `<span style="float:left;">Margin:&nbsp&nbsp</span>` + `<span style="float:right;">${d3.format("$,.0f")(selectedData.margin_dollars)}</span><br>` + 
                        `<span style="float:left;">Expected Margin:&nbsp&nbsp</span>` + `<span style="float:right;">${d3.format("$,.0f")(selectedData.expected_margin_dollars)}</span>` 
                    )
                }

                function mouseout() {
                    focusCircle1.style("opacity", 0)
                    focusX1.style("opacity", 0)
                    focusY1.style("opacity", 0)
                    focusXtext1.style("opacity", 0)
                    focusYtext1.style("opacity", 0)

                    focusCircle2.style("opacity", 0)
                    focusX2.style("opacity", 0)
                    focusY2.style("opacity", 0)
                    focusXtext2.style("opacity", 0)
                    focusYtext2.style("opacity", 0)

                    focusCircle3.style("opacity", 0)
                    focusX3.style("opacity", 0)
                    focusY3.style("opacity", 0)
                    focusXtext3.style("opacity", 0)
                    focusYtext3.style("opacity", 0)

                    tooltipFocus.style("opacity", 0)
                }

                // ----------------------------------------------------------------
                // FIRST LINE PLOT
                const xAxis1 = group1
                    .append("g")
                    .call(xAxisGenerator)
                        .style("transform", `translateY(${height}px)`)
                        .attr("class", "x-axis")

                const yScale1 = d3.scaleLinear()
                    .domain(d3.extent(dataBid, d => pwinAccessor(d)))
                    .range([height, 0])

                const yAxisGenerator1 = d3.axisLeft()
                    .scale(yScale1)
                    .tickFormat("")
                    .tickSize(0)
                    .tickPadding(10)
                    .ticks(3)

                const yAxis1 = group1
                    .append("g")
                    .call(yAxisGenerator1)
                        .attr("class", "y-axis")

                const lineGenerator1 = d3.line()
                    .curve(d3.curveNatural)
                    .x(d => xScale(bidtodatAccessor(d)))
                    .y(d => yScale1(pwinAccessor(d)))

                const pwinLine = group1
                    .append("path")
                        .attr("fill", "none")
                        .attr("stroke", "#3a4245")
                        .attr("stroke-width", 1.25)
                        .attr("d", lineGenerator1(dataBid))
                        .attr("class", "pwinLine")

                const circleBid1 = group1
                    .append("circle")
                        .style("fill", "#3a4245")
                        .attr("r", 6)
                        .attr("cx", xScale(dataBidYes[0].bid_to_dat))
                        .attr("cy", yScale1(dataBidYes[0].pwin))

                const xBidLine1 = group1
                    .append("line")
                        .style("stroke-dasharray", "5,3")
                        .style("stroke", "#3a4245")
                        .style("stroke-width", 1.)
                        .attr("x1", xScale(dataBidYes[0].bid_to_dat))
                        .attr("x2", xScale(dataBidYes[0].bid_to_dat))
                        .attr("y1", yScale1(dataBidYes[0].pwin))
                        .attr("y2", yScale1(yScale1.domain()[0]))

                const yBidLine1 = group1
                    .append("line")
                        .style("stroke-dasharray", "5,3")
                        .style("stroke", "#3a4245")
                        .style("stroke-width", 1.)
                        .attr("x1", xScale(xScale.domain()[0]))
                        .attr("x2", xScale(dataBidYes[0].bid_to_dat))
                        .attr("y1", yScale1(dataBidYes[0].pwin))
                        .attr("y2", yScale1(dataBidYes[0].pwin))

                const xBidText1 = group1
                    .append("text")
                        .text(d3.format(",.0%")(dataBidYes[0].bid_to_dat))
                        .attr("x", xScale(dataBidYes[0].bid_to_dat))
                        .attr("y", yScale1(yScale1.domain()[0]) + 17)
                        .attr("text-anchor", "middle")
                        .style("fill", "#3a4245")
                        .style("font-size", "11px")
                        .style("font-family", "Roboto")

                const yBidText1 = group1
                    .append("text")
                        .text(d3.format(",.0%")(dataBidYes[0].pwin))
                        .attr("x", xScale(xScale.domain()[0]) - 8)
                        .attr("y", yScale1(dataBidYes[0].pwin))
                        .attr("text-anchor", "end")
                        .style("fill", "#3a4245")
                        .style("font-size", "11px")
                        .style("font-family", "Roboto")
                        .style("dominant-baseline", "middle")

                const yAxisText1 = group1
                    .append("text")
                        .text("Win Probability")
                        .attr("y", yScale1(yScale1.domain()[1]) - 70)
                        .attr("text-anchor", "end")
                        .style("fill", "#3a4245")
                        .style("font-size", "12px")
                        .style("font-family", "Roboto")
                        .attr("transform", `rotate(-90)`)

                // interactions
                const focus1 = group1
                    .append("g")

                const focusCircle1 = focus1
                    .append("circle")
                        .style("fill", "#007B82")
                        .attr("stroke", "none")
                        .attr("r", 6)
                        .style("opacity", 0)

                const focusX1 = focus1
                    .append("line")
                        .style("stroke-dasharray", "5,3")
                        .style("stroke", "#007B82")
                        .style("stroke-width", 1.)
                        .style("opacity", 0)

                const focusY1 = focus1
                    .append("line")
                        .style("stroke-dasharray", "5,3")
                        .style("stroke", "#007B82")
                        .style("stroke-width", 1.)
                        .style("opacity", 0)

                const focusXtext1 = focus1
                    .append("text")
                        .style("fill", "#007B82")
                        .style("font-size", "11px")
                        .style("font-family", "Roboto")
                        .attr("text-anchor", "middle")
                        .style("opacity", 0)

                const focusYtext1 = focus1
                    .append("text")
                        .style("fill", "#007B82")
                        .style("font-size", "11px")
                        .style("font-family", "Roboto")
                        .attr("text-anchor", "end")
                        .style("dominant-baseline", "middle")
                        .style("opacity", 0)

                const rect1 = group1
                    .append("rect")
                        .style("fill", "none")
                        .style("pointer-events", "all")
                        .attr("width", width)
                        .attr("height", height)
                        .on("mouseover", mouseover)
                        .on("mousemove", mousemove)
                        .on("mouseout", mouseout)

                // SECOND LINE PLOT
                const xAxis2 = group2
                    .append("g")
                    .call(xAxisGenerator)
                        .style("transform", `translateY(${height}px)`)
                        .attr("class", "x-axis")

                const yScale2 = d3.scaleLinear()
                    .domain(d3.extent(dataBid, d => marginAccessor(d)))
                    .range([height, 0])

                const yAxisGenerator2 = d3.axisLeft()
                    .scale(yScale2)
                    .tickFormat("")
                    .tickSize(0)
                    .tickPadding(10)
                    .ticks(3)

                const yAxis2 = group2
                    .append("g")
                    .call(yAxisGenerator2)
                        .attr("class", "y-axis")

                const lineGenerator2 = d3.line()
                    .curve(d3.curveNatural)
                    .x(d => xScale(bidtodatAccessor(d)))
                    .y(d => yScale2(marginAccessor(d)))

                const marginLine = group2
                    .append("path")
                        .attr("fill", "none")
                        .attr("stroke", "darkgrey")
                        .attr("stroke-width", 1.5)
                        .attr("d", lineGenerator2(dataBid))
                        .attr("class", "marginLine")

                const circleBid2 = group2
                    .append("circle")
                        .style("fill", "#3a4245")
                        .attr("r", 6)
                        .attr("cx", xScale(dataBidYes[0].bid_to_dat))
                        .attr("cy", yScale2(dataBidYes[0].margin_dollars))

                const xaxisLine2 = group2
                    .append("line")
                        .style("stroke-dasharray", "5,3")
                        .style("stroke", "#3a4245")
                        .style("stroke-width", 1.)
                        .attr("x1", xScale(dataBidYes[0].bid_to_dat))
                        .attr("x2", xScale(dataBidYes[0].bid_to_dat))
                        .attr("y1", yScale2(dataBidYes[0].margin_dollars))
                        .attr("y2", yScale2(yScale2.domain()[0]))

                const yaxisLine2 = group2
                    .append("line")
                        .style("stroke-dasharray", "5,3")
                        .style("stroke", "#3a4245")
                        .style("stroke-width", 1.)
                        .attr("x1", xScale(xScale.domain()[0]))
                        .attr("x2", xScale(dataBidYes[0].bid_to_dat))
                        .attr("y1", yScale2(dataBidYes[0].margin_dollars))
                        .attr("y2", yScale2(dataBidYes[0].margin_dollars))

                const xBidText2 = group2
                    .append("text")
                        .text(d3.format(",.0%")(dataBidYes[0].bid_to_dat))
                        .attr("x", xScale(dataBidYes[0].bid_to_dat))
                        .attr("y", yScale2(yScale2.domain()[0]) + 17)
                        .attr("text-anchor", "middle")
                        .style("fill", "#3a4245")
                        .style("font-size", "11px")
                        .style("font-family", "Roboto")
    
                const yBidText2 = group2
                    .append("text")
                        .text(d3.format("$,.0f")(dataBidYes[0].margin_dollars))
                        .attr("x", xScale(xScale.domain()[0]) - 8)
                        .attr("y", yScale2(dataBidYes[0].margin_dollars))
                        .attr("text-anchor", "end")
                        .style("fill", "#3a4245")
                        .style("font-size", "11px")
                        .style("font-family", "Roboto")
                        .style("dominant-baseline", "middle")

                const yAxisText2 = group2
                    .append("text")
                        .text("Margin")
                        .attr("y", yScale2(yScale2.domain()[1]) - 70)
                        .attr("text-anchor", "end")
                        .style("fill", "#3a4245")
                        .style("font-size", "12px")
                        .style("font-family", "Roboto")
                        .attr("transform", `rotate(-90)`) 

                // interactions
                const focus2 = group2
                    .append("g")

                const focusCircle2= focus2
                    .append("circle")
                        .style("fill", "#007B82")
                        .attr("stroke", "none")
                        .attr("r", 6)
                        .style("opacity", 0)

                const focusX2 = focus2
                    .append("line")
                        .style("stroke-dasharray", "5,3")
                        .style("stroke", "#007B82")
                        .style("stroke-width", 1.)
                        .style("opacity", 0)

                const focusY2 = focus2
                    .append("line")
                        .style("stroke-dasharray", "5,3")
                        .style("stroke", "#007B82")
                        .style("stroke-width", 1.)
                        .style("opacity", 0)

                const focusXtext2 = focus2
                    .append("text")
                        .style("fill", "#007B82")
                        .style("font-size", "11px")
                        .style("font-family", "Roboto")
                        .attr("text-anchor", "middle")
                        .style("opacity", 0)

                const focusYtext2 = focus2
                    .append("text")
                        .style("fill", "#007B82")
                        .style("font-size", "11px")
                        .style("font-family", "Roboto")
                        .attr("text-anchor", "end")
                        .style("dominant-baseline", "middle")
                        .style("opacity", 0)

                const rect2 = group2
                    .append("rect")
                        .style("fill", "none")
                        .style("pointer-events", "all")
                        .attr("width", width)
                        .attr("height", height)
                        .on("mouseover", mouseover)
                        .on("mousemove", mousemove)
                        .on("mouseout", mouseout)

                // THIRD LINE PLOT
                const xAxis3 = group3
                    .append("g")
                    .call(xAxisGenerator)
                        .style("transform", `translateY(${height}px)`)
                        .attr("class", "x-axis")

                const yScale3 = d3.scaleLinear()
                    .domain(d3.extent(dataBid, d => expmarginAccessor(d)))
                    .range([height, 0])
 
                const yAxisGenerator3 = d3.axisLeft()
                    .scale(yScale3)
                    .tickFormat("")
                    .tickSize(0)
                    .tickPadding(10)
                    .ticks(3) 

                const yAxis3 = group3 
                    .append("g")
                    .call(yAxisGenerator3)
                        .attr("class", "y-axis")

                const lineGenerator3 = d3.line()
                    .curve(d3.curveNatural)
                    .x(d => xScale(bidtodatAccessor(d)))
                    .y(d => yScale3(expmarginAccessor(d)))

                const expMarginLine = group3
                    .append("path")
                        .attr("fill", "none")
                        .attr("stroke", "darkgrey")
                        .attr("stroke-width", 1.5)
                        .attr("d", lineGenerator3(dataBid))
                        .attr("class", "expMarginLine")

                const circleBid3 = group3
                    .append("circle")
                        .style("fill", "#3a4245")
                        .attr("r", 6)
                        .attr("cx", xScale(dataBidYes[0].bid_to_dat))
                        .attr("cy", yScale3(dataBidYes[0].expected_margin_dollars))

                const xaxisLine3 = group3
                    .append("line")
                        .style("stroke-dasharray", "5,3")
                        .style("stroke", "#3a4245")
                        .style("stroke-width", 1.)
                        .attr("x1", xScale(dataBidYes[0].bid_to_dat))
                        .attr("x2", xScale(dataBidYes[0].bid_to_dat))
                        .attr("y1", yScale3(dataBidYes[0].expected_margin_dollars))
                        .attr("y2", yScale3(yScale3.domain()[0]))

                const yaxisLine3 = group3
                    .append("line")
                        .style("stroke-dasharray", "5,3")
                        .style("stroke", "#3a4245")
                        .style("stroke-width", 1.)
                        .attr("x1", xScale(xScale.domain()[0]))
                        .attr("x2", xScale(dataBidYes[0].bid_to_dat))
                        .attr("y1", yScale3(dataBidYes[0].expected_margin_dollars))
                        .attr("y2", yScale3(dataBidYes[0].expected_margin_dollars))

                const xBidText3 = group3
                    .append("text")
                        .text(d3.format(",.0%")(dataBidYes[0].bid_to_dat))
                        .attr("x", xScale(dataBidYes[0].bid_to_dat))
                        .attr("y", yScale3(yScale3.domain()[0]) + 17)
                        .attr("text-anchor", "middle")
                        .style("fill", "#3a4245")
                        .style("font-size", "11px")
                        .style("font-family", "Roboto")
    
                const yBidText3 = group3
                    .append("text")
                        .text(d3.format("$,.0f")(dataBidYes[0].expected_margin_dollars))
                        .attr("x", xScale(xScale.domain()[0]) - 8)
                        .attr("y", yScale3(dataBidYes[0].expected_margin_dollars))
                        .attr("text-anchor", "end")
                        .style("fill", "#3a4245")
                        .style("font-size", "11px")
                        .style("font-family", "Roboto")
                        .style("dominant-baseline", "middle")

                const yAxisText3 = group3
                    .append("text")
                        .text("Expected Margin")
                        .attr("y", yScale3(yScale3.domain()[1]) - 70)
                        .attr("text-anchor", "end")
                        .style("fill", "#3a4245")
                        .style("font-size", "12px")
                        .style("font-family", "Roboto")
                        .attr("transform", `rotate(-90)`) 

                // interactions
                const focus3 = group3
                    .append("g")

                const focusCircle3 = focus3
                    .append("circle")
                        .style("fill", "#007B82")
                        .attr("stroke", "none")
                        .attr("r", 6)
                        .style("opacity", 0)

                const focusX3 = focus3
                    .append("line")
                        .style("stroke-dasharray", "5,3")
                        .style("stroke", "#007B82")
                        .style("stroke-width", 1.)
                        .style("opacity", 0)

                const focusY3 = focus3
                    .append("line")
                        .style("stroke-dasharray", "5,3")
                        .style("stroke", "#007B82")
                        .style("stroke-width", 1.)
                        .style("opacity", 0)

                const focusXtext3 = focus3
                    .append("text")
                        .style("fill", "#007B82")
                        .style("font-size", "11px")
                        .style("font-family", "Roboto")
                        .attr("text-anchor", "middle")
                        .style("opacity", 0)

                const focusYtext3 = focus3
                    .append("text")
                        .style("fill", "#007B82")
                        .style("font-size", "11px")
                        .style("font-family", "Roboto")
                        .attr("text-anchor", "end")
                        .style("dominant-baseline", "middle")
                        .style("opacity", 0)

                const rect3 = group3
                    .append("rect")
                        .style("fill", "none")
                        .style("pointer-events", "all")
                        .attr("width", width)
                        .attr("height", height)
                        .on("mouseover", mouseover)
                        .on("mousemove", mousemove)
                        .on("mouseout", mouseout)
                
                // FORMATTING ALL AXES
                const xlines = d3.selectAll(".x-axis .domain")
                xlines
                    .style("stroke", "#c1c1c1")
                    .style("stroke-width", 1.)

                const ylines = d3.selectAll(".y-axis .domain")
                ylines
                    .style("stroke", "#c1c1c1")
                    .style("stroke-width", 1.)


                // --------------------------------------------------------
                // TOOLTIPS
                const tooltipBid = d3.select(".tooltip1")
                    .style("position", "absolute")
                    .style("display", "block")
                    .style("background-color", "#ffffff")
                    .attr("pointer-events", "none")
                    .style("color", "#3a4245")
                    .style("font-size", "10px")

                tooltipBid.html(`<div id="tt-body"></div>`)
                const tooltipBidBody = tooltipBid.select("#tt-body")
                tooltipBidBody.html(
                    `<span style="float:left;"><b>Optimal Bid</b></span><br>` + 
                    `<span style="float:left;">Ratio to DAT:&nbsp&nbsp</span>` + `<span style="float:right;">${d3.format(",.0%")(dataBidYes[0].bid_to_dat)}</span><br>` + 
                    `<span style="float:left;">Win Probability:&nbsp&nbsp</span>` + `<span style="float:right;">${d3.format(",.0%")(dataBidYes[0].pwin)}</span><br>` + 
                    `<span style="float:left;">Margin:&nbsp&nbsp</span>` + `<span style="float:right;">${d3.format("$,.0f")(dataBidYes[0].margin_dollars)}</span><br>` + 
                    `<span style="float:left;">Expected Margin:&nbsp&nbsp</span>` + `<span style="float:right;">${d3.format("$,.0f")(dataBidYes[0].expected_margin_dollars)}</span>` 
                )

                tooltipBid.style("left", width - 150 + "px")
                tooltipBid.style("top", 5 + "px")


                const tooltipFocus = d3.select(".tooltip2")
                    .style("position", "absolute")
                    .style("display", "block")
                    .style("background-color", "#ffffff")
                    .attr("pointer-events", "none")
                    .style("color", "#007B82")
                    .style("font-size", "10px")
                    .style("opacity", 0)

                tooltipFocus.html(`<div id="tt-body"></div>`)
                const tooltipFocusBody = tooltipFocus.select("#tt-body")
                tooltipFocus.style("left", width - 30 + "px")
                tooltipFocus.style("top", 5 + "px")

                
            }

            drawASP()

        } catch(error) {
            console.log(error)
        }
        done()
    },
}