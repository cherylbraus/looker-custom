import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'
import { object } from './topTextTile'
import * as $ from 'jquery'

// Query the element
const ele = document.getElementById('viz-container');

// The current position of mouse
let x = 0;
let y = 0;

// The dimension of the element
let w = 0;
let h = 0;



const this_environment = "dev";
const done = () => {
	console.log("done")
}    
const menuOptions = "<div id='menu'><h1><strong>Menu</strong></h1><div id='menu-options'></div></div></div>" 
$("body").append(menuOptions)

const keys = Object.keys(object.options)

console.log("object.options", object.options)
console.log("Object", Object.keys(object.options))
console.log("keys", keys)

keys.forEach(function(entry, i) {

	const array_name = object.options[entry].label

	$("#menu-options").append("<p>" + array_name + "</p>")

	var form = $('<form>', {
		id: 'id-1',
		class: 'menu-options-entry'
	}).appendTo('#menu-options');

	// console.log("display", object.options[entry].display, ["radio","select"].includes(object.options[entry].display))

	if (["radio","select"].includes(object.options[entry].display)) {
		const array_values = object.options[entry].values;

		array_values.forEach(function(ent) {
			let str;

			if (ent[Object.keys(ent)[0]] == object.options[entry]["default"]) {
				str = "<input type='radio' internal_cat='" + keys[i] + "' internal_value='" + ent[Object.keys(ent)] + "' id='" + Object.keys(ent)[0] + "' name='" + array_name + "' value='" + Object.keys(ent)[0] + "' checked></input><label class='form-label' for='" + Object.keys(ent)[0] + "'>" + Object.keys(ent)[0] + "</label>"
			} else {
				str = "<input type='radio' internal_cat='" + keys[i] + "' internal_value='" + ent[Object.keys(ent)] + "' id='" + Object.keys(ent)[0] + "' name='" + array_name + "' value='" + Object.keys(ent)[0] + "'></input><label class='form-label' for='" + Object.keys(ent)[0] + "'>" + Object.keys(ent)[0] + "</label>"
			}
			form.append(str)
		})
	} else if (object.options[entry].display == "number") {
		let str;
		str = "<input type='number' internal_cat='" + keys[i] + "' internal_value='" + object.options[entry]["default"] + "' id='" + keys[i] + "' min='0' name='" + object.options[entry]["label"] + "' value='" + object.options[entry]["default"] + "'></input><label class='form-label' for='" + object.options[entry]["label"] + "'>" + object.options[entry]["label"] + "</label>"
		form.append(str)
	} else if (object.options[entry].display == "text") {
		let str;
		str = "<input type='text' internal_cat='" + keys[i] + "' internal_value='" + object.options[entry]["default"] + "' id='" + keys[i] + "' name='" + object.options[entry]["label"] + "' value='" + object.options[entry]["default"] + "'></input><label class='form-label' for='" + object.options[entry]["label"] + "'>" + object.options[entry]["label"] + "</label>"
		form.append(str)
	} else if (object.options[entry].type == "boolean") {
		const array_values = ["true", "false"]

		array_values.forEach(function(ent) {
			let str;

			if (ent == object.options[entry]["default"]) {
				// console.log("adding default")
				str = "<input type='radio' internal_cat='" + keys[i] + "' internal_value='" + ent + "' id='" + keys[i] + "' name='" + array_name + "' value='" + ent + "' checked></input><label class='form-label' for ='" + ent + "'>" + ent + "</label>"
			} else {
				// console.log("not default")
				str = "<input type='radio' internal_cat='" + keys[i] + "' internal_value='" + ent + "' id='" + keys[i] + "' name='" + array_name + "' value='" + ent + "'></input><label class='form-label' for ='" + ent + "'>" + ent + "</label>"
			}
			form.append(str)
		})
	} else if (object.options[entry].type == "array") {
		const array_values = object.options[entry].default;

		// console.log("array_values", array_values)

		array_values.forEach(function(ent) {
			let str;

			// console.log("ent", ent)

			if (ent == array_values[0]) {
				str = "<input type='radio' internal_cat='" + keys[i] + "' internal_value='" + ent + "' id='" + ent + "' name='" + array_name + "' value='" + ent + "' checked></input><label class='form-label' for='" + ent + "'>" + ent + "</label>"
			} else {
				str = "<input type='radio' internal_cat='" + keys[i] + "' internal_value='" + ent + "' id='" + ent + "' name='" + array_name + "' value='" + ent + "'></input><label class='form-label' for='" + ent + "'>" + ent + "</label>"
			}
			form.append(str)
		})
	}
})


