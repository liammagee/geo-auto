

let sketch = (p) => {
    // gui params
    let numShapes = 20;
    let strokeWidth = 4;
    let strokeColor = '#00ddff';
    let fillColor = [180, 255, 255];
    let drawStroke = true;
    let	drawFill = true;
    let radius = 20;
    let shape = ['circle', 'triangle', 'square', 'pentagon', 'star'];
    let label = 'label';

    // gui
    let visible = true;
    let gui, gui2;

    // dynamic parameters
    let bigRadius;

    let agentParams = {
        agentSize: 1000
	};
    let moveOptions = {
		chanceToMoveCountry: 0.002,
        changeToWithinCountry: 0.01,
        movementAmount: 0.1,
        distanceLimit: 1000
	};
    let viralOptions = {
		initialInfectionRate: 0.01,
        infectionRate: 0.01,
        showTrail: ['path', 'tail', 'none']
	};
    let coordinatePlaces = {};
    let agents = [];
    let agentCreateMode = 2; // 0 - random location or 1 = choose a country or 2 = choose a place
    let placePopCutoff = 100000;
    let countryCurrent;
    let isRunning = true;

    let countries = [];
    let countryImages = {};
    let backgroundImg;
    let backgroundGraphics;

    let params = {
        r: 500
      };

      p.getCountries = () => { return countries; };
      p.getPlaces = () => { return coordinatePlaces; };

      var Agent = ( function() {
        function Agent(position, angle) {
            this.position = position;
            this.trail = [];
            this.trail.push(this.position);
            this.angle = angle;
            // Viral
            this.isInfected = false;
        }
        Agent.prototype.reposition = function (v) {
            this.position = v;
            this.trail.push(v);
            // if (this.trail.length >= 10)
            //     this.trail.shift();
        };
        Agent.prototype.move = function () {
            var x = p.cos(this.angle) * moveOptions.movementAmount;
            var y = p.sin(this.angle) * moveOptions.movementAmount;
            var v = p.createVector(this.position.x + x, this.position.y + y);
            var c = p.getCountry(v.x, v.y);
            //console.log(c);
            if (c !== undefined) {
                this.reposition(v);
                this.angle += p.random(-0.1, 0.1);
            }
            else {
                this.angle = p.random(0, p.TAU);
            }
        };
        Agent.prototype.draw = function () {
            var a = 50;
            var l = this.trail.length;
            if (this.isInfected) {
                p.fill(0, 80, 80, a);
                backgroundGraphics.fill(0, 80, 80, 10);
            }
            else {
                p.fill(120, 80, 80, a);
                backgroundGraphics.fill(120, 80, 80, 10);
            }
                
            p.noStroke();
            p.ellipse(this.position.x, this.position.y, 5, 5);
            if (viralOptions.showTrail == 'path') {
                backgroundGraphics.noStroke();
                backgroundGraphics.ellipse(this.position.x, this.position.y, 1, 1);
            }
            else if (viralOptions.showTrail == 'tail') {
                for (var i = this.trail.length - 2; i >= 0; i--) {
                    var t = this.trail[i];
                    var r = i / l;
                    backgroundGraphics.noStroke();
                    backgroundGraphics.ellipse(t.x, t.y, 1);
                }
            }
        };
        return Agent;
    }());
    var PlaceAgent = (function () {
        function PlaceAgent(position, destination, country) {
            var _this = this;
            _this.origin = position;
            _this.position = position;
            _this.trail = [];
            _this.destination = (destination === undefined) ? _this.origin : destination;
            _this.country = country;
            var a = p.atan2(_this.destination.y - _this.position.y, _this.destination.x - _this.position.x);
            _this.angle = a;
            coordinatePlaces[_this.destination].agents.push(_this);
            return _this;
        }
        PlaceAgent.prototype.move = function () {
            var x = p.cos(this.angle) * moveOptions.movementAmount * 10;
            var y = p.sin(this.angle) * moveOptions.movementAmount * 10;
            var v = p.createVector(this.position.x + x, this.position.y + y);
            var currDist = p5.Vector.dist(v, this.destination);
            if (currDist < 2.0 * moveOptions.movementAmount * 10 || currDist > moveOptions.distanceLimit) {
                // Viral logic here
                var otherAgents = coordinatePlaces[this.destination].agents;
                for (var i = 0; i < otherAgents.length; i++) {
                    var oa = otherAgents[i];
                    if (oa.isInfected) {
                        var r = p.random(0, 1);
                        if (r < viralOptions.infectionRate) {
                            this.isInfected = true;
                        }
                    }
                }
                var nv = p.randomPlace(this.country);
                if (nv !== undefined) {
                    var dist = p5.Vector.dist(nv, this.destination);
                    if (dist < moveOptions.distanceLimit) {
                        var agents = coordinatePlaces[this.destination].agents;
                        if (dist < 1.0) {
                            agents.push(this);
                        }
                        else {
                            var ind = agents.indexOf(2);
                            if (ind >= 0) {
                                coordinatePlaces[this.destination].agents = a.concat(agents.slice(0, ind), agents.slice (ind+1));
                            }
                            coordinatePlaces[this.destination].agents.push(this);
                        }
                            
                        this.origin = this.destination;
                        this.position = this.destination;
                        this.destination = nv;
                        var a = p.atan2(this.destination.y - this.position.y, this.destination.x - this.position.x);
                        this.angle = a;
                    }
                }
            }
            else {
                this.reposition(v);
            }
        };

        PlaceAgent.prototype.reposition = function (v) {
            this.position = v;
            this.trail.push(v);
            // if (this.trail.length >= 10)
            //     this.trail.shift();
        };
        PlaceAgent.prototype.draw = function () {
            var a = 50;
            var l = this.trail.length;
            if (this.isInfected) {
                p.fill(0, 80, 80, a);
                backgroundGraphics.fill(0, 80, 80, 10);
            }
            else {
                p.fill(120, 80, 80, a);
                backgroundGraphics.fill(120, 80, 80, 10);
            }
                
            p.noStroke();
            p.ellipse(this.position.x, this.position.y, 5, 5);
            if (viralOptions.showTrail == 'path') {
                backgroundGraphics.noStroke();
                backgroundGraphics.ellipse(this.position.x, this.position.y, 1, 1);
            }
            else if (viralOptions.showTrail == 'tail') {
                for (var i = this.trail.length - 2; i >= 0; i--) {
                    var t = this.trail[i];
                    var r = i / l;
                    backgroundGraphics.noStroke();
                    backgroundGraphics.ellipse(t.x, t.y, 1);
                }
            }
        };        
        return PlaceAgent;
    }());

    
    p.loadCountries = () => {
        var url = 'res/json-equal-greyscale.json';
        p.loadJSON(url, (cs) => {
            countries = Object.values(cs);
            
            for (let i = 0; i < countries.length; i++) {
                let country = countries[i];
                for (let j = 0; j < country.places.length; j++) {
                    let place = country.places[j];
                    let placePts = place.points;
                    var vec = p.createVector(placePts[0], placePts[1]);
                    coordinatePlaces[vec] = place;
                    //country_1.places[name_1] = place;
                    let im = p.loadImage('res/countries/'+country.iso_a3+'_equal.png');
                    countryImages[country.iso_a3] = im;
                }
        
            }
    
        });

    };
    
    p.preload = () => {
        p.loadCountries();
        p.backgroundImg = p.loadImage('res/background-equal-greyscale.png');
        // p.backgroundImg = p.loadImage('res/background-equal-colour.png');
    };
    
    p.setup = () => {

        div = p.canvas.parentElement;
        p.createCanvas(div.clientWidth, div.clientHeight);
        
        backgroundGraphics = p.createGraphics(1334, 650);
        backgroundGraphics.colorMode(p.HSB, 360, 100, 100, 100);

        // Calculate big radius
        bigRadius = p.height / 3.0;
    
        // Create Layout GUI
        gui = p.createGui(p).setPosition(p.windowWidth - 220, 20);;
        p.sliderRange(0, 5000, 10);
        gui.addObject(agentParams);
        p.sliderRange(0.0, 1.0, 0.001);
        gui.addObject(moveOptions);
        p.sliderRange(0.0, 0.2, 0.001);
        gui.addObject(viralOptions);
        // gui.addGlobals('numShapes', 'bigRadius', 'shape', 'label', 'radius',
        //     'drawFill', 'fillColor', 'drawStroke', 'strokeColor', 'strokeWidth');

        p.initSketch();
        // Don't loop automatically
        // p.noLoop();
    
    };
    

    p.draw = function() {
        p.image(backgroundGraphics, 0, 0, p.width, p.height);
        let agentCounts = p.getCountries().map((c) => { return c.places.map((place) => {return p.getPlaces()[p.createVector(place.points[0], place.points[1])].agents.length}).reduce((acc, cur) => acc + cur, 0)});
        // for (let i = 0; i < countries.length; i++) {
        //     let country = countries[i];
        //     let agentCount = agentCounts[i];
        //     let im = countryImages[country.iso_a3];
        //     if (im !== undefined) {
        //         let alpha = agentCount / agentParams.agentSize * 255;
        //         backgroundGraphics.tint(255, alpha); 
        //         backgroundGraphics.image(im, country.offsetX, country.offsetY - im.height + 5, im.width, im.height);
        //     }
                
        // }
        backgroundGraphics.tint(255, 255); 
        p.push();
        // applyMatrix(
        //     1, 0, 
        //     0, 1, width / 2, height / 2);
        for (var i = 0; i < agents.length; i++) {
            var a = agents[i];
            a.move();
            a.draw();
        }
        p.pop();
    }

    p.windowResized = function() {
        p.resizeCanvas(div.clientWidth, div.clientHeight);
    }

    p.randomCountryWeighted = function (includeIncome) {
        var l = Object.keys(countries).length;
        var names = [];
        var pops = [];
        var wealths = [];
        var totalPop = 0;
        for (var i = 0; i < l; i++) {
            var cn = Object.keys(countries)[i];
            var country = countries[cn];
            var pop = parseInt(country.pop_est);
            // https://datatopics.worldbank.org/world-development-indicators/stories/the-classification-of-countries-by-income.html
            var wealth = Math.pow(6 - parseInt(country.income_grp[0]), 2);
            names.push(cn);
            pops.push(pop);
            if (includeIncome)
                pop *= wealth;
            totalPop += pop;
            wealths.push(wealth);
        }
        var r = p.random(0, totalPop);
        var totalNew = 0;
        for (var i = 0; i < pops.length; i++) {
            var pop = pops[i];
            var wealth = wealths[i];
            if (includeIncome)
                pop *= wealth;
            var n = names[i];
            totalNew += pop;
            if (r < totalNew) {
                return countries[n];
            }
        }
        return undefined;
    };
    p.randomPlaceWeighted = function (c) {
        var places = c.places;
        if (places === undefined)
            return undefined;
        var l = Object.keys(places).length;
        if (c.placePops === undefined) {
            var placePops = [];
            var placesSorted = [];
            var totalPlacePop = 0;
            for (var i = 0; i < l; i++) {
                var place = places[Object.keys(places)[i]];
                var placePop = parseInt(place.POP_MAX);
                placePops.push(placePop);
                placesSorted.push(place);
                totalPlacePop += placePop;
            }
            c.placePops = placePops;
            c.placesSorted = placesSorted;
            c.totalPlacePop = totalPlacePop;
        }
        var r = p.random(0, c.totalPlacePop);
        var totalNew = 0;
        for (var i = 0; i < c.placePops.length; i++) {
            var pop_3 = c.placePops[i];
            totalNew += pop_3;
            if (r < totalNew) {
                var place = c.placesSorted[i];
                return p.createVector(place.points[0], place.points[1]);
            }
        }
        return undefined;
    };
    p.randomPlace = function (country) {
        var chance = p.random(0, 1);
        if (chance < moveOptions.chanceToMoveCountry) {
            var cl = Object.keys(countries).length;
            var cr = p.floor(p.random(0, cl));
            // var newCountry = countries[Object.keys(countries)[cr]];
            var newCountry = p.randomCountryWeighted(true);
            return p.randomPlaceWeighted(newCountry);
        }
        else if (chance < moveOptions.changeToWithinCountry) {
            return p.randomPlaceWeighted(country);
        }
        else {
            // Stay at home
            return undefined;
        }
    };
    p.initSketch = function () {
        // p.clear();
        // p.background(0);
        // p.image(p.backgroundImg, 0, 0);
        backgroundGraphics.clear();
        backgroundGraphics.background(0);
        backgroundGraphics.image(p.backgroundImg, 0, 0, 1334, 650);

        agents = [];
        for (var i = 0; i < Object.keys(coordinatePlaces).length; i++) {
            var place = coordinatePlaces[Object.keys(coordinatePlaces)[i]];
            place.agents = [];
        }
        for (var i = 0; i < agentParams.agentSize; i++) {
            //Crude approach to creating agents in a country
            var v = void 0, c = void 0;
            var counter = 0;
            if (agentCreateMode == 0) {
                do {
                    v = p.createVector(random(0, p.width), random(0, p.height));
                    c = p.getCountry(v.x, v.y);
                } while (c === undefined);
                p.agents.push(new Agent(v, random(0, p.TAU)));
            }
            else if (agentCreateMode == 1) {
                // Evenly weighted
                // let l = Object.keys(countries).length;
                // let r = floor(random(0, l));
                // c = countries[Object.keys(countries)[r]];
                // Pop. weighted
                
                do {
                    c = p.randomCountryWeighted(false);
                } while (c.places === undefined && (counter++) < 10);
                var origin_1 = p.randomPlaceWeighted(c);
                agents.push(new Agent(origin_1, p.random(0, p.TAU)));
            }
            else if (agentCreateMode == 2) {
                do {
                    c = p.randomCountryWeighted(false);
                } while (c.places === undefined && (counter++) < 10);
                var origin_2 = p.randomPlaceWeighted(c);
                var destination = p.randomPlace(c);
                if (origin_2 !== undefined)
                    agents.push(new PlaceAgent(origin_2, destination, c));
            }
        }
        for (var i = 0; i < agents.length; i++) {
            var r = p.random(0, 1);
            var agent = agents[i];
            if (r < viralOptions.initialInfectionRate) {
                agent.isInfected = true;
            }
        }
        // if (!isRunning) {
        //     p.loop();
        //     isRunning = true;
        // }
    };    
    
    p.collisionDetection = function (points, testX, testY) {
        var crossed = false;
        var times = 0;
        // Double check the detection is within the widest bounds
        for (var j = 0; j < points.length; j++) {
            var pts = points[j];
            var maxx = p.max(pts.map(function (pt) { return pt.x; }));
            for (var i = 0; i < pts.length; i++) {
                var p1 = pts[i];
                var p2 = (i == pts.length - 1) ? pts[0] : pts[i + 1];
                // Make floating, and jitter to avoid boundary issues with integers.
                var x1 = parseFloat(p1.x) + 0.001, 
                    y1 = parseFloat(p1.y) - 0.001, 
                    x2 = parseFloat(p2.x) + 0.001, 
                    y2 = parseFloat(p2.y) - 0.001;
                if ((y1 < testY && y2 >= testY) || (y1 > testY && y2 <= testY)) {
                    if ((x1 + x2) / 2.0 < testX && testX < maxx) {
                        times++;
                        crossed = !crossed;
                    }
                }
            }
        }
        return crossed;
    };
    collisionDetection = function (points, testX, testY) {
        var crossed = false;
        var times = 0;
        // Double check the detection is within the widest bounds
        for (var j = 0; j < points.length; j++) {
            var pts = points[j];
            var maxx = p.max(pts.map(function (pt) { return pt.x; }));
            for (var i = 0; i < pts.length; i++) {
                var p1 = pts[i];
                var p2 = (i == pts.length - 1) ? pts[0] : pts[i + 1];
                // Make floating, and jitter to avoid boundary issues with integers.
                var x1 = parseFloat(p1.x) + 0.001, 
                    y1 = parseFloat(p1.y) - 0.001, 
                    x2 = parseFloat(p2.x) + 0.001, 
                    y2 = parseFloat(p2.y) - 0.001;
                console.log(x1, x2, testX, maxx)
                if ((y1 < testY && y2 >= testY) || (y1 > testY && y2 <= testY)) {
                    // console.log(x1, x2, testX, maxx)
                    if ((x1 + x2) / 2.0 < testX && testX < maxx) {
                        times++;
                        crossed = !crossed;
                    }
                }
            }
        }
        return crossed;
    };    
    p.getCountry = function (x, y) {
        var c = undefined;
        for (var i = 0; i < Object.keys(countries).length; i++) {
            var cn = Object.keys(countries)[i];
            var country = countries[cn];
            var points = country.points;
            var inside = p.collisionDetection(points, x, y);
            if (inside) {
                c = country;
                break;
            }
        }
        return c;
    };

    p.mouseMoved = function () {
        countryCurrent = p.getCountry(p.mouseX, p.mouseY);
        // console.log(countryCurrent)
    };
    p.mousePressed = function () {
        if (isRunning) {
            p.noLoop();
            isRunning = false;
        }
        else {
            p.loop();
            isRunning = true;
        }
    };
    p.keyPressed = function () {
        switch(p.key) {
            // type [F1] to hide / show the GUI
            case 'p':
                visible = !visible;
                if(visible) gui.show(); else gui.hide();
                break;
            case 's':
                var t = p.millis();
                p.saveCanvas('screen-2020-02-20-' + t + '.png');
                p.saveCanvas('screen-2020-02-20-' + t + '.tif');
                break;
            case 'r':
                p.initSketch();
                break;
        }
    };
    

}

let pp = new p5(sketch, 'sketch1');
