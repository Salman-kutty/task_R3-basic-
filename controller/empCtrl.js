const employee = require("../model/employee");
const { Op } = require('sequelize');
const redisClient = require('redis').createClient(6379, 'localhost');
redisClient.connect().then(() => console.log("Redis is connected..."))
    .catch((err) => console.log("Error while connecting redis ::", err))

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
        console.log(req.body);
        let data;
        let validateData;
        if (Object.keys(req.body).length > 0) {
            if (Array.isArray(req.body)) {
                for (let obj of req.body) {
                    validateData = validation(obj);
                    console.log("Bulk-->", validateData)
                    if (!validateData) {
                        ErrorData.message = "Incorrect body"
                        res.status(400).json(ErrorData);
                        return
                    }
                }
                data = await employee.bulkCreate(req.body);
            } else {
                validateData = validation(req.body);
                console.log("Single-->", validateData)
                if (!validateData) {
                    ErrorData.message = "Incorrect body"
                    res.status(400).json(ErrorData);
                    return
                }
                data = await employee.create(req.body);
            }
        } else {
            ErrorData.message = "Empty body is not allowed..."
            res.status(400).json(ErrorData);
            return
        }
        creatingKey(data);
        ResponseData.response = data ? data : {};
        res.status(201).json(ResponseData);
    } catch (err) {
        console.log("Error while posting Data ---> ", err)
        ErrorData.message = err.message;
        res.status(400).json(ErrorData);
    }
}

const creatingKey = async (data) => {
    try {
        let key;
        if (Array.isArray(data)) {
            for (let single of data) {
                key = `#id:${single.id}#name:${single.name}#age:${single.age}#`;
                await redisClient.set(key, JSON.stringify(single));
            }
        } else {
            key = `#id:${data.id}#name:${data.name}#age:${data.age}#`
            await redisClient.set(key, JSON.stringify(data));
        }

    } catch (err) {
        console.log("Error in creatingKey --> ", err.message);
    }
}

const allDataFromDB = async (req, res) => {
    try {
        let data;
        let whereCondition = {};
        let bodyKeys = ["id", "name", "age"];
        let properties = Object.keys(req.body);
        console.log("Properties --> ", properties)
        if (Object.keys(req.body).length > 0) {
            let typeErrors = typeValidation(req.body);
            if (typeErrors.length > 0) {
                ErrorData.message = "Invalid type of Data is present in Request body";
                res.status(400).json(ErrorData);
                return
            } else {
                let DataError = validationForFields(properties, bodyKeys);
                if (DataError.length > 0) {
                    ErrorData.message = "Invalid Data is present in Request body";
                    res.status(400).json(ErrorData);
                    return
                }
            }
            if (req.body.id) {
                whereCondition = { id: req.body.id }
            } else {
                if (req.body.name && req.body.age) {
                    whereCondition = { name: req.body.name, age: req.body.age }
                } else {
                    if (req.body.name) {
                        whereCondition = { name: req.body.name }
                    } else if (req.body.age) {
                        whereCondition = { age: req.body.age }
                    }
                }
            }
        }
        data = await employee.findAndCountAll({ where: whereCondition });
        ResponseData.response = Object.keys(data).length !== 0 ? data : {};
        res.status(200).json(ResponseData);
    } catch (err) {
        ErrorData.message = err.message;
        res.status(400).json(ErrorData)
    }
}

const updateData = async (req, res) => {
    try {
        let data, updatedData;
        const bodyKeys = ["id", "name", "age"];
        if (Object.keys(req.body).length === 0) {
            ErrorData.message = "Empty request body is not allowed...";
            res.status(400).json(ErrorData);
            return
        } else {
            const firstProperties = Object.keys(req.body.providedData);
            const secondProperties = Object.keys(req.body.updatingData);
            if (Object.keys(req.body.providedData).length > 0 || Object.keys(req.body.updatingData).length > 0) {
                let typeErrorInProvidedBody = typeValidation(req.body.providedData);
                let typeErrorInUpdatingData = typeValidation(req.body.updatingData);
                if (typeErrorInProvidedBody.length === 0 && typeErrorInUpdatingData.length === 0) {
                    let errorsInProvidedBody = validationForFields(firstProperties, bodyKeys);
                    let errorsInUpdatingBody = validationForFields(secondProperties, bodyKeys);
                    if (errorsInProvidedBody.length > 0 || errorsInUpdatingBody.length > 0) {
                        ErrorData.message = "Invalid Data is present in Request body";
                        res.status(400).json(ErrorData);
                        return
                    }
                } else {
                    ErrorData.message = "Invalid type of Data is present in Request body";
                    res.status(400).json(ErrorData);
                    return
                }

            } else {
                ErrorData.message = "Empty Data in Request body..";
                res.status(400).json(ErrorData);
                return
            }
            if (req.body.providedData.id) {
                whereCondition = { id: req.body.providedData.id }
            } else {
                if (req.body.providedData.name && req.body.providedData.age) {
                    whereCondition = { name: req.body.providedData.name, age: req.body.providedData.age }
                } else {
                    if (req.body.providedData.name) {
                        whereCondition = { name: req.body.providedData.name }
                    } else if (req.body.providedData.age) {
                        whereCondition = { age: req.body.providedData.age }
                    }
                }
            }
            data = await employee.update(req.body.updatingData, { where: whereCondition });
            updatedData = await employee.findAll({ where: whereCondition });
            console.log("Updated data --> ", typeof (updatedData));
            if (updatedData) {
                const provide = await commonKeyCreation(req.body.providedData)
                for (let oneKey of provide) {
                    await redisClient.del(oneKey);
                }
                await creatingKey(updatedData)
            }
            ResponseData.response = data ? data : {};
            res.status(200).json(ResponseData);
        }

    } catch (err) {
        ErrorData.message = err.message;
        res.status(400).json(ErrorData)
    }
}

