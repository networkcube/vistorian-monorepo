import{S as ve,i as fe,s as ue,e,k as r,t as a,w as we,c as n,a as i,d as o,m as l,h as s,x as ge,b as f,f as _e,Q as be,g as ke,J as t,y as ye,E as ze,q as Ee,o as xe,B as Ve,v as Ne}from"../chunks/index-93102edf.js";import{c as nt}from"../chunks/createVisIframe-5c5b424f.js";import{g as Pe}from"../chunks/utils-9aa79bf4.js";import{F as Te}from"../chunks/Footer-a301bf05.js";function Ie(Lt){let c,p,g,k,d,P,T,Jt,ot,y,it,at,st,rt,h,A,lt,dt,D,ht,ct,$,I,pt,mt,z,q,vt,ft,C,ut,wt,u,F,gt,_t,S,bt,kt,O,yt,zt,R,Et,xt,_,j,Vt,Nt,B,Pt,Tt,U,It,Ht,m,G,Mt,At,L,Dt,$t,J,qt,Ct,Q,Ft,St,W,Ot,Rt,V,jt,H,Bt,Ut,Gt,N,K;return N=new Te({}),{c(){c=e("main"),p=e("div"),g=e("p"),k=r(),d=e("div"),P=e("a"),T=e("img"),ot=r(),y=e("p"),it=a("Interactive Visualizations for Dynamic and Multivariate Networks. "),at=e("br"),st=a(" Online and Open Source."),rt=r(),h=e("div"),A=e("p"),lt=a(`Scroll down and interact with the visualizations. Each view shows the same network, a
				fictive dynamic scientific social network. Hovering elements in one visualization propagates
				to the other views, highlighting the same element(s).`),dt=r(),D=e("p"),ht=a(`Use the time slider in each visualization to navigate through time. Each visualization
				provides additional parameters for visual refinement. (Possible delays in interaction are
				due to synchronization between visualizations. Visualizations will be faster if used in
				isolation).`),ct=r(),$=e("p"),I=e("a"),pt=a("Back to main page"),mt=r(),z=e("div"),q=e("h2"),vt=a("Node Link Visualization"),ft=r(),C=e("p"),ut=a(`Node-link diagrams show nodes in the network as points (dots) and (multiple) relations
					between nodes as straight parallel lines. Moving the time slider on the top of the
					visualization filters links between nodes according to their presence in time. Colors show
					the type of relation.`),wt=r(),u=e("div"),F=e("h2"),gt=a("Matrix Visualization"),_t=r(),S=e("p"),bt=a(`Adjacency matrices (or simply matrices) are table representations of networks. Nodes are
					represented both as rows and columns, connections between nodes are shown as black or
					colored cells in the matrix. Contrary to node-link representations, matrices do not suffer
					from visual clutter if the network is dense (i.e. contains many links). Matrices help you
					exploring dense networks that would look too cluttered with node-link diagrams.`),kt=r(),O=e("p"),yt=a(`The below example shows a cluster of connections of the same type (red). The first row in
					the matrix, featuring cells of different types (colors), indicates a highly connected
					node.`),zt=r(),R=e("p"),Et=a(`Node labels are shown for rows and columns. A small overview on the left shows the entire
					matrix and the currently visible part when panning and zooming.`),xt=r(),_=e("div"),j=e("h2"),Vt=a("Timeline Visualization"),Nt=r(),B=e("p"),Pt=a(`The below visualization shows a timeline running from left to right. Rows represent nodes
					in the network and arcs represent connections between them. Adapting the time slider on
					the top of the visualization adapts the time range visible in the visualization.`),Tt=r(),U=e("p"),It=a(`Clicking a node label sets this node the current ego node and removes all nodes from the
					visualization that are not connected to the ego node.`),Ht=r(),m=e("div"),G=e("h2"),Mt=a("Map Visualization"),At=r(),L=e("p"),Dt=a(`The map visualization shows a dynamic network with nodes having geographic node positions.
					This requires that nodes have geographic coordinates associated with them in the data
					model. Every dot-node on the map represents a position of an actual node in the network.
					In other words, for every geographical position that one node occupies during its
					lifetime, there is one node rendered on the map. Hovering a node on the map, shows all the
					nodes belonging to the same node in the network. For example, if a person in a social
					network moves between three different positions over time, there will be three nodes
					rendered on the map and highlighted if one of them is hovered.`),$t=r(),J=e("p"),qt=a(`All locations that are occupied by some node over time, are rendered as black transparent
					squares. Hovering, reveals the location's name as well as the names of the present nodes.`),Ct=r(),Q=e("p"),Ft=a(`Nodes without any geographic position (free nodes) will be placed as close as possible to
					all their connected neighbors. Free nodes are rendered transparent, which can be adjusted
					using the corresponding slider on the top of the map visualization.`),St=r(),W=e("p"),Ot=a(`One common problem with geographic positions is, that multiple nodes are present at the
					same location. The map visualization allows to specify an offset between these nodes
					(slider on the top of the visualization) that nodes at the same geographical position
					slightly apart.`),Rt=r(),V=e("p"),jt=a("The visual encoding of the network is otherwise the same as for the "),H=e("a"),Bt=a("node-link visualization"),Ut=a("."),Gt=r(),we(N.$$.fragment),this.h()},l(b){c=n(b,"MAIN",{});var X=i(c);p=n(X,"DIV",{id:!0});var E=i(p);g=n(E,"P",{id:!0,style:!0}),i(g).forEach(o),k=l(E),d=n(E,"DIV",{id:!0});var Y=i(d);P=n(Y,"A",{href:!0});var Qt=i(P);T=n(Qt,"IMG",{id:!0,src:!0}),Qt.forEach(o),ot=l(Y),y=n(Y,"P",{class:!0});var Z=i(y);it=s(Z,"Interactive Visualizations for Dynamic and Multivariate Networks. "),at=n(Z,"BR",{}),st=s(Z," Online and Open Source."),Z.forEach(o),Y.forEach(o),rt=l(E),h=n(E,"DIV",{id:!0});var v=i(h);A=n(v,"P",{});var Wt=i(A);lt=s(Wt,`Scroll down and interact with the visualizations. Each view shows the same network, a
				fictive dynamic scientific social network. Hovering elements in one visualization propagates
				to the other views, highlighting the same element(s).`),Wt.forEach(o),dt=l(v),D=n(v,"P",{});var Kt=i(D);ht=s(Kt,`Use the time slider in each visualization to navigate through time. Each visualization
				provides additional parameters for visual refinement. (Possible delays in interaction are
				due to synchronization between visualizations. Visualizations will be faster if used in
				isolation).`),Kt.forEach(o),ct=l(v),$=n(v,"P",{});var Xt=i($);I=n(Xt,"A",{href:!0});var Yt=i(I);pt=s(Yt,"Back to main page"),Yt.forEach(o),Xt.forEach(o),mt=l(v),z=n(v,"DIV",{id:!0});var tt=i(z);q=n(tt,"H2",{});var Zt=i(q);vt=s(Zt,"Node Link Visualization"),Zt.forEach(o),ft=l(tt),C=n(tt,"P",{});var te=i(C);ut=s(te,`Node-link diagrams show nodes in the network as points (dots) and (multiple) relations
					between nodes as straight parallel lines. Moving the time slider on the top of the
					visualization filters links between nodes according to their presence in time. Colors show
					the type of relation.`),te.forEach(o),tt.forEach(o),wt=l(v),u=n(v,"DIV",{id:!0});var x=i(u);F=n(x,"H2",{});var ee=i(F);gt=s(ee,"Matrix Visualization"),ee.forEach(o),_t=l(x),S=n(x,"P",{});var ne=i(S);bt=s(ne,`Adjacency matrices (or simply matrices) are table representations of networks. Nodes are
					represented both as rows and columns, connections between nodes are shown as black or
					colored cells in the matrix. Contrary to node-link representations, matrices do not suffer
					from visual clutter if the network is dense (i.e. contains many links). Matrices help you
					exploring dense networks that would look too cluttered with node-link diagrams.`),ne.forEach(o),kt=l(x),O=n(x,"P",{});var oe=i(O);yt=s(oe,`The below example shows a cluster of connections of the same type (red). The first row in
					the matrix, featuring cells of different types (colors), indicates a highly connected
					node.`),oe.forEach(o),zt=l(x),R=n(x,"P",{});var ie=i(R);Et=s(ie,`Node labels are shown for rows and columns. A small overview on the left shows the entire
					matrix and the currently visible part when panning and zooming.`),ie.forEach(o),x.forEach(o),xt=l(v),_=n(v,"DIV",{id:!0});var M=i(_);j=n(M,"H2",{});var ae=i(j);Vt=s(ae,"Timeline Visualization"),ae.forEach(o),Nt=l(M),B=n(M,"P",{});var se=i(B);Pt=s(se,`The below visualization shows a timeline running from left to right. Rows represent nodes
					in the network and arcs represent connections between them. Adapting the time slider on
					the top of the visualization adapts the time range visible in the visualization.`),se.forEach(o),Tt=l(M),U=n(M,"P",{});var re=i(U);It=s(re,`Clicking a node label sets this node the current ego node and removes all nodes from the
					visualization that are not connected to the ego node.`),re.forEach(o),M.forEach(o),Ht=l(v),m=n(v,"DIV",{id:!0});var w=i(m);G=n(w,"H2",{});var le=i(G);Mt=s(le,"Map Visualization"),le.forEach(o),At=l(w),L=n(w,"P",{});var de=i(L);Dt=s(de,`The map visualization shows a dynamic network with nodes having geographic node positions.
					This requires that nodes have geographic coordinates associated with them in the data
					model. Every dot-node on the map represents a position of an actual node in the network.
					In other words, for every geographical position that one node occupies during its
					lifetime, there is one node rendered on the map. Hovering a node on the map, shows all the
					nodes belonging to the same node in the network. For example, if a person in a social
					network moves between three different positions over time, there will be three nodes
					rendered on the map and highlighted if one of them is hovered.`),de.forEach(o),$t=l(w),J=n(w,"P",{});var he=i(J);qt=s(he,`All locations that are occupied by some node over time, are rendered as black transparent
					squares. Hovering, reveals the location's name as well as the names of the present nodes.`),he.forEach(o),Ct=l(w),Q=n(w,"P",{});var ce=i(Q);Ft=s(ce,`Nodes without any geographic position (free nodes) will be placed as close as possible to
					all their connected neighbors. Free nodes are rendered transparent, which can be adjusted
					using the corresponding slider on the top of the map visualization.`),ce.forEach(o),St=l(w),W=n(w,"P",{});var pe=i(W);Ot=s(pe,`One common problem with geographic positions is, that multiple nodes are present at the
					same location. The map visualization allows to specify an offset between these nodes
					(slider on the top of the visualization) that nodes at the same geographical position
					slightly apart.`),pe.forEach(o),Rt=l(w),V=n(w,"P",{});var et=i(V);jt=s(et,"The visual encoding of the network is otherwise the same as for the "),H=n(et,"A",{href:!0});var me=i(H);Bt=s(me,"node-link visualization"),me.forEach(o),Ut=s(et,"."),et.forEach(o),w.forEach(o),v.forEach(o),Gt=l(E),ge(N.$$.fragment,E),E.forEach(o),X.forEach(o),this.h()},h(){f(g,"id","sessId"),_e(g,"display","none"),f(T,"id","logo"),be(T.src,Jt="../logos/logo-networkcube.png")||f(T,"src",Jt),f(P,"href","/"),f(y,"class","subtitle"),f(d,"id","intro"),f(I,"href","../"),f(z,"id","div_nodelink"),f(u,"id","div_matrix"),f(_,"id","div_dynamicego"),f(H,"href","#div_nodelink"),f(m,"id","div_map"),f(h,"id","content"),f(p,"id","main")},m(b,X){ke(b,c,X),t(c,p),t(p,g),t(p,k),t(p,d),t(d,P),t(P,T),t(d,ot),t(d,y),t(y,it),t(y,at),t(y,st),t(p,rt),t(p,h),t(h,A),t(A,lt),t(h,dt),t(h,D),t(D,ht),t(h,ct),t(h,$),t($,I),t(I,pt),t(h,mt),t(h,z),t(z,q),t(q,vt),t(z,ft),t(z,C),t(C,ut),t(h,wt),t(h,u),t(u,F),t(F,gt),t(u,_t),t(u,S),t(S,bt),t(u,kt),t(u,O),t(O,yt),t(u,zt),t(u,R),t(R,Et),t(h,xt),t(h,_),t(_,j),t(j,Vt),t(_,Nt),t(_,B),t(B,Pt),t(_,Tt),t(_,U),t(U,It),t(h,Ht),t(h,m),t(m,G),t(G,Mt),t(m,At),t(m,L),t(L,Dt),t(m,$t),t(m,J),t(J,qt),t(m,Ct),t(m,Q),t(Q,Ft),t(m,St),t(m,W),t(W,Ot),t(m,Rt),t(m,V),t(V,jt),t(V,H),t(H,Bt),t(V,Ut),t(p,Gt),ye(N,p,null),K=!0},p:ze,i(b){K||(Ee(N.$$.fragment,b),K=!0)},o(b){xe(N.$$.fragment,b),K=!1},d(b){b&&o(c),Ve(N)}}}function He(Lt){return Ne(async()=>{let c;window.location.port?c=location.protocol+"//"+window.location.hostname+":"+window.location.port+window.location.pathname+"/":c=location.protocol+"//"+window.location.hostname+window.location.pathname+"/",c=c.split("/")[0];var p=1e3,g=700,k={scrolling:"no"},d=Pe();d.datasetName=d.datasetName.replace(/___/g," "),nt("div_nodelink",c+"../node_modules/vistorian-nodelink/web/index.html",d.session,d.datasetName,p,g,k),nt("div_matrix",c+"../node_modules/vistorian-matrix/web/index.html",d.session,d.datasetName,p,g,k),nt("div_dynamicego",c+"../node_modules/vistorian-dynamicego/web/index.html",d.session,d.datasetName,p,g,k),nt("div_map",c+"../node_modules/vistorian-map/web/index.html",d.session,d.datasetName,p,g,k)}),[]}class qe extends ve{constructor(c){super(),fe(this,c,He,Ie,ue,{})}}export{qe as default};
