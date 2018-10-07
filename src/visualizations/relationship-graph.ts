import * as d3 from 'd3'
import { formatType, handleErrors } from '../common/utils'
import { Row, Looker, VisualizationDefinition } from '../common/types';

import './relationship-graph.scss'

// <svg width="960" height="600"></svg>
// <script src="https://d3js.org/d3.v4.min.js"></script>

// Global values provided via the API
declare var looker: Looker;

interface RelationshipGraphVisualization extends VisualizationDefinition {
    svg?: any,
}

// recursively create children array
function descend(obj: any, depth: number = 0) {
  const arr: any[] = []
  for (const k in obj) {
    if (k === '__data') {
      continue
    }
    const child: any = {
      name: k,
      depth,
      children: descend(obj[k], depth + 1)
    }
    if ('__data' in obj[k]) {
      child.data = obj[k].__data
    }
    arr.push(child)
  }
  return arr
}

function burrow(table: Row[]) {
  // create nested object
  const obj: any = {}

  table.forEach((row: Row) => {
    // start at root
    let layer = obj

    // create children as nested objects
    row.taxonomy.value.forEach((key: any) => {
      layer[key] = key in layer ? layer[key] : {}
      layer = layer[key]
    })
    layer.__data = row
  })

  // use descend to create nested children arrays
  return {
    name: 'root',
    children: descend(obj, 1),
    depth: 0
  }
}

const vis: RelationshipGraphVisualization = {
  id: 'relationshipVizGraph', // id/label not required, but nice for testing and keeping manifests in sync
  label: 'Despoina Karna',
  options: {
    title: {
        type: 'string',
        label: 'Complex Relationship Viz',
        display: 'text',
        default: 'Vizualazation of complex relationships as graph'
    },
    color_range: {
      type: 'array',
      label: 'Color Range',
      display: 'colors',
      default: ['#dd3333', '#80ce5d', '#f78131', '#369dc1', '#c572d3', '#36c1b3', '#b57052', '#ed69af']
    }
  },

  // Set up the initial state of the visualization
  create(element, config) {
    element.style.fontFamily = `"Open Sans", "Helvetica", sans-serif`
    this.svg = d3.select(element).append('svg')
  },

  // Render in response to the data or settings changing
  update(data, element, config, queryResponse) {
    if (!handleErrors(this, queryResponse, {
      min_pivots: 0, max_pivots: 0,
      min_dimensions: 3, max_dimensions: 3,
      min_measures: 0, max_measures: 0
    })) return

    const width = element.clientWidth
    const height = element.clientHeight
    const heightSmall = height/2 - 10;

    const radius = Math.min(width, height) / 2 - 8
    const dimensions = queryResponse.fields.dimension_like

    const svg = (
      this.svg
      .html('')
      .attr('width', '100%')
      .attr('height', '100%')
      .append('g')
      .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')
    )
    const label = svg.append('text').attr('y', -height / 2 + 20).attr('x', -width / 2 + 20)

    // data.forEach(row => {
    //   row.taxonomy = {
    //     value: dimensions.map((dimension) => row[dimension.name].value)
    //   }
    // })

    // const measure = queryResponse.fields.measure_like[0]
    // const format = formatType(measure.value_format) || ((s: any): string => s.toString())

    const colorScale: d3.ScaleOrdinal<string, null> = d3.scaleOrdinal();;
    const color = colorScale.range(config.color_range);
    // const color = d3.scaleOrdinal(d3.schemeCategory20);

    console.log( 'data', data );
    console.log( 'element', element );
    console.log( 'config', config );
    console.log( 'queryResponse', queryResponse );
    console.log( 'width', width );
    console.log( 'height', height );


    var graph = data2graph(data);
    console.log('graph', graph );

    var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(0,0));


  var link = svg.append("g")
      .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")
      .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

  var node = svg.append("g")
      .attr("class", "nodes")
    .selectAll("g")
    .data(graph.nodes)
    .enter().append("g")

  var circles = node.append("circle")
      .attr("r", 5)
      .attr("fill", function(d) { return color(d.group); })
      .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

  var lables = node.append("text")
      .text(function(d) {
        return d.id;
      })
      .attr('x', 6)
      .attr('y', 3);

  node.append("title")
      .text(function(d) { return d.id; });

  simulation
      .nodes(graph.nodes)
      .on("tick", ticked);

  simulation.force("link")
      .links(graph.links);

  function ticked() {
    link
      .attr("x1", function(d) { return d.source.x = Math.max(-width, Math.min( width,  d.source.x)); })
      .attr("y1", function(d) { return d.source.y = Math.max(-heightSmall, Math.min( heightSmall,  d.source.y)); })
      .attr("x2", function(d) { return d.target.x = Math.max(-width, Math.min( width,  d.target.x)); })
      .attr("y2", function(d) { return d.target.y = Math.max(-heightSmall, Math.min( heightSmall,  d.target.y)); });

    node
        .attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
        })
  }

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}



function data2graph(data){
  var graph = {nodes:[], links:[]};
  var globalGroups = new Map();
  var globalRelationships = new Map();

  data.forEach(row => {

    var id = String(row["graph.id"].value);
    var relatives = String(row["graph.relatives"].value);
    var groups = String(row["graph.groups"].value);

    var allGroups = groups.split("|");

    if ( !globalGroups.has(groups) ) {
      globalGroups.set(groups, globalGroups.size + 1);
    }
    graph.nodes.push({"id": id, "group": globalGroups.get(groups)});
    for (var i = 0; i < allGroups.length; i++) {
      var group = allGroups[i];
      if ( !globalGroups.has(group) ) {
        globalGroups.set(group, globalGroups.size + 1);
        graph.nodes.push({"id": group, "group": globalGroups.get(group)});
      }
      graph.links.push({"source": id, "target": group, "value": globalRelationships.get(relativeRelationship)})
    }

    var allRelatives = relatives.split("|");
    for (var i = 0; i < allRelatives.length; i++) {
      var relative = allRelatives[i];
      var splitRelative = relative.split(":");
      var relativeID = String(splitRelative[0]);
      var relativeRelationship = String(splitRelative[1]);
      if ( ! globalRelationships.has(relativeRelationship) ) {
        globalRelationships.set(relativeRelationship, globalRelationships.size + 1);
      }
      graph.links.push({"source": id, "target": relativeID, "value": globalRelationships.get(relativeRelationship)})
    }
  })
  return graph
}



  } // END update
}

looker.plugins.visualizations.add(vis)