const commonKeyCreation = async (body) => {
    try {
        let key = "";
        if (body.id) {
            key += `*#id:${body.id}#*`;
        }
        if (body.name) {
            key += `*#name:*${body.name}*#*`;
        }
        if (body.age) {
            key += `*#age:${body.age}#*`;
        }
        console.log("Delete Key --> ", key);
        return await redisClient.keys(key);
    } catch (err) {
        console.log("Error in commonKeyCreation function --> ", err)
    }
}
const deleteData = async (req, res) => {
    try {
        let data, errorsInBody;
        let whereCondition = {};
        let bodyKeys = ["id", "name", "age"];
        let properties = Object.keys(req.body);
        if (Object.keys(req.body).length > 0) {
            let typeErrors = typeValidation(req.body);
            if (typeErrors.length > 0) {
                ErrorData.message = "Invalid type of Data is present in Request body";
                res.status(400).json(ErrorData);
                return
            } else {
                errorsInBody = validationForFields(properties, bodyKeys);
                if (errorsInBody.length > 0) {
                    ErrorData.message = "Invalid Data is present in Request body";
                    res.status(400).json(ErrorData);
                    return
                } else {
                    if (req.body.id) {
                        whereCondition = { id: req.body.id }
                    } else {
                        if (req.body.name && req.body.age) {
                            whereCondition = { name: req.body.name, age: req.body.age }
                        } else {
                            if (req.body.name) {
                                whereCondition = { name: req.body.name }
                            } else if (req.body.age) {
                                whereCondition = { age: req.body.age }
                            }
                        }
                    }

                }

            }

        }
        const keyValues = await commonKeyCreation(req.body);
        if (keyValues.length > 0) {
            for (let key of keyValues) {
                await redisClient.del(key)
            }
        }
        data = await employee.destroy({ where: whereCondition });
        ResponseData.response = data ? data : {};
        res.status(200).json(ResponseData);

    } catch (err) {
        ErrorData.message = err.message;
        res.status(400).json(ErrorData)
    }
}
const validationForFields = (arr, keys) => {
    let errorArr = [];
    arr.map((data) => {
        if (!keys.includes(data)) {
            errorArr.push("Incorrect Data");
        }
    })
    return errorArr;
}
const typeValidation = (body) => {
    let errors = [];
    if (body.id) {
        if (typeof (body.id) !== "number") {
            errors.push("Invalid type of data");
        }
    }
    if (body.name && body.age) {
        if (typeof (body.name) !== 'string' && typeof (body.age) !== 'number') {
            errors.push("Invalid type of data")
        }
    } else {
        if (body.name) {
            if (typeof (body.name) !== 'string') {
                errors.push("Invalid type of data")
            }
        } else if (body.age) {
            if (typeof (body.age) !== 'number') {
                errors.push("Invalid type of data")
            }
        }
    }
    console.log(errors)
    return errors;
}
const paginationData = async (req, res) => {
    try {
        let data;
        let whereCondition = {};
        let bodyKeys = ["id", "name", "age", "pageSize", "pageNumber"];
        let properties = Object.keys(req.body);
        console.log("Properties --> ", properties)
        if (Object.keys(req.body).length > 0 && req.body.pageNumber && req.body.pageSize
            && typeof (req.body.pageNumber) === 'number' && typeof (req.body.pageSize) === 'number') {
            let typeError = typeValidation(req.body);
            if (typeError.length > 0) {
                ErrorData.message = "Invalid type of Data is present in Request body";
                res.status(400).json(ErrorData);
                return
            } else {
                let errorsInBody = validationForFields(properties, bodyKeys);
                if (errorsInBody.length > 0) {
                    ErrorData.message = "Invalid Data is present in Request body";
                    res.status(400).json(ErrorData);
                    return
                } else {
                    if (req.body.id) {
                        whereCondition = { id: { [Op.substring]: req.body.id } }
                    } else {
                        if (req.body.name && req.body.age) {
                            whereCondition = { name: { [Op.substring]: req.body.name }, age: { [Op.substring]: req.body.age } }
                        } else {
                            if (req.body.name) {
                                whereCondition = { name: { [Op.substring]: req.body.name } }
                            } else if (req.body.age) {
                                whereCondition = { age: { [Op.substring]: req.body.age } }
                            }
                        }
                    }
                    data = await employee.findAll({ where: whereCondition, offset: (req.body.pageNumber - 1) * req.body.pageSize, limit: req.body.pageSize });
                }
            }

        } else {
            ErrorData.message = "PageNumber and PageSize is mandatory for pagination or type is not correct";
            res.status(400).json(ErrorData);
            return
        }
        ResponseData.response = Object.keys(data).length !== 0 ? data : {};
        res.status(200).json(ResponseData);
    } catch (err) {
        ErrorData.message = err.message;
        res.status(400).json(ErrorData)
    }
}
const validation = (obj) => {
    console.log("Object", obj)
    if (obj && obj.name && obj.age && typeof (obj.name) === 'string' && typeof (obj.age) === 'number' && Object.keys(obj).length === 2) {
        console.log("Present")
        return true;
    } else {
        console.log("Failed")
        return false;
    }
}
const filterKeyValues = async (body) => {
    try {
        let key = "";
        let keyValues = []
        if (Object.keys(body).length === 3 && body.id && body.name && body.age) {
            console.log("Three data")
            key += `*#id:${body.id}*#name:*${body.name}*#age:${body.age}#*`
        } else {
            if (body.id) {
                key += `*#id:${body.id}*#`;
            }
            if (body.name) {
                key += `*name:*${body.name}*#`;
            }
            if (body.age) {
                key += `*age:${body.age}#*`;
            }

        }


        const arr = await redisClient.keys(key);
        console.log(key)
        for (let data of arr) {
            keyValues.push(JSON.parse(await redisClient.get(data)));
        }

        return keyValues
    } catch (err) {
        console.log("Error in filterKey Function --> ", err)
    }
}

