const todoValidation = ({todoText})=>{
    return new Promise((resolve,reject)=>{
        if(!todoText) return reject("Todo data is missing");
        if(typeof todoText !== "string") return reject("todo text is not a text");
        if(todoText.length <3 || todoText.length > 80) return reject("todo text length should be 3-80 char.");
        resolve();
    });
}

module.exports = {todoValidation};