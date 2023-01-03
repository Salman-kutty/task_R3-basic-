const { Sequelize } = require('sequelize');

const database = new Sequelize(
    'testdb',
    'root',
    'Tectoro@123',
    {
        host: 'localhost',
        dialect: 'mssql'
    }
);
async function syncingModel() {
    await database.sync({});
    console.log("Model is synced..")
}
syncingModel();
// database.sync({ force: true }).then(() => console.log("Synced.."))
//     .catch((err) => console.log("Error"))


module.exports = database;