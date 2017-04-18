/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');
var Colorbox = require('../../externs/jquery.colorbox');

function showInfo(url, $this, evt) {
  if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && url.indexOf(".pdf") > -1) {
		var w = window.open(url, '_blank');
	}
	else {
    if (!$this.hasClass("colorbox-initialized")) {
      $this.addClass("colorbox-initialized").colorbox({open: true, width:"95%", height:"95%", top: "0px", escKey: true, iframe:true, href:url});
      evt.preventDefault();
    }
	}
}

module.exports.showInfo = showInfo;
