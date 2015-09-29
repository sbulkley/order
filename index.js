var express = require("express");
var app     = express();
var redis   = require("redis");
var client  = redis.createClient(7911, "pub-redis-17911.us-east-1-2.4.ec2.garantiadata.com");
var url     = require('url');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/scripts'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + "/public/index.html");
});

app.get('/auto', function(req, res, next) {
	var purl = url.parse(req.url, true);
	var query = purl.query;

	client.zrank("zset_lexo_id", query.gimme, function(err, reply) {
		if(reply == null) {
			client.zrank("zset_lexo_desc", query.gimme, function(err, reply) {
				if(reply == null) {
					res.send("0");
				} else {
					client.zrange("zset_lexo_desc", reply, reply + 50, function(err, reply) {
						for(item in reply) {
							if(reply[item].slice(-1) == "*") {
								res.send(reply[item].slice(0,-1));
								return;
							}
						}
						res.send("0");
					});
				}
			});
		} else {
			client.zrange("zset_lexo_id", reply, reply + 50, function(err, reply) {
				for(item in reply) {
					if(reply[item].slice(-1) == "*") {
						res.send(reply[item].slice(0,-1));
						return;
					}
				}
				res.send("0");
			});
		}
	})

	//res.send(JSON.stringify(query));
})

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
