const successResponse = (statusCode,status,message,response)=>{

    const successObject = {
        statusCode,
        status,
        message,
        response,

    }
    return successObject
}


const failedResponse = (statusCode,status,message,response={},)=>{

   const failedObject = {
       statusCode,
       status,
       message,
       response,

   }
   return failedObject
}


module.exports = {successResponse,failedResponse}
