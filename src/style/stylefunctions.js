/* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

	var ol = require('openlayers');
  function stylefunctions(sf) {
	  if(sf=='byggnadsar'){
	  var fill = new ol.style.Fill({color: ''});
	  var stroke = new ol.style.Stroke({color: '', width: 0.1, lineCap:'square', lineJoin:'round'});
	  var polygon = new ol.style.Style({fill: fill, zIndex: 1});
	  var strokedPolygon = new ol.style.Style({fill: fill, stroke: stroke, zIndex: 2});
	  var styles = [];
	  return function(feature, resolution) {
		var length = 0;
		var ba = feature.get('ar_nybygg');
		if(ba<1866){
			stroke.setColor('rgba(204,0,0,1)'); 
			stroke.setWidth(1);          
			fill.setColor('rgba(255,0,0,1)');
			styles[length++] = strokedPolygon;
		}
		else if(ba<1900){
			stroke.setColor('rgba(204, 78, 0,1)'); 
			stroke.setWidth(1);          
			fill.setColor('rgba(255,98,0,1)');
			styles[length++] = strokedPolygon;
		}
		else if(ba<1920){
			stroke.setColor('rgba(204, 126, 0,1)'); 
			stroke.setWidth(1);          
			fill.setColor('rgba(255, 157, 0,1)');
			styles[length++] = strokedPolygon;
		}
		else if(ba<1930){
			stroke.setColor('rgba(204, 174, 0,1)'); 
			stroke.setWidth(1);          
			fill.setColor('rgba(255, 217, 0,1)');
			styles[length++] = strokedPolygon;
		}
		else if(ba<1940){
			stroke.setColor('rgba(195, 204, 34,1)'); 
			stroke.setWidth(1);          
			fill.setColor('rgba(244, 255, 43,1)');
			styles[length++] = strokedPolygon;
		}
		else if(ba<1950){
			stroke.setColor('rgba(164, 204, 90,1)'); 
			stroke.setWidth(1);          
			fill.setColor('rgba(205, 255, 112,1)');
			styles[length++] = strokedPolygon;
		}
		else if(ba<1960){
			stroke.setColor('rgba(122, 204, 138,1)'); 
			stroke.setWidth(1);          
			fill.setColor('rgba(153, 255, 173,1)');
			styles[length++] = strokedPolygon;
		}
		else if(ba<1970){
			stroke.setColor('rgba(59, 204, 187,1)'); 
			stroke.setWidth(1);          
			fill.setColor('rgba(74, 255, 234,1)');
			styles[length++] = strokedPolygon;
		}
		else if(ba<1980){
			stroke.setColor('rgba(37, 168, 204,1)'); 
			stroke.setWidth(1);          
			fill.setColor('rgba(46, 210, 255,1)');
			styles[length++] = strokedPolygon;
		}
		else if(ba<1990){
			stroke.setColor('rgba(47, 115, 204,1)'); 
			stroke.setWidth(1);          
			fill.setColor('rgba(59, 144, 255,1)');
			styles[length++] = strokedPolygon;
		}
		else if(ba<2000){
			stroke.setColor('rgba(41, 68, 204,1)'); 
			stroke.setWidth(1);          
			fill.setColor('rgba(51, 85, 255, 1)');
			styles[length++] = strokedPolygon;
		}
		else if(ba<2018){
			stroke.setColor('rgba(0, 0, 204, 1.0)');
			stroke.setWidth(1);          
			fill.setColor('rgba(0,0,255,1)');
			styles[length++] = strokedPolygon;
		}
		styles.length = length;
		return styles;
	  }
	  }
		else if(sf=='basemap'){
	  var fill = new ol.style.Fill({color: ''});
	  var stroke = new ol.style.Stroke({color: '', width: 0.1, lineCap:'square', lineJoin:'round'});
	   var noStroke = new ol.style.Stroke({color: '', width: 0.0});
	  var overlayedStroke = new ol.style.Stroke({color: '', width: 0.1, lineCap:'square', lineJoin:'round'});
	  var dashedStroke = new ol.style.Stroke({color: '', width: 1, lineDash: [1, 2]});
	  var polygon = new ol.style.Style({fill: fill, zIndex: 1});
	  var strokedPolygon = new ol.style.Style({fill: fill, stroke: stroke, zIndex: 2});
	  var dashedPolygon = new ol.style.Style({fill: fill, stroke: dashedStroke, zIndex: 2});
	  var line = new ol.style.Style({stroke: stroke, zIndex: 10});
	  var overlayedLine = new ol.style.Style({stroke: overlayedStroke, zIndex: 11});
	  var dashedLine = new ol.style.Style({stroke: dashedStroke, zIndex: 12});
	  var text = new ol.style.Style({text: new ol.style.Text({
		text: '', fill: fill, stroke: stroke
	  }), zIndex: 50});
	  var iconCache = {};
	  function getIcon(iconName) {
		var icon = iconCache[iconName];
		if (!icon) {
		  icon = new ol.style.Style({image: new ol.style.Icon({
			src: 'https://cdn.rawgit.com/mapbox/maki/master/icons/' + iconName + '-15.svg',
			imgSize: [15, 15]
		  })});
		  iconCache[iconName] = icon;
		}
		return icon;
	  }
	  var styles = [];
	  return function(feature, resolution) {
		polygon.setZIndex(1);
		line.setZIndex(10);
		var length = 0;
		var layer = feature.get('layer');
		var cls = feature.get('class');
		var type = feature.get('type');
		var kkod = feature.get('KKOD');
		if (kkod==undefined){kkod = feature.get('DETALJTYP');}
		if (layer=="by_fast"){kkod = feature.get('ANDAMAL_1');}
		var detaljtyp = feature.get('detaljtyp');
		var dt = feature.get('DETALJTYP');
		var funk = feature.get('FUNKTION');
		var andamal = feature.get('ANDAMAL_1');
		var klass = feature.get('klass');
		var scalerank = feature.get('scalerank');
		var labelrank = feature.get('labelrank');
		var adminLevel = feature.get('admin_level');
		var maritime = feature.get('maritime');
		var disputed = feature.get('disputed');
		var maki = feature.get('maki');
		var geom = feature.getGeometry().getType();
		
		if (layer=="my_vagk" || layer=="my_over" || layer=="my_fast"){ //MARKYTOR
		
		switch(kkod) {
			case 302://Annan koncentrerad bebyggelse
			case 2://Bebyggelseområde
					stroke.setColor('rgba(0,0,0,1)'); 
					stroke.setWidth(1);          
					 fill.setColor('rgba(0,0,0,1)');
					 // styles[length++] = strokedPolygon;
								break;
								
			case 303://Tätort
					stroke.setColor('rgba(0,0,0,1)'); 
					stroke.setWidth(1);          
					 fill.setColor('rgba(0,0,0,1)');
					//  styles[length++] = strokedPolygon;
								break;
								
			case 601://Skogsmark   
			case 3://Skog
					stroke.setColor('rgba(20,30,20,0.0)');
					stroke.setWidth(0);          
					 fill.setColor('rgba(20,30,20,1)');
					 // styles[length++] = strokedPolygon;
								break;
								
			case 611://Öppen mark
			case 7://Öppen mark
					stroke.setColor('rgba(9,9,0,0.0)');
					stroke.setWidth(0);          
					fill.setColor('rgba(18,18,0,1)');
					//  styles[length++] = strokedPolygon;
								break;
								
			case 901://Vattenyta
			case 1://Vattenyta
			case "VATTEN":
					stroke.setColor('rgba(30,35,40,1)'); 
					stroke.setWidth(1);          
					fill.setColor('rgba(35,40,45,1)');
					  styles[length++] = strokedPolygon;
								break;
								
			case 911://Sankmark
			case 4://Sankmark, svårframkomlig
			case 5://Sankmark, normal, öppen
			case 6://Sankmark, normal, skogklädd
			case 13://Sankmark, normal eller svårframkomlig
					fill.setColor('rgba(9,9,9,0.6)');
				//	  styles[length++] = polygon;
								break;
			case "VATTEN":// Vatten (sjöar och större vattendrag)
				stroke.setColor('#18ADFB');  
				stroke.setWidth(0.1);          
				fill.setColor('rgba(150,199,212,0.6)');
				styles[length++] = strokedPolygon;
				break;
			case "BEBYGG":// Bebyggelse, ospecificerad
			case "BEBLÅG":// Låg bebyggelse
			case "BEBHÖG":// Hög bebyggelse
			case "BEBSLUT":// Sluten bebyggelse
				fill.setColor('rgba(245,215,165,0.6)');
				//styles[length++] = polygon;
				break;
			case "BEBIND":// Industriområde
				fill.setColor('rgba(234,234,234,0.6)');
				//styles[length++] = polygon;
                break;
			case "ODLÅKER":// Åker    
			case "ODLFRUKT":// Fruktodling/fröplantage
			case "ODLEJÅK":// Ej brukad åker   
				fill.setColor('rgba(255,255,214,0.6)');
				//styles[length++] = polygon;
                break;
			case "ÖPMARK":// Annan öppen mark                    
				fill.setColor('rgba(255,255,220,0.6)');
				//styles[length++] = polygon;
                break;
			case "SKOGBARR":// Barr- och blandskog   
			case "SKOGLÖV":// Lövskog        
				fill.setColor('rgba(205,215,175,0.6)');
				//styles[length++] = polygon;
                break;
			case "ÖPTORG":// Torg                    
				fill.setColor('rgba(255,255,220,0.6)');
				//styles[length++] = polygon;
                break;
			case "SKOGFBJ":// Fjällbjörkskog
			case "MRKO":// Ej karterat område
			case "MRKÖVR":// Övrig mark, oklassificerad
			case "ÖPKFJÄLL":// Kalfjäll
			case "ÖPGLAC":// Glaciär
			default:                  
				fill.setColor('rgba(255,255,255,1)');
			//	styles[length++] = polygon;
                break;					
			}
		}
		else if (layer=="_my_kd"){ //SANKMARK
		
		switch(dt) {
			case "BANA.Y"://       
			case "IDROTT.Y"://  
				fill.setColor('rgba(255,255,214,0.6)');
				styles[length++] = polygon;
                break;   
			case "BOSOMR.Y"://   
				fill.setColor('rgba(245,215,165,0.6)');
				styles[length++] = polygon;
				break;        
			case "BÄCK.Y"://  
			case "DIKE.Y"://       
			case "SJÖ.Y"://      
			case "VATTEN.Y"://      
			case "ÄLV.Y"://     
				stroke.setColor('#18ADFB');  
				stroke.setWidth(0.1);          
				fill.setColor('rgba(150,199,212,0.6)');
				styles[length++] = strokedPolygon;
				break;    
			case "GÅGATA.Y"://      
			case "INDOMR.Y"://      
			case "JÄRNVOMR.Y":// 
				fill.setColor('rgba(234,234,234,0.6)');
				styles[length++] = polygon;
                break;     
			case "MARK.Y"://      
			case "NPARK.Y"://      
			case "PARK.Y"://      
			case "PARKER.Y"://     
			case "SKOG.Y"://     
				fill.setColor('rgba(205,215,175,0.6)');
				styles[length++] = polygon;
                break;    
			case "BUSSGATA.Y":// 
			case "ÖMARK.Y"://                   
				fill.setColor('rgba(255,255,220,0.6)');
				styles[length++] = polygon;
                break;     
			default:                  
				fill.setColor('rgba(255,255,220,0.6)');
				styles[length++] = polygon;
                break;	
		}
		}
		else if (layer=="_ms_fast"){ //SANKMARK
		
		switch(dt) {
			case "SANK":// Sankmark (Yta)
				stroke.setColor('#18ADFB');  
				stroke.setWidth(0.2);          
				fill.setColor('rgba(230,205,175,0.5)');
				styles[length++] = strokedPolygon;
								break;
			case "SANKSVÅ":// Sankmark, svårframkomlig
				stroke.setColor('#18ADFB');  
				stroke.setWidth(0.2);          
				fill.setColor('rgba(150,200,210,0.5)');
				styles[length++] = strokedPolygon;
								break;
			case "SANKBLE":// Sankmark blekvät
			default:
				stroke.setColor('#18ADFB');  
				stroke.setWidth(0.2);          
				fill.setColor('rgba(120,120,190,0.5)');
				styles[length++] = strokedPolygon;
								break;
		}
		}
		else if (layer=="ba_fast"){
		switch(funk) {
		
			case "Bandyplan": // IDRPLAN
			case "Fotbollsplan": // IDRPLAN
			case "Galoppbana": // IDRPLAN
			case "Idrottsplats": // IDRPLAN
			case "Idrottsplan, ospecificerat": // IDRPLAN
			case "Ishockeybana": // IDRPLAN
			case "Tennisbana": // IDRPLAN
			case "Travbana": // IDRPLAN
					dashedStroke.setColor('rgba(75,80,65,0.7)');
					dashedStroke.setWidth(1.5);
					dashedStroke.setLineDash([8, 3]);
					dashedStroke.setLineCap('square');
					fill.setColor('rgba(75,80,65,0.6)');
					styles[length++] = dashedPolygon;
				break;
			
			case "Golfbana": // ANLOMR
			case "Motionsanläggning": // ANLOMR
			case "Motorbana": // IDRPLAN, ANLOMR
			case "Övrigt": // IDRPLAN, ANLOMR
			case "Avfallsanläggning": // ANLOMR
			case "Begravningsplats": // ANLOMR
			case "Bilskrotningsanläggning": // ANLOMR
			case "Campingplats": // ANLOMR
			case "Djurpark": // ANLOMR
			case "Flygfält": // ANLOMR
			case "Flygplats": // ANLOMR
			case "Koloniområde": // ANLOMR
			case "Skjutbana": // ANLOMR
			case "Återvinningsanläggning": // ANLOMR
			default:
					dashedStroke.setColor('rgba(120,120,120,1)');
					dashedStroke.setWidth(1.5);
					dashedStroke.setLineDash([15, 5]);
					dashedStroke.setLineCap('square');
					fill.setColor('rgba(75,80,65,0.61)');
					styles[length++] = dashedLine;
				break;
				}
				}
		else if (layer=="by_vagk" || layer=="by_fast"){ //BYGGNADER
		switch(kkod) {
			case 690://Bebyggelseyta, större byggnad
					fill.setColor('rgba(20,20,20,1.0)');
					polygon.setZIndex(25);
					if(resolution < 15){styles[length++] = polygon;}
					break;
			case 729://Flygbana
					fill.setColor('rgba(100,100,100,1.0)');
					polygon.setZIndex(25);
					styles[length++] = polygon;
					break;
			case 130:// Bostad Småhus, friliggande Småhus med en bostad som inte är sammanbyggt med ett annat småhus. 
			case 131:// Bostad Småhus, kedjehus Två eller flera, med varandra via garage, förråd eller dylikt sammanbyggda enbostadshus. Varje bostad finns på en egen fastighet, även parhus klassificeras som kedjehus.
			case 132:// Bostad Småhus, radhus Småhus som ligger i en rad om minst tre hus vars bostadsdelar är direkt sammanbyggda med varandra och där varje bostad finns på egen fastighet.
			case 133:// Bostad Flerfamiljshus Byggnad som är inrättad med minst tre bostäder. Kan ibland innehålla kontor, butik, hotell, restaurang och liknande. Minst 50% ska dock utgöras av bostad.
			case 135:// Bostad Småhus med flera lägenheter Småhus med flera bostäder som finns på samma fastighet. T.ex. tvåbostadshus alternativt hyres- eller bostadsrättsradhus om minst tre bostäder.
			case 199:// Bostad Ospecificerad Bostad med okänt bostadsändamål,. Anges endast av Lantmäteriet vid ajourhållningsmetod där ändamål inte kan avgöras.
				stroke.setColor('rgba(25,25,25,1.0)');
				stroke.setWidth(0.5);
				fill.setColor('rgba(125,125,125,1.0)');
				if(resolution < 3){styles[length++] = strokedPolygon;}
				break;
			case 301:// Samhällsfunktion Badhus Byggnad med offentlig badinrättning. T.ex. badhus, kallbadhus, simhall, äventyrsbad.
			case 302:// Samhällsfunktion Brandstation Byggnad för räddningstjänsten.
			case 303:// Samhällsfunktion Busstation Större busshållplats eller resecentrum med flera linjer med byggnad. T.ex. resecentrum.
			case 304:// Samhällsfunktion Distributionsbyggnad Byggnad i distributionsnätet för gas, värme elektricitet eller vatten. T.ex. transformatorstation, värmecentral, teknikbod (tele, bredband), vattentorn, nätstation
			case 305:// Samhällsfunktion Djursjukhus Byggnad för stationär vård av sjuka djur.
			case 306:// Samhällsfunktion Försvarsbyggnad Byggnad som används för försvarsändamål eller försvarsberedskap. T.ex. byggnad i anslutning till en militär anläggning eller ett militärt förråd.
			case 307:// Samhällsfunktion Vårdcentral Enhet för öppen hälso- och sjukvård. T.ex. hälsocentral, vårdcentral, läkarstation, vårdcentrum. Dock ej privatläkarmottagning.
			case 308:// Samhällsfunktion Högskola Eftergymnasial skola klassad som högskola.
			case 309:// Samhällsfunktion Ishall Inbyggd konstfrusen isanläggning. T.ex. för ishockey, bandy eller skridskor.
			case 310:// Samhällsfunktion Järnvägsstation Station eller hållplats som expedierar person- eller godstrafik enligt SJs författningar (SJF 611) och Rikstidtabellen.
			case 311:// Samhällsfunktion Kommunhus Huvudbyggnad för kommunledning. T.ex. kommunhus, stadshus, rådhus.
			case 312:// Samhällsfunktion Kriminalvårdsanstalt Institution för verkställande av fängelsestraff, t.ex. kriminalvårdsanstalt eller fängelse.
			case 313:// Samhällsfunktion Kulturbyggnad Byggnad som används för kulturellt ändamål. T.ex. teater och museum eller hembygdsgård.
			case 314:// Samhällsfunktion Polisstation Byggnad inrymmande central för polisverksamhet.
			case 315:// Samhällsfunktion Reningsverk Byggnad för rening av avloppsvatten.
			case 316:// Samhällsfunktion Ridhus Byggnad med manege för ridning, t.ex. ridhus, ridskola.
			case 317:// Samhällsfunktion Samfund Byggnad för fast organiserad religiös gemenskap. T.ex. kyrka, frikyrka, moské, synagoga, tempel, kloster, församlingshem, krematorium, kapell, gravkapell.
			case 318:// Samhällsfunktion Sjukhus Inrättning för sluten vård och specialiserad öppenvård. T.ex. lasarett, länssjukhus, regionsjukhus.
			case 319:// Samhällsfunktion Skola Byggnad för undervisning. T.ex. förskola, grundskola, gymnasium, folk-, handels-, jakt-, jordbruk- , lanthushålls-, natur- och kultur-, naturbruks-, nomad-, räddnings-, skogsbruks-, verkstads-, vård-, samisk skola.
			case 320:// Samhällsfunktion Sporthall Inomhusanläggning för sport och idrott, t.ex. idrotts-, badminton-, curling-, tennis-hall.
			case 321:// Samhällsfunktion Universitet Eftergymnasial utbildning klassificerad i högskoleförordning.
			case 322:// Samhällsfunktion Vattenverk Anläggning där grundvatten eller ytvatten bereds till dricksvatten. T.ex. vattenreningsverk.
			case 324:// Samhällsfunktion Multiarena Flexibel större arena för utövande av sport, kultur och genomförande av många slags arrangemang.
			case 399:// Samhällsfunktion Ospecificerad Samhällsfunktion med okänt ändamål.
				stroke.setColor('rgba(25,10,10,1.0)');
				stroke.setWidth(0.4);
				fill.setColor('rgba(55,15,15,1.0)');
				if(resolution < 7.5){styles[length++] = strokedPolygon;}
			break;
			case 699://  Komplementbyggnad Ospecificerad Komplementbyggnad med okänt ändamål.
					stroke.setColor('rgba(25,25,25,1.0)');
					stroke.setWidth(0.4);
					fill.setColor('rgba(175,175,175,1.0)');
					if(resolution < 1){styles[length++] = strokedPolygon;}
			break;
			case 499://  Verksamhet Ospecificerad Verksamhet med okänt ändamål.
			case 599://  Ekonomibyggnad Ospecificerad Ekonomibyggnad med okänt ändamål.
			case 799://  Övrig byggnad Ospecificerad Övrig byggnad med okänt ändamål.
					stroke.setColor('rgba(25,25,25,1.0)');
					stroke.setWidth(0.4);
					fill.setColor('rgba(80,80,80,1.0)');
					if(resolution < 5){styles[length++] = strokedPolygon;}
			break;
			case 240:// Industri Annan tillverkningsindustri Byggnad för övrig industriell verksamhet med tillverkning.
			case 241:// Industri Gasturbinanläggning Anläggning för produktion av el med förbränningsgaser.
			case 242:// Industri Industrihotell Byggnad som inrymmer flera olika industrier. T.ex. industrihus.
			case 243:// Industri Kemisk industri Industri för tillverkning eller förädling av kemiska produkter. T.ex. färgindustri, plastindustri, läkemedelsindustri.
			case 244:// Industri Kondenskraftverk Anläggning för produktion av el ur ånga, tar ej tillvara spillvärme.
			case 245:// Industri Kärnkraftverk Anläggning för framställning av el ur kärnenergi.
			case 246:// Industri Livsmedelsindustri Industri för tillverkning av livsmedel bl.a. genom förädling av jordbruksprodukter. T.ex. charkuteri, konservindustri, fruktindustri.
			case 247:// Industri Metall- eller maskinindustri Industri för tillverkning och förädling av metall och maskiner. T.ex. bilindustri, järnverk, mekanisk industri, metallindustri, varv.
			case 248:// Industri Textilindustri Industri som tillverkar garn, tyg och dylikt samt bereder dessa. T.ex. tekoindustri, väveri.
			case 249:// Industri Trävaruindustri Industri för förädling av skogsråvaror. T.ex. trä-, massa- , pappers- och möbelindustri, pappersbruk, sågverk, snickeri.
			case 250:// Industri Vattenkraftverk Anläggning som omvandlar lägesenergi hos vatten till el.
			case 251:// Industri Vindkraftverk Anläggning för omvandling av vindenergi till el.
			case 252:// Industri Värmeverk Anläggning som levererar fjärrvärme med pannor för fast, flytande eller gasformiga bränslen samt el. T.ex. kraftvärmeverk eller fjärrvärmeverk. Industri Övrig industribyggnad Övrig byggnad för industriell verksamhet (även utan väggar) som inte är tillverkning, t.ex. lagerbyggnad, bensinstation, reparationsverkstad.
			case 299:// Industri Ospecificerad Industri med okänt ändamål.
			default:
				stroke.setColor('rgba(20,20,20,1.0)');
				stroke.setWidth(0.4);
				fill.setColor('rgba(20,20,20,1.0)');
				if(resolution < 5){styles[length++] = strokedPolygon;}
			break;
		}
		}
		else if (layer=="hl_vagk" || layer=="hl_over" || layer=="hl_fast"){ //HYDROGRAFI
		switch(kkod) {
			//case 441:// Vattendrag, storleksklass 1
			//case 455:// Vattendrag, storleksklass 2
			//case 456:// Vattendrag, storleksklass 3
			//case 458:// Vattendrag, under markyta
			default:// Alla
				stroke.setColor('rgba(35,40,45,0.71)');
				stroke.setWidth(0.8);
				line.setZIndex(8);
				styles[length++] = line;
				break;
		}
		}
		else if (layer=="jl_vagk" || layer=="jl_fast"){ //JÄRNVÄG
		switch(kkod) {
			case "JVGR1.M":// Järnväg med enkelspår 
			case "JVGR2.M":// Järnväg med dubbelspår
			case "JVGU.M":// Underfart/tunnel för järnväg
			case "JVGÖ.M":// Övrig järnväg
			case "JVGBY.M":// Järnväg under byggnation
			case "JVGÖU.M":// Övrig järnväg i tunnel
			case 270:// Järnväg under byggnad (byggnation)
			case 271:// Järnväg med enkelspår, ej elektrifierad
			case 272:// Järnväg med enkelspår, elektrifierad
			case 273:// Järnväg med dubbelspår, elektrifierad
			case 291:// Järnväg, enkelspår, ej elektrifierad, i underfart
			case 292:// Järnväg, enkelspår, elektrifierad, i underfart
			case 293:// Järnväg, dubbelspår, elektrifierad, i underfart
						//stroke.setColor('rgba(120,120,120,1.0)');
						//stroke.setWidth(3);
						//styles[length++] = line;
						stroke.setColor('rgba(80,80,80,1.0)');
						stroke.setWidth(2);
						if(resolution > 50){
						stroke.setWidth(1.25);
						}
						styles[length++] = line;
					dashedStroke.setColor('rgba(150,150,150,1.0)');
					dashedStroke.setWidth(1.4);
					dashedStroke.setLineDash([4, 10]);
						if(resolution > 50){
						dashedStroke.setWidth(0.9);
					dashedStroke.setLineDash([3, 6]);
						}
					dashedStroke.setLineCap('square');
					styles[length++] = dashedLine;
					break;
			case 274:// Smalspårig ej elektrifierad järnväg
			case 275:// Smalspårig elektrifierad järnväg med enkelspår
			case 276:// Smalspårig elektrifierad järnväg med dubbelspår
			case 279:// Industrispår
			case 294:// Smalspårig ej elektrifierad järnväg, i underfart
			case 295:// Smalspårig el. järnväg med enkelspår, i underfart
			case 296:// Smalspårig el. järnväg med dubbelspår, i underfart
			case 299:// Industrispår eller museijärnväg, i underfart
			default:// Alla
						stroke.setColor('rgba(80,80,80,1.0)');
						stroke.setWidth(1);
						styles[length++] = line;
					dashedStroke.setColor('rgba(130,130,130,1.0)');
					dashedStroke.setWidth(0.7);
					dashedStroke.setLineDash([2, 5]);
					dashedStroke.setLineCap('square');
					if(resolution < 10){
					styles[length++] = dashedLine;}
					break;
					}
					}
		else if (layer=="vl_fast"){
		switch(dt) {
			
			//case "VÄGMO.D":// Motorväg, körbanemitt
			//case "VÄGMOU.D":// Motorväg, körbanemitt, underfart/tunnel
			case "VAGMO.D":// Motorväg, körbanemitt
			case "VAGMOU.D":// Motorväg, körbanemitt, underfart/tunnel
				stroke.setColor('rgba(175,175,175,1.0)');
				stroke.setWidth(3+5/(resolution));
				styles[length++] = line;
				break;
            break;
			//case "VÄGKV.M":// Kvartersväg
			//case "VÄGBN.M":// Bilväg/gata
			//case "VÄGBNU.M":// Bilväg/gata i underfart/tunnel
			case "VAGKV.M":// Kvartersväg
			case "VAGBN.M":// Bilväg/gata
			case "VAGBNU.M":// Bilväg/gata i underfart/tunnel
				stroke.setColor('rgba(90,90,90,1.0)');
				stroke.setWidth(0.8);
				if(resolution < 5){stroke.setWidth(3);}
				if(resolution < 2){stroke.setWidth(5);}
				if(resolution < 1){stroke.setWidth(10);}
				stroke.setWidth(0.5+3.5/(resolution));
				styles[length++] = line;
				/*
				if(resolution < 1){
				overlayedStroke.setColor('rgba(170,170,170,1.0)');
				overlayedStroke.setWidth(2);
				if(resolution < 2){overlayedStroke.setWidth(4);}
				if(resolution < 1){overlayedStroke.setWidth(9);}
				overlayedStroke.setWidth(0.5+3/(resolution));
				styles[length++] = overlayedLine;
				}
				*/
				break;
				
			//case "VÄGBS.M":// Sämre bilväg 
			//case "VÄGBSU.M":// Sämre bilväg i underfart/tunnel
			case "VAGBS.M":// Sämre bilväg 
			case "VAGBSU.M":// Sämre bilväg i underfart/tunnel
				dashedStroke.setColor('rgba(90,90,90,1.0)');
				dashedStroke.setWidth(1.2);
				dashedStroke.setLineDash([12, 5]);
				if(resolution < 15){
					styles[length++] = dashedLine;
					}
				break;
				
			case "FÄRJELED":// Färjeled
			case "VÄGA1.M":// Allmän väg klass I, vägmitt
			case "VÄGA1U.M":// Allmän väg klass I, vägmitt, underfart
			case "VÄGA2.M":// Allmän väg klass II, vägmitt.
			case "VÄGA2U.M":// Allmän väg klass II, vägmitt, underfart
			case "VÄGA3.M":// Allmän väg klass III, vägmitt
			case "VÄGA3U.M":// Allmän väg klass III, vägmitt, underfart
			case "VÄGAS.D":// Allmän väg, skilda körbanor, körbanemitt
			case "VÄGASU.D":// Allmän väg, skilda körbanor, körbanemitt, underfart
			case "VÄGGG.D":// Genomfartsgata/-led, körbanemitt
			case "VÄGGG.M":// Genomfartsgata/-led, gatumitt
			case "VÄGGGU.D":// Genomfartsgata/- led, körbanemitt, underfart
			case "VÄGGGU.M":// Genomfartsgata/-led, gatumitt, underfart/tunnel
			case "VÄGA0BY.M":// Väg under byggnation
			default:
				stroke.setColor('rgba(175,175,175,1.0)');
				stroke.setWidth(3);
				if(resolution < 2){stroke.setWidth(4.5);}
				if(resolution < 1){stroke.setWidth(7.5);}
				stroke.setWidth(1.5+3.5/(resolution));
				
				styles[length++] = line;
				break;
}
}
		else if (layer=="vagkant_kd_"){ //VÄGKANT
		//console.log(dt);
		switch(dt) {
			case "BRO.K"://
			case "BRYGGA.K"://
			case "KÖRBANA.K"://
			case "KÖRBKST.K"://
			case "REFUG.K"://
			case "TUNNEL.K"://
						stroke.setColor('rgba(50,50,50,1.0)');
						stroke.setWidth(0.5);
						styles[length++] = line;
								break;
		}}
		else if (layer=="vl_vagk" || layer=="_vl_fast"){ //VÄGAR
		switch(kkod) {
			case 5011:// Motorväg, riksväg
			case 5016:// Motorväg, ej riksväg
			case 5811:// Motorväg, riksväg, i underfart/tunnel
			case 5816:// Motorväg, ej riksväg, i underfart/tunnel
						stroke.setColor('rgba(150,150,150,1.0)');
						stroke.setWidth(2);
						styles[length++] = line;
								break;
			case 5012:// Motortrafikled, riksväg
			case 5017:// Motortrafikled, ej riksväg
			case 5812:// Motortrafikled, riksväg, i underfart/tunnel
			case 5817:// Motortrafikled, ej riksväg, i underfart/tunnel
						stroke.setColor('rgba(150,150,150,1.0)');
						stroke.setWidth(2);
						styles[length++] = line;
								break;
			case 5014:// Allmän väg under byggnad, ej riksväg
			case 5018:// Allmän väg under byggnad, riksväg
			case 5021:// Allmän väg > 7 m, riksväg
			case 5022:// Allmän väg > 7 m, ej riksväg
			case 5821:// Allmän väg > 7 m, riksväg, i underfart/tunnel
			case 5822:// Allmän väg > 7 m, ej riksväg, i underfart/tunnel
						stroke.setColor('rgba(120,120,120,1.0)');
						stroke.setWidth(1.3);
						styles[length++] = line;
								break;
			case 5024:// Allmän väg 5-7 m, riksväg
			case 5025:// Allmän väg 5-7 m, ej riksväg
			case 5824:// Allmän väg 5-7 m, riksväg, i underfart/tunnel
			case 5825:// Allmän väg 5-7 m, ej riksväg, i underfart/tunnel
			case 5028:// Allmän väg < 5 m, riksväg
			case 5029:// Allmän väg < 5 m, ej riksväg
			case 5828:// Allmän väg < 5 m, riksväg, i underfart/tunnel
			case 5829:// Allmän väg < 5 m, ej riksväg, i underfart/tunnel
			case 5033:// På- och avfartsväg
			case 5036:// På- och avfartsväg, riksväg
			case 5833:// På- och avfartsväg, i underfart/tunnel
			case 5836:// På- och avfartsväg, riksväg, i underfart/tunnel
						stroke.setColor('rgba(120,120,120,1.0)');
						stroke.setWidth(1);
						styles[length++] = line;
								break;
			case 5040:// Gata
			case 5045:// Gata, större, gatumitt
			case 5840:// Gata, i underfart/tunnel
			case 5845:// Gata, större, gatumitt, i underfart/tunnel
						stroke.setColor('rgba(80,80,80,1.0)');
						stroke.setWidth(0.7);
						if(resolution < 10){
							styles[length++] = line;
							}
								break;
			case 5061:// Bättre bilväg
			case 5861:// Bättre bilväg, i underfart/tunnel
			case 5071:// Bilväg
			case 5871:// Bilväg, i underfart/tunnel
			case 5091:// Uppfartsväg
			case 5891:// Uppfartsväg, i underfart/tunnel
						stroke.setColor('rgba(80,80,80,1.0)');
						stroke.setWidth(1);
						styles[length++] = line;
								break;
			case 5082:// Sämre bilväg
			case 5882:// Sämre bilväg, i underfart/tunnel
						dashedStroke.setColor('rgba(80,80,80,1.0)');
						dashedStroke.setWidth(0.7);
						dashedStroke.setLineDash([12, 5]);
						if(resolution < 15){styles[length++] = dashedLine;}
								break;
			default:
				stroke.setColor('rgba(175,175,175,1.0)');
				stroke.setWidth(3);
				if(resolution < 2){stroke.setWidth(4.5);}
				if(resolution < 1){stroke.setWidth(7.5);}
				//styles[length++] = line;
				break;
		}
		}		
		else if (layer=="vl_over"){ //VÄGAR
		switch(kkod) {
			case 5011:// Motorväg, vägnummer E4-99
			case 5012:// Motorväg, vägnummer E4-99, underfart
			case 5013:// Motorväg, vägnummer E4-99, tunnel
			case 5021:// Motorväg, vägnummer 100-499
			case 5022:// Motorväg, vägnummer 100-499, underfart
			case 5023:// Motorväg, vägnummer 100-499,tunnel
			case 5031:// Motorväg, vägnummer >500
			case 5032:// Motorväg, vägnummer >500, underfart
			case 5033:// Motorväg, vägnummer >500, tunnel
						stroke.setColor('rgba(150,150,150,1.0)');
						stroke.setWidth(1.5);
						if(resolution > 75){
						stroke.setWidth(1.25);
						}
						styles[length++] = line;
								break;
			case 5111:// Motortrafikled, vägnummer E4-99
			case 5112:// Motortrafikled, vägnummer E4-99,underfart
			case 5113:// Motortrafikled, vägnummer E4-99,tunnel
			case 5121:// Motortrafikled, vägnummer 100-499
			case 5122:// Motortrafikled, vägnummer 100-499, underfart
			case 5123:// Motortrafikled, vägnummer 100-499, tunnel
			case 5131:// Motortrafikled, vägnummer >500
			case 5132:// Motortrafikled, vägnummer >500,underfart
			case 5133:// Motortrafikled, vägnummer >500,tunnel
						stroke.setColor('rgba(150,150,150,1.0)');
						stroke.setWidth(1.5);
						if(resolution > 75){
						stroke.setWidth(1.25);
						}
						styles[length++] = line;
								break;
			case 5211:// Allmän väg >7m, vägnummer E4-99
			case 5212:// Allmän väg >7m, vägnummer E4-99, underfart
			case 5213:// Allmän väg >7m, vägnummer E4-99, tunnel
			case 5221:// Allmän väg >7m, vägnummer 100-499
			case 5222:// Allmän väg >7m, vägnummer 100-499, underfart
			case 5223:// Allmän väg >7m, vägnummer 100-499, tunnel
			case 5225:// Allmän väg >7m, vägnummer 100-499, färja
			case 5231:// Allmän väg >7m, vägnummer >500
			case 5232:// Allmän väg >7m, vägnummer>500, underfart
			case 5233:// Allmän väg >7m, vägnummer>500, tunnel
			case 5235:// Allmän väg >7m, vägnummer>500, färja
						stroke.setColor('rgba(120,120,120,1.0)');
						stroke.setWidth(1.3);
						if(resolution > 75){
						stroke.setWidth(1);
						}
						styles[length++] = line;
								break;
			case 5311:// Allmän väg 5-7m, vägnummer E4-99
			case 5312:// Allmän väg 5-7m, vägnummer E4-99, underfart
			case 5313:// Allmän väg 5-7m, vägnummer E4-99, tunnel
			case 5321:// Allmän väg 5-7m, vägnummer 100-499
			case 5322:// Allmän väg 5-7m, vägnummer 100-499, underfart
			case 5323:// Allmän väg 5-7m, vägnummer 100-499, tunnel
			case 5325:// Allmän väg 5-7m, vägnummer 100-499, färja
			case 5331:// Allmän väg 5-7m, vägnummer>500
			case 5332:// Allmän väg 5-7m, vägnummer>500, underfart
			case 5333:// Allmän väg 5-7m, vägnummer>500, tunnel
			case 5334:// Väg under byggnad
			case 5335:// Allmän väg 5-7m, vägnummer>500, färja
			case 5411:// Allmän väg <5m, vägnummer E4-99
			case 5412:// Allmän väg <5m, vägnummer E4-99, underfart
			case 5413:// Allmän väg <5m, vägnummer E4-99, tunnel
			case 5421:// Allmän väg <5m, vägnummer 100-499
			case 5422:// Allmän väg <5m, vägnummer 100-499, underfart
			case 5423:// Allmän väg <5m, vägnummer 100-499, tunnel
			case 5425:// Allmän väg <5m, vägnummer 100-499, färja
			case 5431:// Allmän väg <5m, vägnummer >500
			case 5432:// Allmän väg <5m, vägnummer>500, underfart
			case 5433:// Allmän väg <5m, vägnummer>500, tunnel
			case 5435:// Allmän väg <5m, vägnummer>500, färja
						stroke.setColor('rgba(90,90,90,1.0)');
						stroke.setWidth(0.9);
						if(resolution > 75){
						stroke.setWidth(0.6);
						}
						styles[length++] = line;
								break;
			case 5551:// Enskild väg
			case 5552:// Enskild väg, underfart
			case 5553:// Enskild väg, tunnel
			case 5555:// Enskild väg, färja
						stroke.setColor('rgba(80,80,80,1.0)');
						stroke.setWidth(0.6);
						if(resolution < 75){
							styles[length++] = line;
						}
								break;
		}
		}
		else if (layer=="vo_fast"){
		switch(dt) {
			case "ÖVÄGCYK.M":// Cykelväg/parkväg Mittlinje för cykel- eller parkväg.
			case "OVAGCYK.M":// Cykelväg/parkväg Mittlinje för cykel- eller parkväg.
				dashedStroke.setColor('rgba(200,100,100,0.75)');
				dashedStroke.setWidth(0.75);
				dashedStroke.setLineDash([6, 4]);
				if(resolution < 5){styles[length++] = dashedLine;}
						break;
			case "ÖVÄGELS.M":// Elljusspår
			case "OVAGELS.M":// Elljusspår
				stroke.setColor('rgba(180,180,120,0.75)');
				stroke.setWidth(1);
				if(resolution < 5){styles[length++] = line;}
						break;
			case "ÖVÄGSTI.M":// Gångstig Mittlinje för tydlig gångstig.
			case "OVAGSTI.M":// Gångstig Mittlinje för tydlig gångstig.
				dashedStroke.setColor('rgba(175,175,175,1.0)');
				dashedStroke.setWidth(1);
				dashedStroke.setLineDash([1, 5]);
				if(resolution < 15){styles[length++] = dashedLine;}
						break;
			case "ÖVÄGTRA.M":// Traktorväg
			case "OVAGTRA.M":// Traktorväg
			case "ÖVÄGUND.M":// Underfart/tunnel för övrig väg eller led
			case "OVAGUND.M":// Underfart/tunnel för övrig väg eller led
			case "GÅNGBRO.M":// Gångbro
			case "GANGBRO.M":// Gångbro
			case "VANDLED":// Vandringsled
				dashedStroke.setColor('rgba(175,175,175,1.0)');
				dashedStroke.setWidth(0.75);
				dashedStroke.setLineDash([8, 4]);
				if(resolution < 15){styles[length++] = dashedLine;}
						break;
		}
		}
		else if (layer=="vo_vagk"){
		switch(kkod) {
			case 264:// Gångstig
			case 289:// Annan led
			case 332:// Gångbro
						dashedStroke.setColor('rgba(100,100,100,1.0)');
						dashedStroke.setWidth(0.6);
						dashedStroke.setLineDash([8, 4]);
						if(resolution < 15){styles[length++] = dashedLine;}
						break;
			case 265:// Vandringsled
			case 268:// Vandringsled, längs väg
			case 336:// Färjeled
						dashedStroke.setColor('rgba(100,100,100,1.0)');
						dashedStroke.setWidth(0.8);
						dashedStroke.setLineDash([8, 4]);
						if(resolution < 15){styles[length++] = dashedLine;}
								break;
		}
		}
		styles.length = length;
		return styles;
	}
	}
	else if(sf=='labels'){
	  var fill = new ol.style.Fill({color: ''});
	  var stroke = new ol.style.Stroke({color: '', width: 0.1, lineCap:'square', lineJoin:'round'});
	  var overlayedStroke = new ol.style.Stroke({color: '', width: 0.1, lineCap:'square', lineJoin:'round'});
	  var dashedStroke = new ol.style.Stroke({color: '', width: 1, lineDash: [1, 2]});
	  var polygon = new ol.style.Style({fill: fill, zIndex: 1});
	  var strokedPolygon = new ol.style.Style({fill: fill, stroke: stroke, zIndex: 2});
	  var line = new ol.style.Style({stroke: stroke, zIndex: 10});
	  var overlayedLine = new ol.style.Style({stroke: overlayedStroke, zIndex: 11});
	  var dashedLine = new ol.style.Style({stroke: dashedStroke, zIndex: 12});
	  var text = new ol.style.Style({text: new ol.style.Text({
		text: '', fill: fill, stroke: stroke
	  }), zIndex: 50});
	  var iconCache = {};
	  function getIcon(iconName) {
		var icon = iconCache[iconName];
		if (!icon) {
		  icon = new ol.style.Style({image: new ol.style.Icon({
			src: 'https://cdn.rawgit.com/mapbox/maki/master/icons/' + iconName + '-15.svg',
			imgSize: [15, 15]
		  })});
		  iconCache[iconName] = icon;
		}
		return icon;
	  }
	  var styles = [];
	  return function(feature, resolution) {
		polygon.setZIndex(1);
		var length = 0;
		var layer = feature.get('layer');
		var cls = feature.get('class');
		var type = feature.get('type');
		var kkod = feature.get('KKOD');
		if (kkod==undefined){kkod = feature.get('DETALJTYP');}
		if (layer=="by_fast"){kkod = feature.get('ANDAMAL_1');}
		var detaljtyp = feature.get('detaljtyp');
		var dt = feature.get('DETALJTYP');
		var andamal = feature.get('ANDAMAL_1');
		var klass = feature.get('klass');
		var scalerank = feature.get('scalerank');
		var labelrank = feature.get('labelrank');
		var adminLevel = feature.get('admin_level');
		var maritime = feature.get('maritime');
		var disputed = feature.get('disputed');
		var maki = feature.get('maki');
		var geom = feature.getGeometry().getType();
		
	  if (feature.get('TEXT') && resolution <= 15){
	  if(dt=='BEBTX'){ 
		text.getText().setText(feature.get('TEXT'));
		text.getText().setFont(feature.get('THOJD')+'px sans-serif');
		stroke.setColor('rgba(80,80,80,0)');
		fill.setColor('rgba(0,0,0,1.0)');
		styles[length++] = text;
		}
	  }
		styles.length = length;
		return styles;
	}
	}
	}

module.exports = stylefunctions;
