
let hue = require("node-hue-api");
let HueApi = require("node-hue-api").HueApi;

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
* Resolves passing the connected hueApi.
*/
let findAndConnectToBridge = ()=>{
	console.log('finding and connecting to bridge.');
	let username = "J6sizwN7qJz7lDNGXKOschliq2ft-7Q85A-sq35Z";//todo: store from createUser call
  //let ipaddress = "192.168.1.118";
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

/**
* retrieves collection of lights from the hueApi.
*/
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
let dimAllLights = ()=>{
	let lightStateFunc = (light, state, hueApi)=>{
		state.bri(0);
		return state;
	};
	return performActionOnLights(undefined, lightStateFunc);
};

let brightenAllLights = ()=>{
	let lightStateFunc = (light, state, hueApi)=>{
		state.bri(255);
		return state;
	};
	return performActionOnLights(undefined, lightStateFunc);
};

/**
* Takes care of boiler plate code for connecting to bridge and retrieving lights.
* Simply provide a filter function for which lights to have lightStateFunc executed for.
* @param lightFilterFunc - return boolean value indicating whether light should be operated on.
* @param lightStateFunc - set the state of the light. each included light will be passed to this function.
*/
let performActionOnLights = (
		lightFilterFunc = (light, hueApi) => light.state.on,
		lightStateFunc = (light, state, hueApi) => {
			console.log(`running lightStateFunc`);
			state.bri(0); //turn the light down
			return state;
		}
	) =>{

	let promise = new Promise((resolve, reject)=>{
		findAndConnectToBridge()
		.then((hueApi) =>{
			getLights(hueApi)
			.then((lightsResult)=>{
				//filter out lights then call the lightStateFunc for each light included.
				let lightDimPromises = lightsResult.lights
					.filter(light => lightFilterFunc(light, hueApi))
					.map(light=> {
						let state = lightStateFunc(light, hue.lightState.create(), hueApi);
						return hueApi.setLightState(light.id, state);
					});

				//wait for all calls for light state changes to complete.
				Promise.all(lightDimPromises)
				.then(values=>{
					console.log(`done performing action on lights`);
					resolve();
				})
				.catch(e=>{
					console.error(`error performing action on lights: ${e}`);
					reject(e);
				});
			})
			.catch(e=>{
				console.error(`error performing action on lights: ${e}`);
				reject(e);
			});
		});

	});
	return promise;
};

/**
* You must press the bridge button before calling this function.
* @return - promise which resolves with a userId string
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
	findABridge,
	connectToBridge,
	findAndConnectToBridge,
	getBridgeConfig,
	createUser,
	getLights,
	dimAllLights,
	performActionOnLights,
	dimAllLights,
	brightenAllLights
};
