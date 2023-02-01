const  prettier =require("prettier")
const  fs =require("fs")



const code =fs.readFileSync("./ss.tsx","utf-8")


prettier.format(`export default {
    a: 1, "header.account.menu.accSetting": "header.account.menu.accSetting", kyc_Bbutton_submint: "kyc_Bbutton_submint", unbinding_prompt: "unbinding_prompt", account_unbind_hint_content: "account_unbind_hint_content", dwdwd: "dwdwd", };`,{parser:"babel-ts"});