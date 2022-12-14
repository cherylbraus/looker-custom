import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'

export const object = {  
    // Id and Label are legacy properties that no longer have any function besides documenting
    // what the visualization used to have. The properties are now set via the manifest
    // form within the admin/visualizations page of Looker.

    id: "sparkline-table",
    label: "Sparkline Table",
    options: {
        // SETUP OPTIONS
        where_values: {
            section: "Setup",
            order: 1,
            type: "string",
            display: "text",
            label: "Measure(s) to draw from (see docs)",
            placeholder: "Comma separated",
            default:"0"
        },
        where_chart: {
            section: "Setup",
            order:2,
            type: "string",
            display: "text",
            label: "Chart column(s) placement (see docs)",
            placeholder: "Comma separated",
            default:"1"
        },
        where_measure_totals: {
            section: "Setup",
            order: 3,
            type: "string",
            display: "text",
            label: "Show totals for these measures",
            placeholder: "Comma separated",
            default:"0"
        },
        total_period_count: {
            section: "Setup",
            order: 4,
            type: "string",
            display: "text",
            label: "Show totals for this many prior periods",
            placeholder: "All",
            default:"All"
        },
        total_header_suffix: {
            section: "Setup",
            order:5,
            type: "string",
            display: "text",
            label: "Total Column Suffix",
            placeholder: "(Total)",
            default: "(Total)"
        },
        where_conditional_formatting: {
            section: "Setup",
            order: 6,
            type: "string",
            display: "text",
            label: "Conditionally format these total measures",
            placeholder: "Comma separated",
            default: ""
        },
        add_last_period_stats: { // ignore_last_week = false
            section: "Setup",
            order:7,
            type: "boolean",
            label: "Show last period data",
            default:"true"
        },
        first_chart_type: {
            section: 'Setup',
            order:8,
            type: 'string',
            label: 'First Chart Type',
            display: "select",
            values: [
              {"Line": "line"},
              {"Area": "area"},
              {"Bar": "bar"}
            ],
            default: "line"
        },
        second_chart_type: {
            section: 'Setup',
            order:9,
            type: 'string',
            label: 'Second Chart Type',
            display: "select",
            values: [
              {"Line": "line"},
              {"Area": "area"},
              {"Bar": "bar"}
            ],
            default: "line"
        },
        third_chart_type: {
            section: 'Setup',
            order:10,
            type: 'string',
            label: 'Third Chart Type',
            display: "select",
            values: [
              {"Line": "line"},
              {"Area": "area"},
              {"Bar": "bar"}
            ],
            default: "line"
        },
        // Y-AXIS OPTIONS
        y_axis_scale_fixed: {
            section: "Y",
            order: 1,
            type: "boolean",
            label: "Use Same Y-Scale",
            default: "true",
        },
        y_axis_lower_first: {
            section: "Y",
            order:2,
            type: "string",
            display: "text",
            label: "Lower Y-Axis Bound - 1st Chart",
            placeholder: "Set lower y-axis bound",
            default: ""
        },
        y_axis_upper_first: {
            section: "Y",
            order:3,
            type: "string",
            display: "text",
            label: "Upper Y-Axis Bound - 1st Chart",
            placeholder: "Set upper y-axis bound",
            default: ""
        },
        y_axis_lower_second: {
            section: "Y",
            order:4,
            type: "string",
            display: "text",
            label: "Lower Y-Axis Bound - 2nd Chart",
            placeholder: "Set lower y-axis bound",
            default: ""
        },
        y_axis_upper_second: {
            section: "Y",
            order:5,
            type: "string",
            display: "text",
            label: "Upper Y-Axis Bound - 2nd Chart",
            placeholder: "Set upper y-axis bound",
            default: ""
        },
        y_axis_lower_third: {
            section: "Y",
            order:6,
            type: "string",
            display: "text",
            label: "Lower Y-Axis Bound - 3rd Chart",
            placeholder: "Set lower y-axis bound",
            default: ""
        },        
        y_axis_upper_third: {
            section: "Y",
            order:7,
            type: "string",
            display: "text",
            label: "Upper Y-Axis Bound - 3rd Chart",
            placeholder: "Set upper y-axis bound",
            default: ""
        },
        // FORMATTING OPTIONS
        display_values: {
            section: 'Formatting',
            order:1,
            type: 'boolean',
            label: 'Display max/min values on charts',
            default: "false"
        },
        directionality: {
            section: 'Formatting',
            order:2,
            type: 'boolean',
            label: 'Color negative trends',
            default: "true" // false
        },
        freeze_header: {
            section: 'Formatting',
            order:3,
            type: 'boolean',
            label: 'Freeze header row',
            default: "true" // false
        },
        size_to_fit: {
            section: 'Formatting',
            order:2,
            type: 'boolean',
            label: 'Size-to-fit table width',
            default: "false"
        },
        // LABELING OPTIONS
        label_first: {
            section: 'Labels',
            order:1,
            type: 'string',
            label: 'Chart 1 label',
            display: "text",
            default: ""
        },
        change_label_first: {
            section: 'Labels',
            order:2,
            type: 'string',
            label: 'Last period label - Chart 1',
            display: "text",
            default: ""
        },
        label_second: {
            section: 'Labels',
            order:3,
            type: 'string',
            label: 'Chart 2 label',
            display: "text",
            default: ""
        },
        change_label_second: {
            section: 'Labels',
            order:4,
            type: 'string',
            label: 'Last period label - Chart 2',
            display: "text",
            default: ""
        },     
        label_third: {
            section: 'Labels',
            order:5,
            type: 'string',
            label: 'Chart 3 label',
            display: "text",
            default: ""
        },
        change_label_third: {
            section: 'Labels',
            order:6,
            type: 'string',
            label: 'Last period label - Chart 3',
            display: "text",
            default: ""
        },    
        label_total_row: {
            section: 'Labels',
            order:7,
            type: 'string',
            label: 'Total row descriptor',
            display: "text",
            default: ""
          }, 
    },

    // Set up the initial state of the visualization
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
                .min-max-text-background {
                    font-weight:700!important;
                    font-family:Roboto;
                }
                .min-max-text-background_two {
                    font-weight:700!important;
                    font-family:Roboto;
                }
                .min-max-text {
                    font-weight:700!important;
                    font-family:Roboto;
                }
                .min-max-text_two {
                    font-weight:700!important;
                    font-family:Roboto;
                }
                .line {
                    fill: none;
                    stroke-width: 2px;
                }
                .null-val {
                    color:#c2c2c2;
                }
                            /* design */
                table {
                    border-collapse:collapse;
                    border:none;
                    overflow-y:scroll;
                    height:100%;
                    font-size: 12px;
                    display:block;
                    text-align:left;
                }
                table td, table th {
                    border: 1px solid #bec4c7;
                }
                th {
                    padding: 8px 8px;
                    background-color:#c2d3e0;
                    font-family:Roboto;
                    font-size:12px!important;
                    font-weight:500;
                }
                th.stuck {
                    position: sticky!important;
                    top:0;
                }
                td {
                    font-family:Roboto;
                    font-size:12px!important;
                    font-weight:400!important;
                }
                .table-index {
                 text-align: right;
                }

                div[class^='chart_column'] {
                    min-width: 120px!important;
                    min-height: 70px!important;
                    text-align:center;
                }

                tr:first-child {
                 font-weight:500
                }
                tr:nth-child(even) { 
                    background: #f0f1f0; 
                }
                .value-down {
                    color: #D76106;
                    font-weight:500;
                    display:flex;
                    justify-content: center;
                }
                td:not(.no-padding) {
                    padding: 0 8px;
                }
                .value-even {
                    text-align:center;
                }
                .value-up {
                    color: #0072b5;
                    font-weight:500;
                    display:flex;
                    justify-content: center;
                }
                .value-up.color-off {
                    color: black;
                }
                .value-down.color-off {
                    color: black;
                }
                .change-figure {
                    line-height: 36px;
                }
                .insert-column {
                    background-color:#9facb7;
                }
            </style>`;
        element.style.fontFamily = `Roboto,"Open Sans", "Helvetica", sans-serif`
    },

    // Render in response to the data or settings changing
    updateAsync: function(data, element, config, queryResponse, details, done, environment = "prod") {
        if (environment == "prod") {
              if (!handleErrors(this, queryResponse, {
                  min_pivots: 1, max_pivots: 1,
                  min_dimensions: 1, max_dimensions: 40,
                  min_measures: 1, max_measures: 40
              })) return
        }

        // Custom error handling
        if (typeof config.where_values == 'undefined' || typeof config.where_chart == 'undefined') {
            $('#vis').contents(':not(style)').remove();
            const error = '<div class="error-container"><div class="error-header">Loading</div><div class="error">Wait until chart type is fully loaded.</div></div>'
            $('#vis').append(error);
        } else if (queryResponse.has_row_totals == false) {
            $('#vis').contents(':not(style)').remove();
            const error = '<div class="error-container"><div class="error-header">Row totals required</div><div class="error">Sparklines requires row totals. Check row totals box and re-run.</div></div>'
            $('#vis').append(error);
        } else if ((config.where_chart == "" && config.where_values != "") || (config.where_values == "" && config.where_chart != "") || ((config.where_values || config.where_chart) && config.where_chart.split(",").length != config.where_values.split(",").length)) {
            $('#vis').contents(':not(style)').remove();
            const error = '<div class="error-container"><div class="error-header">Options mismatch</div><div class="error">Number of measures charted and chart columns must be equal.</div></div>'
            $('#vis').append(error);
        } else if (config.where_values && config.where_values.split(",") && parseInt(config.where_values.split(",")[0]) > queryResponse.fields.measure_like.length - 1 || parseInt(config.where_values.split(",")[1]) > queryResponse.fields.measure_like.length - 1 || parseInt(config.where_values.split(",")[2]) > queryResponse.fields.measure_like.length - 1 ) {
            $('#vis').contents(':not(style)').remove();
            const error = '<div class="error-container"><div class="error-header">Index out of range</div><div class="error">That value is out of the range of possible measures.</div></div>'
            $('#vis').append(error);
        } else if (config.total_period_count > queryResponse.fields.measure_like.length - 1) { // FIX THIS
            $('#vis').contents(':not(style)').remove();
            const error = '<div class="error-container"><div class="error-header">Value out of range</div><div class="error">Number of periods is larger than periods included in data.</div></div>'
            $('#vis').append(error);
        } else {

            try {
                // set possible parseTimes
                var parseTimeDay = d3.timeParse("%Y-%m-%d"); // for day or "other" (week)
                var parseTimeMonth = d3.timeParse("%Y-%m"); // for month
                var parseTimeYear = d3.timeParse("%Y"); // for year
                var parseTimeSecond = d3.timeParse("%Y-%m-%d %H:%M:%S"); // for exact time

                var parseTime;

                // table calculations are included in measure-like and can be found by is_table_calculation = true
                const dimensions = queryResponse.fields.dimension_like;
                const measures = queryResponse.fields.measure_like;
                const pivots = queryResponse.fields.pivots;

                console.log("queryResponse", queryResponse)
                console.log("dimensions", dimensions)
                console.log("measures", measures)
                console.log("pivots", pivots)
                console.log("data", data)
                console.log("object keys", Object.keys(data[0][measures[0].name]))

                if (pivots[0].time_interval.name == "day") {
                    parseTime = parseTimeDay;
                } else if (pivots[0].time_interval.name == "month") {
                    parseTime = parseTimeMonth;
                } else if (pivots[0].time_interval.name == "year") {
                    parseTime = parseTimeYear;
                } else if (pivots[0].time_interval.name == "second") {
                    parseTime = parseTimeSecond;
                } else {
                    // can you apply parseTimeDay to the values in the first measure column successfully?
                    if (parseTimeDay(Object.keys(data[0][measures[0].name])[0])) {
                        parseTime = parseTimeDay;
                    } else {
                        if (parseTimeMonth(Object.keys.apply(data[0][meausres[0].name])[0])) {
                            parseTime = parseTimeMonth;
                        } else {
                            parseTime = parseTimeDay;
                        }
                    }
                };

                // create array values for where_chart, where_values, where_totals, where_conditional
                let where_chart = [];

                if (config.where_chart.length < 1) {
                    where_chart = []
                } else {
                    config.where_chart.split(',').forEach((d, i) => {
                        if (d) {
                            where_chart[i] = parseInt(d)
                        }
                    })
                }
                console.log("where_chart", where_chart)

                let where_values = [];

                if (config.where_values.length < 1) {
                    where_values = []
                } else {
                    config.where_values.split(',').forEach((d, i) => {
                        if (d) {
                            where_values[i] = parseInt(d)
                        }
                    })
                }

                console.log("where_values", where_values)

                let where_totals = [];

                if (config.where_measure_totals.length < 1) {
                    where_totals = []
                } else {
                    config.where_measure_totals.split(',').forEach((d, i) => {
                        if (d) {
                            where_totals[i] = parseInt(d)
                        }
                    })
                }

                console.log("where_totals", where_totals)

                let where_conditional = [];

                if (config.where_conditional_formatting.length < 1) {
                    where_conditional = []
                } else {
                    config.where_conditional_formatting.split(',').forEach((d, i) => {
                        if (d) {
                            where_conditional[i] = parseInt(d)
                        }
                    })
                }

                console.log("where_conditional", where_conditional)

                let condition_setups = {};

                if (where_conditional != []) {
                    where_conditional.forEach((d, i) => {
                        if (where_totals.includes(d)) { // has to be a column chose to show total for
                            let col_extent = d3.extent(data, function(e, j) {
                                return e[measures[d].name]["$$$_row_total_$$$"].value
                            })
                            
                            // let condition_scale = d3.scaleSequential()
                            //     .interpolator(d3.interpolate("rgba(245, 249, 242, 0.8)", "rgba(140, 187, 97, 0.8)"))
                            //     .domain(col_extent)
                            let condition_scale = d3.scaleLinear()
                                .range(["rgba(245, 249, 242, 0.8)", "rgba(140, 187, 97, 0.8)"])
                                .domain(col_extent)

                            condition_setups[d] = {'extent': col_extent, 'scale': condition_scale}
                        }
                    })
                } else {
                    condition_setups = {}
                }

                console.log("condition_setups", condition_setups)

                // gather headings
                let row_totals = [];
                let column_headers = [];

                // Get header names for the dimensions
                dimensions.forEach(function(entry, i) {
                    column_headers.push(entry.name)
                })

                // Add names for all measures
                measures.forEach(function(entry, i) {
                    if (where_totals.includes(i)) {
                        row_totals.push(entry.name)
                        column_headers.push(("row_total_heading-" + i))
                    }
                })

                // Add headers for chart columns and if user wants to show last week values
                // Use reverse order or else index choices in where_chart & splice function get messed up
                if (where_chart.length > 0) {
                    for (let i = where_chart.length - 1; i >= 0; i--) { // reverse order
                        if (config.add_last_period_stats == "true") {
                            column_headers.splice(where_chart[i], 0, `last_period_column-${i}`)
                        }
                        column_headers.splice(where_chart[i], 0, `chart_column-${i}`)
                    }
                };

                console.log("row_totals", row_totals)
                console.log("column_headers", column_headers)

                // -----------------------------------------------------------------------------------------
                // Set global variables
                const OPTION_MAP = {
                    "chart_column-0": {
                        "option": config.label_first,
                        "where": where_values[0],
                        "type": "Trend",
                        "ylower": config.y_axis_lower_first,
                        "yupper": config.y_axis_upper_first,
                        "chart": config.first_chart_type
                    },
                    "chart_column-1": {
                        "option": config.label_second,
                        "where": where_values[1],
                        "type": "Trend",
                        "ylower": config.y_axis_lower_second,
                        "yupper": config.y_axis_upper_second,
                        "chart": config.second_chart_type
                    },
                    "chart_column-2": {
                        "option": config.label_third,
                        "where": where_values[2],
                        "type": "Trend",
                        "ylower": config.y_axis_lower_third,
                        "yupper": config.y_axis_upper_third,
                        "chart": config.third_chart_type
                    },
                    "last_period_column-0": {
                        "option": config.change_label_first,
                        "where": where_values[0],
                        "type": "Last Period"
                    }, 
                    "last_period_column-1": {
                        "option": config.change_label_second,
                        "where": where_values[1],
                        "type": "Last Period"
                    }, 
                    "last_period_column-2": {
                        "option": config.change_label_third,
                        "where": where_values[2],
                        "type": "Last Period"
                    }
                }

                // -----------------------------------------------------------------------------------------
                // Start setting up the plots

                const margin = {
                    top: 12,
                    bottom: 12,
                    left: 2, 
                    right: 2
                }

                const x = d3.scaleTime().range([0, 116])
                const y = d3.scaleLinear().range([46, 0])

                // Define charting functions
                const line = d3.line()
                    .defined(function(d) {
                        return d.value != null
                    })
                    .x(function(d) {
                        return x(parseTime(d.date))
                    })
                    .y(function(d) {
                        return y(d.value)
                    })

                const area = d3.area()
                    .x(function(d) {
                        return x(parseTime(d.date))
                    })
                    .y0(function(d) {
                        return y(0)
                    })
                    .y1(function(d) {
                        return y(d.value)
                    })

                // -----------------------------------------------------------------------------------------
                // Function that creates the table
                function createTable(data_insert, element) {
                    // Clear out previous charts/code, except keep style tag
                    $('#vis').contents(':not(style)').remove();

                    const headings_dim = data_insert;

                    let html = '<table>';

                    html += '<thead><tr><th class="table-index"></th>';

                    // cycle through each dimension heading $.each() iterates over array
                    // function is passed array index & corresponding value referenced using "this"
                    $.each(headings_dim, function() { 
                        let found = false;
                        const lookup_this = this

                        dimensions.forEach(function(entry) {
                            if (lookup_this == entry.name) {
                                html += '<th>' + entry.label_short + '</th>';
                                found = true;
                            }
                        })

                        // deal with measures now that dimensions are already added
                        // if label is provided, use that, otherwise, use original name of column
                        if (found == false) {
                            if (lookup_this in OPTION_MAP) {
                                // Include if it is a "Trend", or if show_last_period is true (then also add "Last Period")
                                if (OPTION_MAP[lookup_this]["type"] === "Trend" || config.add_last_period_stats == "true") {
                                    if (OPTION_MAP[lookup_this]["option"].length == 0) {
                                        html += `<th class="insert-column">` + measures[OPTION_MAP[lookup_this]["where"]].label_short + ` ${OPTION_MAP[lookup_this]["type"]}</th>`;
                                    } else {
                                        html += `<th class="insert-column">` + OPTION_MAP[lookup_this]["option"] + `</th>`;
                                    }
                                }
                            } else if (this.split("-")[0] == "row_total_heading") {
                                html += `<th>${measures[this.split("-")[1]].label_short} ${config.total_header_suffix}</th>`
                            } else {
                                html += '<th>' + lookup_this + '</th>';
                            }
                        }
                    });

                    html += '</tr></thead>';

                    console.log("html with headings", html)

                    // Build table body
                    html += '<tbody>';

                    // If there is a total row at the bottom of the table - NEED TO TEST THIS BC HAVEN'T SEEN THIS YET
                    if (queryResponse.has_totals == true) {
                        let descriptor = ""
                        if (config.label_total_row.length>0) {
                          descriptor = " " + config.label_total_row + "s"
                        }
                
                        console.log("insert row prep", data[0][Object.keys(data[0])[0]].value.split(" ")[0])
                        console.log("data_insert", data_insert)
                
                        if (data[0][Object.keys(data[0])[0]].value.split(" ")[0] != "All") {
                            let insertRow = {}
                
                            insertRow[data_insert[0]] = {}
                
                            insertRow[data_insert[0]]['value'] = "All" + descriptor
                
                            const insertArray = Object.keys(queryResponse.totals_data)
                
                            console.log("insertRow pre", insertRow)
                            console.log("insertArray", insertArray)
                            
                            insertArray.forEach((entry) => {
                              let fillemup = {}
                              for (const [key, value] of Object.entries(queryResponse.totals_data[entry])) {
                                fillemup[key] = {}
                                fillemup[key]['value'] = value['value']
                                fillemup[key]['rendered'] = value['html']
                              }
                              insertRow[entry] = fillemup
                            })
                
                            console.log("insertRow", insertRow)
                
                            data.splice(0,0,insertRow)
                        }
                    }

                    for (let i = 0, len = data.length; i < len; i++) {
                        html += `<tr><td class="table-index">` + (i + 1) + `</td>`;

                        $.each(headings_dim, function() {
                            // Add the chart columns
                            if (this.startsWith("chart_column")) {
                                const chart_id = `${this}-${i}`
                                // console.log("chart_column html", this, chart_id)
                                html += `<td class="no-padding"><div class=${this} id=` + chart_id + '></div></td>';
                            
                            // add the last period columns
                            } else if (this.startsWith("last_period")) {
                                const number_label = this.split("-")[1]
                                const last_period_id = `${this}-${i}`
                                let last_period_class;
                                let direction_icon;
                                let last_period_data;

                                let date_keys = Object.keys(data[i][measures[OPTION_MAP[this]["where"]].name])

                                date_keys = date_keys.filter((entry) => {
                                    return entry[0] != "$"
                                })

                                // if the actual cell/data point value isn't null
                                if (data[i][measures[OPTION_MAP[this]["where"]].name][date_keys[date_keys.length - 1]]["value"] != null) {
                                    // if there is a rendered value for the specific data point
                                    if (data[i][measures[OPTION_MAP[this]["where"]].name][date_keys[date_keys.length - 1]]["rendered"]) {
                                        last_period_data = data[i][measures[OPTION_MAP[this]["where"]].name][date_keys[date_keys.length - 1]]["rendered"]
                                    } else {
                                        // if there is no rendered, then use the actual value
                                        last_period_data = data[i][measures[OPTION_MAP[this]["where"]].name][date_keys[date_keys.length - 1]]["value"]
                                    }
                                } else {
                                    // if actual cell/data point is null, add null symbol
                                    last_period_data = "<span class='null-val'>∅</span>"
                                }

                                // if there is a value for last period and 2nd to last period, look for if it went up or down period-over-period
                                if (data[i][measures[OPTION_MAP[this]["where"]].name][date_keys[date_keys.length - 1]]["value"] != null && 
                                data[i][measures[OPTION_MAP[this]["where"]].name][date_keys[date_keys.length - 2]]["value"] != null) {
                                    if (data[i][measures[OPTION_MAP[this]["where"]].name][date_keys[date_keys.length - 1]]["value"] < 
                                    data[i][measures[OPTION_MAP[this]["where"]].name][date_keys[date_keys.length - 2]]["value"]) {
                                        // if the last period was a decrease
                                        last_period_class = "value-down"
                                        direction_icon = `<div id="chart_triangle-${number_label}-${i}"></div>`
                                    } else if (data[i][measures[OPTION_MAP[this]["where"]].name][date_keys[date_keys.length - 1]]["value"] > 
                                    data[i][measures[OPTION_MAP[this]["where"]].name][date_keys[date_keys.length - 2]]["value"]) {
                                        // if the last period was an increase
                                        last_period_class = "value-up"
                                        direction_icon = `<div id="chart_triangle-${number_label}-${i}"></div>`
                                    } else {
                                        // if the values are equal
                                        last_period_class = "value-even"
                                        direction_icon = `<div style="display:none" id="chart_triangle-${number_label}-${i}"></div>`
                                    }
                                } else {
                                    // one or both of the last 2 periods had a null value (same as if values are even)
                                    last_period_class = "value-even"
                                    direction_icon = `<div style="display:none" id="chart_triangle-${number_label}-${i}"></div>`
                                }

                                html += `<td class="triangle-flex"><div class=${last_period_class} id=${last_period_id}><div class="change-figure">${last_period_data}</div>${direction_icon}</div></td>`
                            
                            // if the column is a row total column
                            } else if (this.split("-")[0] == "row_total_heading") {
                                // if there is a value, use rendered if it exists, otherwise use value
                                if (data[i][measures[this.split("-")[1]]["name"]]["$$$_row_total_$$$"]["value"]) {
                                    // if there is a total value
                                    if (data[i][measures[this.split("-")[1]]["name"]]["$$$_row_total_$$$"]["rendered"]) {
                                        if (where_conditional.includes(parseInt(this.split('-')[1]))) {
                                            html += `<td class="value-even" style="background:${condition_setups[parseInt(this.split('-')[1])]["scale"](data[i][measures[this.split("-")[1]]["name"]]["$$$_row_total_$$$"]["value"])};">${data[i][measures[this.split("-")[1]]["name"]]["$$$_row_total_$$$"]["rendered"]}</td>`;
                                        } else {
                                            html += `<td class="value-even">${data[i][measures[this.split("-")[1]]["name"]]["$$$_row_total_$$$"]["rendered"]}</td>`;
                                        }
                                    } else {
                                        if (where_conditional.includes(parseInt(this.split('-')[1]))) {
                                            html += `<td class="value-even" style="background:${condition_setups[parseInt(this.split('-')[1])]["scale"](data[i][measures[this.split("-")[1]]["name"]]["$$$_row_total_$$$"]["value"])};">${data[i][measures[this.split("-")[1]]["name"]]["$$$_row_total_$$$"]["value"]}</td>`;
                                        } else {
                                            html += `<td class="value-even">${data[i][measures[this.split("-")[1]]["name"]]["$$$_row_total_$$$"]["value"]}</td>`;
                                        }
                                    }
                                }
                            } else {
                                if (data[i][this]["rendered"]) {
                                    html += `<td>${data[i][this]["rendered"]}</td>`
                                } else if (data[i][this]["value"] == null) {
                                    html += `<td><span class='null-val'>∅</span></td>`
                                } else {
                                    html += `<td>${data[i][this]["value"]}</td>`
                                }
                            }
                        });
                        html += '</td>';
                    }

                    html += '</tbody>';
                    html += '</table>';

                    $("#vis").append(html);

                    if (config.freeze_header == "true") {
                        $('th').addClass('stuck')
                    } else {
                        $('th').removeClass('stuck')
                    }

                    if (config.directionality == "false") {
                        $('.value-down').addClass('color-off')
                        $('.value-up').addClass('color-off')
                    } else {
                        $('.value-down').removeClass('color-off')
                        $('.value-up').removeClass('color-off')
                    }
                }

                // add visuals to table
                function drawOnTable(data_insert, element) {
                    if (config.size_to_fit == "true") {
                        $("table").addClass("size-to-fit")
                    } else {
                        $("table").removeClass("size-to-fit")
                    }

                    let widths = [];
                    let heights = [];
                    let col_mins = [];
                    let col_maxs = [];

                    if (where_values.length < 1) {
                        return 
                    } else {
                        // ------------------------------------------------------------------------------
                        // Widths don't change whether y-scale is fixed or variable
                        if (config.where_chart.length > 0) {
                            where_chart.forEach((d, i) => {
                                const node_get_width = d3.select(`#chart_column-${i}-0`)
                                const new_node_width = node_get_width.select(function() { return this.parentNode; })
                                const width_first = new_node_width.node().getBoundingClientRect().width

                                widths.push(width_first)
                            })
                        }

                        console.log("Widths - fixed & variable", widths)

                        // Standardize things if y scale is fixed
                        if (config.y_axis_scale_fixed == "true") {
                            // gather widths and heights for each chart column based on first row
                            if (config.where_chart.length > 0) {
                                where_chart.forEach((d, i) => {
                                    const node_get_height = d3.select(`#chart_column-${i}-0`)
                                    const new_node_height = node_get_height.select(function() { return this.parentNode; })
                                    const height_first = new_node_height.node().getBoundingClientRect().height

                                    heights.push(height_first)
                                })
                            }

                            console.log("FIXED y scale heights", heights)

                            // determine mins and maxs for each chart column
                            for (let j = 0, len = data.length; j < len; j++) {
                                where_values.forEach((d, i) => {
                                    let dataset = []

                                    let dataset_keys = Object.keys(data[j][measures[where_values[i]].name])

                                    dataset_keys.forEach((entry) => {
                                        if (entry[0] != "$") {
                                            dataset.push({data: entry, value: data[j][measures[where_values[i]].name][entry]["value"]})
                                        }
                                    })

                                    const new_col_min = d3.min([col_mins[i], d3.min(dataset, (ent) => {
                                        return ent.value
                                    })])

                                    col_mins[i] = new_col_min

                                    const new_col_max = d3.max([col_maxs[i], d3.max(dataset, (ent) => {
                                        return ent.value
                                    })])

                                    col_maxs[i] = new_col_max
                                })
                            }

                            console.log("FIXED y scale mins/maxs", col_mins, col_maxs)
                        }

                        // ------------------------------------------------------------------------------

                        // ------------------------------------------------------------------------------
                        // CYCLE THROUGH EACH ROW AND MAKE THE CHARTS (i)
                        for (let i = 0, len = data.length; i < len; i++) {
                            // CYCLE THROUGH EACH CHART COLUMN (j)
                            where_values.forEach((d, j) => {
                                let dataset = []

                                let dataset_keys = Object.keys(data[i][measures[where_values[j]].name])

                                dataset_keys.forEach((entry) => {
                                    if (entry[0] != "$") {
                                        dataset.push({date:entry, value:data[i][measures[where_values[j]].name][entry]["value"], rendered:data[i][measures[where_values[j]].name][entry]["rendered"]})
                                    }
                                })

                                if (config.y_axis_scale_fixed == "false") {
                                    const node_get_height = d3.select(`#chart_column-${j}-${i}`)
                                    const new_node_height = node_get_height.select(function() { return this.parentNode; })
                                    const height_first = new_node_height.node().getBoundingClientRect().height

                                    heights[j] = height_first

                                    col_mins[j] = d3.min(dataset, (ent) => {
                                        return ent.value
                                    })

                                    col_maxs[j] = d3.max(dataset, (ent) => {
                                        return ent.value
                                    })

                                    console.log("VARIABLE y-scale heights", heights)
                                    console.log("VARIABLE y-scale mins and maxs", col_mins, col_maxs)
                                }
                                
                                if (OPTION_MAP[`chart_column-${j}`]["ylower"] == "" && OPTION_MAP[`chart_column-${j}`]["yupper"] == "") {
                                    y.domain([col_mins[j], col_maxs[j]])
                                } else if (OPTION_MAP[`chart_column-${j}`]["ylower"] != "" && OPTION_MAP[`chart_column-${j}`]["yupper"] != "") {
                                    y.domain([OPTION_MAP[`chart_column-${j}`]["ylower"], OPTION_MAP[`chart_column-${j}`]["yupper"]])
                                } else if (OPTION_MAP[`chart_column-${j}`]["ylower"] != "") {
                                    y.domain([OPTION_MAP[`chart_column-${j}`]["ylower"], col_maxs[j]])
                                } else {
                                    y.domain([col_mins[j], OPTION_MAP[`chart_column-${j}`]["yupper"]])
                                }

                                x.domain([parseTime(dataset[0].date), parseTime(dataset[dataset.length-1].date)]).range([0, widths[j] - margin.left - margin.right])
                                y.range([heights[j] - margin.top - margin.bottom, 0])

                                const chart_id_grabber = `#chart_column-${j}-${i}`
                                const triangle_id_grabber = `#chart_triangle-${j}-${i}`

                                const svg = d3.select(chart_id_grabber).append('svg')
                                    .html('')
                                    .attr("width", widths[j])
                                    .attr('height', heights[j])
                                    .classed(`svg-${j}`, true)

                                const group = svg.append('g')
                                    .attr("transform", `translate(${margin.left}, ${margin.top})`)
                                    .attr("width", widths[j] - margin.left - margin.right)
                                    .attr("height", heights[j] - margin.top - margin.bottom)
                                    .classed("group", true)

                                var icons = d3.select(triangle_id_grabber).append("svg")
                                    .attr("width", 30)
                                    .attr("height", 30)
                                    .append("g")
                                        .attr("transform", "translate(15, 18)")

                                const tri = icons
                                    .append("path")
                                    .attr("d", d3.symbol().type(d3.symbolTriangle).size(30))

                                if (config.directionality == "true") {
                                    if (dataset[dataset.length - 1].value < dataset[dataset.length - 2].value) {
                                        tri
                                            .attr("transform", "rotate(180)")
                                            .style("fill", "#D76106")
                                    } else if (dataset[dataset.length - 1].value > dataset[dataset.length - 2].value) {
                                        tri
                                            .style("fill", "#0072b5")
                                    }
                                } else {
                                    if (dataset[dataset.length - 1].value < dataset[dataset.length - 2].value) {
                                        tri
                                            .attr("transform", "rotate(180)")
                                    }
                                }

                                if (OPTION_MAP[`chart_column-${j}`]["chart"] == "line") {
                                    group.append("path")
                                        .data([dataset])
                                        .attr("class", "line")
                                        .attr("d", line)
                                        .attr("stroke", (e) => {
                                            if (config.directionality == "true") {
                                                // if first value of chart is more than last value, consider it decrease/orange
                                                if (dataset[dataset.length - 1].value != null && dataset[0].value > dataset[dataset.length - 1].value) {
                                                    return "#d76106"
                                                } else if (dataset[dataset.length - 1].value != null && dataset[0].value < dataset[dataset.length - 1].value) {
                                                    return "#0072b5"
                                                } else {
                                                    return "#c2c2c2"
                                                }
                                            } else {
                                                return ["#27566b","#007b82"][i%2] // alternate bw blue and teal
                                            }
                                        });

                                    group.selectAll(".dot")
                                        .data(dataset.filter(function(d, i) {
                                            return d.value !== null
                                        }))
                                        .enter()
                                        .append("circle")
                                            .attr("class", "dot")
                                            .attr("cx", line.x())
                                            .attr("cy", line.y())
                                            .attr("r", 1)
                                            .attr("fill", (d) => {
                                                if (config.directionality == "true") {
                                                    if (dataset[dataset.length - 1].value != null && dataset[0].value > dataset[dataset.length - 1].value) {
                                                        return "#d76106"
                                                    } else if (dataset[dataset.length - 1].value != null && dataset[0].value < dataset[dataset.length - 1].value) {
                                                        return "#0072b5"
                                                    } else {
                                                        return "#c2c2c2"
                                                    }
                                                } else {
                                                    return ["#27566b","#007b82"][i%2]
                                                }
                                            })
                                } else if (OPTION_MAP[`chart_column-${j}`]["chart"] == "area") {
                                    group.append("path")
                                        .data([dataset])
                                            .attr("class", "area")
                                            .attr("d", area)
                                            .attr("stroke",(d) => {
                                                if (config.directionality == "true") {
                                                    if (dataset[dataset.length-1].value != null && dataset[0].value > dataset[dataset.length-1].value) {
                                                    return "#D76106"
                                                    } else if (dataset[dataset.length-1].value != null && dataset[0].value < dataset[dataset.length-1].value) {
                                                    return "#0072b5"
                                                    } else {
                                                    return "#c2c2c2"
                                                    }
                                                } else {
                                                    return ["#27566b","#007b82"][i%2]
                                                }
                                            })
                                            .attr("fill", (d) => {
                                                if (config.directionality == "true") {
                                                    if (dataset[dataset.length-1].value != null && dataset[0].value > dataset[dataset.length-1].value) {
                                                    return "#D76106"
                                                    } else if (dataset[dataset.length-1].value != null && dataset[0].value < dataset[dataset.length-1].value) {
                                                    return "#0072b5"
                                                    } else {
                                                    return "#c2c2c2"
                                                    }
                                                } else {
                                                    return ["#27566b","#007b82"][i%2]
                                                }
                                            });
                                } else if (OPTION_MAP[`chart_column-${j}`]["chart"] == "bar") {
                                    const xBar = d3.scaleBand() 
                                        .domain(dataset.map(function(d, i) {
                                            return d.date
                                        }))
                                        .range([0, widths[j] - margin.left - margin.right])
                                        .padding(0.05)

                                    group.selectAll(".bar")
                                        .data(dataset)
                                        .enter()
                                        .append("rect")
                                            .attr("class", "bar")
                                            .attr("x", (d) => {
                                                return xBar(d.date)
                                            })
                                            .attr("y", (d) => {
                                                return y(Math.max(0, d.value))
                                            })
                                            .attr("width", xBar.bandwidth())
                                            .attr("height", (d) => {
                                                return Math.abs(y(d.value) - y(0))
                                            })
                                            .attr("fill", (d) => {
                                                if (config.directionality == "true") {
                                                    if (dataset[dataset.length-1].value != null && dataset[0].value > dataset[dataset.length-1].value) {
                                                      return "#D76106"
                                                    } else if (dataset[dataset.length-1].value != null && dataset[0].value < dataset[dataset.length-1].value) {
                                                      return "#0072b5"
                                                    } else {
                                                      return "#c2c2c2"
                                                    }
                                                } else {
                                                    return ["#27566b","#007b82"][i%2]
                                                }
                                            })
                                }
                                
                                let arr_text = []

                                const val_extent = d3.extent(dataset, function(d, i) {
                                    return d.value
                                })

                                let minValValues = {}
                                let maxValValues = {}

                                dataset.forEach(function(entry, i) {
                                    if (entry.value == val_extent[0]) {
                                        minValValues['date'] = entry.date
                                        minValValues['rendered'] = entry.rendered
                                    } else if (entry.value == val_extent[1]) {
                                        maxValValues['date'] = entry.date
                                        maxValValues['rendered'] = entry.rendered
                                    }
                                })

                                if (isNaN(+val_extent[0])) {
                                    return 
                                } else {
                                    arr_text.push({"value": val_extent[0], "date": minValValues['date'], "rendered": minValValues['rendered']})
                                    arr_text.push({"value": val_extent[1], "date": maxValValues['date'], "rendered": maxValValues['rendered']})

                                    if (config.display_values == "true") {
                                        var filter = group.append("defs")
                                            .append("filter")
                                                .attr("id", "blur")
                                                .append("feGaussianBlur")
                                                    .attr("stdDeviation", .8)

                                        group.selectAll(".min-max-text-background")
                                            .data(arr_text)
                                            .enter()
                                            .append("text")
                                                .attr("class", "min-max-text-background")
                                                .attr("x", (d, i) => {
                                                    if (pivots[0].time_interval.name == "month" && x(parseTime(d.date)) > 20) {
                                                        return x(parseTime(d.date))
                                                    } else {
                                                        return x(parseTime(d.date))
                                                    }
                                                })
                                                .attr("y", (d, i) => {
                                                    if (i == 0) {
                                                        return y(d.value) + 10
                                                    } else {
                                                        return y(d.value) - 4
                                                    }
                                                })
                                                .text((d) => {
                                                    if (d.rendered == undefined) {
                                                        return d.value
                                                    } else {
                                                        return d.rendered
                                                    }
                                                })
                                                .attr("font-size", 8)
                                                .attr("font-family", "Roboto")
                                                .attr("font-weight", 700)
                                                .attr("fill", "white")
                                                .attr("text-anchor", (d, i) => {
                                                    if (x(parseTime(d.date)) < 12) {
                                                        return "start" // beginning
                                                    } else if (x(parseTime(d.date)) < 100) {
                                                        return "middle"
                                                    } else {
                                                        return "end"
                                                    }
                                                })
                                                .style("opacity", .4)
                                                .attr("filter", "url(#blur)")

                                        group.selectAll(".min-max-text")
                                            .data(arr_text)
                                            .enter()
                                            .append("text")
                                                .attr("class", "min-max-text")
                                                .attr("x", (d, i) => {
                                                    if (pivots[0].time_interval.name == "month" && x(parseTime(d.date)) > 20) {
                                                        return x(parseTime(d.date))
                                                    } else {
                                                        return x(parseTime(d.date))
                                                    }
                                                })
                                                .attr("y", (d, i) => {
                                                    if (i == 0) {
                                                        return y(d.value) + 10
                                                    } else {
                                                        return y(d.value) - 4
                                                    }
                                                })
                                                .text((d) => {
                                                    if (d.rendered == undefined) {
                                                        return d.value
                                                    } else {
                                                        return d.rendered
                                                    }
                                                })
                                                .attr("font-size", 8)
                                                .attr("font-weight", 700)
                                                .attr("text-anchor", (d, i) => {
                                                    if (x(parseTime(d.date)) < 12) {
                                                        return "start" // "beginning"
                                                    } else if (x(parseTime(d.date)) < 100) {
                                                        return "middle"
                                                    } else {
                                                        return "end"
                                                    }
                                                })
                                    }
                                }
                            })      
                        }
                    }                    
                }

                // -----------------------------------------------------------------------------------------
                
                createTable(column_headers)
                console.log("finished createTable")
                
                drawOnTable(column_headers)
                console.log("finished drawOnTable")

            } catch(error) {
                console.log(error)
            }
        };
        done()
    }
};