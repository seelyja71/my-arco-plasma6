!function(c){var t,a=function(t){return Boolean("undefined"!=typeof reduxApp&&"function"==typeof reduxApp.getState&&reduxApp.getState().settings.features&&reduxApp.getState().settings.features[t])}("password_strength_hardening"),g="poor",h="bad",u="good",v="best",s=function(t,e,s){var t,e,n;a?bg.calculatePasswordStrength(t,e,s,a):(t=t?t.substring(0,50):"",e=e?e.substring(0,50).toLowerCase():"",s(25*zxcvbn(t,[e,"lastpass","lastpass.com"]).score))},l=function(i,l,t,d,p){var e;s(i,t,function(t){var e,s;if(25==t?(e=g,s=Strings.translateString("Invalid")):50==t?(e=h,s=Strings.translateString("Weak")):75==t?(e=u,s=Strings.translateString("Good")):100==t&&(e=v,s=Strings.translateString("Super!")),p){l.attr("class","score-segment").addClass(e),l.css("width","20%");for(var n=l.parent(),a=(n.empty(),n.append(l),Math.floor(t/25)),r=1;r<4;r++){var o=l.clone();a<=r&&o.removeClass(e),o.insertAfter("div.score-segment:last")}}else l.attr("class",e),l.css("width",t+"%");d&&(i?(c(d.parent()).css("opacity",1),d.text(s),d.removeClass("strength")):(c(d.parent()).css("opacity",.5),d.text(Strings.translateString("Strength")),l.attr("class","strength"),l.css("width","100%")))})};jQuery.fn.LP_addGeneratePasswordMeter=function(t){var e,s,n,e;this&&0<this.length&&(e=c(LPTools.createElement("div","meter-gen-pass")),s=c(LPTools.createElement("div")),this.parent().append(e.append(s)),n=t||!1,this.on("input",e=function(){l(c(this).val(),s,"somestringthathopefullydoesnotmatchpassword",null,n)}).on("change",e))},jQuery.fn.LP_addPasswordMeter=function(e,t,s){var n=LPTools.createElement("div","meterContainer"),a=LPTools.createElement("div","meter"),r=LPTools.createElement("div"),o=null,i=(a.appendChild(r),n.appendChild(a),a=c(a),r=c(r),t&&(o=LPTools.createElement("label","meterLabel","Strength"),n.appendChild(o),o=c(o),a.css("width","88%"),o.css("width","12%")),this.parent().append(n),s||!1);this.LP_input("passwordMeter",function(t){l(t,r,e?e.val():"",o,i)})}}(jQuery),function(c){var g="poor",h="bad",u="good",v="best",r="undefined"!=typeof bg&&bg.get("g_password_strength_hardening_enabled"),n=function(t,e,s,n){var s=s||r,s,t,a;s?bg.calculatePasswordStrength(t,e,n,s):(s=t?t.substring(0,50):"",t=e?e.substring(0,50).toLowerCase():"",n(25*zxcvbn(s,[t,"lastpass","lastpass.com"]).score))},l=function(i,l,t,d,p,e){var s;n(i,t,e,function(t){var e,s;if(25==t?(e=g,s=Strings.translateString("Invalid")):50==t?(e=h,s=Strings.translateString("Weak")):75==t?(e=u,s=Strings.translateString("Good")):100==t&&(e=v,s=Strings.translateString("Super!")),p){l.attr("class","score-segment").addClass(e),l.css("width","20%");for(var n=l.parent(),a=(n.empty(),n.append(l),Math.floor(t/25)),r=1;r<4;r++){var o=l.clone();a<=r&&o.removeClass(e),o.insertAfter("div.score-segment:last")}}else l.attr("class",e),l.css("width",t+"%");d&&(i?(c(d.parent()).css("opacity",1),d.text(s),d.removeClass("strength")):(c(d.parent()).css("opacity",.5),d.text(Strings.translateString("Strength")),l.attr("class","strength"),l.css("width","100%")))})};jQuery.fn.LP_addGeneratePasswordMeter=function(t,e){var s,n,a,s;this&&0<this.length&&(s=c(LPTools.createElement("div","meter-gen-pass")),n=c(LPTools.createElement("div")),this.parent().append(s.append(n)),a=t||!1,this.on("input",s=function(){l(c(this).val(),n,"somestringthathopefullydoesnotmatchpassword",null,a,e)}).on("change",s))},jQuery.fn.LP_addPasswordMeter=function(e,t,s){var n=LPTools.createElement("div","meterContainer"),a=LPTools.createElement("div","meter"),r=LPTools.createElement("div"),o=null,i=(a.appendChild(r),n.appendChild(a),a=c(a),r=c(r),t&&(o=LPTools.createElement("label","meterLabel","Strength"),n.appendChild(o),o=c(o),a.css("width","88%"),o.css("width","12%")),this.parent().append(n),s||!1);this.LP_input("passwordMeter",function(t){l(t,r,e?e.val():"",o,i)})}}(jQuery);