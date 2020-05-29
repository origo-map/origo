import { renderIcon } from '../../utils/legendrender';
import maputils from '../../maputils';
import {
    ImageWMS,
    TileWMS,
    OSM
} from 'ol/source';

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
	try {
		let url = layer.getSource().getUrls()[0]
		let properties = {
			layer : layer.get('name'),
			format : "image/png",
			version : layer.getSource().getParams().VERSION
		}
	
		if(layer.getProperties().legendGraphicSettings)
			properties = Object.assign(properties, layer.getProperties().legendGraphicSettings);
	
		properties.request = "getLegendGraphic";
		properties.scale = Number(maputils.resolutionToScale(viewer.getMap().getView().getResolution(), viewer.getProjection())) - 1;
	
		url += `?` + serialize(properties);
		return url;
	} catch (error) {
		console.warn("Error while generating Legend graphic url for layer named '", layer.get('name'), "'.... Error message: ",  error)
		return ""
	}
	
	
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

 // All urls should point to wms service, regardless if layer type is wfs
 export const fetchSourceUrl = function fetchSourceUrl(layer) {
	let url;
	switch (layer.get('type').toUpperCase()) {
		case "WMS":
			if (layer.getSource() instanceof TileWMS) {
				url = layer.getSource().getUrls()[0];
			} else if (layer.getSource() instanceof ImageWMS) {
				url = layer.getSource().getUrl();
			}
			if (url.charAt(0) === "/") {
				url = window.location.protocol + "//" + window.location.hostname + url;
			}
			return url;
			break;
		case "WFS":
			let fullUrl = viewer.getSettings().source[layer.get('sourceName')].url;
			let parsed = fullUrl.split('/');
			let result = parsed[0] + '//' + parsed[2];
			return result + '/geoserver/wms';
			break;
	}
	// return viewer.getSettings().source[sourceName].url;

}

export const getIfThemeLayer = function getIfThemeLayer(viewer, layers) {	/*
	Get legend Json and add add theme true to layer if it is a theme layer
	*/

	var requests = [];
    layers.forEach(function (layer) {
		//ArcGIS WMS layers are handled manually at the moment as not the same format:application/json getLegendGraphic response as Geoserver's
		if (layer.get('type').toUpperCase() === "WMS" && !Boolean(layer.get("ArcGIS"))) {
			let params;
			let url = fetchSourceUrl(layer);
			let requestUrl;
			if (!layer.get('theme') && layer.get('group') !== "background") {
				params = {
					service: "WMS",
					version: "1.1.0",
					request: "GetLegendGraphic",
					layer: layer.get("name"),
					format: "application/json",
					scale: 401 //reasonable scale to check whether layer is a theme layer
				}
				requestUrl = url + '?' + Object.keys(params).map(function (key) {return key + '=' + params[key]}).join('&')
				requests.push(new Promise(function(resolve, reject) {
					try {
						var thelayer;
						fetch(requestUrl).then(
							response => {
								thelayer = layer
								return response.json()
						}).then( 
							(resp) => {
								let isThemeLayer = checkIfThemeFromLegend(thelayer, resp)
								resolve({isThemeLayer: isThemeLayer, layerName: thelayer.get('name')})
							},
							(err) => {
								console.error("Error: ", err)
							}
						);
					}
					catch(error) {
						console.error("Error while getting legend as json: ", error)
						reject(error)
					}
					
				}));
			}
		}
	})
	return requests
}

export const checkIfThemeFromLegend = function checkIfThemeFromLegend (layer, info) {
	if (!layer.get("sublayers")) { 
		if ((info.Legend[0].layerName === layer.get("name") && info.Legend[0].rules.length > 1) || (info.Legend.length > 1)) {
			return true
		}
	}

	return false
}