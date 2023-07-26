/* eslint-disable object-shorthand */
import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'

export const object = {
  id: 'week-day-bar',
  label: 'AnimatedBubble',
  options: {
    show_legend: {
      type: 'boolean',
      label: 'Show Legend',
      default: 'true',
      section: 'General',
      order: 1,
    },
    line_color: {
      type: 'color',
      label: 'Line color',
      default: ['#BADA55'],
      display: 'color',
    },
  },

  create: function (element, config) {
    element.innerHTML = `
    <script src="https://cdnjs.cloudflare.com/ajax/libs/d3-legend/2.25.6/d3-legend.min.js"></script>
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

        #viz-container {
            z-index: 9;
            position: relative;
            background-color: none;
            border: 1px solid #d3d3d3;
            text-align: center;
            width: 600px;
            height: 360px;
        }

        #vis {
            font-family: 'Open Sans', 'Helvetica', 'sans-serif;';
            cursor: move;
            z-index: 10;
            background-color: none;
            color: #fff;
            height: 100%;
            width: 100%;
            fill: black;
            color: black;
        }

        .x-axis {
          stroke: 'black';
        }

        button {
          background-color: #ffffff;
          border: 2px solid lightgrey;
          border-radius: 12px;
          transition-duration: 0.4s;
          color: black;
          outline: none;
        }

        button:hover {
          background-color: lightgrey;
          color: black;
          outline: none;
        }

        .progress-bar-bg {
          fill: lightgray;
        }

        .progress-bar {
          fill: gray;
        }

        .progress-end-dot {
          fill: gray;
        }

        .progress-label {
          font-size: 11px;
          font-weight: 700;
          fill: gray;
          text-anchor: middle;
          dominant-baseline: middle;
        }

    </style>

    <svg>
    </svg>` 
    element.style.fontFamily = `"Open Sans", "Helvetica", sans-serif`
  },
  updateAsync: function (
    data,
    element,
    config,
    queryResponse,
    details,
    done,
    environment = 'dev'
  ) {
    if (environment === 'prod') {
      if (
        !handleErrors(this, queryResponse, {
          min_pivots: 0,
          max_pivots: 0,
          min_dimensions: 3,
          max_dimensions: 10,
          min_measures: 3,
          max_measures: 10,
        })
      )
        return
    }

    try {
      // set dimensions
      const margin = {
        top: 25,
        right: 100,
        bottom: 50,
        left: 100,
      }

      const width = element.clientWidth
      const height = element.clientHeight

      const boundedWidth = width - margin.left - margin.right
      const boundedHeight = height - margin.top - margin.bottom

      d3.json('./dataAnimatedBubble.json').then(function(dat) {

        const mdata = dat.data
        const queryResponse = dat.queryResponse

        console.log('mdata', mdata)
        console.log("boundedWidth/Height", width, height)
        console.log(element)

        const svg = (
          d3.select(element).select('svg')
              .html('')
              .attr('width', '100%')
              .attr('height', '100%')
      )

        const tooltip = d3
          .select(".tooltip")
          .style("position", "absolute")
          .style("visibility", "hidden")
          .style("background", "white")
          .style("border", "solid")
          .style("border-width", "1px")
          .style("border-radius", "5px")
          .style("padding", "10px");

        const group = svg
          .append('g')
          .attr('transform', `translate(${margin.left}, ${margin.top})`)
          .attr('width', '100%')
          // .attr('height', `${boundedHeight}px`)
          .attr('height', '100%')
          .classed('group', true)

        // LOAD DATA
        const dimensions = queryResponse.fields.dimension_like
        const measures = queryResponse.fields.measure_like

        console.log("dimensions", dimensions)
        console.log("measures", measures)

        const dataParsed = []

        mdata.forEach(d => {
          dataParsed.push({
            state: d[dimensions[0].name].value,
            region: d[dimensions[1].name].value,
            year: +d[dimensions[2].name].value,
            lanes: +d[measures[0].name].value,
            shipments: +d[measures[1].name].value,
            margin: +d[measures[2].name].value
          })
        })

        dataParsed.sort(function (x, y) {
          return d3.ascending(x.year, y.year)
        })

        console.log("dataParsed", dataParsed)

        const uniqueYears = [...new Set(dataParsed.map(d => d.year))]
        console.log("uniqueYears", uniqueYears, uniqueYears[0])

        const stateAccessor = (d) => d.state
        const regionAccessor = (d) => d.region
        const yearAccessor = (d) => d.year
        const laneAccessor = (d) => d.lanes
        const shipmentAccessor = (d) => d.shipments
        const marginAccessor = (d) => d.margin

        // const accessor = (d: TEntry, key: keyof TEntry) => d[key]

        // X-Axis
        const xDomainMin = 0
        const xDomainMax = d3.max(dataParsed, d => shipmentAccessor(d)) || 0
        const xDomain = [xDomainMin, xDomainMax]
        const xDomainAdj = [xDomainMin, xDomainMax + ((xDomainMax - xDomainMin) * .10)]
        const xScale = d3.scaleLinear()
          .domain(xDomainAdj)
          .range([0, boundedWidth])
        const xAxisGenerator = d3.axisBottom(xScale)
          .scale(xScale)
          .tickPadding(5)
          .tickSize(0)
          .tickFormat(d3.format(",.2s"))

        const xAxis = group
          .append('g')
          .call(xAxisGenerator)
          .style('transform', `translateY(${boundedHeight}px)`)
          .attr('class', 'x-axis')

        const xAxisLabel = xAxis.append("text")
          .attr("class", "axis-label")
          .attr("x", boundedWidth / 2)
          .attr("y", margin.bottom - 10)
          .text("Shipment Count")

        // Y-Axis
        // const yDomainMax = d3.max(dataParsed, d => marginAccessor(d)) || 0
        const yDomainMax = d3.max(dataParsed, d => d['margin'])
        const yDomainMin = d3.min(dataParsed, d => d['margin'])
        const yDomain = [yDomainMin, yDomainMax]
        const yDomainAdj = [yDomainMin - ((yDomainMax - yDomainMin) * .10), yDomainMax + ((yDomainMax - yDomainMin) * .10)]
        const yScale = d3.scaleLinear()
          .domain(yDomainAdj)
          .range([boundedHeight, 0])
        const yAxisGenerator = d3.axisLeft(yScale)
          .scale(yScale)
          .tickPadding(10)
          .tickSize(0)
          .tickFormat(d3.format("$,.2s"))

        const yAxis = group
          .append('g')
          .call(yAxisGenerator)
          .attr('class', 'y-axis')

        const yAxisLabel = yAxis.append("text")
          .attr("class", "axis-label")
          .attr("x", (-boundedHeight / 2))
          .attr("y", -margin.left + 30)
          .style("transform", "rotate(-90deg)")
          .attr("text-anchor", "middle")
          .text("Margin $")

        // Other Scales
        const radiusScale = d3.scaleLinear()
          .domain(d3.extent(dataParsed, d => d['lanes']))
          .range([2, 20])

        const customPalette = []
        const regionSet = [...new Set(dataParsed.map(d => d.region))]
        regionSet.sort();
        const colorScale = d3.scaleOrdinal(regionSet, d3.schemeTableau10) //customPalette
        console.log("regionSet", regionSet)

        // const stateEntries = d3.group(dataParsed, d => d.state)
        const stateEntries = d3.nest()
          .key(function(d) { return d.state; })
          .entries(dataParsed)
        console.log("stateEntries", stateEntries)

        const minYear = d3.min(uniqueYears)
        const maxYear = d3.max(uniqueYears)

        // Legend
        const legend = group.append("g")
          .attr("class", "legend")
          .attr("transform", `translate(${boundedWidth + 20}, ${20})`)

        regionSet.forEach((region, i) => {
          const legendGroup = legend.append('g')
            .attr('transform', `translate(0, ${i * 17})`);

          legendGroup.append('circle')
            .attr('r', 4.25)
            .attr('fill', colorScale(region));

          legendGroup.append('text')
            .attr('font-size', '10px')
            .attr('x', 10)
            .attr('y', 3.5)
            .text(region)
        })

        // -------------------------------------
        const bisect = d3.bisector((d) => d.year).left

        const interpolateData = (year) => {
          return Array.from(stateEntries, ({key: state, values: entries}) => {
            entries.sort((a, b) => d3.ascending(a.year, b.year));
            const shipments = interpolateValues(entries, 'shipments', year)
            const margin = interpolateValues(entries, 'margin', year)
            const lanes = interpolateValues(entries, 'lanes', year)
            return {
              state: state,
              region: entries[0].region,
              shipments: shipments,
              margin: margin,
              lanes: lanes
            };
          });
        };

        // type NumericKeys = "shipments" | "margin" | "lanes";

        const interpolateValues = (values, key, year) => {
          const i = bisect(values, year, 0, values.length - 1)
          if (i > 0) {
            const a = values[i]
            const b = values[i - 1]
            const t = (year - a.year) / (b.year - a.year)
            return a[key] * (1 - t) + b[key] * t
          }
          return values[i][key]
        }

        const circle = group.append("g")
          .selectAll('circle')
          .data(interpolateData(uniqueYears[0]))
          .join('circle')
          .attr("cx", d => xScale(d.shipments))
          .attr("cy", d => yScale(d.margin))
          .attr("r", d => radiusScale(d.lanes))
          .attr("fill", d => colorScale(d.region))
          .sort((a, b) => d3.descending(a.lanes, b.lanes))

          console.log("here")


        circle
          .on('mouseover', (d) => {
            console.log("mouseover d", d)
            tooltip.html(
              `<span style="float:left;">State:&nbsp&nbsp</span>` +  `<span style="float:right;">${d.state}</span><br>` + 
              `<span style="float:left;">Region:&nbsp&nbsp</span>` +  `<span style="float:right;">${d.region}</span><br>` + 
              `<span style="float:left;">Lanes:&nbsp&nbsp</span>` +  `<span style="float:right;">${d3.format(",.0f")(d.lanes)}</span><br>` + 
              `<span style="float:left;">Shipments:&nbsp&nbsp</span>` +  `<span style="float:right;">${d3.format(",.0f")(d.shipments)}</span><br>` + 
              `<span style="float:left;">Margin:&nbsp&nbsp</span>` +  `<span style="float:right;">${d3.format("$,.0f")(d.margin)}</span>` 
            )
              .style("visibility", "visible")
          })
          .on('mousemove', () => {
            tooltip.style("top", (d3.event.pageY - 200) + "px").style("left", (d3.event.pageX + 10) + "px");
          })
          .on('mouseout', () => {
            tooltip.style("visibility", "hidden")
          })

        

        let currentYear = minYear
        
        const update = (year) => {
          const dataYear = interpolateData(year);
          circle.data(dataYear, d => d.state)
            .attr("cx", d => xScale(d.shipments))
            .attr("cy", d => yScale(d.margin))
            .attr("r", d => radiusScale(d.lanes));

          const progressValue = (year - (minYear || 0)) / ((maxYear || 0) - (minYear || 0));
          const progressWidth = progressBarWidth * progressValue;
          progress.attr('width', progressWidth);
        
          const progressEndDotX = progressBarX + progressWidth;
          progressEndDot.attr('cx', progressWidth);

          const roundedYear = Math.round(year);
          progressEndDot.attr('data-year', roundedYear);
          progressLabel.attr('x', progressEndDot.attr('cx')).text(roundedYear);
        };

        // --------------------------------------
        // buttons and progress bar
        let animationPaused = false;
        let isTransitioning = false;
        let transitionEnded = false;

        const progressBarHeight = 5;
        const progressBarWidth = boundedWidth / 2;
        const progressBarX = margin.left + (boundedWidth - progressBarWidth) / 2;
        const progressBarY = 30;

        const buttonContainer = group.append('g')
          .attr("transform", `translate(${progressBarX - 150}, ${progressBarY - 32})`)
          .attr("class", "buttonContainer")

        const buttonRect = buttonContainer.append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', 30)
          .attr('height', 20)
          .attr('fill', 'transparent')
          .attr('stroke', '#595959')

        const buttonText = buttonContainer.append('text')
          .attr('x', 15)
          .attr('y', 10)
          .attr('text-anchor', 'middle')
          .style('dominant-baseline', 'middle')
          .style('font-size', 10)
          .style('fill', '#595959')
          .text('Start')
          .on('click', function () {
            const d3This = d3.select(this)
            d3This.text('Stop')
          })

        const progressBar = svg
          .append('g')
          .attr('transform', `translate(${progressBarX}, ${progressBarY})`)
          .attr("class", "progresBar")

        progressBar
          .append('rect')
          .attr('class', 'progress-bar-bg')
          .attr('width', progressBarWidth)
          .attr('height', progressBarHeight)
          .attr('rx', 6)
        
        const progress = progressBar
          .append('rect')
          .attr('class', 'progress-bar')
          .attr('width', 0)
          .attr('height', progressBarHeight)
          .attr('rx', 6)
        
        const progressEndDot = progressBar
          .append('circle')
          .attr('class', 'progress-end-dot')
          .attr('cy', progressBarHeight / 2)
          .attr('r', 5)
          
        const progressLabel = progressBar
          .append('text')
          .attr('class', 'progress-label')
          .attr('x', progressBarX + progressBarWidth)
          .attr('y', -8)
          .text('');

        const yearScale = d3.scaleLinear()
          .domain([0, progressBarWidth])
          .range([minYear, maxYear])

        const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

        const transitionFunction = () => {
          if (!isTransitioning) {
            buttonText.text('Stop')
            startAnimation()
          } else {
            buttonText.text('Start')
            stopAnimation()
          }
        }

        const drag = d3.drag()
          .on('drag', () => {
            if (!isTransitioning) {
              const newX = clamp(d3.event.x, 0, progressBarWidth)
              progressEndDot.attr('cx', newX);
              const newYear = Math.round(yearScale(newX));
              progress.attr('width', newX);
              currentYear = newYear;
              update(currentYear)
            }
          });

        progressEndDot.call(drag)
        // (progressEndDot as unknown as d3.Selection<Element, unknown, null, undefined>).call(drag) 

        const startAnimation = () => {
          if (transitionEnded) {
            currentYear = minYear;
            progress.attr('width', 0)
            transitionEnded = false;
          }

          if (!isTransitioning) {
            isTransitioning = true
            animationPaused = false

            // MAJD
            const totalDuration = 10000;
            const elapsed = (currentYear - (d3.min(uniqueYears) || 0)) / (d3.max(uniqueYears) - d3.min(uniqueYears)) * totalDuration;
            console.log("currentYear/elapsed", currentYear, elapsed)

            svg.transition()
              .duration(totalDuration - elapsed)
              .ease(d3.easeLinear)
              .tween("year", () => {
                const year = d3.interpolateNumber(currentYear, (maxYear || 0));
                return (t) => {
                  currentYear = year(t);
                  update(currentYear);
                };
              })
              .on("end", () => {
                isTransitioning = false;
                buttonText.text("Start")
                transitionEnded = true;
              })
          }
        }

        const stopAnimation = () => {
          if (isTransitioning) {
            isTransitioning = false
            animationPaused = true
            svg.interrupt()
          }        
        }

        buttonContainer.on('click', transitionFunction)
      })


    } catch (error) {
        console.log(error)
    }

      // Callback at the end of the rendering to let Looker know it's finished
      done()
  },
}
