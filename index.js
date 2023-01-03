console.log("Main Page ...")
const app = require('express')();
const bodyParser = require('body-parser');
const cors = require('cors');
const router = require('./routes');
const database = require('./database');
database.authenticate()
    .then(() => console.log("Database is connected.."))
    .catch((err) => console.log("Error while connecting database :: ", err))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', router)
app.use(cors());

app.listen(3030, () => console.log("Server is running on port : 3030."));