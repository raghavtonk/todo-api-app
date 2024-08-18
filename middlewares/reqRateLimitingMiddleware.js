const { accessModel } = require("../Models/accessModel");

const reqRateLimiting = async(req,res,next)=>{
    const sessionId = req.session.id;
    try{
        //find sessionId exist in accessDB or not R1
        const accessDB = await accessModel.findOne({sessionId});
        //if not Create the entry 
        if(!accessDB){
            accessModel.create({
                sessionId,
                lastReqTime: Date.now(),
            })
            
            next();
        }
        // R2-Rnth , compare the time R(n) - R(n-1)
        const timeDiff = ((Date.now() - accessDB.lastReqTime)/(1000*60));
        // if time is less then our logic
        console.log(timeDiff)
        if(timeDiff < 0.1){
            return res.send({
                status: 400,
                message: "Too many request, please wait for some time."
            });
        }

        //else 
        await accessModel.updateOne({sessionId},{lastReqTime: Date.now()});
        next();
        return;
    }
    catch(error){
      return  res.send({
        status: 500,
        message: "Internal server error",
        error: error,
      })
    }

   
}

module.exports = {reqRateLimiting};