// Width and height
var chart_width     =   800;
var chart_height    =   600;
var ibox 			= 	chart_height/6;
var color 			=   d3.scaleQuantile().range([
		'rgb(255,245,240)', 'rgb(254,224,210)', 'rgb(252,187,161)', 
		'rgb(252,146,114)', 'rgb(251,106,74)', 'rgb(239,59,44)', 
		'rgb(203,24,29)', 'rgb(165,15,21)', 'rgb(103,0,13)'	   
	]);

//Projection
var projection      = d3.geoAlbersUsa()
	.translate([0, 0]);

var path 			=   d3.geoPath(projection)

// Create SVG
var svg             =   d3.select("#chart")
    .append("svg")
    .attr("width", chart_width)
    .attr("height", chart_height);
   

var zoom_map		=	d3.zoom()
	.scaleExtent([0.8, 6.0])
	.translateExtent([
			[-500, -500],
			[500, 500]
		])
	.on('zoom', function(){
	// console.log(d3.event);
	var offset 		= [
		d3.event.transform.x,
		d3.event.transform.y
	];
	var scale 		= d3.event.transform.k * 900;

	projection.translate(offset)
		.scale(scale);

		svg.selectAll('path')
			.transition()
			.attr('d', path);

		svg.selectAll('circle')
			.transition()
			.attr("cx", (d) => projection([d.lon, d.lat])[0])
			.attr("cy", (d) => projection([d.lon, d.lat])[1]);
});

var map 			= 	svg.append('g')
	.attr('id', 'map')
	.call(zoom_map)
	.call(
			zoom_map.transform,
			d3.zoomIdentity
				.translate(chart_width/2, chart_height/2)
				.scale(1)
		);

map.append('rect')
	.attr('x', 0)
	.attr('y', 0)
	.attr('width', chart_width)
	.attr('height', chart_height)
	.attr('opacity', 0);

var title			= svg.append('text')
    .text('Record High Temperatures Per State')
    .attr('x', '50%')
    .attr('y', 50)
    .attr('text-anchor', 'middle')
    .attr('font-size', 25)
    .attr('font-weight', 'bold');

var infogroup			= svg.append('g')
	.attr('id', 'info-group');

var infobox 			= infogroup.append('rect')
	.attr('width', chart_width/2)
	.attr('height', ibox)
	.attr('stroke', '#333')
	.attr('stroke-width', 1)
	.attr('fill', '#f7f7f7')
	.attr('opacity', 0.9)
	.attr('y', (chart_height-ibox)-0.5);

var cityinfo 		= infogroup.append('text')
	.attr('class', 'infotitles')
	.attr('x', 10)
	.attr('y', (chart_height-ibox) + 25)
	.text('Location: ')
	.append('tspan')
	.attr('class', 'infotext')
	.text('Roll Over a City');

var dateinfo 		= infogroup.append('text')
	.attr('class', 'infotitles')
	.attr('x', 10)
	.attr('y', (chart_height-ibox) + 55)
	.text('Date: ')
	.append('tspan')
	.attr('class', 'infotext');

var tempinfo 		= infogroup.append('text')
	.attr('class', 'infotitles')
	.attr('x', 10)
	.attr('y', (chart_height-ibox) + 85)
	.text('Temperature: ')
	.append('tspan')
	.attr('class', 'infotext');

var moreinfoGroup   = svg.append('g');

var moreinfo		= moreinfoGroup.append('text')
	.text('More Information: ')
	.attr("class", "moreinfotext")
	.attr('x', chart_width/2 + 5)
	.attr('y', chart_height-2);

var moreinfolink   	= moreinfoGroup.append('a')
    .attr("href", "https://en.wikipedia.org/wiki/U.S._state_temperature_extremes")
    .attr("target", "_blank")
    .attr("class", "infolink")
    .append('text')
    .classed('moreinfotext', true)
    .attr('x', (chart_width/2) + 95)
    .attr('y', chart_height-2)
    .text('https://en.wikipedia.org/wiki/U.S._state_temperature_extremes');


// Data
d3.json('data/hottest-states.json').then(function(heat_data){
	color.domain([
		d3.min(heat_data, (d) => d.num),
		d3.max(heat_data, (d) => d.num)
	]);

	d3.json('data/us.json').then(function(us_data){
		us_data.features.forEach((us_e, us_i) =>{
			heat_data.forEach((z_e, z_i) =>{
				if(us_e.properties.name !== z_e.state){
					return null;
				}

				us_data.features[us_i].properties.num = parseFloat(z_e.num);
			});
		});

		// console.log(us_data);

		map.selectAll('path')
			.data(us_data.features)
			.enter()
			.append('path')
			.attr('d', path)
			.attr('fill', (d) => {
				var num = d.properties.num;
				return num ? color(num) : '#ddd';
			})
			.attr('stroke', (d) =>{
				if(d.properties.name == 'Alaska' || d.properties.name == 'Hawaii'){
					var colorcheck = d.properties.num;
					if(color(colorcheck) == 'rgb(255,245,240)'){
						return '#000';
					}
				}
				return '#fff';
			})
			.attr('stroke-width', 1);



			draw_cities();
		});

});

function draw_cities(){
	d3.json('data/hottest-cities.json').then((city_data) =>{
		map.selectAll("circle")
			.data(city_data)
			.enter()
			.append("circle")
			.attr('class', 'cities')
			.style("fill", "#9D497A")
			.style("opacity", 0.8)
			.attr("cx", (d) => projection([d.lon, d.lat])[0])
			.attr("cy", (d) => projection([d.lon, d.lat])[1])
			.attr("r", (d) => 7)
			// .append('title')
			// .text((d) => d.city);
			.on('mouseover', function(d){
					var city = d.city;
					var date = d.date;
					var temp = d.temp;
					cityinfo.attr('dx', 2)
						.text(city);
					dateinfo.attr('dx', 2)
						.text(date);
					tempinfo.attr('dx', 2)
						.text(temp);       		
			});

	});
}

d3.selectAll('#buttons button.panning')
	.on('click', function(){
		
		var distance  = 100;
		var direction = d3.select(this).attr('class').replace('panning ', '');
		var x		  = 0;
		var y 		  = 0;

		if(direction == "up"){
			y += distance;

		}else if(direction == "down"){
			y -= distance;

		}else if(direction == "left"){
			x += distance;

		}else if(direction == "right"){
			x -= distance;
		}

		map.transition()
			.call(zoom_map.translateBy, x, y);
	});

d3.selectAll('#buttons button.zooming')
	.on('click', function(){
		
		var scale  = 1;
		var direction = d3.select(this).attr('class').replace('zooming ', '');

		if(direction === "in"){
			scale = 1.25;

		}else if(direction === "out"){
			scale = 0.75;

		}

		map.transition()
			.call(zoom_map.scaleBy, scale);
	});
