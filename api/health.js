module.exports=async(req,res)=>{res.setHeader('Cache-Control','no-store');res.status(200).json({ok:true,service:'LISTA! API',version:'4.1'})}
