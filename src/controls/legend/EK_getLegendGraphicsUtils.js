import { renderIcon } from '../../utils/legendrender';
import maputils from '../../maputils';

//Parses an object to a querystring
function serialize(obj) {
	let str = [];
	for (const key in obj) {
	  if (obj.hasOwnProperty(key)) {
	    str.push(encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]))
	  }
	}
	return str.join("&");
}

//Builds and returns the url based on properties
function buildGetLegendGraphicUrl(layer,viewer){
	console.log(layer.getSource())
	console.log(layer.getSource().getUrls())
	let url = layer.getSource().getUrls()[0]
	let properties = {
		layer : layer.get('name'),
		format : "image/png",
		version : layer.getSource().getParams().VERSION
	}

	if(layer.getProperties().legendGraphicSettings)
		properties = Object.assign(properties, layer.getProperties().legendGraphicSettings);

	properties.request = "getLegendGraphic";
	properties.scale = maputils.resolutionToScale(viewer.getMap().getView().getResolution(), viewer.getProjection());

	url += `?` + serialize(properties);
	return url;
}

export const getLegendGraphicIcon = function getLegendGraphicIcon(layer, viewer) {
	let url = (layer.get('theme') || layer.get('grouplayer')) ? 'img/svg/temaikon.svg' : buildGetLegendGraphicUrl(layer, viewer);
	let iconOpt = { src : url};
	//Set data-layer to layername to be able to find element and update src
	return renderIcon.Icon(iconOpt).replace(`<img `, `<img data-layer=${layer.get('name')} `);
}

export const getLegendGraphicUrl = function getLegendGraphicUrl(layer, viewer){
	return buildGetLegendGraphicUrl(layer, viewer);
}

export const getLegendGraphicUrlStyle = function getLegendGraphicUrlStyle(layer, viewer){
	let url = buildGetLegendGraphicUrl(layer, viewer);
	//this format is used to match with what Origo expects
	let style = 
		[
			[
				{ 
					icon: { src: url},
					extendedLegend : "true"
				}
			]
		]
	return style;
}