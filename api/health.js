module.exports=async(req,res)=>{res.setHeader('cache-control','no-store');res.status(200).json({ok:true,service:'LISTA! API',version:'0.5.0-beta.2'})};
