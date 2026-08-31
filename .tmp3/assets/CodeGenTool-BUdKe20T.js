import{a as e,c as t,f as n,i as r,l as i,o as a,r as o,s,t as c}from"./ui-C83w4VuR.js";import{t as l}from"./wand-sparkles-C0CDVaRI.js";import{C as u,E as d,n as f,p,t as m}from"./index-D3HBKR-h.js";import{t as h}from"./SplitPane-BZ2K_RDb.js";var g=d(u(),1),_=e=>String(e).replace(/[^a-zA-Z0-9]+(.)?/g,(e,t)=>t?t.toUpperCase():``).replace(/^(.)/,e=>e.toUpperCase())||`Model`,v=e=>{let t=_(e);return t.charAt(0).toLowerCase()+t.slice(1)},y=e=>String(e).replace(/([a-z0-9])([A-Z])/g,`$1_$2`).replace(/[^a-zA-Z0-9]+/g,`_`).toLowerCase();function b(e){return e==null?`null`:Array.isArray(e)?`array`:typeof e}function x(e,t,n){let r=b(e);if(r===`object`){let r=Object.entries(e).map(([e,t])=>({key:e,kind:b(t),child:x(t,_(e),n),sample:t})),i=_(t),a=i,o=2;for(;n.has(a)&&JSON.stringify(n.get(a).map(e=>e.key))!==JSON.stringify(r.map(e=>e.key));)a=`${i}${o++}`;return n.set(a,r),{type:`object`,name:a}}return r===`array`?e.length?{type:`array`,of:x(e[0],t.replace(/s$/,``)||`Item`,n)}:{type:`array`,of:{type:`unknown`}}:r===`number`?{type:Number.isInteger(e)?`int`:`float`}:r===`boolean`?{type:`bool`}:r===`null`?{type:`null`}:r===`string`?/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2})/.test(e)?{type:`datetime`}:{type:`string`}:{type:`unknown`}}var S={typescript:{string:`string`,int:`number`,float:`number`,bool:`boolean`,datetime:`string`,null:`null`,unknown:`unknown`},go:{string:`string`,int:`int`,float:`float64`,bool:`bool`,datetime:`time.Time`,null:`interface{}`,unknown:`interface{}`},java:{string:`String`,int:`Integer`,float:`Double`,bool:`Boolean`,datetime:`Instant`,null:`Object`,unknown:`Object`},python:{string:`str`,int:`int`,float:`float`,bool:`bool`,datetime:`datetime`,null:`None`,unknown:`Any`},csharp:{string:`string`,int:`int`,float:`double`,bool:`bool`,datetime:`DateTime`,null:`object`,unknown:`object`}};function C(e,t){let n=S[t];if(e.type===`object`)return t===`python`?`"${e.name}"`:e.name;if(e.type===`array`){let n=C(e.of,t);switch(t){case`typescript`:return`${n}[]`;case`go`:return`[]${n}`;case`java`:return`List<${n}>`;case`python`:return`List[${n}]`;case`csharp`:return`List<${n}>`;default:return n}}return n[e.type]||n.unknown}function w(e,t,n){let r=new Map;x(e,t,r);let i=[...r.entries()].reverse();if(!i.length)return`// Provide a JSON object (or an array of objects) to generate models.`;let a=i.map(([e,t])=>{switch(n){case`typescript`:return[`export interface ${e} {`,...t.map(e=>`  ${/^[A-Za-z_$][\w$]*$/.test(e.key)?e.key:`"${e.key}"`}${e.kind===`null`?`?`:``}: ${C(e.child,n)};`),`}`].join(`
`);case`go`:return[`type ${e} struct {`,...t.map(e=>`\t${_(e.key)} ${C(e.child,n)} \`json:"${e.key}"\``),`}`].join(`
`);case`java`:return[`public class ${e} {`,...t.map(e=>`    private ${C(e.child,n)} ${v(e.key)};`),``,...t.flatMap(e=>{let t=C(e.child,n),r=_(e.key);return[`    public ${t} get${r}() { return ${v(e.key)}; }`,`    public void set${r}(${t} ${v(e.key)}) { this.${v(e.key)} = ${v(e.key)}; }`]}),`}`].join(`
`);case`python`:return[`@dataclass`,`class ${e}:`,...t.map(e=>`    ${y(e.key)}: ${C(e.child,n)}${e.kind===`null`?` = None`:``}`)].join(`
`);case`csharp`:return[`public class ${e}`,`{`,...t.map(e=>`    [JsonPropertyName("${e.key}")]\n    public ${C(e.child,n)} ${_(e.key)} { get; set; }`),`}`].join(`
`);default:return``}});return({go:`package models

import "time"
`,java:`import java.time.Instant;
import java.util.List;
`,python:`from dataclasses import dataclass
from datetime import datetime
from typing import Any, List, Optional
`,csharp:`using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
`,typescript:``}[n]||``)+`
`+a.join(`

`)}var T=[{value:`typescript`,label:`TypeScript`},{value:`go`,label:`Go`},{value:`java`,label:`Java`},{value:`python`,label:`Python`},{value:`csharp`,label:`C#`}],E=f(),D=`{
  "id": 1042,
  "orderRef": "ORD-2291",
  "customer": {
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "verified": true
  },
  "items": [
    { "sku": "SKU-1", "qty": 2, "price": 19.99 }
  ],
  "total": 39.98,
  "placedAt": "2026-08-30T10:15:00Z"
}`;function O(){let[u,d]=(0,g.useState)(D),[f,_]=(0,g.useState)(`typescript`),[v,y]=(0,g.useState)(`Order`),[b,x]=(0,g.useState)(``),[S,C]=(0,g.useState)(``),O=m();function k(e=f){try{let t=JSON.parse(u),n=Array.isArray(t)?t[0]:t;if(typeof n!=`object`||!n)throw Error(`Provide a JSON object, or an array whose first element is an object.`);x(w(n,v||`Model`,e)),C(``),O(`Generated ${T.find(t=>t.value===e)?.label} model`)}catch(e){x(``),C(e.message),O(`Could not generate model`,`error`)}}return(0,E.jsxs)(`div`,{children:[(0,E.jsx)(s,{icon:p,title:`JSON → Code Models`,subtitle:`Turn an API payload into typed models for your service layer.`,accent:`indigo`}),(0,E.jsxs)(`div`,{className:`space-y-4 p-4 sm:p-6`,children:[(0,E.jsx)(t,{children:(0,E.jsxs)(`div`,{className:`flex flex-wrap items-center gap-3`,children:[(0,E.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,E.jsx)(`label`,{className:`t-muted text-xs`,children:`Language`}),(0,E.jsx)(i,{value:f,onChange:e=>{_(e.target.value),b&&k(e.target.value)},children:T.map(e=>(0,E.jsx)(`option`,{value:e.value,children:e.label},e.value))})]}),(0,E.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,E.jsx)(`label`,{className:`t-muted text-xs`,children:`Root name`}),(0,E.jsx)(e,{value:v,onChange:e=>y(e.target.value),className:`w-40`,placeholder:`Model`})]}),(0,E.jsxs)(c,{onClick:()=>k(),type:`button`,children:[(0,E.jsx)(l,{className:`h-3.5 w-3.5`}),`Generate`]})]})}),(0,E.jsx)(h,{storageKey:`toolbelt-split-codegen`,left:(0,E.jsxs)(t,{title:`JSON payload`,children:[(0,E.jsx)(n,{rows:20,value:u,onChange:e=>d(e.target.value),placeholder:`Paste a JSON response…`}),(0,E.jsx)(`div`,{className:`mt-3`,children:(0,E.jsx)(r,{children:S})})]}),right:(0,E.jsx)(t,{title:T.find(e=>e.value===f)?.label,actions:(0,E.jsx)(o,{text:b,onCopied:()=>O(`Copied to clipboard`)}),children:(0,E.jsx)(a,{text:b,placeholder:`Generated models will appear here…`})})})]})]})}export{O as default};