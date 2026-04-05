import{c as u}from"./createLucideIcon.BJulnz13.js";import{r as d}from"./index.CJnayx4B.js";import{u as h}from"./index.CPvGoA3x.js";function p(r,t,{checkForDefaultPrevented:o=!0}={}){return function(e){if(r?.(e),o===!1||!e.defaultPrevented)return t?.(e)}}/**
 * @license lucide-react v0.552.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]],v=u("check",b);function g(r){const[t,o]=d.useState(void 0);return h(()=>{if(r){o({width:r.offsetWidth,height:r.offsetHeight});const i=new ResizeObserver(e=>{if(!Array.isArray(e)||!e.length)return;const n=e[0];let s,c;if("borderBoxSize"in n){const f=n.borderBoxSize,a=Array.isArray(f)?f[0]:f;s=a.inlineSize,c=a.blockSize}else s=r.offsetWidth,c=r.offsetHeight;o({width:s,height:c})});return i.observe(r,{box:"border-box"}),()=>i.unobserve(r)}else o(void 0)},[r]),t}export{v as C,p as c,g as u};
