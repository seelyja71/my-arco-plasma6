(self.webpackChunk=self.webpackChunk||[]).push([[3384],{15073:(e,t,n)=>{n.d(t,{u:()=>o});var o,i,r,u,a,s,l,c=n(27378),d=n(40327),m=n(98403),f=n(19751),p=n(2844),S=n(85089),z=n(2834),h=n(9223),C=n(5114),v=n(83078),y=n(90845);i=o||(o={}),r=i.Manager=function(e){var t=e.children,n=e.remSize,o=m.Dx(n).pipe(f.shareReplay({refCount:!0,bufferSize:1}));return y.P.useSingleton("RemSize.Manager"),y.P.useSubscriptionTo(o),c.createElement(l.Provider,{value:o},t)},i.DefaultManager=function(e){var t=e.children;return y.P.useSingleton("RemSize.DefaultManager"),c.createElement(r,{remSize:a(u)},t)},u=i.defaultSizeObserver=p.aj(S.Lw("(max-width: 1359px)"),S.Lw("(min-width: 1600px)"),(function(e,t){return e?14:t?18:16})),a=i.withRemSizeEffect=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:s;return e.pipe(z.b((function(e){return t(C.some(e))})),h.x(t.bind(null,C.none)),f.shareReplay({refCount:!0,bufferSize:1}))},s=i.defaultFontSizeSetter=function(e){o.setRootCssVar(document.documentElement,e),o.setRootFontSize(e)},l=i.Context=c.createContext(u),i.setRootCssVar=function(e,t){e.style.setProperty("--rem",(0,d.pipe)(t,C.map(String),v.QP))},i.setRootFontSize=function(e){document.documentElement.style.fontSize=(0,d.pipe)(e,C.map((function(e){return e+"px"})),v.QP)}},58808:(e,t,n)=>{n.r(t),n.d(t,{SduiCard:()=>E});var o=n(27378),i=n(57050),r=n(15073),u=n(42103),a=n(76974),s=n(2834),l=n(5114),c=n(18702),d=n(33194),m=n(60626),f=n(79880),p=n(78792),S=n(40333),z=n(66688),h=n(89894);const C=h.ux.style({padding:h.ux.px(4)}),v=()=>o.createElement(z.T,{type:"mini",size:16,className:C});var y;!function(e){e.of=e=>e}(y||(y={}));const g=({children:e})=>o.createElement(r.u.Manager,{remSize:(0,i.zG)(a.of(16),s.b((e=>r.u.setRootCssVar(document.documentElement,l.some(e)))))},o.createElement(u.G.DefaultProvider,null,e)),E=({model:e})=>o.createElement(g,null,o.createElement(c.P,{key:e.sdui.id,sduiRootId:e.sdui.id,content:e.sdui.content,prevContent:l.none,transitions:[],designSystem:{...p.k,inlineCard:(0,S.I)(y.of(13.5),y.of(20.25)),icon:{...m.y,[f.Tb.GButtonSmall]:v}},onMount:i.Q1,onAnimationEnd:i.Q1,notify:(t,n,o)=>{const i=n.filter((e=>"positionedClick"!=e.type&&"hoverStateChanged"!=e.type));e.onSduiAction(d.Oe.create(i,e.sdui.id,t,o))}}))}}]);