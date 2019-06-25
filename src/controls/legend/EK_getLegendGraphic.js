import { 
	getLegendGraphicUrlStyle, 
	getLegendGraphicUrl, 
	getLegendGraphicIcon } from './EK_getLegendGraphicsUtils';
import { Component } from '../../ui';

/*
	Component mainly initializes and updates the legend
	graphics when zooming in and zooming out. It also 
	forwards some utility functions from getLegendGraphicsUtils
	incase those functions are needed
*/
const GetLegendGraphic = function GetLegendGraphic(options = {}) {
    let {
        target
    } = options;

    let viewer = options.viewer;
	let CurrentZoom;
	let layers = viewer.getMap().getLayers().getArray();


	function updateLegendGraphics(layer){
		let layername = layer.get('name');
		/*Try to get and update tags with data-layer on them.
			The data-layer property is set the utils*/
		let img = document.querySelector(`[data-layer='${layername}']`);
		if(img){
			img.src = getLegendGraphicUrl(layer, viewer);
		}
	}
	
	return Component({
	    onAdd(evt) {
	        viewer = evt.target;
	        
	    },
	    initUpdatingWhenZoom() {
	    	//Initializes CurrentZoom before checking its value
	    	CurrentZoom = viewer.getMap().getView().getZoom();
	    	viewer.getMap().on('moveend', () => {
		    	let zoom = viewer.getMap().getView().getZoom();
		    	/*Compare the current zoom to out last saved zoom
		    		and only update if zoom lvl has changed*/
			    if(CurrentZoom != zoom){
			      CurrentZoom = zoom
			      layers.forEach(updateLegendGraphics)
			    }  
	    	})
	    },
	    getLegendGraphicUrlStyle, 
		getLegendGraphicUrl, 
		getLegendGraphicIcon,
	    onInit() {},
	    render() {
	        this.dispatch('render');
	    }
    });
};

export default GetLegendGraphic;