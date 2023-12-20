const otpGenerator = require('otp-generator');

const generateId = (d) => {
    const randomNumber = otpGenerator.generate(d, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
    });

    let x = new Date().getFullYear()
    const YY = x % 100;
    let customId = `${YY}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${randomNumber}`
    
    return customId
}

module.exports = generateId




