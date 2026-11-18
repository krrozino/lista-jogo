const fs=require('node:fs');const esbuild=require('esbuild');
(async()=>{
 fs.mkdirSync('public',{recursive:true});
 fs.copyFileSync('index.html','public/index.html');
 await esbuild.build({entryPoints:['src/auth-client.js'],bundle:true,minify:true,format:'esm',platform:'browser',target:'es2022',outfile:'public/auth-client.js',define:{'process.env.NODE_ENV':'"production"'}});
 await esbuild.build({entryPoints:['src/experience.js'],bundle:true,minify:true,format:'esm',platform:'browser',target:'es2022',outfile:'public/experience.js'});
 console.log('LISTA! 0.7.0-beta.1 compilado.');
})().catch(e=>{console.error(e);process.exitCode=1});
