const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
// Connection URL


var url = process.env.MONGODB_URI;

if(!url) {
    throw new Error('MONGODB_URI is not set')
}


// Database Name
dbName = 'dbname';

// Create a new MongoClient
const client = new MongoClient(url, {
    // retry to connect for 60 times
    reconnectTries: 60,
    // wait 1 second before retrying
    reconnectInterval: 1000
});

var db, col;

module.exports = {
    connect: function (collectionName) {
        return new Promise(resolve => {
            client.connect(function(err, db) {
                collectionName = collectionName;
                db = client.db(dbName);
                col = db.collection(collectionName);
                console.log("Connected successfully to server");
                resolve(client);
            });
        })
    },
    disconnect: function () {
        client.close();
    }

};

