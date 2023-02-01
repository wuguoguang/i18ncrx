const  prettier =require("prettier")
const  fs =require("fs")



const code =fs.readFileSync("./ss.tsx","utf-8")


prettier.format(code,{parser:"typescript"});