d3.json("http://localhost:3001/dataTopTextTile").then(function(data) {
	let todays_options = {}

	$('input:radio:checked').each(function() {
		todays_options[this.attributes.internal_cat.value] = this.attributes.internal_value.value
	});
	$('input[type=number]').each(function() {
		todays_options[this.attributes.internal_cat.value] = this.attributes.internal_value.value
	})
	$('input[type=text]').each(function() {
		todays_options[this.attributes.internal_cat.value] = this.attributes.internal_value.value
	})
	$('input[type=boolean]').each(function() {
		todays_options[this.attributes.internal_cat.value] = this.attributes.internal_value.value
	})
	// $('input[type=array]').each(function() {
	// 	todays_options[this.attributes.internal_cat.value] = this.attributes.internal_value.value
	// })

	const details = ""
	// Fire first instance of chart
	object.updateAsync(data.data, d3.select("#vis")._groups[0][0], todays_options, data.queryResponse, details, done, this_environment)
	
	// On change to options, loop through selections and then redraw chart
	$('input:radio').on("click", function() {
		$('input:radio:checked').each(function() {
			todays_options[this.attributes.internal_cat.value] = this.attributes.internal_value.value
		});
		object.updateAsync(data.data, d3.select("#vis")._groups[0][0], todays_options, data.queryResponse, details, done, this_environment)
	});
	$('input[type=number]').on("input", function() {
		// const id = $('input[type=number]').attr("id")
		const id = this.attributes.id.value
		let num = $("#" + id).val()
		todays_options[this.attributes.internal_cat.value] = num
		object.updateAsync(data.data, d3.select("#vis")._groups[0][0], todays_options, data.queryResponse, details, done, this_environment)
	});
	$('input[type=text]').on("input", function() {
		const id = this.attributes.id.value
		let str = $("#" + id).val()
		todays_options[this.attributes.internal_cat.value] = str
		object.updateAsync(data.data, d3.select("#vis")._groups[0][0], todays_options, data.queryResponse, details, done, this_environment)
	});


	// Handle the mousedown event
	// that's triggered when user drags the resizer
	const mouseDownHandler = function (e) {

	    // Get the current mouse position
	    x = e.clientX;
	    y = e.clientY;

	    // Calculate the dimension of element
	    const styles = window.getComputedStyle(ele);
	    w = parseInt(styles.width, 10);
	    h = parseInt(styles.height, 10);

	    
	    // Attach the listeners to `document`
	    document.addEventListener('mousemove', mouseMoveHandler);
	    document.addEventListener('mouseup', mouseUpHandler);
	};

	const mouseMoveHandler = function (e) {
	    // How far the mouse has been moved
	    const dx = e.clientX - x;
	    const dy = e.clientY - y;

	    // Adjust the dimension of element
	    ele.style.width = `${w + dx}px`;
	    ele.style.height = `${h + dy}px`;
	};

	const mouseUpHandler = function () {
	    // Remove the handlers of `mousemove` and `mouseup`
	    document.removeEventListener('mousemove', mouseMoveHandler);
	    document.removeEventListener('mouseup', mouseUpHandler);
	    object.updateAsync(data.data, d3.select("#vis")._groups[0][0], todays_options, data.queryResponse, details, done, this_environment)
	};

	// Query all resizers
	const resizers = ele.querySelectorAll('.resizer');

	// Loop over them
	[].forEach.call(resizers, function (resizer) {
	    resizer.addEventListener('mousedown', mouseDownHandler);
	});

})