export default {
    formats: ['PDF', 'TIFF', 'PNG'],
    sizes: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'Egendefinierad'],
    hasArcGISServerWMS: function(){
    	if (window.location.href.split('/')[3] == "vattenkarta")
    		return true  
    	else
    		return false
    },
    orientation: ['Stående', 'Liggande'],
    localHost: 'http://ksdgisutv.northeurope.cloudapp.azure.com:8080',
    printInfo: 'http://ksdgisutv.northeurope.cloudapp.azure.com:8080/geoserver/pdf/info.json',
    printCreate: 'http://ksdgisutv.northeurope.cloudapp.azure.com:8080/geoserver/pdf/create.json',
    templates: ['Mall 1', 'Mall 2', 'Mall 3'],
    scales: ['1:100000','1:500', '1:1000', '1:2500', '1:5000', '1:10000', '1:25000', '1:50000', '1:250000'],
    resolutions: ['72 dpi', '96 dpi', '150 dpi', '200 dpi', '300 dpi']
}