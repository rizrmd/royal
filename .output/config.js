var p=Object.defineProperty;var D=Object.getOwnPropertyDescriptor;var E=Object.getOwnPropertyNames;var h=Object.prototype.hasOwnProperty;var u=(e,r)=>()=>(r||e((r={exports:{}}).exports,r),r.exports),m=(e,r)=>{for(var o in r)p(e,o,{get:r[o],enumerable:!0})},b=(e,r,o,t)=>{if(r&&typeof r=="object"||typeof r=="function")for(let s of E(r))!h.call(e,s)&&s!==o&&p(e,s,{get:()=>r[s],enumerable:!(t=D(r,s))||t.enumerable});return e};var G=e=>b(p({},"__esModule",{value:!0}),e);var v=u((j,a)=>{var I=require("fs"),f=require("path"),C=require("os"),T=/(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;function V(e){let r={},o=e.toString();o=o.replace(/\r\n?/mg,`
`);let t;for(;(t=T.exec(o))!=null;){let s=t[1],n=t[2]||"";n=n.trim();let c=n[0];n=n.replace(/^(['"`])([\s\S]*)\1$/mg,"$2"),c==='"'&&(n=n.replace(/\\n/g,`
`),n=n.replace(/\\r/g,"\r")),r[s]=n}return r}function d(e){console.log(`[dotenv][DEBUG] ${e}`)}function B(e){return e[0]==="~"?f.join(C.homedir(),e.slice(1)):e}function F(e){let r=f.resolve(process.cwd(),".env"),o="utf8",t=Boolean(e&&e.debug),s=Boolean(e&&e.override);e&&(e.path!=null&&(r=B(e.path)),e.encoding!=null&&(o=e.encoding));try{let n=l.parse(I.readFileSync(r,{encoding:o}));return Object.keys(n).forEach(function(c){Object.prototype.hasOwnProperty.call(process.env,c)?(s===!0&&(process.env[c]=n[c]),t&&d(s===!0?`"${c}" is already defined in \`process.env\` and WAS overwritten`:`"${c}" is already defined in \`process.env\` and was NOT overwritten`)):process.env[c]=n[c]}),{parsed:n}}catch(n){return t&&d(`Failed to load ${r} ${n.message}`),{error:n}}}var l={config:F,parse:V};a.exports.config=l.config;a.exports.parse=l.parse;a.exports=l});var O=u((R,g)=>{var i={};process.env.DOTENV_CONFIG_ENCODING!=null&&(i.encoding=process.env.DOTENV_CONFIG_ENCODING);process.env.DOTENV_CONFIG_PATH!=null&&(i.path=process.env.DOTENV_CONFIG_PATH);process.env.DOTENV_CONFIG_DEBUG!=null&&(i.debug=process.env.DOTENV_CONFIG_DEBUG);process.env.DOTENV_CONFIG_OVERRIDE!=null&&(i.override=process.env.DOTENV_CONFIG_OVERRIDE);g.exports=i});var _=u((y,N)=>{var $=/^dotenv_config_(encoding|path|debug|override)=(.+)$/;N.exports=function(r){return r.reduce(function(o,t){let s=t.match($);return s&&(o[s[1]]=s[2]),o},{})}});var w={};m(w,{default:()=>x});module.exports=G(w);(function(){v().config(Object.assign({},O(),_()(process.argv)))})();var x={app:{name:"app"},prod:{url:"https://localhost:3200",dbs:{db:{url:process.env.PROD_DB}}},dev:{url:"http://localhost:3200",useProdDB:!0,dbs:{db:{url:process.env.DEV_DB}}}};0&&(module.exports={});
