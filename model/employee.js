const { DataTypes } = require('sequelize');
const database = require('../database');

const employee = database.define('employee',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        age: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
    timestamps: false,
    freezeTableName: true,
    schema: 'nexus'
})

module.exports = employee;