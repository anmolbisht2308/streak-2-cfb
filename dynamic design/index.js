"use strict";


var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

var mousePos = { x: canvas.width / 2, y: canvas.height / 2 };
var mouseDown = false;

canvas.addEventListener(
  "mousemove",
  function (evt) {
    mousePos = getMousePos(canvas, evt);
  },
  false
);

canvas.addEventListener(
  "mousedown",
  function (evt) {
    mouseDown = true;
  },
  false
);

canvas.addEventListener("mouseup", function (evt) {
  mouseDown = false;
});



function map(value, start1, stop1, start2, stop2) {
  return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}

function constrain(value, min, max) {
  return value > max ? max : value < min ? min : value;
}


function Clear() {
  this.update = function () {
    var grd = context.createRadialGradient(75, 50, 5, 90, 60, canvas.width);
    grd.addColorStop(0, "black");
    grd.addColorStop(1, "#1a0f00");

    if (mouseDown) {
      var grd = context.createRadialGradient(75, 50, 5, 90, 60, canvas.width);
      grd.addColorStop(0, "#ebf0fa");
      grd.addColorStop(1, "white");
    }

    context.fillStyle = grd;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fill();
  };
}

function Vehicle(x, y) {
  this.maxSpeed = 5;
  this.maxForce = 0.04;
  this.mass = 1;
  this.size = 10;
  this.desiredSeparation = this.size * 2;

  this.counter = 0;

  this.location = new Vector(x, y);
  this.velocity = new Vector(0, 0);
  this.acceleration = new Vector(0, 0);
}

Vehicle.prototype.seek = function (target) {
  var desired = Vector.subtract(target, this.location);
  desired.normalize();
  desired.multiply(this.maxSpeed);

  var steer = new Vector.subtract(desired, this.velocity);
  steer.limit(this.maxForce);

  return steer;
};

Vehicle.prototype.arrive = function (target) {
  var desired = Vector.subtract(target, this.location);
  var d = desired.magnitude();
  desired.normalize();

  if (d < 100) {
    var m = map(d, 0, 100, 0, this.maxSpeed);
    desired.multiply(m);
  } else {
    desired.multiply(this.maxSpeed);
  }

  var steer = Vector.subtract(desired, this.velocity);
  steer.limit(this.maxForce);

  return steer;
};

Vehicle.prototype.separate = function (vehicles) {
  var sum = new Vector(0, 0);
  var count = 0;
  for (var i in vehicles) {
    var distance = Vector.distance(this.location, vehicles[i].location);

    if (distance > 0 && distance < this.desiredSeparation) {
      var difference = Vector.subtract(this.location, vehicles[i].location);
      difference.normalize();

      sum.add(difference);
      count++;
    }
  }

  if (count > 0) {
    sum.divide(count);
    sum.setMagnitude(this.maxSpeed);

    var steer = Vector.subtract(sum, this.velocity);
    steer.limit(this.maxForce);

    return steer;
  }

  return new Vector(0, 0);
};

Vehicle.prototype.connect = function (vehicles) {
  for (var i in vehicles) {
    var distance = Vector.distance(this.location, vehicles[i].location);

    if (distance > 0 && distance < 30) {
      this.drawConnection(vehicles[i].location);
    }
  }
};

Vehicle.prototype.applyBehaviours = function (vehicles) {
  var separate = this.separate(vehicles);
  var mouse = new Vector(mousePos.x, mousePos.y);
  var seek = this.seek(mouse);
  var arrive = this.arrive(mouse);

  separate.multiply(1.5);
  seek.multiply(0.5);
  arrive.multiply(0.2);

  this.applyForce(separate);
  this.applyForce(seek);
  this.applyForce(arrive);

  this.connect(vehicles);
};

Vehicle.prototype.applyForce = function (force) {
  var f = Vector.divide(force, this.mass);
  this.acceleration.add(f);
};

Vehicle.prototype.update = function () {
  this.velocity.add(this.acceleration);
  this.velocity.limit(this.maxSpeed);

  this.angle = Math.atan2(this.velocity.x, this.velocity.y * -1);

  this.location.add(this.velocity);

  this.acceleration.multiply(0);

  //this.draw();

  this.counter += 0.1;
};

