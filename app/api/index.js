module.exports = [
    {
        method: 'POST',
        path: 'import-csv',
        handler: require('./import-csv')
    },
    {
        method: 'GET',
        path: 'test',
        handler: require('./test')
    }
]
    
