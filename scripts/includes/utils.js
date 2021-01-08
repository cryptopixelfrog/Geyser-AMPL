require('dotenv').config();
const fs = require('fs');

exports.storeData = async function(data, path){
  try {
    fs.writeFileSync(path, JSON.stringify(data))
  } catch (err) {
    console.error(err)
  }
}