Vehicle.prototype.drawConnection = function (vehicleLocation) {
  context.beginPath();
  context.strokeStyle = "rgba(255, 245, 230, .1)";
  if (mouseDown) {
    context.strokeStyle = "rgba(0, 10, 15, .1)";
  }
  var lw = constrain(this.angle, 1, 3);
  context.lineWidth = lw;
  context.moveTo(this.location.x, this.location.y);
  context.lineTo(vehicleLocation.x, vehicleLocation.y);
  context.stroke();
};

Vehicle.prototype.draw = function () {
  context.beginPath();
  context.lineWidth = 1;
  context.strokeStyle = "rgb(255, 255, 255)";
  context.moveTo(
    this.location.x - (this.size / 2) * Math.cos(this.angle),
    this.location.y - (this.size / 2) * Math.sin(this.angle)
  );
  context.lineTo(
    this.location.x + (this.size / 2) * Math.cos(this.angle),
    this.location.y + (this.size / 2) * Math.sin(this.angle)
  );
  context.stroke();
  context.beginPath();
  context.arc(
    this.location.x,
    this.location.y,
    this.size,
    0,
    Math.PI * 2,
    false
  );
  context.stroke();
};

function Vehicles() {
  this.vehicles = [];

  for (var i = 0; i < 100; i++) {
    this.vehicles.push(
      new Vehicle(Math.random() * canvas.width, canvas.height * Math.random())
    );
  }
}

Vehicles.prototype.update = function () {
  for (var i in this.vehicles) {
    this.vehicles[i].applyBehaviours(this.vehicles);
    this.vehicles[i].update();
  }
};

// --------------------
// Animate
// --------------------

function Stage() {
  this.clear = new Clear();
  this.vehicles = new Vehicles();

  var animate = function () {
    this.clear.update();
    this.vehicles.update();

    requestAnimationFrame(animate);
  }.bind(this);

  animate();
}

// --------------------
// Tools
// --------------------

function Vector(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z === undefined ? 0 : z;

  this.add = function (v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
  };

  this.multiply = function (n) {
    this.x *= n;
    this.y *= n;
    this.z *= n;
  };

  this.divide = function (n) {
    this.x /= n;
    this.y /= n;
    this.z /= n;
  };

  this.magnitude = function () {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  };

  this.setMagnitude = function (vOrL, l) {
    if (l === undefined) {
      l = vOrL;
      this.normalize();
      this.multiply(l);
    } else {
      var v = vOrL;
      v.normalize();
      v.multiply(len);
      return v;
    }
  };

  this.normalize = function () {
    var m = this.magnitude();
    if (m !== 0) {
      this.divide(m);
    }
  };

  this.limit = function (n) {
    if (this.magnitude() > n) {
      this.normalize();
      this.multiply(n);
    }
  };

  this.distance = function (v) {
    var dx = this.x - v.x,
      dy = this.y - v.y,
      dz = this.z - v.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };

  this.inverseX = function () {
    this.x *= -1;
  };

  this.inverseY = function () {
    this.y *= -1;
  };

  this.inverseZ = function () {
    this.z *= -1;
  };

  this.get = function () {
    return new Vector(this.x, this.y, this.z);
  };

  this.dot = function (v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  };
}

// -------------------------
// Vector: Static
// -------------------------

Vector.add = function (v1, v2) {
  var v3 = new Vector(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);

  return v3;
};

Vector.subtract = function (v1, v2) {
  var v3 = new Vector(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);

  return v3;
};

Vector.multiply = function (v1, v2) {
  var v3 = new Vector(v1.x * v2.x, v1.y * v2.y, v1.z * v2.z);

  return v3;
};

Vector.divide = function (v1, v2) {
  if (typeof v2 === Vector) {
    var v3 = new Vector(v1.x / v2.x, v1.y / v2.y, v1.z / v2.z);
  } else {
    var v3 = new Vector(v1.x / v2, v1.y / v2, v1.z / v2);
  }

  return v3;
};

Vector.distance = function (v1, v2) {
  return v1.distance(v2);
};

Vector.random2D = function () {
  var x = parseInt(Math.random() * 3) - 1;
  var y = parseInt(Math.random() * 3) - 1;
  var z = parseInt(Math.random() * 2) - 1;

  var v1 = new Vector(x, y, z);
  return v1;
};

new Stage();
