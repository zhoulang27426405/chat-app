// create a server
var express = require('express');
var app = express();
var server = require('http').createServer(app);

// path
var path = require('path');

// parse request body and cookie
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

// pass the server to socket.io
var io = require('socket.io')(server);

// dateformat
var dateFormat = require('dateformat');

// for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));
// for parsing application/json
app.use(bodyParser.json());
// for cookie
app.use(cookieParser());

// routing
var users = {};
var usernumber = 0;
var clients = {};
app.get('/', function(req, res) {
  if (!req.cookies.username) {
    res.redirect('/signin');
  } else {
    res.sendFile(path.join(__dirname, '/public', 'index.html'));
  }
});
app.get('/signin', function(req, res) {
  res.sendFile(path.join(__dirname, '/public', 'signin.html'));
});
app.post('/signin', function(req, res) {
  var key = req.body.username;
  if (users[key]) {
    // user has already existed
    res.redirect('/signin');
  } else {
    // set cookie and redirect index.html
    res.cookie('username', key, {maxAge: 1000*60*60*24*30});
    res.redirect('/');
  }
})

// communicate between client and server by socket.io
io.on('connection', function(socket) {
  // user online
  socket.on('online', function(msg) {
    socket.username = msg;
    // add user
    if (!users[socket.username]) {
      users[socket.username] = msg;
      usernumber++;
      // sending to all clients except sender
      for (var i in clients) {
        clients[i].emit('broadcast message', {
          type: 'online',
          info: socket.username
        });
      }
    }
    // send to current request socket client
    socket.emit('private message', {
      type: 'online',
      info: socket.username,
      users: users
    });
    // sending to all clients, include sender
    io.emit('public message', {
      type: 'online',
      info: usernumber
    });
    clients[socket.username] = socket;
  });

  // user offline
  socket.on('disconnect', function() {
    // delete user
    if (users[socket.username]) {
      delete users[socket.username];
      delete clients[socket.username];
      usernumber--;
      for (var i in clients) {
        clients[i].emit('broadcast message', {
          type: 'offline',
          info: socket.username
        });
      }
      io.emit('public message', {
        type: 'offline',
        info: usernumber,
      });
    }
  });

  // chat
  socket.on('chat message', function(msg) {
    // format time
    var now = new Date();
    var format_time = dateFormat(now, "HH:MM");
    var data = {
      time: format_time,
      from: msg.from,
      to: msg.to,
      info: msg.info
    }
    if ('group' == msg.to) {
      for (var i in clients) {
        if (clients[i].username != socket.username) {
          clients[i].emit('chat message', data);
        }
      }
    } else {
      clients[msg.to].emit('chat message', data);
    }
  });
});

// Serve static content for the app from the "public" directory in the application directory
app.use(express.static(__dirname + '/public'));

// listen port
server.listen(3000, function() {
  console.log('listen on 3000');
});