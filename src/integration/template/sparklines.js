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
        first_chart_type: {
            section: 'Setup',
            order:3,
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
            order:4,
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
            order:5,
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
        add_last_week_stats: { // ignore_last_week = false
            section: "Setup",
            order:6,
            type: "boolean",
            label: "Disable last period display",
            default:"true"
        },
        // Y-AXIS OPTIONS
        y_axis_scale_fixed: {
            section: "Y",
            order: 1,
            type: "boolean",
            label: "Use Same Y-Scale",
            default: "false",
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
                .chart_column {
                    min-width: 120px!important;
                    min-height: 70px!important;
                    text-align:center;
                }
                .second_chart_column {
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

                let where_chart = [];

                console.log("where chart", config.where_chart)

                


            } catch(error) {
                console.log(error)
            }
        };
    }
};