const filterData = async (req, res) => {
    try {
        let data;
        let key;
        let whereCondition = {};
        let bodyKeys = ["id", "name", "age"];
        let properties = Object.keys(req.body);
        console.log("Properties --> ", properties)
        if (Object.keys(req.body).length > 0) {
            let typeErrors = typeValidation(req.body);
            if (typeErrors.length > 0) {
                ErrorData.message = "Invalid type of Data is present in Request body";
                res.status(400).json(ErrorData);
                return
            } else {
                let DataError = validationForFields(properties, bodyKeys);
                if (DataError.length > 0) {
                    ErrorData.message = "Invalid Data is present in Request body";
                    res.status(400).json(ErrorData);
                    return
                }
            }
            let filterDataArr = await filterKeyValues(req.body);
            const countValue = (await redisClient.keys('*')).length;
            console.log("Fill----> ", filterDataArr)
            if (filterDataArr.length > 0) {
                console.log("Data from Cache...", countValue)
                data = { totalCount: countValue, rows: filterDataArr }
            } else {
                console.log("Data from DB...")
                if (req.body.id) {
                    whereCondition = { id: { [Op.substring]: req.body.id } }
                } else {
                    if (req.body.name && req.body.age) {
                        whereCondition = { name: { [Op.substring]: req.body.name }, age: { [Op.substring]: req.body.age } }
                    } else {
                        if (req.body.name) {
                            whereCondition = { name: { [Op.substring]: req.body.name } }
                        } else if (req.body.age) {
                            whereCondition = { age: { [Op.substring]: req.body.age } }
                        }
                    }
                }
                data = await employee.findAll({ where: whereCondition });
                if (Array.isArray(data)) {
                    for (let single of data) {
                        key = `#id:${single.id}#name:${single.name}#age:${single.age}#`
                        await redisClient.set(key, JSON.stringify(single));
                    }
                } else {
                    key = `#id:${data.id}#name:${data.name}#age:${data.age}#`
                    await redisClient.set(key, JSON.stringify(data));
                }

            }

        }

        ResponseData.response = Object.keys(data).length !== 0 ? data : {};
        res.status(200).json(ResponseData);
    } catch (err) {
        ErrorData.message = err.message;
        res.status(400).json(ErrorData)
    }
}

const resettingRedis = async () => {
    try {
        let key;
        await redisClient.flushAll();
        const allData = await employee.findAll({});
        for (let data of allData) {
            key = `#id:${data.id}#name:${data.name}#age:${data.age}#`;
            await redisClient.set(key, JSON.stringify(data))
        }
    } catch (err) {
        ErrorData.message = err.message;
        res.status(400).json(ErrorData)
    }
}

module.exports = {
    postData,
    allDataFromDB,
    updateData,
    deleteData,
    paginationData,
    resettingRedis,
    filterData
}