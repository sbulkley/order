var express = require("express");
var app     = express();
var redis   = require("redis");
var url     = require('url');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/scripts'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + "/public/index.html");
});

app.get('/auto', function(req, res) {
	var client  = redis.createClient(17911, "pub-redis-17911.us-east-1-2.4.ec2.garantiadata.com");

	var purl = url.parse(req.url, true);
	var query = purl.query;

	var list = [];

	client.zrank("zset_lexo_id", query.gimme, function(err, reply) {
		if(reply == null) {
			client.zrank("zset_lexo_desc", query.gimme, function(err, reply) {
				if(reply == null) {
					list = [];
					res.send(list);
					client.quit();
				} else {
					client.zrange("zset_lexo_desc", reply, reply + 50, function(err, reply) {
						for(item in reply) {
							if(reply[item].slice(-1) == "*") {
								list.push(reply[item].slice(0, -1))
							}
						}
						res.send(list);
						client.quit();
					});
				}
			});
		} else {
			client.zrange("zset_lexo_id", reply, reply + 50, function(err, reply) {
				for(item in reply) {
					if(reply[item].slice(-1) == "*") {
						list.push(reply[item].slice(0, -1))
					}
				}
				res.send(list);
				client.quit();
			});
		}
	})
})

app.get('/item', function(req, res) {
	var client  = redis.createClient(17911, "pub-redis-17911.us-east-1-2.4.ec2.garantiadata.com");

	var purl = url.parse(req.url, true);
	var query = purl.query;

	client.get(query.item, function(err, reply) {
		if(reply == null) {
			res.send("0");
			client.quit();
		} else {
			client.hgetall(reply, function(err, reply) {
				if(reply == null) {
					res.send("0");
					client.quit();
				} else {
					res.send(reply);
					client.quit();
				}
			});
		}
	});
})

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
