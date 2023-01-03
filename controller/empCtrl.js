const employee = require("../model/employee");

const ResponseData = {
    status: "SUCCESS",
    response: null,
    message: null
}

const ErrorData = {
    status: "FAILED",
    response: null,
    message: null
}

const postData = async (req, res) => {
    try {
        const body = req.body
        console.log(body);
        let data;
        let validateData;
        if (Array.isArray(body)) {
            for (let obj of body) {
                validateData = validation(obj);
                console.log("Bulk-->", validateData)
                if (!validateData) {
                    ErrorData.message = "Incorrect body"
                    res.status(400).json(ErrorData);
                    return
                }
            }
            data = await employee.bulkCreate(body);
            ResponseData.response = data;

        } else {
            validateData = validation(body);
            console.log("Single-->", validateData)
            if (!validateData) {
                ErrorData.message = "Incorrect body"
                res.status(400).json(ErrorData);
                return
            }
            data = await employee.create(body);
            ResponseData.response = data;
        }
        res.status(201).json(ResponseData);
    } catch (err) {
        console.log("Error while posting Data ---> ", err)
        ErrorData.message = err.message;
        res.status(400).json(ErrorData);
    }
}

const allDataFromDB = async (req, res) => {
    try {
        let data;
        let whereCondition;
        let body = req.body;
        let bodyKeys = ["id", "name", "age"];
        let properties = Object.keys(body);
        console.log("Properties --> ", properties)
        if (Object.keys(body).length > 0) {
            for (let prop of properties) {
                if (!bodyKeys.includes(prop)) {
                    ErrorData.message = "Invalid Data is present in Request body";
                    res.status(400).json(ErrorData);
                    return
                }
            }
            if (body.id) {
                whereCondition = { id: body.id }
            } else {
                if (body.name && body.age) {
                    whereCondition = { name: body.name, age: body.age }
                } else {
                    if (body.name) {
                        whereCondition = { name: body.name }
                    } else {
                        whereCondition = { age: body.age }
                    }
                }
            }
        } else {
            whereCondition = {};
        }
        data = await employee.findAll({ where: whereCondition });
        ResponseData.response = data;
        res.status(200).json(ResponseData);
    } catch (err) {
        ErrorData.message = err.message;
        res.status(400).json(ErrorData)
    }
}

const updateData = async (req, res) => {
    try {
        const body = req.body;
        const bodyKeys = ["id", "name", "age"];
        let keyData1, keyData2;
        const firstProperties = Object.keys(req.body.providedData);
        const secondProperties = Object.keys(req.body.updatingData);
        if (Object.keys(req.body).length === 0) {
            throw Error("Empty request body is not allowed...")
        } else {
            for (let prop of firstProperties) {
                if (!bodyKeys.includes(prop)) {
                    ErrorData.message = "Invalid Data is present in Request body";
                    res.status(400).json(ErrorData);
                    return
                }
            }
            for (let propData of secondProperties) {
                if (!bodyKeys.includes(propData)) {
                    ErrorData.message = "Invalid Data is present in Request body";
                    res.status(400).json(ErrorData);
                    return
                }
            }
            if (body.providedData.id) {
                whereCondition = { id: body.providedData.id }
            } else {
                if (body.providedData.name && body.providedData.age) {
                    whereCondition = { name: body.providedData.name, age: body.providedData.age }
                } else {
                    if (body.providedData.name) {
                        whereCondition = { name: body.providedData.name }
                    } else {
                        whereCondition = { age: body.providedData.age }
                    }
                }
            }
            let data = await employee.update(req.body.updatingData, { where: whereCondition });
            ResponseData.response = data;
            res.status(200).json(ResponseData);
        }

    } catch (err) {
        ErrorData.message = err.message;
        res.status(400).json(ErrorData)
    }
}
const deleteData = async (req, res) => {
    try {
        let data;
        let whereCondition;
        let body = req.body;
        let bodyKeys = ["id", "name", "age"];
        let properties = Object.keys(body);
        if (Object.keys(body).length > 0) {
            for (let prop of properties) {
                if (!bodyKeys.includes(prop)) {
                    ErrorData.message = "Invalid Data is present in Request body";
                    res.status(400).json(ErrorData);
                    return
                }
            }
            if (body.id) {
                whereCondition = { id: body.id }
            } else {
                if (body.name && body.age) {
                    whereCondition = { name: body.name, age: body.age }
                } else {
                    if (body.name) {
                        whereCondition = { name: body.name }
                    } else {
                        whereCondition = { age: body.age }
                    }
                }
            }
        } else {
            whereCondition = {};
        }

        data = await employee.destroy({ where: whereCondition });
        ResponseData.response = data;
        res.status(200).json(ResponseData);

    } catch (err) {
        ErrorData.message = err.message;
        res.status(400).json(ErrorData)
    }
}
const validation = (obj) => {
    console.log("Object", obj)
    if (obj && obj.name && obj.age) {
        console.log("Present")
        return true;
    } else {
        console.log("Failed")
        return false;
    }
}

module.exports = { postData, allDataFromDB, updateData, deleteData }