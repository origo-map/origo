import { Component, Button, dom, Element } from '../ui';
import Mapfishprint from './EK-mapfishprint';
import maputils from '../maputils';
import Printarea from './EK-printarea';
import { getCenter } from 'ol/extent';


const Printmenu = function Printmenu(options = {}) {
    let viewer;
    let {
        target,
        largeScaleRestriction,
        orientations,
        employsArcGISServerWMS,
        MapfishInfoUrl,
        MapfishCreateUrl
    } = options;


    let mapfishConfig, hideLayouts, layoutIfHidden, vector, layouts;

    //components internally
    let closePrintMenu, printButtonTool, sizeselect, scaleselect, orientationselect, clearButton, layoutselect, printDpi, printCreate, formatselect, titleInput;

    //imported "help-components" specific for this printmenu
    let printarea, mapfishPrint;

    //Html objects of some components
    let htmlSizes, htmlOrientation, htmlLayouts, htmlScales, htmlResos, htmlPrintmenu, htmlTitle;




    function buildPanel(config) {
        let outputFormats = config.outputFormats.map(function(format) {
            return format.name.toUpperCase();
        });

        let layoutNames = config.layouts.map(function(layout) {
            return layout.name.split('-')[0];
        });

        //Populera mall-lista med endast ett entry per "layout" i config.yaml. Enligt kravspec
        layouts = layoutNames.filter(function(layoutName) {
            if (!this.has(layoutName)) {
                this.set(layoutName, true);
                return true;
            }
        }, new Map);

        if (layouts.length > 1) {
            hideLayouts = false;
        }

        let dpis = config.dpis.map(function(dpi) {
            return dpi.value;
        });

        function layoutOptions(layouts) {
            let htmlstring = '';
            for (let i = 0; i < layouts.length; i++) {
                htmlstring += `<option value=${layouts[i].name}>${layouts[i].name}</option>`;
            }
            return htmlstring;
        }

        function sizeOptions(sizes) {
            let revSize = sizes.reverse();
            let htmlstring = '';
            for (let i = 0; i < sizes.length; i++) {
                let index = (sizes.length - 1) - i;
                htmlstring += `<option value=${index}>${revSize[i]}</option>`;
            }
            return htmlstring;
        }

        function resoOptions(resos) {
            let options = '';
            resos.forEach((res) => {
                options += `<option value=${res}>${res}</option>`;
            });
            return options;
        }

        function formatOptions(formats) {
            let options = '';
            formats.forEach((format) => {
                options += `<option value=${format}>${format}</option>`;
            });
            return options;
        }

        function scaleOptions(scales) {
            let options = '';
            if (Number.isInteger(largeScaleRestriction)) {
                scales = scales.filter(function(element, index, arr){return parseInt(element.value) >= largeScaleRestriction});
            }
            scales.forEach((scale) => {
                options += `<option value=${scale.value}>${scale.name}</option>`;
            });
            return options;
        }

        let scales = scaleOptions(config.scales);
        formatselect = Element({
            tagName: 'select',
            innerHTML: formatOptions(outputFormats),
            cls: 'o-dd-input'
        });

        scaleselect = Element({
            tagName: 'select',
            innerHTML: scales,
            cls: 'o-dd-input'
        });

        orientationselect = Element({
            tagName: 'select',
            innerHTML: `<option value='Portrait'> ${orientations[0]} </option>
                        <option value='Landscape'> ${orientations[1]} </option>`,
            cls: 'o-dd-input'
        });

        printDpi = Element({
            tagName: 'select',
            innerHTML: resoOptions(dpis),
            cls: 'o-dd-input'
        });

        let namesAndSizes;
        if (hideLayouts) {
            namesAndSizes = getAvailableSizes(layouts[0], config);
            layoutIfHidden = layouts;
        } else {
            //layoutselect = document.getElementById('o-layout-dd');
            //namesAndSizes = getAvailableSizes(layoutselect.options[layoutselect.selectedIndex].text);
        }

        sizeselect = Element({
            tagName: 'select',
            cls: 'o-dd-input',
            innerHTML: sizeOptions(namesAndSizes)
        });

        layoutselect = Element({
            tagname: 'select',
            cls: 'o-dd-input',
            innerHTML: layoutOptions(namesAndSizes)
        });

        printCreate = Button({
            cls: 'btn',
            text: 'Skapa',
            click() {
                let map = viewer.getMap();
                let layers = map.getLayers();
                let extent = vector.getSource().getFeatures()[0].getGeometry().getExtent(); //TODO: Finns risk för nullpointer här, även om det alltid endast finns en vector. Borde hanteras bättre
                let centerPoint = getCenter(extent);
                let visibleLayers = layers.getArray().filter(function(layer) {
                    return layer.getVisible();
                });

                visibleLayers.sort((a, b) => { 
                    if(a.getZIndex() < b.getZIndex() || a.getZIndex() === undefined) return -1;
                    else if (a.getZIndex() > b.getZIndex() || b.getZIndex() === undefined) return 1;
                    return 0;
                });
                
                let contract = {
                    dpi: htmlResos.value,
                    layers: visibleLayers,
                    outputFormat: document.getElementById(formatselect.getId()).value.trim().toLowerCase(),
                    scale: htmlScales.value,
                    orientation: htmlOrientation.value,
                    size: htmlSizes.options[htmlSizes.selectedIndex].text,
                    title: htmlTitle.value,
                    layout: buildLayoutString.apply(null, buildLayoutObjectsArray()),
                    center: centerPoint
                };

                // Abort pending ajax request
                let request = mapfishPrint.printMap(contract);
                let cancel = document.getElementById('o-dl-cancel');
                cancel.addEventListener('click', () => {
                    request.abort();
                    document.getElementById('o-dl-progress').style.display = "none";
                    cancel.style.display = "none";
                });

                return false;
            }
        })

        clearButton = Button({
            text: 'Avbryt',
            cls: 'btn',
            style: 'margin:5px',
            click() {
                let map = viewer.getMap();
                let vector = printarea.getVector();
                if (vector) {
                    vector.setVisible(false);
                    htmlPrintmenu.classList.remove('o-printmenu-show');
                }
            }
        });

        printButtonTool = Button({
            cls: 'padding-small  box-shadow icon-smaller round light box-shadow',
            icon: '#fa-print',
            click() {
                togglePrintMenu();
            }
        });

        closePrintMenu = Button({
            cls: 'padding-small rounded box-shadow icon-smaller light',
            icon: '#fa-times',
            style: 'position: absolute; right: .5rem;',
            click() {
                htmlPrintmenu.classList.remove('o-printmenu-show');
            }
        });

        titleInput = Element({
            tagName: 'input',
            type: 'text',
            cls: 'o-text-input'
        });

    }

    // Hides layouts dropdown if there is only one layout in config.yaml
    function hideOrShowLayouts(shouldHide, layouts) {
        return !shouldHide ?
            `<div class="o-block"> 
        <span class="o-setting-heading">Mall</span> 
        ${layoutselect.render()}
      </div>` : "";
    }

    function getAvailableNamesSizes(config) {
        let configLayouts = config.layouts.map(function(layout, i) {
            let _name = layout.name.split('-')[0];
            let _size = layout.name.split('-')[1];
            return {
                name: _name,
                size: _size
            }
        });

        let namesAndSizes = [];
        // build objects of avaiable sizes for each name
        configLayouts.forEach(function(a) {
            let existsAt;

            if (namesAndSizes.length !== 0) {
                namesAndSizes.forEach(function(o, i) {
                    if (namesAndSizes[i].name === a.name) {
                        existsAt = i;
                        return;
                    } else {
                        existsAt = -1;
                    }
                });

                if (existsAt !== -1) {
                    namesAndSizes[existsAt].sizes.push(a.size);
                } else {
                    namesAndSizes.push({
                        name: a.name,
                        sizes: [a.size]
                    })
                }
            } else {
                namesAndSizes.push({
                    name: a.name,
                    sizes: [a.size]
                });
            }
        });

        namesAndSizes.forEach(function(obj) {
            let noDuplicateSizes = [];
            obj.sizes.forEach((el, i) => {
                    if (!noDuplicateSizes.includes(el)) noDuplicateSizes.push(el);
                })
                // $.each(obj.sizes, function(i, el) {
                //   if ($.inArray(el, noDuplicateSizes) === -1) noDuplicateSizes.push(el);
                // });
            obj.sizes = noDuplicateSizes;
        });
        return namesAndSizes;
    }

    function getAvailableSizes(layout, config) {
        let availableNamesAndSizes = getAvailableNamesSizes(config);
        let sizesByName = availableNamesAndSizes.filter(function(name) {
            return name.name === layout;
        });
        if (sizesByName[0]) {
            return sizesByName[0].sizes;
        } else {
            return [];
        }
    }

    //If Mapfish reports very small scales as exponential numbers then convert to decimal
    function detectAndFixE(scale) {
        if (scale.indexOf('E') > -1) {
            scale = parseFloat(scale).toString();
        }
        return scale;
    }

    function togglePrintMenu() {
        if (htmlPrintmenu.classList.contains('o-printmenu-show')) {
            htmlPrintmenu.classList.remove('o-printmenu-show');
        } else {
            let currScale = maputils.resolutionToScale(viewer.getMap().getView().getResolution(), viewer.getProjection()); //Calculate current map scale,  

            let factor = Math.pow(10, currScale.toString().length) / 10000;
            currScale = Math.round(currScale / factor) * factor;
            if (currScale >= 10000000) { //If map scale >= 1:ten million then convert to exponential nr of form which rhymes with Mapfish
                currScale = currScale.toExponential().toString().toUpperCase().replace('+', '');
            } else {
                currScale = currScale + ".0";
            }

            for (let i = 0; i < htmlScales.options.length; i++) {
                if (htmlScales.options[i].value == currScale) {
                    htmlScales.selectedIndex = i;
                }
            }

            if (!vector) {
                vector = printarea.printA1();
                let paper = getPaperMeasures();
                printarea.addPreview(htmlScales.value, paper);
                htmlPrintmenu.classList.add('o-printmenu-show');
            } else {
                vector.setVisible(true);
                viewer.getMap().removeLayer(vector);
                vector = printarea.printA1();
                let paper = getPaperMeasures();
                printarea.addPreview(htmlScales.value, paper);
                htmlPrintmenu.classList.add('o-printmenu-show');
            }

        }
    }

    function getPaperMeasures(format) {
        let orientationLandscape = htmlOrientation.value == 'Landscape',
            width = 0,
            height = 0;

        // Sätt storlek på polygon till storlek på kartutsnitt
        // Hämta vald mall
        //let size = sizeselect.options[sizeselect.selectedIndex].text; //$('#o-size-dd').find(':selected').text();

        let layoutName = buildLayoutString.apply(null, buildLayoutObjectsArray());
        if (mapfishConfig) {
            let layoutnames = mapfishConfig.layouts;
            let getWidth = function(name) {
                let layout = layoutnames.filter(function(layoutname) {
                    return layoutname.name === name;
                });
                return layout[0] ? layout[0].map.width : 0;
            }
            let getHeight = function(name) {
                let layout = layoutnames.filter(function(layoutname) {
                    return layoutname.name === name;
                });
                return layout[0] ? layout[0].map.height : 0;
            };
            width = getWidth(layoutName);
            height = getHeight(layoutName);
        }

        // switch (format) {
        //  case 'A1':
        //    width = orientationLandscape ? 594 : 420,
        //    height = orientationLandscape ? 420 : 594
        //    break;
        //  case 'A2':
        //    width = orientationLandscape ? 420 : 297,
        //    height = orientationLandscape ? 297 : 420
        //    break;
        //  case 'A3':
        //    width = orientationLandscape ? 297 : 210,
        //    height = orientationLandscape ? 210 : 297
        //    break;
        //  case 'A4':
        //    width = orientationLandscape ? 210 : 400,
        //         height = orientationLandscape ? 149 : 800
        //    break;
        //  case 'A5':
        //    width = orientationLandscape ? 149 : 105,
        //         height = orientationLandscape ? 105 : 149
        //    break;
        //  case 'A6':
        //    width = orientationLandscape ? 105 : 74,
        //         height = orientationLandscape ? 74 : 105
        //    break;
        // }

        return {
            width: width, //((width / 25.4)),
            height: height //((height / 25.4))
        };
    };

    function bindUIActions() {
        htmlSizes = document.getElementById(sizeselect.getId());
        htmlOrientation = document.getElementById(orientationselect.getId());
        htmlLayouts = document.getElementById(layoutselect.getId());
        htmlScales = document.getElementById(scaleselect.getId());
        htmlResos = document.getElementById(printDpi.getId());
        htmlTitle = document.getElementById(titleInput.getId());

        htmlResos.addEventListener('change', () => {
            checkPrintability('dpi');
        });

        htmlSizes.addEventListener('change', () => {
            let paper = getPaperMeasures(htmlSizes.value);
            let scale = htmlScales.value;
            scale = detectAndFixE(scale);
            scale = scale.split('.')[0];
            printarea.addPreview(scale, paper);
            checkPrintability('size');
        });

        htmlOrientation.addEventListener('change', () => {
            let paper = getPaperMeasures(htmlSizes.value);
            let scale = htmlScales.value;
            scale = detectAndFixE(scale);
            scale = scale.split('.')[0];
            printarea.addPreview(scale, paper);
        });

        htmlScales.addEventListener('change', () => {
            let paper = getPaperMeasures(htmlSizes.value);
            let scale = htmlScales.value;
            scale = detectAndFixE(scale);
            scale = scale.split('.')[0];
            printarea.addPreview(scale, paper);
        });

        if (htmlLayouts) {
            htmlLayouts.addEventListener('change', () => {
                let namesAndSizes = getAvailableSizes(htmlLayouts.options[htmlLayouts.selectedIndex].text, mapfishConfig);
                htmlSizes.empty();
                namesAndSizes.forEach((val, key) => {
                    htmlSizes.appendChild(`<option value=${key}>${val}</option>`);
                })
                let paper = getPaperMeasures(htmlSizes.value);
                let scale = htmlScales.value;
                scale = detectAndFixE(scale);
                scale = scale.split('.')[0];
                printarea.addPreview(scale, paper);
            });
        }

        document.getElementById(formatselect.getId()).value = "PDF";


    }

    function buildLayoutObjectsArray() {
        let layoutObjectsArray = [];
        hideLayouts ? layoutObjectsArray =
            [layoutIfHidden, htmlSizes.options[htmlSizes.selectedIndex].text, htmlOrientation.value] :
            [htmlLayouts.value, htmlSizes.options[htmlSizes.selectedIndex].text, htmlOrientation.value];

        if (htmlTitle.value != "") {
            layoutObjectsArray.push("Title");
        }
        if (document.getElementById('o-legend-input').checked) {
            layoutObjectsArray.push("Legend");
        }
        return layoutObjectsArray;
    }


    //Three to five arguments expected
    //Title and Legend are optional, layoutName and paperSize and orientation are not
    function buildLayoutString() {
        if (arguments.length == 3) {
            return arguments[0] + '-' + arguments[1] + '-' + arguments[2];
        } else if (arguments.length == 4) {
            return arguments[0] + '-' + arguments[1] + '-' + arguments[2] + '-' + arguments[3];

        } else if (arguments.length == 5) {
            return arguments[0] + '-' + arguments[1] + '-' + arguments[2] + '-' + arguments[3] + '-' + arguments[4];
        }
    }

    function checkPrintability(parameter) {
        //specific printability-check
        if (employsArcGISServerWMS) {
            if (parameter == 'dpi') {
                if (htmlResos.value == '300') {
                    for (let i = 0; i < htmlSizes.options.length; i++) {
                        if (htmlSizes.options[i].value < "4") htmlSizes.options[i].disabled = true;
                    }
                    htmlSizes.value = "4";
                    //disable all sizes except A4
                } else if (htmlResos.value == '150') {
                    for (let i = 0; i < htmlSizes.options.length; i++) {
                        if (htmlSizes.options[i].value < "2") htmlSizes.options[i].disabled = true;
                        else if (htmlSizes.options[i].value > "1") htmlSizes.options[i].disabled = false;
                    }
                    //disable sizes A0 and A1, enable the rest
                } else {
                    for (let i = 0; i < htmlSizes.options.length; i++) {
                        htmlSizes.options[i].disabled = false;
                    }
                    //enable all sizes
                }
            } else if (parameter == 'size') {
                let selectedSize = htmlSizes.options[htmlSizes.selectedIndex].text;
                if (selectedSize == 'A0' || selectedSize == 'A1') {
                    for (let i = 0; i < htmlResos.options.length; i++) {
                        if (htmlResos.options[i].value < "75") htmlResos.options[i].disabled = true;
                    }
                    htmlResos.value = "75";
                    //disable dpis 150 and 300 
                } else if (selectedSize == 'A2' || selectedSize == 'A3') {
                    for (let i = 0; i < htmlResos.options.length; i++) {
                        if (htmlResos.options[i].value < "300") htmlResos.options[i].disabled = false;
                        else htmlResos.options[i].disabled = true;
                    }
                    //disable dpi 300 and enable dpi 150 
                } else {
                    for (let i = 0; i < htmlResos.options.length; i++) {
                        htmlResos.options[i].disabled = false;
                    }
                    //enable all dpis
                }
            }
        }

        //normal printability-check
        else {
            if (htmlSizes.value == '0') {
                for (let i = 0; i < htmlResos.options.length; i++) {
                    if (htmlResos.options[i].value == "300") {
                        htmlResos.options[i].disabled = true;
                        htmlResos.options[i].title = "300 dpi är inte tillgängligt för A0";
                    }
                }
            } else if (htmlResos.value == '300') {
                for (let i = 0; i < htmlSizes.options.length; i++) {
                    if (htmlSizes.options[i].value == "0") {
                        htmlSizes.options[i].disabled = true;
                        htmlSizes.options[i].title = "A0 är inte tillgängligt för 300 dpi";
                    }
                }
            } else {
                for (let i = 0; i < htmlResos.options.length; i++) {
                    htmlResos.options[i].disabled = false;
                    htmlResos.options[i].title = "";
                }
                for (let i = 0; i < htmlSizes.options.length; i++) {
                    htmlSizes.options[i].disabled = false;
                    htmlSizes.options[i].title = "";
                }
            }
        }

    }


    return Component({
        name: 'printmenu',
        onAdd(evt) {
            viewer = evt.target;
            printarea = Printarea({
                viewer: viewer
            });
            mapfishPrint = Mapfishprint(({
                viewer: viewer,
                MapfishCreateUrl: MapfishCreateUrl


                // relay necessary bits from index.jsons options for the control here
            }));

            let thisComp = this;
            let xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    let json = JSON.parse(this.responseText);
                    buildPanel(json);
                    mapfishConfig = json;
                    thisComp.addComponents([printButtonTool, closePrintMenu, clearButton, printCreate]);
                    thisComp.render();
                }
            };
            xmlhttp.open("GET", MapfishInfoUrl);
            xmlhttp.send();

            /**** --- used to do some debugging locally --- ****/
            // console.log(printinfo);
            // mapfishConfig = printinfo;
            // buildPanel(printinfo);
            // this.addComponents([printButtonTool, closePrintMenu, clearButton, printCreate]);
            // this.render();
        },
        onInit() {
            hideLayouts = true;
        },
        render() {
            let menuEl = `<form type="submit"> 
                          <div id="o-printmenu" class="o-printmenu"> 
                            <h5 id="o-main-setting-heading">Skriv ut karta${closePrintMenu.render()}</h5> 
                            <div class="o-block"> 
                              <span class="o-setting-heading">Format</span> 
                              ${formatselect.render()}
                            </div> 
                              ${hideOrShowLayouts(hideLayouts, layouts)} 
                            <div class="o-block"> 
                              <span class="o-setting-heading">Orientering</span> 
                              ${orientationselect.render()}
                            </div> 
                            <div class="o-block"> 
                              <span class="o-setting-heading">Storlek</span> 
                              ${sizeselect.render()}
                            </div> 
                            <div class="o-block"> 
                              <span class="o-setting-heading">Skala</span> 
                              ${scaleselect.render()}
                            </div> 
                            <div class="o-block"> 
                              <span class="o-setting-heading">Upplösning</span> 
                              ${printDpi.render()} 
                            </div> 
                            <br /> 
                            <div class="o-block"> 
                              <span class="o-setting-heading">Titel<span><br /> 
                              ${titleInput.render()} 
                            </div> 
                            <br /> 
                            <div class="o-block"> 
                              <input type="checkbox" id="o-legend-input" /> 
                              <label for="o-legend-input">Teckenförklaring</label> 
                            </div> 
                              
                            <br /> 
                              <div class="o-block"> 
                              ${printCreate.render()}
                              ${clearButton.render()}
                            </div> 
                            <br /> 
                            <div class="o-block"> 
                              <span id="o-dl-progress">Skapar... <img src="img/spinner.svg" /></span><a id="o-dl-link" href="#">Ladda ner</a><img id="o-dl-cancel" src="img/png/cancel.png"/> 
                            </div> 
                          </div> 
                          </form>`;
            document.getElementById(viewer.getMain().getNavigation().getId()).appendChild(dom.html(printButtonTool.render()));
            document.getElementById(viewer.getMain().getId()).appendChild(dom.html(menuEl));
            this.dispatch('render');
            htmlPrintmenu = document.getElementById('o-printmenu');
            bindUIActions();
        },
        getPrintmenu() {
            return htmlPrintmenu;
        }
    });
};

export default Printmenu;