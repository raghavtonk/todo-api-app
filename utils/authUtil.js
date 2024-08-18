const isEmailValid = ({key})=>{
    const pattern = /^[\w\.-]+@[a-zA-Z\d\.-]+\.[a-zA-Z]{2,}$/;
    return pattern.test(key);

}

const dataValidation = ({name,username,email,password})=>{
    return new Promise((resolve,reject)=>{
        if(!name || !email || !username || !password) reject("Missing User Data.");
        if(typeof email !== 'string') reject ("Email is not a text");
        if(typeof name !== 'string') reject ("name is not a text");
        if(typeof username !== 'string') reject ("username is not a text");
        if(typeof password !== 'string') reject ("password is not a text");
        if(username.length < 3 || username.length >20) reject("Username length should be 3-20");
        if(!isEmailValid({key:email})) reject('Format of an email is incorrect');

        resolve();
    })
}

module.exports = {dataValidation ,isEmailValid};