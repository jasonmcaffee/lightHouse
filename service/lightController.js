
let hue = require("node-hue-api");
let HueApi = require("node-hue-api").HueApi;


let test = ()=>{
		
	let displayBridges = (bridge)=> {
	    console.log("Hue Bridges Found: " + JSON.stringify(bridge));
	};

	hue.nupnpSearch().then(displayBridges).done();
};

/**
* Finds and returns the first bridge found.
*/
let findABridge = ()=>{
	let promise = new Promise((resolve, reject)=>{
		hue.nupnpSearch()
		.then((bridges)=>{
			if(!bridges || !bridges[0]){resolve();}
			let bridge = bridges[0];//just grab the first bridge found
			resolve(bridge);		
		})
		.catch(reject);
	});
	return promise;
};

/**
* Ensure we are paired with the bridge and have user rights.
* @param bridge - object with properties id and ipaddress
*/
let connectToBridge = (bridge)=>{
	console.log(`connecting to bridge with ip ${bridge.ipaddress}`);
};

/**
* Finds first bridge and connects to it.
*/
let findAndConnectToBridge = ()=>{
	console.log('finding and connecting to bridge.');
	let username = "J6sizwN7qJz7lDNGXKOschliq2ft-7Q85A-sq35Z";//todo: store from createUser call

	let promise = new Promise((resolve, reject)=>{
		console.log(`finding a bridge`);
		
		findABridge()
		.then((bridge)=>{
			resolve(new HueApi(bridge.ipaddress, username));
		})
		.catch((e)=>{
			console.error(`error during findAndConnectToBridge: ${e}`);
			reject(e);
		});

	
	});;
	return promise;			
};

let getLights = (hueApi)=>{
	console.log(`getting lights`);
	return hueApi.lights();
};

/**
{
      "id": "5",
      "state": {
        "on": true,
        "bri": 1,
        "hue": 5909,
        "sat": 228,
        "effect": "none",
        "xy": [
          0.5897,
          0.3682
        ],
        "ct": 500,
        "alert": "none",
        "colormode": "hs",
        "reachable": true
      },
      "type": "Extended color light",
      "name": "Hue color downlight 2",
      "modelid": "LCT002",
      "manufacturername": "Philips",
      "uniqueid": "00:17:88:01:00:f3:45:0a-0b",
      "swversion": "5.23.1.13452"
    }
*/
let dimAllLights = hueApi => {
	let lightState = hue.lightState;
	let state = lightState.create().bri(0);

	let promise = new Promise((resolve, reject)=>{
		findAndConnectToBridge()
		.then((hueApi) =>{
			getLights(hueApi)
			.then((lightsResult)=>{
				//console.log(`lightResult: ${JSON.stringify(lightsResult, null, 2)}`);
				let lights = lightsResult.lights;
				//console.log()
				// let lightDimPromises = [];
				// for (let light of lights){
				// 	console.log(`dimming light id: ${light.id}`);
				// 	lightDimPromises.push(hueApi.setLightState(light.id, state));

				// }
				let lightDimPromises = lights.map(light=>hueApi.setLightState(light.id, state));
				Promise.all(lightDimPromises)
				.then(values=>{
					console.log(`done dimming lights`);
					resolve();
				})
				.catch(e=>{
					console.error(`error dimming light: ${e}`);
					reject(e);
				});
			})
		})
		
	});

	return promise;
};

/**
* You must press the bridge button before calling this function.
* @return - userId string
*/
let createUser = (bridge)=>{
	let hue = new HueApi();
	let promise = new Promise((resolve, reject)=>{
		hue.registerUser(bridge.ipaddress, "jason user")
	    .then((result)=>{
	    	console.log(`create user result: ${JSON.stringify(result)}`);
	    	resolve(result);
	    })
	    .fail((error)=>{
	    	console.error(`error creating user ${error}`);
	    	reject(error);
	    })
	    .done();
	});	
	return promise;
};

let getBridgeConfig = (host, username)=>{
	let api = new HueApi(host, username);
	return api.config();	
};

module.exports = {
	test,
	findABridge,
	connectToBridge,
	findAndConnectToBridge,
	getBridgeConfig,
	createUser,
	getLights,
	dimAllLights
};